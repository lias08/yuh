// Menu screens. Each screen renders into app.ui and wires its own handlers.
import { icon } from './icons.js';
import { redeemCode } from '../core/save.js';
import { Accounts } from '../core/accounts.js';
import { accountsScreen, adminScreen } from './accountScreens.js';
import { Voice, VOICE_SLOTS } from '../core/voice.js';
import { Save, bData, owned, totalTrophies, upgrade, upgradeCost, canUpgrade, buyItem, grant, rewardLabel, buyBrawler, openOrb, leaderboard, unreadNotes, note, seeded, botName, MAX_LEVEL, UNLOCK, PRICES, TROPHY_ROAD, PASS, GEARS } from '../core/save.js';
import { ROSTER, BY_ID, RARITIES, ANIME, skinsFor } from '../data/index.js';
import { MODES, THEMES, MAPS } from '../data/maps.js';
import { PINS, SPRAYS, TITLES, EFFECTS, EMOTES } from '../data/progression.js';
import { setVolumes, sfx } from '../core/audio.js';
import { actRange } from '../game/ai.js';
import { BOSS_DEF } from '../game/modes/index.js';

const fmt = (n) => Math.round(n).toLocaleString('de-DE');
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rar = (r) => RARITIES[r];
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

function curBar() {
  const d = Save.data;
  return `<div class="curbar">
    <div class="cur">${icon('coin')}<b>${fmt(d.coins)}</b></div>
    <div class="cur">${icon('gem')}<b>${fmt(d.gems)}</b></div>
    <div class="cur">${icon('credits')}<b>${fmt(d.credits)}</b></div>
  </div>`;
}
function header(title, extra = '') {
  return `<header class="phead"><button class="back">${icon('back')}</button><h1>${title}</h1><div class="sp"></div>${extra}${curBar()}</header>`;
}
function pimg(app, id, skin = 'default', form = 'base', cls = 'pimg') {
  return `<img class="${cls}" data-p="${id}" data-skin="${skin}" data-form="${form}" alt="">`;
}
function hydrate(app, root = app.ui) {
  root.querySelectorAll('img[data-p]:not(.queued)').forEach(img => { img.classList.add('queued'); app.queuePortrait(img, img.dataset.p, img.dataset.skin, img.dataset.form); });
}
function rarityTag(r) { const R = rar(r); return `<span class="rtag r-${r}" style="--rc:${R.color}">${R.name}</span>`; }

// ---------------------------------------------------------------------------
export function codeModal(app) {
  const m = app.modal(`<h2>Code einlösen</h2><p>Gib deinen Code ein.</p><input class="inp code" inputmode="numeric" maxlength="16" placeholder="Code"><div class="row"><button class="btn ghost no">Abbrechen</button><button class="btn green yes">Einlösen</button></div>`);
  const go = () => { const r = redeemCode(m.el.querySelector('.code').value); app.toast(r.text, r.ok ? 'gold' : ''); if (r.ok) { sfx('unlock'); m.close(); app.stage.celebrate(0xffd23f); app.show(app.screen); } };
  m.el.querySelector('.yes').onclick = go;
  m.el.querySelector('.code').onkeydown = (e) => { if (e.key === 'Enter') go(); };
  m.el.querySelector('.no').onclick = () => m.close();
  setTimeout(() => m.el.querySelector('.code').focus(), 50);
}

export function rewardsModal(app, list, title = 'Belohnungen') {
  const items = list.map((r, i) => { const L = rewardLabel(r); return `<div class="rw" style="animation-delay:${0.15 + i * 0.12}s"><div class="ri">${r.kind === 'brawler' ? pimg(app, r.id, 'default', 'base', 'rimg') : `<span>${L.icon}</span>`}</div><div class="rt">${L.text}${r.dupe ? ' <small>(Duplikat → Credits)</small>' : ''}</div></div>`; }).join('');
  const m = app.modal(`<h2>${title}</h2><div class="rwlist">${items}</div><button class="btn yellow ok">Super!</button>`, { cls: 'rewards' });
  hydrate(app, m.el);
  m.el.querySelector('.ok').onclick = () => { m.close(); };
  sfx('coin');
  const b = list.find(r => r.kind === 'brawler' && !r.dupe);
  if (b) setTimeout(() => unlockReveal(app, b.id), 400);
}
export function unlockReveal(app, id) {
  const c = BY_ID[id]; const R = rar(c.rarity);
  const m = app.modal(`<div class="reveal r-${c.rarity}" style="--rc:${R.color};--rg:${R.glow}">
      <div class="rays"></div><div class="orb"></div>
      <div class="rcard"><div class="rframe">${pimg(app, id, 'default', 'base', 'rvimg')}</div>
      <div class="rname">${esc(c.name)}</div><div class="rsub">${rarityTag(c.rarity)} · ${ANIME[c.anime].name}</div>
      <div class="rdesc">${esc(c.desc)}</div></div>
      <div class="newtag">NEUER KÄMPFER!</div>
    </div><button class="btn yellow ok">Weiter</button>`, { cls: 'unlock', noClose: true });
  hydrate(app, m.el);
  sfx('unlock');
  m.el.querySelector('.ok').onclick = () => { m.close(); };
}

// ---------------------------------------------------------------------------
function lobby(app) {
  const d = Save.data;
  const def = BY_ID[d.selected]; const b = bData(d.selected);
  const M = MODES[d.mode] || MODES.crystal;
  const total = totalTrophies();
  const nextRoad = TROPHY_ROAD.find(r => r.t > total) || TROPHY_ROAD[TROPHY_ROAD.length - 1];
  const prevT = [...TROPHY_ROAD].reverse().find(r => r.t <= total)?.t ?? 0;
  const claimable = TROPHY_ROAD.filter(r => r.t <= total && !d.roadClaimed.includes(r.t)).length;
  const passTier = Math.floor(d.pass.xp / PASS.xpPerTier);
  const passClaim = Math.min(PASS.tiers, passTier) - d.pass.free.length + (d.pass.premium ? Math.min(PASS.tiers, passTier) - d.pass.prem.length : 0);
  const questDone = d.quests.list.filter(q => q.done && !q.claimed).length;
  const unread = unreadNotes();
  const theme = THEMES[app.pickTheme(d.mode)];
  app.ui.innerHTML = `
  <div class="lobby">
    <header class="topbar">
      <button class="profile-chip" data-go="profile">${pimg(app, d.player.icon, 'default', 'base', 'avatar')}<div><b>${esc(d.player.name)}</b><small>${TITLES[d.player.title] ?? ''}</small></div></button>
      <button class="trophy-chip" data-go="road">${icon('trophy')}<div class="tc"><b>${fmt(total)}</b><div class="tbar"><i style="width:${Math.min(100, (total - prevT) / Math.max(1, nextRoad.t - prevT) * 100)}%"></i></div></div>${claimable ? `<em class="badge">${claimable}</em>` : ''}</button>
      <div class="sp"></div>
      ${curBar()}
      <button class="icon-btn bell">${icon('bell')}${unread ? `<em class="badge">${unread}</em>` : ''}</button>
      ${Accounts.isOwner() ? '<button class="icon-btn adminbtn" data-go="admin" title="Admin-Panel">👑</button>' : ''}
      <button class="icon-btn codebtn" title="Code einlösen">${icon('gadget')}</button>
      <button class="icon-btn" data-go="settings">${icon('settings')}</button>
    </header>
    <nav class="side left">
      <button class="sbtn c-shop" data-go="shop">${icon('shop')}<span>Shop</span><em class="badge dot ${d.shop.bought.includes('free') ? 'hide' : ''}">!</em></button>
      <button class="sbtn c-brawlers" data-go="brawlers">${icon('brawlers')}<span>Kämpfer</span><small>${Object.keys(d.brawlers).length}/${ROSTER.length}</small></button>
      <button class="sbtn c-pass" data-go="pass">${icon('pass')}<span>Pass</span>${passClaim > 0 ? `<em class="badge">${passClaim}</em>` : ''}</button>
      <button class="sbtn c-quests" data-go="quests">${icon('quests')}<span>Quests</span>${questDone ? `<em class="badge">${questDone}</em>` : ''}</button>
    </nav>
    <nav class="side right">
      <button class="sbtn c-friends" data-go="friends">${icon('friends')}<span>Freunde</span>${d.team.length ? `<em class="badge">${d.team.length}</em>` : ''}</button>
      <button class="sbtn c-club" data-go="club">${icon('club')}<span>Club</span></button>
      <button class="sbtn c-rank" data-go="ranking">${icon('ranking')}<span>Rangliste</span></button>
      <button class="sbtn c-events" data-go="events">${icon('events')}<span>Events</span></button>
    </nav>
    <div class="stage-tap"></div>
    <div class="char-info">
      <div class="cname">${esc(def.name)}</div>
      <div class="csub">${rarityTag(def.rarity)} <span class="lvl">LV ${b.level}</span> <span class="ctr">${icon('trophy')}${b.trophies}</span></div>
      <div class="cform">${icon('form')} ${def.trans ? esc(def.trans.name) + (def.trans.next ? ' → ' + esc(def.trans.next.name) : '') : ''}</div>
    </div>
    <footer class="bottombar">
      <button class="brawler-chip" data-go="brawlers">${pimg(app, d.selected, b.skin)}<div><small>Kämpfer</small><b>${esc(def.name)}</b></div></button>
      <button class="mode-chip" data-go="events" style="--mc:${M.color}"><span class="mi">${M.icon}</span><div><small>${esc(theme.name)} · ${esc(MAPS[M.map]?.name ?? 'Wechselnd')}</small><b>${esc(M.name)}</b></div></button>
      <button class="train-btn" title="Trainingsmodus">${icon('sword')}<span>Training</span></button>
      <button class="play-btn"><span>SPIELEN</span></button>
    </footer>
  </div>`;
  hydrate(app);
  if (app.stageChar !== d.selected) app.setStageChar(d.selected);
  const tap = app.ui.querySelector('.stage-tap');
  let down = null;
  tap.addEventListener('pointerdown', (e) => { down = { x: e.clientX, t: performance.now(), s: app.stage.spinTarget }; app.stage.drag = true; (() => { try { tap.setPointerCapture(e.pointerId); } catch {} })(); });
  tap.addEventListener('pointermove', (e) => { if (down) app.stage.spinTarget = down.s + (e.clientX - down.x) * 0.012; });
  tap.addEventListener('pointerup', (e) => { if (down && Math.abs(e.clientX - down.x) < 8) { app.stage.react(); sfx(def.sfx || 'punch'); } down = null; app.stage.drag = false; });
  app.ui.querySelector('.codebtn').onclick = () => codeModal(app);
  app.ui.querySelector('.train-btn').onclick = () => { app.startMatch('training', { brawler: d.selected }); app.pendingMatch.from = 'lobby'; };
  app.ui.querySelector('.play-btn').onclick = () => { if (!owned(d.selected)) { app.toast('Kämpfer nicht freigeschaltet'); return; } app.startMatch(d.mode); };
  app.ui.querySelector('.bell').onclick = () => {
    const m = app.modal(`<h2>Benachrichtigungen</h2><div class="notes">${d.notes.map(n => `<div class="note ${n.unread ? 'new' : ''}"><small>${new Date(n.t).toLocaleString('de-DE')}</small><p>${esc(n.text)}</p></div>`).join('') || '<p>Keine Nachrichten.</p>'}</div>`);
    d.notes.forEach(n => n.unread = false); Save.save();
    m.el.addEventListener('click', () => {}, { once: true });
    const badge = app.ui.querySelector('.bell .badge'); if (badge) badge.remove();
  };
}

