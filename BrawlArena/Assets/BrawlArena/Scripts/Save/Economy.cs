// ---------------------------------------------------------------------------------------------
// Economy – alle Regeln für Fortschritt und Belohnungen an einem Ort:
// Trophäen, Münzen, XP & Spielerlevel, Brawler-Upgrades (Kraftpunkte + Münzen), Trophäenpfad,
// Boxen (Inhalt per Zufall nach Seltenheit), Shop-Angebote, tägliche Belohnung und Tokens.
// Spielwährung wird NUR im Spiel verdient – es gibt keine Echtgeld-Käufe.
// ---------------------------------------------------------------------------------------------
using System;
using System.Collections.Generic;
using UnityEngine;
using BrawlArena.Core;
using BrawlArena.Data;
using BrawlArena.Net;

namespace BrawlArena.Save
{
    public enum RewardType { Coins, Gems, PowerPoints, Brawler, Box, Tokens, Skin }

    [Serializable]
    public class Reward
    {
        public RewardType type;
        public int amount;
        public string targetId; // Brawler-ID / Skin-ID / Box-Art
        public string label;

        public static Reward Coins(int n) { return new Reward { type = RewardType.Coins, amount = n, label = n + " Münzen" }; }
        public static Reward Gems(int n) { return new Reward { type = RewardType.Gems, amount = n, label = n + " Edelsteine" }; }
        public static Reward Tokens(int n) { return new Reward { type = RewardType.Tokens, amount = n, label = n + " Tokens" }; }
        public static Reward Box(BoxType t) { return new Reward { type = RewardType.Box, amount = 1, targetId = t.ToString(), label = Economy.BoxName(t) }; }
    }

    public enum BoxType { Small, Big, Mega }

    public class TrophyRoadStep
    {
        public int trophies;
        public Reward reward;
    }

    public class ShopOffer
    {
        public string id;
        public string title;
        public string subtitle;
        public int coinPrice;
        public int gemPrice;
        public Reward reward;
        public Color color;
    }

    public static class Economy
    {
        public const int MaxBrawlerLevel = 11;
        public static readonly int[] PowerPointsForLevel = { 0, 20, 30, 50, 80, 130, 210, 340, 550, 890, 1440 }; // Kosten für Level n -> n+1
        public static readonly int[] CoinsForLevel = { 0, 20, 35, 75, 140, 290, 480, 800, 1250, 1875, 2800 };
        public const int TokensPerSmallBox = 100;

