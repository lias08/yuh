// App shell: renderer, main loop, screen router and match flow.
import * as THREE from 'three';
import { Stage, portrait } from '../render/stage.js';
import { prewarmLooks, isLookReady, setLowEnd } from '../render/model.js';
import { looksFor, lookFor } from '../game/fighter.js';
import { Save, bData, owned, applyMatch, totalTrophies, seeded, botName, note } from '../core/save.js';
import { initAudio, music, setVolumes, sfx } from '../core/audio.js';
import { ROSTER, BY_ID, RARITIES, skinsFor } from '../data/index.js';
import { MODES, THEMES, TOURNAMENT_RULES } from '../data/maps.js';
import { World } from '../game/world.js';
import { Hud } from '../game/hud.js';
import { Input, AimIndicator } from '../game/input.js';
import { SCREENS } from './screens.js';
import { LocalTransport } from '../net/transport.js';

const RARITY_HEX = (r) => parseInt(RARITIES[r].color.slice(1), 16);
// debug flags via URL: ?autoplay=1 (player controlled by AI), ?sim=N (N simulation steps per frame, no rendering)
const QS = new URLSearchParams(location.search);
export const DEBUG = { autoplay: QS.has('autoplay'), sim: +(QS.get('sim') || 0) };

export class App {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ui = document.getElementById('ui');
    this.modalRoot = document.getElementById('modal');
    this.hudRoot = document.getElementById('hud');
    Save.load();
    const q = Save.data.settings.quality;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: q !== 'low', powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = q !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.applyQuality();
    this.stage = new Stage(this.renderer);
    this.screen = null; this.params = null;
    this.world = null;
    this.portraitQueue = [];
    this.transport = new LocalTransport();
    this.last = performance.now();
    this.fps = 60; this.fpsAcc = 0; this.fpsN = 0;
    window.addEventListener('resize', () => this.resize());
    this.resize();
    setVolumes(Save.data.settings.sfx, Save.data.settings.music);
    document.addEventListener('pointerdown', () => { initAudio(); if (!this.world) music('lobby'); }, { once: true });
    this.setStageChar();
    this.show('lobby');
    requestAnimationFrame((t) => this.loop(t));
  }
  applyQuality() {
    const q = Save.data.settings.quality;
    setLowEnd(q === 'low');
    const dpr = Math.min(window.devicePixelRatio || 1, q === 'high' ? 2 : q === 'medium' ? 1.5 : 1);
    this.renderer.setPixelRatio(dpr);
    this.renderer.shadowMap.enabled = q !== 'low';
  }
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.stage.resize(w, h);
    this.world?.resize();
    document.documentElement.classList.toggle('portrait', h > w);
  }
  setStageChar(id = Save.data.selected, form = 'base') {
    const def = BY_ID[id]; if (!def) return;
    const b = bData(id);
    const skin = b ? skinsFor(def).find(s => s.id === b.skin) : null;
    this.stage.setCharacter(def, skin && skin.look ? skin : null, form, RARITY_HEX(def.rarity));
    this.stageChar = id;
  }

  // ---- routing -----------------------------------------------------------------------
  show(name, params = {}) {
    sfx('click');
    const prev = this.screen;
    this.screen = name; this.params = params;
    this.ui.className = 'ui screen-' + name;
    this.stage.offsetX = 0; this.stage.zoom = 1; this.stageVisible = true;
    if (this.screenCleanup) { this.screenCleanup(); this.screenCleanup = null; }
    const fn = SCREENS[name];
    if (!fn) throw new Error('unknown screen ' + name);
    this.ui.innerHTML = '';
    fn(this, params);
    this.ui.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => this.show(b.dataset.go, b.dataset.arg ? { id: b.dataset.arg } : {})));
    this.ui.querySelectorAll('.back').forEach(b => b.addEventListener('click', () => this.show(params.from || 'lobby')));
    this.ui.classList.remove('enter'); void this.ui.offsetWidth; this.ui.classList.add('enter');
  }
  modal(html, opts = {}) {
    const m = document.createElement('div');
    m.className = 'modal-wrap' + (opts.cls ? ' ' + opts.cls : '');
    m.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}">${opts.noClose ? '' : '<button class="mclose">✕</button>'}${html}</div>`;
    this.modalRoot.appendChild(m);
    const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 180); opts.onClose && opts.onClose(); };
    m.querySelector('.mclose')?.addEventListener('click', close);
    m.addEventListener('pointerdown', (e) => { if (e.target === m && !opts.noClose) close(); });
    return { el: m, close };
  }
  toast(text, kind = '') {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = text;
    this.modalRoot.appendChild(t); setTimeout(() => t.classList.add('out'), 1800); setTimeout(() => t.remove(), 2200);
  }
  queuePortrait(img, id, skinId = 'default', form = 'base') {
    this.portraitQueue.push({ img, id, skinId, form });
  }
  processPortraits() {
    let n = 0;
    while (this.portraitQueue.length && n < 3) {
      const p = this.portraitQueue.shift();
      if (!p.img.isConnected) continue;
      const def = BY_ID[p.id] || (p.id === 'boss_oni' ? this.bossDef : null); if (!def) continue;
      const skin = skinsFor(def).find(s => s.id === p.skinId);
      const look = def.boss ? def.look : lookFor(def, skin && skin.look ? skin : null, p.form);
      if (!isLookReady(look, 'lo')) { p.waiting = true; this.portraitQueue.push(p); if (!p.req) { p.req = true; prewarmLooks([look], 'lo'); } if (this.portraitQueue.every(x => x.waiting)) { this.portraitQueue.forEach(x => x.waiting = false); break; } continue; }
      p.img.src = portrait(this.renderer, def, skin && skin.look ? skin : null, p.form);
      p.img.classList.add('ready');
      n++;
    }
  }

  // ---- matches ---------------------------------------------------------------------------
  buildLineups(modeId, opts = {}) {
    const d = Save.data;
    const me = bData(d.selected) || bData(Object.keys(d.brawlers)[0]);
    const myId = opts.brawler || d.selected;
    const mb = bData(myId) || { level: 11, gadget: 0, sp: 0, gear: [], overdrive: true, skin: 'default' };
    const def = BY_ID[myId];
    const skin = skinsFor(def).find(s => s.id === mb.skin);
    const tr = mb.trophies ?? 0;
    const r = seeded(Date.now());
    const lvl = () => Math.max(1, Math.min(11, Math.round(mb.level + (r() - 0.5) * 2)));
    const pickDef = (exclude) => { let c; do { c = ROSTER[Math.floor(r() * ROSTER.length)]; } while (exclude.has(c.id)); exclude.add(c.id); return c; };
    const used = new Set([myId]);
    const bot = (team, defX, nameX) => ({ def: defX, team, level: lvl(), name: nameX ?? botName(r), gadget: r() < 0.6 && lvl() >= 5 ? Math.floor(r() * 2) : -1, starPower: lvl() >= 7 ? Math.floor(r() * 2) : -1, gears: [] });
    const player = { def, team: 0, isPlayer: true, level: mb.level, name: d.player.name, skin: skin && skin.look ? skin : null, gadget: modeId === 'training' ? 0 : (mb.level >= 5 ? mb.gadget : -1), starPower: mb.level >= 7 ? mb.sp : -1, gears: (mb.gear || []).map(i => ['speed', 'shield', 'damage', 'health', 'vision', 'aura'][i]).filter(Boolean), overdrive: !!mb.overdrive };
    const M = MODES[modeId];
    const L = [player];
    if (modeId === 'training') return L;
    if (modeId === 'showdown') { for (let t = 1; t < 10; t++) L.push(bot(t, pickDef(used))); return L; }
    if (modeId === 'duo') { L.push(bot(0, pickDef(used))); for (let t = 1; t < 5; t++) { L.push(bot(t, pickDef(used))); L.push(bot(t, pickDef(used))); } return L; }
    // allies: team-mates from the friend list first
    const friends = (d.team || []).map(n => d.friends.find(f => f.name === n)).filter(Boolean);
    for (let i = 0; i < 2; i++) {
      const fr = friends[i];
      const dd = fr && !used.has(fr.fav) ? (used.add(fr.fav), BY_ID[fr.fav]) : pickDef(used);
      L.push(bot(0, dd, fr?.name));
    }
    if (modeId === 'boss') return L;
    for (let i = 0; i < 3; i++) L.push(bot(1, pickDef(used)));
    return L;
  }
  difficulty() { const tr = bData(Save.data.selected)?.trophies ?? 0; return Math.min(0.92, 0.3 + tr / 1400); }
  pickTheme(modeId) {
    const keys = Object.keys(THEMES);
    const hour = Math.floor(Date.now() / 3600000);
    return keys[(hour + modeId.length) % keys.length];
  }
  startMatch(modeId, opts = {}) {
    const M = MODES[modeId];
    if (modeId === 'tournament') { this.startTournament(); return; }
    const lineups = opts.lineups || this.buildLineups(modeId, opts);
    const theme = opts.theme || this.pickTheme(modeId);
    this.pendingMatch = { modeId, lineups, theme, rules: opts.rules || {}, brawler: opts.brawler || Save.data.selected, tournament: opts.tournament };
    if (modeId === 'training') { this.launchWorld(); return; }
    this.show('matchmaking', { modeId, lineups, theme, rules: opts.rules });
    prewarmLooks(lineups.flatMap(l => looksFor(l.def || BY_ID[l.defId], l.skin)), 'lo');
  }
  /** sculpt every model the match needs in background workers, then start */
  async launchWorld() {
    const pm = this.pendingMatch;
    if (pm.launching) return; pm.launching = true;
    const looks = pm.lineups.flatMap(l => looksFor(l.def || BY_ID[l.defId], l.skin));
    if (pm.modeId === 'boss' && this.bossDef) looks.push(this.bossDef.look);
    if (!looks.every(l => isLookReady(l, 'lo'))) {
      const ov = document.createElement('div'); ov.className = 'loading-ov'; ov.innerHTML = '<div class="spin"></div><b>Kämpfer werden modelliert…</b>';
      this.modalRoot.appendChild(ov);
      await prewarmLooks(looks, 'lo');
      ov.remove();
    }
    this._launchWorld();
  }
  _launchWorld() {
    const pm = this.pendingMatch;
    const M = MODES[pm.modeId];
    this.ui.innerHTML = ''; this.ui.className = 'ui screen-battle';
    this.screen = 'battle';
    const hud = new Hud(this.hudRoot, { onExit: () => this.exitMatch() });
    const input = new Input(this.hudRoot, this.canvas);
    hud.bindButtons(input);
    const world = new World({
      renderer: this.renderer, hud, input, mode: M, map: M.map, theme: pm.theme, lineups: pm.lineups, rules: pm.rules,
      difficulty: this.difficulty(), quality: Save.data.settings.quality, seed: Math.floor(Math.random() * 1000),
      onEnd: (res) => this.endMatch(res), onExit: () => this.exitMatch(),
      onTrainingSwitch: () => this.trainingSwitch(),
      autoplay: DEBUG.autoplay,
    });
    hud.onPin = (i) => world.player && hud.pin(world.player, i);
    hud.world = world;
    this.world = world; this.input = input; this.hud = hud;
    this.aim = new AimIndicator(world.scene);
    this.transport.begin(world);
    music('battle');
  }
  trainingSwitch() {
    const ids = ROSTER.map(c => c.id);
    const m = this.modal(`<h2>Kämpfer wählen</h2><div class="pick-grid">${ids.map(id => `<button data-id="${id}"><img data-p="${id}" data-skin="default" data-form="base"><br>${BY_ID[id].name.split(' ').slice(-1)[0]}</button>`).join('')}</div>`, { wide: true });
    m.el.querySelectorAll('img[data-p]').forEach(img => this.queuePortrait(img, img.dataset.p));
    m.el.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { m.close(); const from = this.pendingMatch?.from; this.teardownWorld(); this.startMatch('training', { brawler: b.dataset.id }); this.pendingMatch.from = from || 'lobby'; });
  }
  exitMatch() {
    if (!this.world) return;
    const training = this.world.modeCfg.id === 'training';
    if (!training && !this.world.over) {
      const m = this.modal(`<h2>Match verlassen?</h2><p>Das zählt als Niederlage.</p><div class="row"><button class="btn ghost no">Weiterspielen</button><button class="btn red yes">Verlassen</button></div>`);
      m.el.querySelector('.no').onclick = () => m.close();
      m.el.querySelector('.yes').onclick = () => { m.close(); const r = this.world.buildResult({ winners: [1], reason: 'Aufgegeben' }); this.teardownWorld(); this.endMatch(r); };
      return;
    }
    const back = this.pendingMatch?.from || (training ? 'detail' : 'lobby');
    const id = this.pendingMatch?.brawler;
    this.teardownWorld();
    this.show(back, { id });
  }
  teardownWorld() {
    if (!this.world) return;
    this.transport.end();
    this.input.dispose(); this.world.dispose();
    this.hudRoot.innerHTML = ''; this.hudRoot.className = '';
    this.world = null; this.input = null; this.hud = null;
    music('lobby');
  }
  endMatch(res) {
    if (this.world) this.teardownWorld();
    const pm = this.pendingMatch;
    if (pm.modeId === 'training') { this.show('detail', { id: pm.brawler }); return; }
    const out = owned(pm.brawler) ? applyMatch(pm.brawler, res) : { delta: 0, coins: 0, pp: 0, xp: 0, questDone: [] };
    if (pm.tournament) {
      const T = this.tournament;
      if (res.won) T.wins++; else if (!res.draw) T.losses++;
      T.history.push({ mode: pm.modeId, rule: pm.rules?.name, won: res.won, draw: res.draw });
      T.round++;
      if (T.wins >= 2 || T.losses >= 2 || T.round > 3) { T.done = true; if (T.wins >= 2) { Save.data.stats.tournamentWins++; Save.data.coins += 150; Save.data.gems += 10; note('Anime-Turnier gewonnen! +150 Münzen, +10 Juwelen'); if (!Save.data.cos.titles.includes('champion')) Save.data.cos.titles.push('champion'); Save.save(); } }
    }
    this.setStageChar(pm.brawler);
    this.show('results', { res, out, tournament: pm.tournament ? this.tournament : null });
  }
  startTournament() {
    const r = Math.random;
    const modes = ['crystal', 'knockout', 'zone', 'ball', 'vault'].sort(() => r() - 0.5).slice(0, 3);
    const rules = [...TOURNAMENT_RULES].sort(() => r() - 0.5).slice(0, 3);
    this.tournament = { round: 1, wins: 0, losses: 0, modes, rules, history: [], done: false };
    this.nextTournamentRound();
  }
  nextTournamentRound() {
    const T = this.tournament;
    const i = T.round - 1;
    const rule = T.rules[i];
    this.startMatch(T.modes[i], { rules: { ...rule }, tournament: true });
  }

  // ---- loop -------------------------------------------------------------------------------
  loop(t) {
    const dt = Math.min(0.1, (t - this.last) / 1000); this.last = t;
    this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc > 0.5) { this.fps = Math.round(this.fpsN / this.fpsAcc); this.fpsAcc = 0; this.fpsN = 0; }
    try {
      if (this.world && DEBUG.sim) {
        for (let i = 0; i < DEBUG.sim && this.world; i++) this.world.update(0.05);
      } else if (this.world) {
        this.world.update(dt);
        this.aim?.update(this.world, this.input, this.world.player);
        this.world.render();
        if (this.modalRoot.children.length) this.processPortraits();
      } else {
        this.stage.update(dt);
        this.stage.render();
        this.processPortraits();
        this.screenTick && this.screenTick(dt);
      }
    } catch (e) { console.error(e); }
    requestAnimationFrame((tt) => this.loop(tt));
  }
}