// ---------------------------------------------------------------------------
function brawlers(app, params) {
  const d = Save.data;
  const st = app.brawlerFilter || (app.brawlerFilter = { anime: 'all', sort: 'rarity', rarity: 'all' });
  const render = () => {
    let list = [...ROSTER];
    if (st.anime !== 'all') list = list.filter(c => c.anime === st.anime);
    if (st.rarity !== 'all') list = list.filter(c => c.rarity === st.rarity);
    list.sort((a, b) => {
      if (st.sort === 'trophies') return (bData(b.id)?.trophies ?? -1) - (bData(a.id)?.trophies ?? -1);
      if (st.sort === 'name') return a.name.localeCompare(b.name);
      if (st.sort === 'level') return (bData(b.id)?.level ?? 0) - (bData(a.id)?.level ?? 0);
      return rar(a.rarity).order - rar(b.rarity).order || (owned(b.id) - owned(a.id));
    });
    grid.innerHTML = list.map(c => {
      const b = bData(c.id); const R = rar(c.rarity);
      return `<button class="bcard r-${c.rarity} ${b ? '' : 'locked'} ${d.selected === c.id ? 'sel' : ''}" data-id="${c.id}" style="--rc:${R.color};--rg:${R.glow}">
        <div class="bport">${pimg(app, c.id, b?.skin ?? 'default')}</div>
        <div class="bano">${ANIME[c.anime].short}</div>
        ${b ? `<div class="blvl">${b.level}</div><div class="btr">${icon('trophy')}${b.trophies}</div>` : `<div class="block">${icon('lock')}</div>`}
        <div class="bname">${esc(c.name)}</div>
        <div class="brar">${R.name}</div>
      </button>`;
    }).join('');
    hydrate(app, grid);
    grid.querySelectorAll('.bcard').forEach(el => el.onclick = () => app.show('detail', { id: el.dataset.id, from: 'brawlers' }));
    app.ui.querySelector('.count').textContent = `${Object.keys(d.brawlers).length}/${ROSTER.length} freigeschaltet`;
  };
  app.ui.innerHTML = `<div class="panel-screen">${header('Kämpfer', '<span class="count"></span>')}
    <div class="filters">
      <div class="chips">${[['all', 'Alle'], ...Object.entries(ANIME).map(([k, v]) => [k, v.short])].map(([k, v]) => `<button class="chip ${st.anime === k ? 'on' : ''}" data-a="${k}">${v}</button>`).join('')}</div>
      <div class="chips">
        <select class="sel-rar"><option value="all">Alle Seltenheiten</option>${Object.entries(RARITIES).map(([k, v]) => `<option value="${k}" ${st.rarity === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
        <select class="sel-sort">${[['rarity', 'Seltenheit'], ['trophies', 'Trophäen'], ['level', 'Level'], ['name', 'Name']].map(([k, v]) => `<option value="${k}" ${st.sort === k ? 'selected' : ''}>Sortieren: ${v}</option>`).join('')}</select>
      </div>
    </div>
    <div class="bgrid"></div></div>`;
  const grid = app.ui.querySelector('.bgrid');
  app.ui.querySelectorAll('.chip[data-a]').forEach(b => b.onclick = () => { st.anime = b.dataset.a; app.ui.querySelectorAll('.chip[data-a]').forEach(x => x.classList.toggle('on', x === b)); render(); sfx('tap'); });
  app.ui.querySelector('.sel-rar').onchange = (e) => { st.rarity = e.target.value; render(); };
  app.ui.querySelector('.sel-sort').onchange = (e) => { st.sort = e.target.value; render(); };
  app.stageVisible = false;
  render();
}

// ---------------------------------------------------------------------------
function statRows(c, form) {
  const s = c.stats;
  const FD = form === 'trans2' ? c.trans?.next : form === 'trans' ? c.trans : null;
  const main = FD?.main ?? c.main;
  const perShot = (a) => {
    if (!a) return 0;
    if (a.kind === 'proj') return (a.dmg ?? 0) * (a.count ?? 1) * (a.burst?.n ?? 1) + (a.explode?.dmg ?? 0);
    if (a.kind === 'cone') return (a.dmg ?? 0) * (a.hits ?? 1);
    if (a.kind === 'beam') return (a.dmg ?? 0) * (a.ticks ?? 1);
    if (a.kind === 'multi') return a.list.reduce((t, x) => t + perShot(x), 0);
    return a.dmg ?? 0;
  };
  const dm = (FD?.stats?.dmg ?? 1);
  const rows = [
    ['Lebenspunkte', s.hp * (FD?.stats?.hp ?? 1), 7500, fmt(s.hp * (FD?.stats?.hp ?? 1))],
    ['Tempo', s.speed * (FD?.stats?.speed ?? 1), 4.3, (s.speed * (FD?.stats?.speed ?? 1)).toFixed(2) + ' F/s'],
    ['Schaden / Angriff', perShot(main) * dm, 2600, fmt(perShot(main) * dm)],
    ['Reichweite', actRange(main), 11, actRange(main).toFixed(1) + ' Felder'],
    ['Nachladen', 2.4 - s.reload * (FD?.stats?.reload ?? 1), 1.6, (s.reload * (FD?.stats?.reload ?? 1)).toFixed(2) + ' s'],
    ['Munition', FD?.stats?.ammo ?? s.ammo ?? 3, 4, `${FD?.stats?.ammo ?? s.ammo ?? 3}`],
    ['Super-Ladung', 1 / (s.superHits ?? 4), 0.34, `${s.superHits ?? 4} Treffer`],
  ];
  return rows.map(([n, v, max, txt]) => `<div class="srow"><span>${n}</span><div class="sbar"><i style="width:${Math.max(6, Math.min(100, v / max * 100))}%"></i></div><b>${txt}</b></div>`).join('');
}
function abilityCard(kind, a, extra = '') {
  if (!a) return '';
  return `<div class="ab k-${kind}"><div class="abi">${icon(kind === 'super' ? 'star' : kind === 'gadget' ? 'gadget' : kind === 'sp' ? 'bolt' : kind === 'form' ? 'form' : 'sword')}</div><div class="abt"><small>${({ main: 'Hauptangriff', super: 'Super', gadget: 'Gadget', sp: 'Passive Kraft', form: 'Transformation' })[kind]}</small><b>${esc(a.name ?? '')}</b><p>${esc(a.desc ?? '')}</p>${extra}</div></div>`;
}

function detail(app, params) {
  const id = params.id || Save.data.selected;
  const c = BY_ID[id]; const R = rar(c.rarity);
  const st = app.detailState && app.detailState.id === id ? app.detailState : (app.detailState = { id, tab: 'info', form: 'base' });
  app.stage.offsetX = 0.62; app.stage.zoom = 1.05;
  const draw = () => {
    const b = bData(id);
    const d = Save.data;
    const skinId = b?.skin ?? 'default';
    const key = id + skinId + st.form;
    if (st.lastKey !== key || app.stageChar !== id) { st.lastKey = key; const sk = skinsFor(c).find(s => s.id === skinId); app.stage.setCharacter(c, sk && sk.look ? sk : null, st.form, parseInt(R.color.slice(1), 16)); app.stageChar = id; }
    const FD = st.form === 'trans2' ? c.trans?.next : st.form === 'trans' ? c.trans : null;
    const forms = [['base', 'Grundform'], ['trans', c.trans?.name], ...(c.trans?.next ? [['trans2', c.trans.next.name]] : [])];
    const lvl = b?.level ?? 1;
    const cost = b ? upgradeCost(b.level) : null;
    let body = '';
    if (st.tab === 'info') {
      body = `<p class="desc">${esc(c.desc)}</p><div class="play"><b>Spielstil</b><p>${esc(c.playstyle)}</p></div><div class="stats">${statRows(c, st.form)}</div>
      <div class="meta"><span>Rolle: <b>${esc(c.role)}</b></span><span>Anime: <b>${ANIME[c.anime].name}</b></span>${b ? `<span>Siege: <b>${b.wins}</b></span><span>Rekord: <b>${b.highest} ${icon('trophy')}</b></span><span>Meisterschaft: <b>${masteryName(b.mastery)}</b> (${b.mastery} P.)</span>` : ''}</div>`;
    } else if (st.tab === 'abilities') {
      body = `<div class="formtoggle">${forms.map(([k, n]) => `<button class="chip ${st.form === k ? 'on' : ''}" data-f="${k}">${esc(n)}</button>`).join('')}</div>
        ${abilityCard('main', FD?.main ?? c.main)}${abilityCard('super', FD?.super ?? c.super)}
        ${c.passive?.length ? `<div class="ab k-passive"><div class="abi">${icon('info')}</div><div class="abt"><small>Angeborene Fähigkeit</small><b>${esc(c.passive.map(p => p.name).filter(Boolean).join(', ') || 'Passiv')}</b><p>${passiveText(c.passive)}</p></div></div>` : ''}
        <h3>Gadgets <small>(ab Level ${UNLOCK.gadget})</small></h3>${c.gadgets.map((g, i) => abilityCard('gadget', g, gadgetBtn(b, 'gadget', i))).join('')}
        <h3>Passive Kräfte <small>(ab Level ${UNLOCK.starPower})</small></h3>${c.starPowers.map((g, i) => abilityCard('sp', g, gadgetBtn(b, 'starPower', i))).join('')}
        <div class="row"><button class="btn blue preview">${icon('eye')} Animation ansehen</button><button class="btn green try">${icon('play')} Im Training testen</button></div>`;
    } else if (st.tab === 'form') {
      const T = c.trans;
      body = `<div class="formtoggle">${forms.map(([k, n]) => `<button class="chip ${st.form === k ? 'on' : ''}" data-f="${k}">${esc(n)}</button>`).join('')}</div>
        ${[T, T.next].filter(Boolean).map((F, i) => `<div class="formcard" style="--fc:#${(F.aura ?? 0xffffff).toString(16).padStart(6, '0')}">
          <div class="fh">${icon('form')}<div><small>${i ? 'Zweite Stufe' : 'Transformation'} · ${F.duration ?? 14} s</small><b>${esc(F.name)}</b></div></div>
          <p>${esc(F.desc ?? '')}</p>
          <ul>${formStats(F)}</ul>
          ${abilityCard('main', F.main)}${abilityCard('super', F.super)}
          ${F.passive?.length ? `<div class="ab k-passive"><div class="abi">${icon('info')}</div><div class="abt"><small>Form-Passiv</small><p>${passiveText(F.passive)}</p></div></div>` : ''}
        </div>`).join('')}
        <p class="hint">Die Form-Anzeige lädt durch verursachten und erlittenen Schaden sowie mit der Zeit. Voll? Drücke <b>F</b> oder den FORM-Knopf.${T.next ? ' In der ersten Form lädt die Anzeige weiter — erneut drücken für die zweite Stufe.' : ''}</p>`;
    } else if (st.tab === 'upgrade') {
      if (!b) body = `<p class="desc">Schalte ${esc(c.name)} frei, um Upgrades zu kaufen.</p>`;
      else {
        body = `<div class="lvlbox"><div class="lv">LEVEL <b>${b.level}</b>/${MAX_LEVEL}</div>
          <div class="ppbar"><i style="width:${cost ? Math.min(100, b.pp / cost.pp * 100) : 100}%"></i><span>${icon('pp')} ${b.pp}${cost ? ' / ' + cost.pp : ''}</span></div>
          ${cost ? `<button class="btn yellow up ${canUpgrade(id) ? '' : 'dis'}">${icon('up')} Upgrade · ${icon('coin')} ${cost.coins}</button>` : '<div class="maxed">MAX</div>'}
          <p class="hint">+8 % LP und Schaden pro Level. Power-Punkte gibt es aus Orbs, dem Pass, Quests und Matches.</p></div>
          <h3>Ausrüstung (Gears) <small>(ab Level ${UNLOCK.gear}, 2. Slot ab ${UNLOCK.gear2})</small></h3>
          <div class="gears">${GEARS.map((g, i) => { const own = b.gears.includes(i), eq = b.gear.includes(i); return `<div class="gearc ${own ? 'own' : ''} ${eq ? 'eq' : ''}" data-g="${i}"><span class="gi">${g.icon}</span><b>${g.name}</b><small>${g.desc}</small>${own ? `<button class="btn tiny ${eq ? 'ghost' : 'blue'} geq">${eq ? 'Ablegen' : 'Ausrüsten'}</button>` : `<button class="btn tiny yellow gbuy ${b.level >= UNLOCK.gear ? '' : 'dis'}">${icon('coin')} ${PRICES.gear}</button>`}</div>`; }).join('')}</div>
          <h3>Overdrive <small>(ab Level ${UNLOCK.overdrive})</small></h3>
          <div class="ab k-super"><div class="abi">${icon('bolt')}</div><div class="abt"><b>Overdrive-Super</b><p>Jede zweite Super wird zur Overdrive-Super: +25 % Schaden, +25 % Tempo und 15 % Schadensreduktion für 4 s.</p>${b.overdrive ? '<span class="own">Freigeschaltet</span>' : `<button class="btn tiny yellow odbuy ${b.level >= UNLOCK.overdrive ? '' : 'dis'}">${icon('coin')} ${PRICES.overdrive}</button>`}</div></div>`;
      }
    } else if (st.tab === 'voice') {
      if (!Voice.index) { Voice.loadIndex().then(() => app.screen === 'detail' && draw()); }
      body = `<p class="desc">Nimm deine eigenen Sprüche für ${esc(c.name)} auf (max. 3 Sekunden). Sie werden im Kampf abgespielt.</p>
        <div class="notice small">${icon('info')} Original-Synchronstimmen aus den Animes sind urheberrechtlich geschützt und daher nicht im Spiel enthalten.</div>
        ${Voice.supported() ? VOICE_SLOTS.map(sl => `<div class="vslot" data-s="${sl.id}"><div class="vt"><b>${sl.name}</b><small>${sl.hint}</small></div>
          <div class="vmeter"><i></i></div>
          <button class="btn tiny red vrec">● Aufnehmen</button>${Voice.has(id, sl.id) ? `<button class="btn tiny blue vplay">▶</button><button class="btn tiny ghost vdel">✕</button>` : ''}</div>`).join('')
          : '<p class="hint">Dein Gerät unterstützt keine Audioaufnahme.</p>'}`;
    } else if (st.tab === 'skins') {
      const skins = skinsFor(c);
      body = `<div class="skins">${skins.map(s => { const own = b && b.skins.includes(s.id); const eq = b && b.skin === s.id; return `<div class="skinc ${eq ? 'eq' : ''}" data-s="${s.id}"><div class="sport">${pimg(app, id, s.id)}</div><b>${esc(s.name)}</b>${rarityTag(s.rarity)}${eq ? '<span class="own">Ausgerüstet</span>' : own ? '<button class="btn tiny blue seq">Ausrüsten</button>' : b ? `<button class="btn tiny green sbuy">${icon('gem')} ${s.price}</button>` : ''}</div>`; }).join('')}</div>
        <p class="hint">Skins sind rein kosmetisch und verändern Farben und Kleidung.</p>`;
    }
    app.ui.innerHTML = `<div class="detail r-${c.rarity}" style="--rc:${R.color};--rg:${R.glow}">
      ${header('', '')}
      <div class="dleft"><div class="dname">${esc(c.name)}</div><div class="dsub">${rarityTag(c.rarity)} <span class="ano" style="--ac:${ANIME[c.anime].color}">${ANIME[c.anime].name}</span></div>
        ${b ? `<div class="dlv"><span>LV ${b.level}</span><span>${icon('trophy')} ${b.trophies}</span></div>` : ''}
        <div class="dforms">${forms.map(([k, n]) => `<button class="chip small ${st.form === k ? 'on' : ''}" data-f="${k}">${esc(n)}</button>`).join('')}</div>
        <div class="stage-tap"></div>
      </div>
      <div class="dright">
        <div class="tabs">${[['info', 'Übersicht'], ['abilities', 'Fähigkeiten'], ['form', 'Transformation'], ['upgrade', 'Upgrades'], ['skins', 'Skins'], ['voice', 'Stimme']].map(([k, n]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>
        <div class="tbody">${body}</div>
        <div class="dfoot">
          ${b ? `<button class="btn ${d.selected === id ? 'ghost' : 'yellow'} select">${d.selected === id ? icon('check') + ' Ausgewählt' : 'Auswählen'}</button>`
            : `<button class="btn yellow buyc">${icon('credits')} ${fmt(R.price)}</button><button class="btn green buyg">${icon('gem')} ${R.gemPrice}</button>`}
          <button class="btn blue tryit">${icon('play')} Testen</button>
        </div>
      </div></div>`;
    hydrate(app);
    const $ = (s) => app.ui.querySelector(s), $$ = (s) => app.ui.querySelectorAll(s);
    $('.back').onclick = () => app.show(params.from || 'brawlers');
    $$('.tab').forEach(t => t.onclick = () => { st.tab = t.dataset.t; draw(); sfx('tap'); });
    $$('[data-f]').forEach(t => t.onclick = () => { st.form = t.dataset.f; draw(); app.stage.celebrate(st.form === 'base' ? 0xffffff : (st.form === 'trans2' ? c.trans.next.aura : c.trans.aura)); sfx('transform'); });
    $('.tryit').onclick = () => { app.pendingFrom = 'detail'; app.startMatch('training', { brawler: id }); app.pendingMatch.from = 'detail'; };
    $('.try')?.addEventListener('click', () => $('.tryit').click());
    $('.preview')?.addEventListener('click', () => { app.stage.react(); sfx(c.sfx || 'punch'); });
    $('.select')?.addEventListener('click', () => { d.selected = id; Save.save(); app.stage.celebrate(parseInt(R.color.slice(1), 16)); sfx('powerup'); draw(); });
    $('.buyc')?.addEventListener('click', () => { if (buyBrawler(id, 'credits')) { unlockReveal(app, id); draw(); } else app.toast('Nicht genug Seelen-Credits'); });
    $('.buyg')?.addEventListener('click', () => { if (buyBrawler(id, 'gems')) { unlockReveal(app, id); draw(); } else app.toast('Nicht genug Juwelen'); });
    $('.up')?.addEventListener('click', () => { if (upgrade(id)) { app.stage.celebrate(0xffd23f); sfx('unlock'); draw(); } else app.toast('Nicht genug Münzen oder Power-Punkte'); });
    $$('.gbtn').forEach(bt => bt.onclick = () => {
      const kind = bt.dataset.kind, i = +bt.dataset.i, bb = bData(id);
      if (bt.classList.contains('equip')) { if (kind === 'gadget') bb.gadget = i; else bb.sp = i; Save.save(); draw(); return; }
      if (buyItem(id, kind, i)) { sfx('unlock'); draw(); } else app.toast(lvl < (kind === 'gadget' ? UNLOCK.gadget : UNLOCK.starPower) ? 'Level zu niedrig' : 'Nicht genug Münzen');
    });
    $$('.gearc').forEach(el => {
      const i = +el.dataset.g;
      el.querySelector('.gbuy')?.addEventListener('click', () => { if (buyItem(id, 'gear', i)) { sfx('unlock'); draw(); } else app.toast(b.level < UNLOCK.gear ? 'Level zu niedrig' : 'Nicht genug Münzen'); });
      el.querySelector('.geq')?.addEventListener('click', () => { const bb = bData(id); if (bb.gear.includes(i)) bb.gear = bb.gear.filter(x => x !== i); else { const slots = bb.level >= UNLOCK.gear2 ? 2 : 1; bb.gear.push(i); while (bb.gear.length > slots) bb.gear.shift(); } Save.save(); draw(); });
    });
    $('.odbuy')?.addEventListener('click', () => { if (buyItem(id, 'overdrive', 0)) { sfx('unlock'); draw(); } else app.toast('Level zu niedrig oder nicht genug Münzen'); });
    $$('.skinc').forEach(el => {
      const sid = el.dataset.s; const s = skinsFor(c).find(x => x.id === sid);
      el.querySelector('.seq')?.addEventListener('click', () => { bData(id).skin = sid; Save.save(); draw(); app.stage.celebrate(0xffffff); });
      el.querySelector('.sbuy')?.addEventListener('click', () => { if (d.gems < s.price) { app.toast('Nicht genug Juwelen'); return; } d.gems -= s.price; bData(id).skins.push(sid); bData(id).skin = sid; Save.save(); sfx('unlock'); draw(); app.stage.celebrate(0xffd23f); });
    });
    $$('.vslot').forEach(el => {
      const slot = el.dataset.s, meter = el.querySelector('.vmeter i');
      el.querySelector('.vrec').onclick = async (ev) => {
        const btn = ev.currentTarget; if (btn.disabled) return; btn.disabled = true; btn.textContent = '● Aufnahme… (3 s)';
        try { const blob = await Voice.record(3, (l) => meter.style.width = Math.min(100, l * 140) + '%'); await Voice.save(id, slot, blob); app.toast('Gespeichert!', 'gold'); Voice.lastPlay = 0; Voice.play(id, slot); }
        catch (e) { app.toast('Mikrofon nicht verfügbar – bitte Berechtigung erlauben.'); }
        draw();
      };
      el.querySelector('.vplay')?.addEventListener('click', () => { Voice.lastPlay = 0; Voice.play(id, slot); });
      el.querySelector('.vdel')?.addEventListener('click', async () => { await Voice.remove(id, slot); draw(); });
    });
    const tap = $('.stage-tap');
    let down = null;
    tap.addEventListener('pointerdown', (e) => { down = { x: e.clientX, s: app.stage.spinTarget }; app.stage.drag = true; (() => { try { tap.setPointerCapture(e.pointerId); } catch {} })(); });
    tap.addEventListener('pointermove', (e) => { if (down) app.stage.spinTarget = down.s + (e.clientX - down.x) * 0.012; });
    tap.addEventListener('pointerup', (e) => { if (down && Math.abs(e.clientX - down.x) < 8) { app.stage.react(); sfx(c.sfx || 'punch'); } down = null; app.stage.drag = false; });
  };
  draw();
}
function gadgetBtn(b, kind, i) {
  if (!b) return '';
  const own = kind === 'gadget' ? b.gadgets.includes(i) : b.sps.includes(i);
  const eq = kind === 'gadget' ? b.gadget === i : b.sp === i;
  const need = kind === 'gadget' ? UNLOCK.gadget : UNLOCK.starPower;
  if (own) return eq ? '<span class="own">Ausgerüstet</span>' : `<button class="btn tiny blue gbtn equip" data-kind="${kind}" data-i="${i}">Ausrüsten</button>`;
  return `<button class="btn tiny yellow gbtn ${b.level >= need ? '' : 'dis'}" data-kind="${kind}" data-i="${i}">${b.level >= need ? icon('coin') + ' ' + PRICES[kind] : icon('lock') + ' Level ' + need}</button>`;
}
function formStats(F) {
  const s = F.stats || {}; const out = [];
  if (s.hp && s.hp !== 1) out.push(`LP ×${s.hp}`); if (s.dmg && s.dmg !== 1) out.push(`Schaden ×${s.dmg}`); if (s.speed && s.speed !== 1) out.push(`Tempo ×${s.speed}`); if (s.reload && s.reload !== 1) out.push(`Nachladen ×${s.reload}`);
  out.push(`Heilt beim Verwandeln ${Math.round((F.heal ?? 0.3) * 100)} %`);
  return out.map(x => `<li>${x}</li>`).join('');
}
const PASSIVE_TEXT = {
  infinity: p => `Infinity: −${Math.round(p.reduce * 100)} % Schaden durch Geschosse, Geschosse werden in der Nähe abgebremst`,
  dodge: p => `${Math.round(p.chance * 100)} % Ausweichen`, intangible: p => `${Math.round(p.chance * 100)} % der Geschosse gehen hindurch`,
  futureSight: p => `Blockt alle ${p.cd} s einen Treffer vollständig`, illusion: p => `${Math.round(p.chance * 100)} % Chance, nur eine Illusion zu sein`,
  rage: p => `Bis zu +${Math.round(p.max * 100)} % Schaden bei niedrigen LP`, regen: p => `Regeneriert ${p.amt} LP/s`, lifesteal: p => `Heilt ${Math.round(p.f * 100)} % des Schadens`,
  drain: p => `Verliert ${Math.round(p.perSec * 100)} % LP pro Sekunde`, burnAura: p => `Feueraura (${p.dps} Schaden/s)`, critChance: p => `${Math.round(p.chance * 100)} % Chance auf ${p.mult}× Schaden (${p.name ?? 'Kritisch'})`,
  sweetSpot: p => `Treffer bei ${Math.round(p.at * 100)} % der Reichweite: ${p.mult}× Schaden`, unstoppable: () => 'Unaufhaltsam: kaum Rückstoß, kurze Betäubungen', rubber: () => 'Gummikörper: halber Rückstoß',
  immune: p => `Immun gegen: ${p.effects.join(', ')}`, damageReduce: p => `−${Math.round(p.f * 100)} % Schaden`, flying: () => 'Fliegt über Wasser und Seile', reviveOnce: p => `Überlebt einmal mit ${Math.round(p.hp * 100)} % LP`,
  onHitEffect: () => 'Treffer lösen Zusatzeffekte aus', executeBoost: p => `Hakai-Schwelle +${Math.round(p.add * 100)} %`, markerCap: p => `Bis zu ${p.n} Markierungen`,
};
function passiveText(list) { return list.map(p => (PASSIVE_TEXT[p.type] ? PASSIVE_TEXT[p.type](p) : p.desc ?? p.type)).join(' · '); }
function masteryName(m) { return m >= 2000 ? 'Gold III' : m >= 1200 ? 'Gold' : m >= 600 ? 'Silber' : m >= 200 ? 'Bronze' : 'Anfänger'; }

// ---------------------------------------------------------------------------
function shop(app) {
  const d = Save.data;
  const offerCard = (o) => {
    const bought = d.shop.bought.includes(o.id);
    let vis = '', title = esc(o.title), sub = '';
    if (o.kind === 'orb') { vis = `<div class="orbv t-${o.tier}">${icon('orb')}</div>`; sub = rewardLabel(o).text; }
    if (o.kind === 'pp') { vis = `<div class="bigico">${icon('pp')}</div>`; sub = `${o.n} Power-Punkte für ${esc(BY_ID[d.selected].name)}`; }
    if (o.kind === 'skin') { const [b, s] = o.skin.split(':'); vis = pimg(app, b, s, 'base', 'oimg'); sub = esc(BY_ID[b].name); }
    if (o.kind === 'brawler') { vis = pimg(app, o.brawler, 'default', 'base', 'oimg'); sub = esc(BY_ID[o.brawler].name) + ' ' + rarityTag(BY_ID[o.brawler].rarity); }
    const price = o.cur === 'free' ? 'GRATIS' : `${icon(o.cur === 'gems' ? 'gem' : 'coin')} ${o.price}`;
    return `<div class="offer ${bought ? 'bought' : ''} k-${o.kind}" data-o="${o.id}">${o.sale ? `<em class="sale">-${o.sale}%</em>` : ''}<div class="ov">${vis}</div><b>${title}</b><small>${sub}</small><button class="btn ${o.cur === 'free' ? 'green' : 'yellow'} small obuy" ${bought ? 'disabled' : ''}>${bought ? 'Gekauft' : price}</button></div>`;
  };
  const coinPacks = [{ id: 'c1', n: 150, price: 20 }, { id: 'c2', n: 400, price: 50 }, { id: 'c3', n: 1200, price: 140 }];
  const cosItems = [
    ...PINS.filter(p => !d.cos.pins.includes(p.id)).map(p => ({ kind: 'pin', id: p.id, name: p.name, ic: p.icon, price: 9 })),
    ...SPRAYS.filter(p => !d.cos.sprays.includes(p.id)).map(p => ({ kind: 'spray', id: p.id, name: p.name, ic: '🎨', price: 19 })),
    ...EFFECTS.filter(p => p.id !== 'none' && !d.cos.effects.includes(p.id)).map(p => ({ kind: 'effect', id: p.id, name: p.name, ic: '✨', price: 49 })),
    ...EMOTES.filter(p => !d.cos.emotes.includes(p.id)).map(p => ({ kind: 'emote', id: p.id, name: p.name, ic: '😄', price: 29 })),
  ];
  const locked = ROSTER.filter(c => !owned(c.id)).sort((a, b) => rar(a.rarity).order - rar(b.rarity).order);
  app.ui.innerHTML = `<div class="panel-screen shop">${header('Shop')}
    <div class="scroll">
      <h2 class="sh">Tagesangebote <small>Neue Angebote jeden Tag</small></h2>
      <div class="offers">${d.shop.offers.map(offerCard).join('')}</div>
      <h2 class="sh">Münzen</h2>
      <div class="offers small">${coinPacks.map(p => `<div class="offer" data-c="${p.id}"><div class="ov"><div class="bigico">${icon('coin')}</div></div><b>${fmt(p.n)} Münzen</b><button class="btn yellow small cbuy">${icon('gem')} ${p.price}</button></div>`).join('')}</div>
      <h2 class="sh">Juwelen</h2>
      <div class="notice">${icon('info')} Echtgeld-Käufe sind in diesem Fan-Prototyp deaktiviert. Juwelen verdienst du über den Trophäenpfad, den Pass, Orbs und das Gratis-Geschenk.</div>
      <h2 class="sh">Kämpfer</h2>
      <div class="offers">${locked.slice(0, 12).map(c => `<div class="offer k-brawler" data-b="${c.id}"><div class="ov">${pimg(app, c.id, 'default', 'base', 'oimg')}</div><b>${esc(c.name)}</b><small>${rarityTag(c.rarity)}</small><div class="row2"><button class="btn yellow tiny bcr">${icon('credits')} ${fmt(rar(c.rarity).price)}</button><button class="btn green tiny bgm">${icon('gem')} ${rar(c.rarity).gemPrice}</button></div></div>`).join('') || '<p>Alle Kämpfer freigeschaltet!</p>'}</div>
      <h2 class="sh">Pins, Sprays, Emotes & Effekte</h2>
      <div class="offers small">${cosItems.map(x => `<div class="offer" data-cos="${x.kind}:${x.id}"><div class="ov"><div class="bigico emo">${x.ic}</div></div><b>${esc(x.name)}</b><small>${({ pin: 'Pin', spray: 'Spray', effect: 'Animationseffekt', emote: 'Emote' })[x.kind]}</small><button class="btn green small xbuy">${icon('gem')} ${x.price}</button></div>`).join('') || '<p>Du besitzt alles!</p>'}</div>
    </div></div>`;
  hydrate(app);
  const ui = app.ui;
  ui.querySelectorAll('.offer[data-o] .obuy').forEach(bt => bt.onclick = () => {
    const o = d.shop.offers.find(x => x.id === bt.closest('.offer').dataset.o);
    if (d.shop.bought.includes(o.id)) return;
    if (o.cur === 'gems' && d.gems < o.price) return app.toast('Nicht genug Juwelen');
    if (o.cur === 'coins' && d.coins < o.price) return app.toast('Nicht genug Münzen');
    if (o.cur === 'gems') d.gems -= o.price; if (o.cur === 'coins') d.coins -= o.price;
    d.shop.bought.push(o.id);
    let rewards;
    if (o.kind === 'orb') rewards = openOrb(o.tier);
    else if (o.kind === 'pp') rewards = grant({ kind: 'pp', n: o.n });
    else if (o.kind === 'skin') rewards = grant({ kind: 'skin', id: o.skin });
    else if (o.kind === 'brawler') rewards = grant({ kind: 'brawler', id: o.brawler });
    Save.save(); rewardsModal(app, rewards); shop(app);
  });
  ui.querySelectorAll('.offer[data-c] .cbuy').forEach(bt => bt.onclick = () => { const p = coinPacks.find(x => x.id === bt.closest('.offer').dataset.c); if (d.gems < p.price) return app.toast('Nicht genug Juwelen'); d.gems -= p.price; rewardsModal(app, grant({ kind: 'coins', n: p.n })); shop(app); });
  ui.querySelectorAll('.offer[data-b]').forEach(el => { const id = el.dataset.b; el.querySelector('.bcr').onclick = () => { if (buyBrawler(id, 'credits')) { unlockReveal(app, id); shop(app); } else app.toast('Nicht genug Credits'); }; el.querySelector('.bgm').onclick = () => { if (buyBrawler(id, 'gems')) { unlockReveal(app, id); shop(app); } else app.toast('Nicht genug Juwelen'); }; });
  ui.querySelectorAll('.offer[data-cos] .xbuy').forEach(bt => bt.onclick = () => { const [kind, id] = bt.closest('.offer').dataset.cos.split(':'); const price = { pin: 9, spray: 19, effect: 49, emote: 29 }[kind]; if (d.gems < price) return app.toast('Nicht genug Juwelen'); d.gems -= price; rewardsModal(app, grant({ kind, id })); shop(app); });
  ui.querySelector('.back').onclick = () => app.show('lobby');
}

// ---------------------------------------------------------------------------
function pass(app) {
  const d = Save.data;
  const tier = Math.floor(d.pass.xp / PASS.xpPerTier);
  const prog = (d.pass.xp % PASS.xpPerTier) / PASS.xpPerTier;
  const cell = (r, i, track) => {
    const L = rewardLabel(r);
    const reached = i < tier;
    const claimed = (track === 'free' ? d.pass.free : d.pass.prem).includes(i);
    const locked = track === 'prem' && !d.pass.premium;
    return `<div class="pcell ${reached ? 'reached' : ''} ${claimed ? 'claimed' : ''} ${locked ? 'locked' : ''} t-${track}" data-i="${i}" data-track="${track}">
      <div class="pi">${r.kind === 'skin' ? pimg(app, r.id.split(':')[0], r.id.split(':')[1], 'base', 'pcimg') : `<span>${L.icon}</span>`}</div><small>${L.text}</small>
      ${claimed ? `<div class="pc">${icon('check')}</div>` : reached && !locked ? '<button class="btn tiny green pclaim">Holen</button>' : locked ? `<div class="pl">${icon('lock')}</div>` : ''}
    </div>`;
  };
  app.ui.innerHTML = `<div class="panel-screen passs">${header('Battle Pass')}
    <div class="passhead"><div><h2>${PASS.name}</h2><p>Stufe <b>${Math.min(tier, PASS.tiers)}</b>/${PASS.tiers} · ${d.pass.xp % PASS.xpPerTier}/${PASS.xpPerTier} XP</p><div class="pbar"><i style="width:${prog * 100}%"></i></div><small>XP gibt es für Matches (mehr bei Siegen) und erfüllte Quests.</small></div>
      ${d.pass.premium ? '<div class="premtag">PREMIUM AKTIV</div>' : `<button class="btn green buyprem">${icon('gem')} ${PASS.premiumGems} — Premium freischalten</button>`}</div>
    <div class="ptrack">
      <div class="plabel"><span>GRATIS</span><span>PREMIUM</span></div>
      ${Array.from({ length: PASS.tiers }, (_, i) => `<div class="pcol ${i < tier ? 'done' : ''}"><div class="pnum">${i + 1}</div>${cell(PASS.free(i), i, 'free')}${cell(PASS.premium(i), i, 'prem')}</div>`).join('')}
    </div>
    <div class="row center"><button class="btn yellow claimall">Alle verfügbaren abholen</button></div>
  </div>`;
  hydrate(app);
  const claim = (i, track) => {
    const list = track === 'free' ? d.pass.free : d.pass.prem;
    if (list.includes(i) || i >= tier || (track === 'prem' && !d.pass.premium)) return [];
    list.push(i); return grant(track === 'free' ? PASS.free(i) : PASS.premium(i));
  };
  app.ui.querySelectorAll('.pclaim').forEach(b => b.onclick = () => { const c = b.closest('.pcell'); const r = claim(+c.dataset.i, c.dataset.track); Save.save(); rewardsModal(app, r); pass(app); });
  app.ui.querySelector('.claimall').onclick = () => { let all = []; for (let i = 0; i < Math.min(tier, PASS.tiers); i++) { all = all.concat(claim(i, 'free'), claim(i, 'prem')); } Save.save(); if (all.length) rewardsModal(app, all); else app.toast('Nichts abzuholen'); pass(app); };
  app.ui.querySelector('.buyprem')?.addEventListener('click', () => { if (d.gems < PASS.premiumGems) return app.toast('Nicht genug Juwelen'); d.gems -= PASS.premiumGems; d.pass.premium = true; Save.save(); sfx('unlock'); pass(app); });
  app.ui.querySelector('.back').onclick = () => app.show('lobby');
  const tr = app.ui.querySelector('.ptrack'); tr.scrollLeft = Math.max(0, tier - 2) * 140;
}

// ---------------------------------------------------------------------------
function road(app) {
  const d = Save.data; const total = totalTrophies();
  app.ui.innerHTML = `<div class="panel-screen roads">${header('Trophäenpfad')}
    <div class="roadhead">${icon('trophy')}<b>${fmt(total)}</b><span>Gesamt-Trophäen · Rekord ${fmt(Math.max(d.stats.highest, total))}</span></div>
    <div class="road">${TROPHY_ROAD.map(r => {
      const L = rewardLabel(r.r); const reached = total >= r.t; const claimed = d.roadClaimed.includes(r.t);
      return `<div class="rstep ${reached ? 'reached' : ''} ${claimed ? 'claimed' : ''}" data-t="${r.t}"><div class="rt">${icon('trophy')}${fmt(r.t)}</div><div class="rbox">${r.r.kind === 'brawler' ? pimg(app, r.r.id, 'default', 'base', 'rimg') : r.r.kind === 'skin' ? pimg(app, r.r.id.split(':')[0], r.r.id.split(':')[1], 'base', 'rimg') : `<span class="re">${L.icon}</span>`}<small>${L.text}</small>${claimed ? `<div class="pc">${icon('check')}</div>` : reached ? '<button class="btn tiny green rclaim">Holen</button>' : ''}</div></div>`;
    }).join('')}</div></div>`;
  hydrate(app);
  app.ui.querySelectorAll('.rclaim').forEach(b => b.onclick = () => { const t = +b.closest('.rstep').dataset.t; if (d.roadClaimed.includes(t)) return; d.roadClaimed.push(t); const r = grant(TROPHY_ROAD.find(x => x.t === t).r); Save.save(); rewardsModal(app, r); road(app); });
  app.ui.querySelector('.back').onclick = () => app.show('lobby');
  const first = app.ui.querySelector('.rstep.reached:not(.claimed)') || [...app.ui.querySelectorAll('.rstep.reached')].pop();
  if (first) first.scrollIntoView({ inline: 'center', block: 'nearest' });
}

// ---------------------------------------------------------------------------
function quests(app) {
  const d = Save.data;
  const tomorrow = new Date(); tomorrow.setHours(24, 0, 0, 0);
  const left = Math.max(0, tomorrow - Date.now());
  app.ui.innerHTML = `<div class="panel-screen questss">${header('Quests')}
    <p class="sub">Neue Quests in ${Math.floor(left / 3600000)} h ${Math.floor(left / 60000) % 60} min · Belohnung: Pass-XP</p>
    <div class="qlist">${d.quests.list.map(q => `<div class="quest ${q.done ? 'done' : ''}"><div class="qi">${icon(q.done ? 'check' : 'quests')}</div><div class="qt"><b>${esc(q.text)}</b><div class="qbar"><i style="width:${q.prog / q.n * 100}%"></i><span>${fmt(q.prog)} / ${fmt(q.n)}</span></div></div><div class="qx">+${q.xp}<small>XP</small></div></div>`).join('')}</div>
    <div class="notice">${icon('info')} Quest-XP wird automatisch dem Battle Pass gutgeschrieben, sobald die Quest erfüllt ist.</div></div>`;
  d.quests.list.forEach(q => { if (q.done) q.claimed = true; }); Save.save();
  app.ui.querySelector('.back').onclick = () => app.show('lobby');
}

// ---------------------------------------------------------------------------
function badgesOf(d) {
  const s = d.stats; const n = Object.keys(d.brawlers).length;
  return [
    [s.wins >= 1, 'Erster Sieg', 'Gewinne ein Match'], [s.wins >= 25, 'Veteran', '25 Siege'], [s.kills >= 100, 'Jäger', '100 Kills'],
    [s.transforms >= 10, 'Erwacht', '10 Transformationen'], [n >= 10, 'Sammler', '10 Kämpfer'], [n >= 50, 'Vollständig', 'Alle 50 Kämpfer'],
    [s.soloWins >= 1, 'Überlebender', 'Überleben gewonnen'], [s.bossWins >= 1, 'Dämonenjäger', 'Boss besiegt'], [s.tournamentWins >= 1, 'Champion', 'Turnier gewonnen'],
  ];
}
function profile(app) {
  const d = Save.data; const s = d.stats;
  const top = Object.entries(d.brawlers).sort((a, b) => b[1].trophies - a[1].trophies).slice(0, 3);
  const fav = Object.entries(d.brawlers).sort((a, b) => b[1].mastery - a[1].mastery)[0];
  app.ui.innerHTML = `<div class="panel-screen profiles">${header('Profil')}
    <div class="pgrid">
      <div class="pcardx">
        <div class="pava">${pimg(app, d.player.icon, 'default', 'base', 'bigava')}<button class="btn tiny ghost chava">Avatar ändern</button></div>
        <div class="pinfo"><h2>${esc(d.player.name)} ${Accounts.isOwner() ? '<span class="adm-badge">👑 Besitzer</span>' : '<button class="btn tiny ghost rename">Umbenennen</button>'}</h2>
          <div class="ptitle">Titel: <select class="seltitle">${d.cos.titles.map(t => `<option value="${t}" ${d.player.title === t ? 'selected' : ''}>${TITLES[t]}</option>`).join('')}</select></div>
          <div class="ptrophy">${icon('trophy')} <b>${fmt(totalTrophies())}</b> <small>Rekord ${fmt(Math.max(s.highest, totalTrophies()))}</small></div>
          <div class="pfav">Lieblingskämpfer: <b>${fav ? esc(BY_ID[fav[0]].name) : '—'}</b></div></div>
      </div>
      <div class="pstats">${[['Siege', s.wins], ['Niederlagen', s.losses], ['Unentschieden', s.draws], ['Matches', s.matches], ['Kills', s.kills], ['Schaden', s.dmg], ['Transformationen', s.transforms], ['Supers', s.supers], ['Solo-Siege', s.soloWins], ['Duo-Siege', s.duoWins], ['Bosse besiegt', s.bossWins], ['Turniersiege', s.tournamentWins]].map(([n, v]) => `<div class="pstat"><b>${fmt(v)}</b><small>${n}</small></div>`).join('')}</div>
      <div class="pbest"><h3>Beste Kämpfer</h3>${top.map(([id, b]) => `<div class="pb">${pimg(app, id, b.skin)}<div><b>${esc(BY_ID[id].name)}</b><small>${icon('trophy')} ${b.trophies} · LV ${b.level} · ${masteryName(b.mastery)}</small></div></div>`).join('')}</div>
      <div class="pbadges"><h3>Abzeichen</h3><div class="badges">${badgesOf(d).map(([ok, n, desc]) => `<div class="bdg ${ok ? 'ok' : ''}" title="${desc}">${icon(ok ? 'star' : 'lock')}<b>${n}</b><small>${desc}</small></div>`).join('')}</div></div>
    </div></div>`;
  hydrate(app);
  app.ui.querySelector('.back').onclick = () => app.show('lobby');
  app.ui.querySelector('.seltitle').onchange = (e) => { d.player.title = e.target.value; Save.save(); };
  app.ui.querySelector('.rename')?.addEventListener('click', () => {
    const m = app.modal(`<h2>Name ändern</h2><input class="inp" maxlength="16" value="${esc(d.player.name)}"><button class="btn yellow ok">Speichern</button>`);
    m.el.querySelector('.ok').onclick = () => { const v = m.el.querySelector('.inp').value.trim(); const err = Accounts.rename(Save.accountId, v); if (err) { app.toast(err); return; } d.player.name = v; Save.save(); m.close(); profile(app); };
  });
  app.ui.querySelector('.chava').onclick = () => {
    const m = app.modal(`<h2>Avatar wählen</h2><div class="avgrid">${Object.keys(d.brawlers).map(id => `<button data-id="${id}">${pimg(app, id)}</button>`).join('')}</div>`, { wide: true });
    hydrate(app, m.el);
    m.el.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { d.player.icon = b.dataset.id; Save.save(); m.close(); profile(app); });
  };
}

// ---------------------------------------------------------------------------
function friends(app) {
  const d = Save.data;
  app.ui.innerHTML = `<div class="panel-screen friendss">${header('Freunde')}
    <div class="notice">${icon('info')} Offline-Prototyp: Freunde und Clubmitglieder sind lokal simulierte Bot-Spieler. Eingeladene Freunde kämpfen als KI-Teamkameraden mit ihrem Lieblingskämpfer. Die Netzwerk-Schnittstelle für echten Multiplayer ist vorbereitet (siehe README).</div>
    <div class="team"><h3>Dein Team (${d.team.length}/2)</h3><div class="tslots">${[0, 1].map(i => { const n = d.team[i]; const f = n && d.friends.find(x => x.name === n); return f ? `<div class="tslot full">${pimg(app, f.fav)}<b>${esc(f.name)}</b><button class="btn tiny red kick" data-n="${esc(f.name)}">Entfernen</button></div>` : '<div class="tslot">Freier Platz</div>'; }).join('')}</div></div>
    <div class="flist">${d.friends.map(f => `<div class="friend ${f.online ? 'on' : ''}">${pimg(app, f.fav)}<div class="fi"><b>${esc(f.name)}</b><small>${icon('trophy')} ${fmt(f.trophies)} · ${f.online ? 'Online' : 'Offline'}</small></div>${d.team.includes(f.name) ? '<span class="own">Im Team</span>' : `<button class="btn tiny ${f.online ? 'green' : 'ghost'} inv" data-n="${esc(f.name)}" ${f.online ? '' : 'disabled'}>Einladen</button>`}</div>`).join('')}</div>
    <div class="row"><input class="inp addname" placeholder="Spielername"><button class="btn blue add">Freund hinzufügen</button></div></div>`;
  hydrate(app);
  const ui = app.ui;
  ui.querySelectorAll('.inv').forEach(b => b.onclick = () => { if (d.team.length >= 2) return app.toast('Team ist voll'); d.team.push(b.dataset.n); Save.save(); app.toast(`${b.dataset.n} ist deinem Team beigetreten!`); friends(app); });
  ui.querySelectorAll('.kick').forEach(b => b.onclick = () => { d.team = d.team.filter(n => n !== b.dataset.n); Save.save(); friends(app); });
  ui.querySelector('.add').onclick = () => { const n = ui.querySelector('.addname').value.trim().slice(0, 16); if (!n) return; if (d.friends.some(f => f.name === n)) return app.toast('Schon befreundet'); const r = seeded(n.length * 31 + n.charCodeAt(0)); d.friends.unshift({ name: n, trophies: Math.floor(100 + r() * 2500), fav: ROSTER[Math.floor(r() * ROSTER.length)].id, online: true }); Save.save(); friends(app); };
  ui.querySelector('.back').onclick = () => app.show('lobby');
}

const CHAT_LINES = ['Wer spielt mit? 🔥', 'GG Leute!', 'Hat jemand schon Gear 5?', 'Domain Expansion ist so stark lol', 'Brauche noch 2 für Kristallrausch', 'Neuer Rekord: 800 Trophäen!', 'Ultra Instinct weicht ALLES aus', 'Wer macht den Boss mit mir?', 'Kenpachi ist mein Main 😤', 'Tipp: Infinity verlangsamt Geschosse!', 'Club-Event heute Abend?', 'Hakai auf unter 40 % ist so befriedigend', 'Minato-Markierungen vorher legen!'];
function club(app) {
  const d = Save.data;
  if (!d.club) {
    const r = seeded(77);
    const clubs = ['Hidden Leaf', 'Gotei 13', 'Straw Hats', 'Capsule Corp', 'Jujutsu High', 'Red Hair Crew'].map((n, i) => ({ name: n, tag: '#' + (1000 + i * 137).toString(36).toUpperCase(), trophies: Math.floor(20000 + r() * 60000), members: 10 + Math.floor(r() * 18), req: 100 + i * 150 }));
    app.ui.innerHTML = `<div class="panel-screen clubs">${header('Club')}
      <div class="notice">${icon('info')} Offline-Clubs: Mitglieder sind simulierte Bot-Spieler.</div>
      <div class="clist">${clubs.map((c, i) => `<div class="clubc"><div class="cshield">${icon('club')}</div><div class="ci"><b>${c.name}</b><small>${c.tag} · ${c.members}/30 · ${icon('trophy')} ${fmt(c.trophies)} · ab ${c.req} Trophäen</small></div><button class="btn tiny green join" data-i="${i}">Beitreten</button></div>`).join('')}</div>
      <h3>Eigenen Club gründen</h3><div class="row"><input class="inp cname" maxlength="20" placeholder="Clubname"><button class="btn yellow create">Gründen</button></div></div>`;
    const mkMembers = (n, seed) => { const rr = seeded(seed); return Array.from({ length: n }, () => ({ name: botName(rr), trophies: Math.floor(200 + rr() * 4000), role: 'Mitglied', fav: ROSTER[Math.floor(rr() * ROSTER.length)].id })); };
    app.ui.querySelectorAll('.join').forEach(b => b.onclick = () => { const c = clubs[+b.dataset.i]; d.club = { name: c.name, tag: c.tag, members: mkMembers(c.members, c.name.length * 13), chat: [], created: Date.now() }; d.club.members[0].role = 'Präsident'; Save.save(); club(app); });
    app.ui.querySelector('.create').onclick = () => { const n = app.ui.querySelector('.cname').value.trim(); if (!n) return app.toast('Bitte Namen eingeben'); d.club = { name: n, tag: '#' + Math.random().toString(36).slice(2, 7).toUpperCase(), members: mkMembers(4, n.length), chat: [], created: Date.now(), president: true }; Save.save(); club(app); };
    app.ui.querySelector('.back').onclick = () => app.show('lobby');
    return;
  }
  const c = d.club;
  const total = c.members.reduce((s, m) => s + m.trophies, 0) + totalTrophies();
  const all = [...c.members, { name: d.player.name, trophies: totalTrophies(), role: c.president ? 'Präsident' : 'Mitglied', fav: d.player.icon, me: true }].sort((a, b) => b.trophies - a.trophies);
  app.ui.innerHTML = `<div class="panel-screen clubin">${header(esc(c.name))}
    <div class="cgrid"><div class="cmem"><div class="chead">${icon('club')}<div><b>${esc(c.name)}</b><small>${c.tag} · ${icon('trophy')} ${fmt(total)}</small></div><button class="btn tiny red leave">Verlassen</button></div>
      <div class="mlist">${all.map((m, i) => `<div class="mem ${m.me ? 'me' : ''}"><span class="rk">${i + 1}</span>${pimg(app, m.fav)}<div><b>${esc(m.name)}</b><small>${m.role}</small></div><span class="mt">${icon('trophy')}${fmt(m.trophies)}</span></div>`).join('')}</div></div>
      <div class="cchat"><div class="msgs"></div><div class="row"><input class="inp msg" maxlength="120" placeholder="Nachricht…"><button class="btn blue send">${icon('chat')}</button></div></div></div></div>`;
  hydrate(app);
  const msgs = app.ui.querySelector('.msgs');
  const drawChat = () => { msgs.innerHTML = c.chat.slice(-40).map(m => `<div class="cm ${m.me ? 'me' : ''}"><b>${esc(m.name)}</b><p>${esc(m.text)}</p></div>`).join(''); msgs.scrollTop = msgs.scrollHeight; };
  const botSay = () => { const m = c.members[Math.floor(Math.random() * c.members.length)]; c.chat.push({ name: m.name, text: CHAT_LINES[Math.floor(Math.random() * CHAT_LINES.length)] }); c.chat = c.chat.slice(-60); Save.save(); drawChat(); };
  if (!c.chat.length) botSay();
  drawChat();
  let t = 0; app.screenTick = (dt) => { t += dt; if (t > 6 + Math.random() * 6) { t = 0; botSay(); } };
  app.screenCleanup = () => { app.screenTick = null; };
  const send = () => { const inp = app.ui.querySelector('.msg'); const v = inp.value.trim(); if (!v) return; c.chat.push({ name: d.player.name, text: v, me: true }); inp.value = ''; Save.save(); drawChat(); setTimeout(() => { if (app.screen === 'club') botSay(); }, 1500); };
  app.ui.querySelector('.send').onclick = send;
  app.ui.querySelector('.msg').onkeydown = (e) => { if (e.key === 'Enter') send(); };
  app.ui.querySelector('.leave').onclick = () => { d.club = null; Save.save(); club(app); };
  app.ui.querySelector('.back').onclick = () => app.show('lobby');
}

// ---------------------------------------------------------------------------
function ranking(app, params) {
  const st = app.rankState || (app.rankState = { tab: 'global', brawler: Save.data.selected });
  const rows = leaderboard(st.tab, st.brawler);
  const seasonLeft = Math.max(0, Save.data.seasonEnd - Date.now());
  app.ui.innerHTML = `<div class="panel-screen ranks">${header('Rangliste')}
    <div class="tabs">${[['global', 'Global'], ['club', 'Clubs'], ['brawler', 'Kämpfer']].map(([k, n]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}
      ${st.tab === 'brawler' ? `<select class="selb">${ROSTER.map(c => `<option value="${c.id}" ${st.brawler === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>` : ''}<span class="season">Saison endet in ${Math.ceil(seasonLeft / 86400000)} Tagen</span></div>
    <div class="notice small">${icon('info')} Offline-Rangliste mit generierten Bot-Spielern.</div>
    <div class="rlist">${rows.map((r, i) => `<div class="rrow ${r.me ? 'me' : ''} ${i < 3 ? 'top' + (i + 1) : ''}"><span class="rk">${i + 1}</span>${pimg(app, r.icon)}<b>${esc(r.name)}</b><span class="rt">${icon('trophy')}${fmt(r.trophies)}</span></div>`).join('')}</div></div>`;
  hydrate(app);
  app.ui.querySelectorAll('.tab').forEach(t => t.onclick = () => { st.tab = t.dataset.t; ranking(app); });
  app.ui.querySelector('.selb')?.addEventListener('change', (e) => { st.brawler = e.target.value; ranking(app); });
  app.ui.querySelector('.back').onclick = () => app.show('lobby');
  app.ui.querySelector('.rrow.me')?.scrollIntoView({ block: 'center' });
}

// ---------------------------------------------------------------------------
function events(app) {
  const d = Save.data;
  const hourLeft = 60 - new Date().getMinutes();
  const order = ['crystal', 'ball', 'showdown', 'duo', 'vault', 'zone', 'knockout', 'boss', 'tournament'];
  app.ui.innerHTML = `<div class="panel-screen eventss">${header('Events & Spielmodi')}
    <div class="egrid">${order.map(k => { const M = MODES[k]; const th = THEMES[app.pickTheme(k)]; return `<button class="ev ${d.mode === k ? 'sel' : ''} ${k === 'boss' || k === 'tournament' ? 'special' : ''}" data-m="${k}" style="--mc:${M.color}">
      <div class="et"><span class="ei">${M.icon}</span><div><b>${M.name}</b><small>${M.map ? `${th.name} · ${MAPS[M.map].name}` : 'Wechselnde Karten & Regeln'}</small></div></div>
      <p>${M.desc}</p><div class="ef"><span>${M.teams === 2 ? (M.coop ? '3 Spieler · Koop' : '3 gegen 3') : M.id === 'duo' ? '5 × 2' : '10 Spieler'}</span><span class="timer">Karte wechselt in ${hourLeft} min</span></div>
    </button>`; }).join('')}</div></div>`;
  app.ui.querySelectorAll('.ev').forEach(b => b.onclick = () => { d.mode = b.dataset.m; Save.save(); sfx('tap'); app.show('lobby'); });
  app.ui.querySelector('.back').onclick = () => app.show('lobby');
}

// ---------------------------------------------------------------------------
function settings(app) {
  const s = Save.data.settings;
  app.ui.innerHTML = `<div class="panel-screen settingss">${header('Einstellungen')}
    <div class="sgrid">
      <div class="setc"><h3>Audio</h3><label>Effekte <input type="range" min="0" max="1" step="0.05" value="${s.sfx}" class="rsfx"></label><label>Musik <input type="range" min="0" max="1" step="0.05" value="${s.music}" class="rmus"></label></div>
      <div class="setc"><h3>Grafik</h3><div class="chips">${[['high', 'Hoch'], ['medium', 'Mittel'], ['low', 'Niedrig (Akku)']].map(([k, n]) => `<button class="chip ${s.quality === k ? 'on' : ''}" data-q="${k}">${n}</button>`).join('')}</div><small>„Niedrig“ schaltet Schatten und Kantenglättung ab (Neustart der Seite empfohlen).</small></div>
      <div class="setc"><h3>Steuerung</h3><p class="touch-only">📱 <b>Linker Daumen:</b> irgendwo links auf den Bildschirm tippen und ziehen = bewegen.<br>🔴 <b>Angriff:</b> kurz tippen = Auto-Aim, ziehen = selbst zielen.<br>⭐ <b>Super</b> genauso · 🟢 <b>Gadget</b> · 🌈 <b>FORM</b> = Transformation, sobald voll.</p><label class="adm-tg"><input type="checkbox" class="vib" ${s.vibrate !== false ? 'checked' : ''}> Vibration bei Treffern</label><label class="adm-tg"><input type="checkbox" class="cuts" ${s.cutscenes !== false ? 'checked' : ''}> Ultimate-Cutscenes</label><label class="adm-row"><span>Bot-Schwierigkeit</span><select class="botlvl">${[['easy', 'Leicht'], ['normal', 'Normal'], ['hard', 'Schwer']].map(([k, n]) => `<option value="${k}" ${(s.botLevel ?? 'normal') === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label><div class="keys desk-only"><span><kbd>W A S D</kbd> Bewegen</span><span><kbd>Maus</kbd> Zielen</span><span><kbd>Linksklick</kbd> Angriff</span><span><kbd>Rechtsklick</kbd>/<kbd>Leertaste</kbd> Super</span><span><kbd>E</kbd> Gadget</span><span><kbd>F</kbd>/<kbd>Q</kbd> Transformation</span><span><kbd>1–4</kbd> Pins</span><span><kbd>Esc</kbd> Match verlassen</span></div><small>Touch: linker Joystick bewegt; Angriff/Super ziehen zum Zielen, tippen für Auto-Aim.</small></div>
      <div class="setc"><h3>Code einlösen</h3><p>Gib einen Code ein, um Belohnungen freizuschalten.</p><div class="row"><input class="inp codeinp" maxlength="16" placeholder="Code"><button class="btn green redeem">Einlösen</button></div></div>
      <div class="setc"><h3>Account</h3><p>Angemeldet als <b>${esc(Save.data.player.name)}</b>${Accounts.isOwner() ? ' 👑' : ''}. Jeder Account hat einen eigenen Spielstand auf diesem Gerät.</p>
        <div class="row"><button class="btn blue switchacc">Account wechseln</button><input class="inp sm newpin" type="password" inputmode="numeric" maxlength="8" placeholder="Neue PIN"><button class="btn ghost setpin">PIN setzen</button></div>
        ${Accounts.isOwner() ? '' : '<div class="row"><button class="btn red delacc">Account löschen</button></div>'}</div>
      <div class="setc"><h3>Spielstand</h3><p>Fortschritt dieses Accounts zurücksetzen.</p><button class="btn red reset">Spielstand zurücksetzen</button></div>
      <div class="setc wide"><h3>Über dieses Projekt</h3><p><b>ANIME BRAWL – ULTIMATE CLASH</b> ist ein nicht-kommerzieller Fan-Prototyp. Alle Figuren gehören ihren jeweiligen Rechteinhabern (Jujutsu Kaisen, Dragon Ball, Naruto, Bleach, One Piece). Es werden keine Original-Assets, -Musik oder -Animationen verwendet: Modelle, Effekte, Sounds und Musik sind prozedural im Spiel erzeugt. Spielmodi und Systeme sind vom Genre der 3v3-Arena-Brawler inspiriert, Namen und Grafiken sind eigenständig.</p></div>
    </div></div>`;
  const ui = app.ui;
  ui.querySelector('.rsfx').oninput = (e) => { s.sfx = +e.target.value; setVolumes(s.sfx, s.music); Save.save(); };
  ui.querySelector('.rmus').oninput = (e) => { s.music = +e.target.value; setVolumes(s.sfx, s.music); Save.save(); };
  ui.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { s.quality = b.dataset.q; Save.save(); app.applyQuality(); settings(app); });
  ui.querySelector('.switchacc').onclick = () => app.logout();
  ui.querySelector('.vib').onchange = (e) => { s.vibrate = e.target.checked; Save.save(); };
  ui.querySelector('.cuts').onchange = (e) => { s.cutscenes = e.target.checked; Save.save(); };
  ui.querySelector('.botlvl').onchange = (e) => { s.botLevel = e.target.value; Save.save(); };
  ui.querySelector('.setpin').onclick = async () => { const err = await Accounts.setPin(Save.accountId, ui.querySelector('.newpin').value.trim()); app.toast(err || 'PIN gespeichert', err ? '' : 'gold'); };
  ui.querySelector('.delacc')?.addEventListener('click', () => { const m = app.modal(`<h2>Account löschen?</h2><p>„${esc(Save.data.player.name)}“ und der gesamte Spielstand werden von diesem Gerät gelöscht.</p><div class="row"><button class="btn ghost no">Abbrechen</button><button class="btn red yes">Löschen</button></div>`); m.el.querySelector('.no').onclick = () => m.close(); m.el.querySelector('.yes').onclick = () => { Accounts.remove(Save.accountId); m.close(); app.logout(); }; });
  ui.querySelector('.redeem').onclick = () => { const r = redeemCode(ui.querySelector('.codeinp').value); app.toast(r.text, r.ok ? 'gold' : ''); if (r.ok) { sfx('unlock'); settings(app); } };
  ui.querySelector('.reset').onclick = () => { const m = app.modal(`<h2>Wirklich zurücksetzen?</h2><p>Alle Kämpfer, Trophäen und Käufe gehen verloren.</p><div class="row"><button class="btn ghost no">Abbrechen</button><button class="btn red yes">Zurücksetzen</button></div>`); m.el.querySelector('.no').onclick = () => m.close(); m.el.querySelector('.yes').onclick = () => { Save.reset(); m.close(); app.setStageChar(); app.show('lobby'); }; };
  ui.querySelector('.back').onclick = () => app.show('lobby');
}

// ---------------------------------------------------------------------------
function matchmaking(app, params) {
  const M = MODES[params.modeId]; const th = THEMES[params.theme];
  const teams = {};
  for (const l of params.lineups) (teams[l.team] ||= []).push(l);
  const slot = (l) => `<div class="mslot ${l.isPlayer ? 'me' : ''} r-${l.def.rarity}" style="--rc:${rar(l.def.rarity).color}">${pimg(app, l.def.id, l.skin?.id ?? 'default')}<b>${esc(l.name)}</b><small>${esc(l.def.name)} · LV ${l.level}</small></div>`;
  const teamKeys = Object.keys(teams);
  const vs = teamKeys.length === 2 || M.coop;
  app.ui.innerHTML = `<div class="mm" style="--mc:${M.color}">
    <div class="mmhead"><span class="ei">${M.icon}</span><div><b>${M.name}</b><small>${th.name} · ${M.map ? MAPS[M.map].name : ''}${params.rules?.name ? ' · Regel: ' + esc(params.rules.name) : ''}</small></div></div>
    ${vs ? `<div class="mmteams"><div class="mt blue">${(teams[0] || []).map(slot).join('')}</div><div class="vs">${M.coop ? 'VS' : 'VS'}</div><div class="mt red">${M.coop ? `<div class="mslot boss">${pimg(app, 'boss_oni')}<b>Oni-Kaiser Goryō</b><small>Boss</small></div>` : (teams[1] || []).map(slot).join('')}</div></div>`
      : `<div class="mmsd">${params.lineups.map(slot).join('')}</div>`}
    ${params.rules?.desc ? `<div class="mmrule">${icon('info')} ${esc(params.rules.desc)}</div>` : ''}
    <div class="mmtip">Tipp: ${esc(TIPS[Math.floor(Math.random() * TIPS.length)])}</div>
    <div class="mmload"><i></i></div></div>`;
  app.bossDef = BOSS_DEF;
  hydrate(app);
  app.stageVisible = false;
  setTimeout(() => { if (app.screen === 'matchmaking') app.launchWorld(); }, 2800);
}
const TIPS = ['Halte die Form-Anzeige im Blick — jede Transformation verändert dein ganzes Moveset.', 'Büsche verstecken dich, solange kein Gegner direkt daneben steht.', 'Supers zerstören Wände und Kisten.', 'Divine-Kämpfer haben zweistufige oder besonders aufwendige Transformationen.', 'Tippe den Angriffsknopf für Auto-Aim, ziehe ihn zum präzisen Zielen.', 'Gojo verlangsamt Geschosse mit Infinity — greife ihn im Nahkampf an!', 'Beerus\' Hakai löscht Gegner unter 40 % LP sofort aus.', 'Minatos Kunai sind Teleport-Markierungen — leg sie vorher strategisch.'];

// ---------------------------------------------------------------------------
function results(app, params) {
  const { res, out, tournament: T } = params;
  const won = res.won, draw = res.draw;
  const sd = res.mode === 'showdown' || res.mode === 'duo';
  const title = sd ? `PLATZ ${res.rank}` : won ? 'SIEG!' : draw ? 'UNENTSCHIEDEN' : 'NIEDERLAGE';
  const d = Save.data; const b = bData(res.player?.id);
  const mvp = [...res.fighters].sort((a, c) => (c.kills * 1000 + c.dmg) - (a.kills * 1000 + a.dmg))[0];
  app.ui.innerHTML = `<div class="results ${won || (sd && res.rank <= 2) ? 'win' : draw ? 'draw' : 'lose'}">
    <div class="rhead"><h1>${title}</h1><p>${esc(res.reason ?? '')} · ${esc(MODES[res.mode]?.name ?? '')}</p></div>
    <div class="rgrid">
      <div class="rtroph">${b ? `${icon('trophy')}<b class="${out.delta > 0 ? 'pos' : out.delta < 0 ? 'neg' : ''}">${out.delta > 0 ? '+' : ''}${out.delta}</b><small>${out.before} → ${out.after}</small>` : ''}</div>
      <div class="rrew">${out.coins ? `<span>${icon('coin')} +${out.coins}</span>` : ''}${out.pp ? `<span>${icon('pp')} +${out.pp}</span>` : ''}${out.xp ? `<span>${icon('pass')} +${out.xp} XP</span>` : ''}${out.passTierAfter > out.passTierBefore ? '<span class="lvlup">Pass-Stufe aufgestiegen!</span>' : ''}</div>
      ${out.questDone?.length ? `<div class="rquest">${out.questDone.map(q => `<span>${icon('check')} ${esc(q.text)}</span>`).join('')}</div>` : ''}
    </div>
    <div class="rtable"><div class="rr hdr"><span></span><span>Spieler</span><span>Kills</span><span>Tode</span><span>Schaden</span></div>
      ${res.fighters.filter(f => f.id !== 'boss_oni').sort((a, c) => a.team - c.team || c.dmg - a.dmg).map(f => `<div class="rr ${f.isPlayer ? 'me' : ''} ${f.team === 0 ? 'ally' : 'enemy'}">${pimg(app, f.id)}<span>${esc(f.name)}${f === mvp ? ' <em class="mvp">MVP</em>' : ''}<small>${esc(BY_ID[f.id]?.name ?? '')}</small></span><span>${f.kills}</span><span>${f.deaths}</span><span>${fmt(f.dmg)}</span></div>`).join('')}</div>
    ${T ? `<div class="tourn"><b>Anime-Turnier</b> · Runde ${Math.min(T.round - 1, 3)}/3 · Siege ${T.wins} · Niederlagen ${T.losses}${T.done ? (T.wins >= 2 ? ' — <span class="pos">TURNIER GEWONNEN! +150 Münzen, +10 Juwelen</span>' : ' — <span class="neg">Ausgeschieden</span>') : ''}</div>` : ''}
    <div class="rbtns">${T && !T.done ? '<button class="btn yellow next">Nächste Runde</button>' : `<button class="btn yellow again">${icon('play')} Nochmal</button>`}<button class="btn ghost lobbyb">Lobby</button></div>
  </div>`;
  hydrate(app);
  app.stage.offsetX = 0;
  if (won) app.stage.celebrate(0xffd23f);
  app.ui.querySelector('.again')?.addEventListener('click', () => app.startMatch(res.mode));
  app.ui.querySelector('.next')?.addEventListener('click', () => app.nextTournamentRound());
  app.ui.querySelector('.lobbyb').onclick = () => app.show('lobby');
  // trophy road / new unlock notices
  const total = totalTrophies();
  if (TROPHY_ROAD.some(r => r.t <= total && !d.roadClaimed.includes(r.t))) setTimeout(() => app.toast('Neue Belohnung auf dem Trophäenpfad!', 'gold'), 900);
}

export const SCREENS = { accounts: accountsScreen, admin: adminScreen, lobby, brawlers, detail, shop, pass, road, quests, profile, friends, club, ranking, events, settings, matchmaking, results };