        // ------------------------------------------------------------------ Match-Belohnungen
        /// <summary>Berechnet und vergibt alle Belohnungen eines Matches.</summary>
        public static void ApplyMatchResult(MatchResult r, string brawlerId)
        {
            var p = SaveSystem.Profile;
            var mode = ContentDatabase.GetMode(r.modeId);
            if (mode == null || r.outcome == MatchOutcome.None) return;
            var bp = p.Get(brawlerId);
            bool win = r.outcome == MatchOutcome.Victory;

            // Trophäen
            int trophies;
            if (mode.modeType == ModeType.Showdown && r.rank > 0) trophies = ShowdownTrophies(r.rank, r.playerCount, bp.trophies);
            else if (r.outcome == MatchOutcome.Victory) trophies = mode.trophiesWin;
            else if (r.outcome == MatchOutcome.Draw) trophies = mode.trophiesDraw;
            else trophies = mode.trophiesLoss;
            // Höhere Trophäenzahlen → etwas weniger Gewinn, mehr Verlust
            if (trophies > 0) trophies = Mathf.Max(1, trophies - bp.trophies / 250);
            else if (trophies < 0 && bp.trophies < 50) trophies = 0; // Einsteigerschutz
            if (!mode.ranked) trophies = 0;
            r.trophyDelta = Mathf.Max(-bp.trophies, trophies);
            bp.trophies += r.trophyDelta;
            bp.highestTrophies = Mathf.Max(bp.highestTrophies, bp.trophies);
            p.highestTrophies = Mathf.Max(p.highestTrophies, p.TotalTrophies);

            // Münzen, XP, Tokens
            r.coins = r.outcome == MatchOutcome.Abandoned ? 0 : (win ? mode.coinsWin : mode.coinsLoss) + (r.starPlayer ? 5 : 0);
            r.xp = r.outcome == MatchOutcome.Abandoned ? 0 : (win ? mode.xpWin : mode.xpLoss) + (r.starPlayer ? 10 : 0);
            r.tokens = mode.ranked && r.outcome != MatchOutcome.Abandoned ? 20 : 0;
            p.coins += r.coins;
            p.tokens += r.tokens;
            AddXp(r.xp);

            // Statistik
            if (mode.ranked)
            {
                p.stats.matches++;
                bp.matches++;
                if (win)
                {
                    bp.wins++;
                    if (mode.modeType == ModeType.Showdown) { if (r.rank == 1) p.stats.showdownWins++; }
                    else if (mode.modeType == ModeType.SoloSurvival || mode.modeType == ModeType.DuoSurvival) p.stats.survivalWins++;
                    else p.stats.teamWins++;
                }
                if (r.starPlayer) p.stats.starPlayer++;
            }
            var local = r.stats.Find(s => s.isLocal);
            if (local != null)
            {
                p.stats.kills += local.kills;
                p.stats.deaths += local.deaths;
                p.stats.totalDamage += (long)local.damage;
            }
            SaveSystem.Save();
        }

        public static int ShowdownTrophies(int rank, int players, int current)
        {
            int[] table = { 10, 8, 6, 4, 2, 0, -2, -4, -6, -8 };
            int idx = Mathf.Clamp(Mathf.RoundToInt((rank - 1) * 10f / Mathf.Max(1, players)), 0, 9);
            return table[idx];
        }

        // ------------------------------------------------------------------ Level
        public static int XpForLevel(int level) { return 100 + 30 * (level - 1); }

        /// <summary>Gibt XP und vergibt Level-Ups (je Level: Münzen + Edelsteine).</summary>
        public static List<Reward> AddXp(int amount)
        {
            var p = SaveSystem.Profile;
            var rewards = new List<Reward>();
            p.xp += amount;
            while (p.xp >= XpForLevel(p.level))
            {
                p.xp -= XpForLevel(p.level);
                p.level++;
                var r1 = Reward.Coins(50 + p.level * 10); Grant(r1); rewards.Add(r1);
                if (p.level % 2 == 0) { var r2 = Reward.Gems(5); Grant(r2); rewards.Add(r2); }
            }
            return rewards;
        }

        // ------------------------------------------------------------------ Upgrades
        public static bool CanUpgrade(BrawlerProgress bp, out int ppCost, out int coinCost)
        {
            ppCost = coinCost = 0;
            if (bp.level >= MaxBrawlerLevel) return false;
            ppCost = PowerPointsForLevel[bp.level];
            coinCost = CoinsForLevel[bp.level];
            return bp.powerPoints >= ppCost && SaveSystem.Profile.coins >= coinCost;
        }

        public static bool Upgrade(string brawlerId)
        {
            var p = SaveSystem.Profile;
            var bp = p.Get(brawlerId);
            int pp, coins;
            if (!CanUpgrade(bp, out pp, out coins)) return false;
            bp.powerPoints -= pp;
            p.coins -= coins;
            bp.level++;
            SaveSystem.Save();
            return true;
        }

        public static bool UnlockWithCoins(BrawlerDefinition def)
        {
            var p = SaveSystem.Profile;
            if (p.IsUnlocked(def) || p.coins < def.CoinPrice) return false;
            p.coins -= def.CoinPrice;
            p.Get(def.id).unlocked = true;
            SaveSystem.Save();
            return true;
        }

