// Battle HUD: world-space health/ammo bars, damage popups, score bar, timer,
// kill feed, announcements, transformation banner and action buttons.
import * as THREE from 'three';
import { PINS } from '../data/progression.js';

const v3 = new THREE.Vector3();

export class Hud {
  constructor(root, opts = {}) {
    this.root = root;
    root.innerHTML = '';
    root.className = 'hud';
    const el = (cls, html = '', parent = root) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; parent.appendChild(d); return d; };
    this.el = el;
    this.bars = el('hud-bars');
    this.pops = el('hud-pops');
    this.top = el('hud-top', `<div class="score l"></div><div class="mid"><div class="timer">2:30</div><div class="ctext"></div></div><div class="score r"></div>`);
    this.bossBar = el('hud-boss', `<div class="bname"></div><div class="btrack"><div class="bfill"></div></div>`); this.bossBar.style.display = 'none';
    this.feed = el('hud-feed');
    this.ann = el('hud-ann');
    this.countEl = el('hud-count');
    this.vig = el('hud-vig');
    this.flashEl = el('hud-flash');
    this.exitBtn = el('hud-exit', '✕');
    this.exitBtn.addEventListener('click', () => opts.onExit && opts.onExit());
    this.pinBar = el('hud-pins', PINS.slice(0, 4).map((p, i) => `<button data-i="${i}" title="${p.name}">${p.icon}</button>`).join(''));
    this.pinBar.addEventListener('pointerdown', (e) => { const b = e.target.closest('button'); if (b) { e.stopPropagation(); this.onPin && this.onPin(+b.dataset.i); } });
    this.status = el('hud-status', `<div class="formbar"><div class="fname"></div><div class="ftrack"><div class="ffill"></div></div></div>`);
    this.unitEls = new Map();
    this.popList = [];
  }
  bindButtons(input) { this.input = input; input.buildTouch(this.root); }
  pin(f, i) {
    const p = PINS[i]; if (!p) return;
    this.popup(new THREE.Vector3(f.x, (f.rig?.height ?? 1.3) + 0.9, f.z), p.icon, '#ffffff', 2.2, true);
  }

  unitEl(u) {
    let e = this.unitEls.get(u);
    if (!e) {
      const d = document.createElement('div');
      d.className = 'ubar ' + (u.isPlayer ? 'me' : u.team === this.world.playerTeam ? 'ally' : 'enemy') + (u.kind === 'structure' ? ' struct' : '') + (u.kind === 'minion' ? ' minion' : '') + (u.boss ? ' boss' : '');
      d.innerHTML = `<div class="nm"></div><div class="hp"><div class="hpf"></div><div class="hpd"></div><span class="hpt"></span></div>${u.kind === 'fighter' ? '<div class="am"><i></i><i></i><i></i><i></i></div><div class="tf"><div></div></div>' : ''}`;
      this.bars.appendChild(d);
      e = { d, nm: d.querySelector('.nm'), hpf: d.querySelector('.hpf'), hpd: d.querySelector('.hpd'), hpt: d.querySelector('.hpt'), am: d.querySelectorAll('.am i'), tf: d.querySelector('.tf'), tff: d.querySelector('.tf div'), lastHp: 1, delayed: 1 };
      e.nm.textContent = u.kind === 'structure' ? u.name : u.kind === 'minion' ? u.name : u.name;
      this.unitEls.set(u, e);
    }
    return e;
  }

  update(world) {
    this.world = world;
    const cam = world.camera;
    const W = this.root.clientWidth, H = this.root.clientHeight;
    const seen = new Set();
    for (const u of world.units) {
      if (u.kind === 'structure' && u.isDummy && !u.alive) continue;
      const visible = u.alive && (u.kind !== 'fighter' || u.container.visible) && !(u.boss);
      const e = this.unitEl(u); seen.add(u);
      if (!visible) { e.d.style.display = 'none'; continue; }
      const h = u.kind === 'structure' ? 1.9 : (u.rig?.height ?? 1.3) * (u.kind === 'minion' ? 1 : 1) + 0.35;
      v3.set(u.x, h, u.z).project(cam);
      if (v3.z > 1) { e.d.style.display = 'none'; continue; }
      e.d.style.display = 'block';
      e.d.style.transform = `translate(${(v3.x * 0.5 + 0.5) * W}px, ${(-v3.y * 0.5 + 0.5) * H}px) translate(-50%, -100%)`;
      const f = Math.max(0, u.hp / u.maxHp);
      e.hpf.style.width = (f * 100) + '%';
      e.delayed = Math.max(f, e.delayed - 0.012);
      e.hpd.style.width = (e.delayed * 100) + '%';
      e.hpt.textContent = Math.ceil(u.hp);
      if (u.kind === 'fighter') {
        const n = u.stats.ammo;
        e.am.forEach((a, i) => { a.style.display = i < n ? 'block' : 'none'; const fill = Math.max(0, Math.min(1, u.ammo - i)); a.style.setProperty('--f', fill); });
        e.d.classList.toggle('noammo', !u.isPlayer);
        e.d.classList.toggle('super', u.superCharge >= 1);
        e.d.classList.toggle('hidden', u.inBush && u.team === world.playerTeam);
        e.d.classList.toggle('shield', u.shield > 0);
        if (u.transformed) { e.tf.style.display = 'block'; const FD = u.formDef; e.tff.style.width = (u.transT / (FD.duration ?? 14) * 100) + '%'; e.tff.style.background = '#' + new THREE.Color(FD.aura ?? 0xffffff).getHexString(); }
        else e.tf.style.display = 'none';
        if (u.cubes) e.nm.textContent = `${u.name} ⬢${u.cubes}`;
        else if (u.gems) e.nm.textContent = `${u.name} 💎${u.gems}`;
      }
    }
    for (const [u, e] of this.unitEls) if (!seen.has(u)) { e.d.remove(); this.unitEls.delete(u); }

    // popups
    for (let i = this.popList.length - 1; i >= 0; i--) {
      const p = this.popList[i]; p.t += world.dt || 0.016;
      v3.copy(p.pos); v3.y += p.t * 1.2; v3.project(cam);
      p.el.style.transform = `translate(${(v3.x * 0.5 + 0.5) * W}px, ${(-v3.y * 0.5 + 0.5) * H}px) translate(-50%, -50%) scale(${p.size * (p.t < 0.08 ? 1.4 : 1)})`;
      p.el.style.opacity = Math.max(0, 1 - Math.max(0, p.t - 0.5) / 0.4);
      if (p.t > 0.9) { p.el.remove(); this.popList.splice(i, 1); }
    }

    // top bar
    const m = world.mode;
    const t = Math.max(0, Math.ceil(m.timeLeft));
    this.top.querySelector('.timer').textContent = t > 5000 ? '∞' : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    this.top.querySelector('.timer').classList.toggle('low', t <= 15 && t < 5000);
    const h = m.hud();
    const sl = this.top.querySelector('.score.l'), sr = this.top.querySelector('.score.r');
    sl.innerHTML = h.left ? `<span class="ic">${h.left.icon}</span><b>${h.left.v}</b>` : ''; sl.style.display = h.left ? '' : 'none';
    sr.innerHTML = h.right ? `<b>${h.right.v}</b><span class="ic">${h.right.icon}</span>` : ''; sr.style.display = h.right ? '' : 'none';
    const ct = this.top.querySelector('.ctext'); ct.textContent = h.center ?? ''; ct.style.color = h.centerColor ?? '';
    if (h.boss) {
      this.bossBar.style.display = 'block';
      this.bossBar.querySelector('.bname').textContent = h.boss.name + (h.boss.enraged ? ' — WUTANFALL' : '');
      this.bossBar.querySelector('.bfill').style.width = (h.boss.v * 100) + '%';
      this.bossBar.classList.toggle('rage', !!h.boss.enraged);
    }

    // buttons
    const p = world.player;
    if (p && this.input?.btnSuper) {
      const setRing = (btn, frac, ready) => { const c = btn.querySelector('circle'); c.style.strokeDasharray = `${289 * frac} 289`; btn.classList.toggle('ready', ready); };
      setRing(this.input.btnAttack, Math.min(1, p.ammo / p.stats.ammo), p.ammo >= 1);
      setRing(this.input.btnSuper, p.superCharge, p.superCharge >= 1);
      this.input.btnGadget.style.display = p.gadgetAct ? '' : 'none';
      setRing(this.input.btnGadget, p.gadgets > 0 ? 1 - p.gadgetCd / 6 : 0, p.gadgets > 0 && p.gadgetCd <= 0);
      this.input.btnGadget.querySelector('.lbl').innerHTML = `<i class="ic-gad"></i><em>${p.gadgets > 9 ? '∞' : p.gadgets}</em>`;
      const canT = p.def.trans && (!p.transformed || p.canStage2);
      setRing(this.input.btnTrans, canT ? p.transCharge : p.transformed ? p.transT / (p.formDef?.duration ?? 14) : 0, canT && p.transCharge >= 1);
      const nextName = !p.transformed ? p.def.trans?.name : p.canStage2 ? p.def.trans.next.name : p.formDef?.name;
      this.input.btnTrans.querySelector('.lbl').innerHTML = `<b>FORM</b><small>${nextName ?? ''}</small>`;
      this.input.btnTrans.classList.toggle('active', p.transformed && !p.canStage2);
      this.input.btnSuper.classList.toggle('over', p.overdrive && p.overCharge >= 1);
      const fb = this.status.querySelector('.formbar');
      fb.style.display = p.def.trans ? '' : 'none';
      fb.querySelector('.fname').textContent = p.transformed ? (p.formDef?.name ?? '') : `Form: ${Math.floor(p.transCharge * 100)}%`;
      fb.querySelector('.ffill').style.width = ((p.transformed && !p.canStage2 ? p.transT / (p.formDef?.duration ?? 14) : p.transCharge) * 100) + '%';
      fb.classList.toggle('ready', !!canT && p.transCharge >= 1);
    }
  }

  popup(pos, text, color, size = 1, isText = false) {
    if (this.popList.length > 60) { const o = this.popList.shift(); o.el.remove(); }
    const d = document.createElement('div');
    d.className = 'pop' + (isText ? ' txt' : '');
    d.textContent = text; d.style.color = color;
    this.pops.appendChild(d);
    this.popList.push({ el: d, pos: pos.clone(), t: 0, size });
  }
  announce(title, sub = '', color = '#fff', small = false) {
    const d = document.createElement('div');
    d.className = 'ann' + (small ? ' small' : '');
    d.innerHTML = `<div class="t" style="color:${color}">${title}</div>${sub ? `<div class="s">${sub}</div>` : ''}`;
    this.ann.appendChild(d);
    setTimeout(() => d.remove(), small ? 1600 : 2400);
  }
  transformBanner(name, who, color, divine) {
    const d = document.createElement('div');
    d.className = 'tban' + (divine ? ' divine' : '');
    d.style.setProperty('--c', color);
    d.innerHTML = `<div class="stripe"></div><div class="who">${who}</div><div class="fn">${name}</div>`;
    this.ann.appendChild(d);
    setTimeout(() => d.remove(), 2000);
  }
  count(c) {
    this.countEl.textContent = c;
    this.countEl.classList.remove('go'); void this.countEl.offsetWidth; this.countEl.classList.add('go');
  }
  killfeed(killer, victim) {
    const d = document.createElement('div');
    const kc = killer ? (killer.team === this.world?.playerTeam ? 'ally' : 'enemy') : 'env';
    const vc = victim.team === this.world?.playerTeam ? 'ally' : 'enemy';
    d.className = 'kf';
    d.innerHTML = `<span class="${kc}">${killer ? killer.name : 'Gift'}</span> <i>⚔</i> <span class="${vc}">${victim.name}</span>`;
    this.feed.prepend(d);
    setTimeout(() => d.remove(), 4000);
    while (this.feed.children.length > 4) this.feed.lastChild.remove();
  }
  hurt() { this.vig.classList.remove('on'); void this.vig.offsetWidth; this.vig.classList.add('on'); }
  flash(color) { this.flashEl.style.background = color; this.flashEl.classList.remove('on'); void this.flashEl.offsetWidth; this.flashEl.classList.add('on'); }
  clear() { this.root.innerHTML = ''; this.unitEls.clear(); this.popList = []; }
}