        public static bool BuySkin(SkinDefinition skin)
        {
            var p = SaveSystem.Profile;
            if (p.OwnsSkin(skin.id) || p.gems < skin.gemPrice) return false;
            p.gems -= skin.gemPrice;
            p.ownedSkins.Add(skin.id);
            SaveSystem.Save();
            return true;
        }

        // ------------------------------------------------------------------ Belohnungen vergeben
        /// <summary>Vergibt eine Belohnung. Boxen werden geöffnet und liefern ihren Inhalt zurück.</summary>
        public static List<Reward> Grant(Reward r)
        {
            var p = SaveSystem.Profile;
            var result = new List<Reward>();
            switch (r.type)
            {
                case RewardType.Coins: p.coins += r.amount; result.Add(r); break;
                case RewardType.Gems: p.gems += r.amount; result.Add(r); break;
                case RewardType.Tokens: p.tokens += r.amount; result.Add(r); break;
                case RewardType.PowerPoints:
                    p.Get(r.targetId).powerPoints += r.amount; result.Add(r); break;
                case RewardType.Brawler:
                    p.Get(r.targetId).unlocked = true; result.Add(r); break;
                case RewardType.Skin:
                    if (!p.ownedSkins.Contains(r.targetId)) p.ownedSkins.Add(r.targetId);
                    result.Add(r); break;
                case RewardType.Box:
                    BoxType bt = (BoxType)Enum.Parse(typeof(BoxType), r.targetId);
                    var contents = RollBox(bt);
                    foreach (var c in contents) result.AddRange(Grant(c));
                    p.stats.boxesOpened++;
                    break;
            }
            return result;
        }

        public static string BoxName(BoxType t)
        {
            switch (t) { case BoxType.Small: return "Brawl-Box"; case BoxType.Big: return "Große Box"; default: return "Mega-Box"; }
        }

        /// <summary>Würfelt den Inhalt einer Box aus.</summary>
        public static List<Reward> RollBox(BoxType type)
        {
            var p = SaveSystem.Profile;
            int rolls = type == BoxType.Small ? 2 : type == BoxType.Big ? 5 : 10;
            float brawlerChance = type == BoxType.Small ? 0.06f : type == BoxType.Big ? 0.15f : 0.3f;
            var list = new List<Reward>();
            var rng = new System.Random();
            int coinSum = 0;
            for (int i = 0; i < rolls; i++)
            {
                double roll = rng.NextDouble();
                if (roll < brawlerChance)
                {
                    var b = PickLockedBrawler(rng);
                    if (b != null)
                    {
                        list.Add(new Reward { type = RewardType.Brawler, amount = 1, targetId = b.id, label = "NEU: " + b.displayName + " (" + RarityUtil.GetName(b.rarity) + ")" });
                        continue;
                    }
                }
                if (roll < 0.55)
                {
                    var owned = ContentDatabase.Brawlers.FindAll(x => p.IsUnlocked(x) && p.Get(x.id).level < MaxBrawlerLevel);
                    if (owned.Count > 0)
                    {
                        var b = owned[rng.Next(owned.Count)];
                        int pp = rng.Next(8, 26);
                        list.Add(new Reward { type = RewardType.PowerPoints, amount = pp, targetId = b.id, label = pp + " Kraftpunkte für " + b.displayName });
                        continue;
                    }
                }
                if (roll > 0.94) { list.Add(Reward.Gems(rng.Next(3, 10))); continue; }
                coinSum += rng.Next(15, 45);
            }
            if (coinSum > 0) list.Insert(0, Reward.Coins(coinSum));
            return list;
        }

        private static BrawlerDefinition PickLockedBrawler(System.Random rng)
        {
            var p = SaveSystem.Profile;
            var locked = ContentDatabase.Brawlers.FindAll(b => !p.IsUnlocked(b));
            if (locked.Count == 0) return null;
            float total = 0;
            foreach (var b in locked) total += RarityUtil.DropWeight(b.rarity);
            float x = (float)rng.NextDouble() * total;
            foreach (var b in locked)
            {
                x -= RarityUtil.DropWeight(b.rarity);
                if (x <= 0) return b;
            }
            return locked[locked.Count - 1];
        }

        // ------------------------------------------------------------------ Trophäenpfad
        private static List<TrophyRoadStep> road;

        public static List<TrophyRoadStep> TrophyRoad
        {
            get
            {
                if (road != null) return road;
                road = new List<TrophyRoadStep>();
                int[] t = { 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 750, 900, 1000, 1250, 1500, 1750, 2000, 2500, 3000 };
                for (int i = 0; i < t.Length; i++)
                {
                    Reward r;
                    switch (i % 5)
                    {
                        case 0: r = Reward.Coins(100 + i * 25); break;
                        case 1: r = Reward.Box(i > 10 ? BoxType.Big : BoxType.Small); break;
                        case 2: r = Reward.Gems(10 + i * 2); break;
                        case 3: r = Reward.Coins(200 + i * 40); break;
                        default: r = Reward.Box(i > 12 ? BoxType.Mega : BoxType.Big); break;
                    }
                    road.Add(new TrophyRoadStep { trophies = t[i], reward = r });
                }
                // Feste Brawler-Freischaltungen auf dem Pfad
                AssignRoadBrawler(1, "brocken");
                AssignRoadBrawler(5, "lumi");
                AssignRoadBrawler(9, "bumm");
                AssignRoadBrawler(14, "zack");
                return road;
            }
        }

        private static void AssignRoadBrawler(int index, string id)
        {
            var b = ContentDatabase.GetBrawler(id);
            if (b == null || index >= road.Count) return;
            road[index].reward = new Reward { type = RewardType.Brawler, amount = 1, targetId = id, label = "Brawler: " + b.displayName };
        }

        public static bool CanClaimRoad(int index)
        {
            var p = SaveSystem.Profile;
            return index < TrophyRoad.Count && !p.claimedTrophyRoad.Contains(index) && p.highestTrophies >= TrophyRoad[index].trophies;
        }

        public static List<Reward> ClaimRoad(int index)
        {
            if (!CanClaimRoad(index)) return new List<Reward>();
            var p = SaveSystem.Profile;
            p.claimedTrophyRoad.Add(index);
            var step = TrophyRoad[index];
            List<Reward> got;
            if (step.reward.type == RewardType.Brawler && p.IsUnlocked(ContentDatabase.GetBrawler(step.reward.targetId)))
                got = Grant(Reward.Coins(300)); // schon freigeschaltet → Münzen als Ersatz
            else got = Grant(step.reward);
            SaveSystem.Save();
            return got;
        }

        public static int UnclaimedRoadCount()
        {
            int n = 0;
            for (int i = 0; i < TrophyRoad.Count; i++) if (CanClaimRoad(i)) n++;
            return n;
        }

        // ------------------------------------------------------------------ Shop
        public static List<ShopOffer> GetShopOffers()
        {
            var p = SaveSystem.Profile;
            var list = new List<ShopOffer>();
            bool freeReady = FreeBoxReady();
            list.Add(new ShopOffer { id = "free_box", title = "Gratis-Box", subtitle = freeReady ? "Jetzt abholen!" : "Wieder in " + FreeBoxRemainingText(), reward = Reward.Box(BoxType.Small), color = new Color(0.3f, 0.8f, 0.4f) });
            list.Add(new ShopOffer { id = "box_small", title = "Brawl-Box", subtitle = "2 Belohnungen", coinPrice = 150, reward = Reward.Box(BoxType.Small), color = new Color(0.3f, 0.6f, 1f) });
            list.Add(new ShopOffer { id = "box_big", title = "Große Box", subtitle = "5 Belohnungen", gemPrice = 30, reward = Reward.Box(BoxType.Big), color = new Color(0.95f, 0.45f, 0.2f) });
            list.Add(new ShopOffer { id = "box_mega", title = "Mega-Box", subtitle = "10 Belohnungen", gemPrice = 80, reward = Reward.Box(BoxType.Mega), color = new Color(0.75f, 0.3f, 0.95f) });
            list.Add(new ShopOffer { id = "coins_pack", title = "Münzpaket", subtitle = "500 Münzen", gemPrice = 40, reward = Reward.Coins(500), color = new Color(1f, 0.8f, 0.2f) });
            // Tägliches Kraftpunkte-Angebot für den gewählten Brawler
            var sel = ContentDatabase.GetBrawler(p.selectedBrawlerId);
            if (sel != null && p.Get(sel.id).level < MaxBrawlerLevel)
                list.Add(new ShopOffer { id = "pp_" + sel.id, title = "Kraftpunkte", subtitle = "40 für " + sel.displayName, coinPrice = 80, reward = new Reward { type = RewardType.PowerPoints, amount = 40, targetId = sel.id, label = "40 Kraftpunkte für " + sel.displayName }, color = new Color(0.85f, 0.3f, 0.75f) });
            return list;
        }

        public static bool CanAfford(ShopOffer o)
        {
            var p = SaveSystem.Profile;
            if (o.id == "free_box") return FreeBoxReady();
            return p.coins >= o.coinPrice && p.gems >= o.gemPrice;
        }

        public static List<Reward> Buy(ShopOffer o)
        {
            if (!CanAfford(o)) return null;
            var p = SaveSystem.Profile;
            if (o.id == "free_box") p.lastFreeBoxTicks = DateTime.UtcNow.Ticks;
            p.coins -= o.coinPrice;
            p.gems -= o.gemPrice;
            var got = Grant(o.reward);
            SaveSystem.Save();
            return got;
        }

        private static readonly TimeSpan FreeBoxInterval = TimeSpan.FromHours(4);
        public static bool FreeBoxReady() { return DateTime.UtcNow - new DateTime(SaveSystem.Profile.lastFreeBoxTicks, DateTimeKind.Utc) >= FreeBoxInterval; }
        public static string FreeBoxRemainingText()
        {
            var left = FreeBoxInterval - (DateTime.UtcNow - new DateTime(SaveSystem.Profile.lastFreeBoxTicks, DateTimeKind.Utc));
            return left.Hours + "h " + left.Minutes + "m";
        }

        // ------------------------------------------------------------------ Tokens & tägliche Belohnung
        public static bool CanOpenTokenBox() { return SaveSystem.Profile.tokens >= TokensPerSmallBox; }

        public static List<Reward> OpenTokenBox()
        {
            if (!CanOpenTokenBox()) return null;
            SaveSystem.Profile.tokens -= TokensPerSmallBox;
            var got = Grant(Reward.Box(BoxType.Small));
            SaveSystem.Save();
            return got;
        }

        public static bool DailyRewardReady()
        {
            var last = new DateTime(SaveSystem.Profile.lastDailyRewardTicks, DateTimeKind.Utc);
            return DateTime.UtcNow.Date > last.Date;
        }

        public static List<Reward> ClaimDailyReward()
        {
            if (!DailyRewardReady()) return null;
            var p = SaveSystem.Profile;
            var last = new DateTime(p.lastDailyRewardTicks, DateTimeKind.Utc);
            p.dailyStreak = (DateTime.UtcNow.Date - last.Date).TotalDays <= 1.5 ? p.dailyStreak + 1 : 1;
            p.lastDailyRewardTicks = DateTime.UtcNow.Ticks;
            int day = (p.dailyStreak - 1) % 7;
            Reward r;
            switch (day)
            {
                case 2: r = Reward.Gems(10); break;
                case 4: r = Reward.Box(BoxType.Big); break;
                case 6: r = Reward.Box(BoxType.Mega); break;
                default: r = Reward.Coins(60 + day * 20); break;
            }
            var got = Grant(r);
            SaveSystem.Save();
            return got;
        }
    }
}
