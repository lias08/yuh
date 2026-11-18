// Account selection / registration and the owner's admin panel.
import { icon } from './icons.js';
import { Accounts, OWNER_NAME, validateName } from '../core/accounts.js';
import { Save, bData, redeemCode, newBrawler, note, totalTrophies } from '../core/save.js';
import { ROSTER, BY_ID } from '../data/index.js';
import { PASS, MAX_LEVEL } from '../data/progression.js';
import { sfx } from '../core/audio.js';

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString('de-DE');

function savedSummary(id) {
  try { const d = JSON.parse(localStorage.getItem('animebrawl.save.' + id) || 'null'); if (!d) return { trophies: 0, n: 0, icon: 'yuji' }; return { trophies: Object.values(d.brawlers || {}).reduce((s, b) => s + (b.trophies || 0), 0), n: Object.keys(d.brawlers || {}).length, icon: d.player?.icon || 'yuji' }; }
  catch { return { trophies: 0, n: 0, icon: 'yuji' }; }
}

// ---------------------------------------------------------------------------
export function accountsScreen(app) {
  const list = Accounts.list();
  app.ui.innerHTML = `<div class="acc-screen">
    <div class="acc-logo">ANIME BRAWL<small>ULTIMATE CLASH</small></div>
    <div class="acc-card">
      ${list.length ? `<h2>Account wählen</h2><div class="acc-list">${list.map(a => { const s = savedSummary(a.id); return `<button class="acc-item ${Accounts.isOwner(a.id) ? 'owner' : ''}" data-id="${a.id}"><img data-p="${s.icon}" data-skin="default" data-form="base"><div><b>${Accounts.isOwner(a.id) ? '👑 ' : ''}${esc(a.name)}</b><small>${icon('trophy')} ${fmt(s.trophies)} · ${s.n} Kämpfer${a.pin ? ' · 🔒 PIN' : ''}</small></div>${icon('play')}</button>`; }).join('')}</div><div class="acc-or">oder</div>` : '<h2>Willkommen!</h2><p class="acc-sub">Erstelle deinen Account, um zu starten.</p>'}
      <div class="acc-new">
        <input class="inp acc-name" maxlength="16" placeholder="Spielername" autocomplete="off" autocapitalize="off" spellcheck="false">
        <input class="inp acc-pin" maxlength="8" inputmode="numeric" type="password" placeholder="PIN (optional, 4–8 Ziffern)">
        <div class="acc-err"></div>
        <button class="btn yellow acc-create">Account erstellen</button>
      </div>
      <p class="acc-note">${icon('info')} Spielstände werden auf diesem Gerät gespeichert – jeder Account hat seinen eigenen. Namen sind einmalig.</p>
    </div></div>`;
  app.ui.querySelectorAll('img[data-p]').forEach(img => app.queuePortrait(img, img.dataset.p));
  const nameEl = app.ui.querySelector('.acc-name'), pinEl = app.ui.querySelector('.acc-pin'), errEl = app.ui.querySelector('.acc-err');
  const check = () => {
    const v = nameEl.value.trim();
    const err = v ? Accounts.nameError(v) : null;
    const owner = v.toLowerCase() === OWNER_NAME && !Accounts.ownerExists() && !err;
    errEl.textContent = err || (owner ? '👑 Besitzer-Account: Eine PIN ist Pflicht.' : '');
    errEl.className = 'acc-err' + (owner ? ' ok' : '');
    pinEl.placeholder = owner ? 'PIN (Pflicht, 4–8 Ziffern)' : 'PIN (optional, 4–8 Ziffern)';
  };
  nameEl.addEventListener('input', check);
  app.ui.querySelector('.acc-create').onclick = async () => {
    const r = await Accounts.create(nameEl.value, pinEl.value.trim());
    if (!r.ok) { errEl.textContent = r.error; errEl.className = 'acc-err'; sfx('lose'); return; }
    sfx('unlock');
    app.enterAccount(r.account.id, true);
  };
  app.ui.querySelectorAll('.acc-item').forEach(b => b.onclick = () => {
    const a = Accounts.get(b.dataset.id);
    if (!a.pin) { Accounts.login(a.id).then(() => app.enterAccount(a.id)); return; }
    const m = app.modal(`<h2>${esc(a.name)}</h2><p>PIN eingeben</p><input class="inp pin" type="password" inputmode="numeric" maxlength="8"><div class="acc-err"></div><button class="btn yellow ok">Einloggen</button>`);
    const go = async () => { const r = await Accounts.login(a.id, m.el.querySelector('.pin').value.trim()); if (!r.ok) { m.el.querySelector('.acc-err').textContent = r.error; sfx('lose'); return; } m.close(); app.enterAccount(a.id); };
    m.el.querySelector('.ok').onclick = go;
    m.el.querySelector('.pin').onkeydown = (e) => { if (e.key === 'Enter') go(); };
    setTimeout(() => m.el.querySelector('.pin').focus(), 50);
  });
}

// ---------------------------------------------------------------------------
export function adminScreen(app) {
  if (!Accounts.isOwner()) { app.show('lobby'); return; }
  const d = Save.data;
  const ad = d.admin || (d.admin = { god: false, instantSuper: false, botDiff: null, showFps: false });
  const sel = app.adminSel || (app.adminSel = d.selected);
  const b = bData(sel);
  const accounts = Accounts.list();
  app.ui.innerHTML = `<div class="panel-screen admin">
    <header class="phead"><button class="back">${icon('back')}</button><h1>👑 Admin-Panel</h1><div class="sp"></div><span class="adm-badge">Besitzer: ${esc(d.player.name)}</span></header>
    <div class="sgrid scroll">
      <div class="setc"><h3>Währungen</h3>
        <div class="adm-row"><span>Münzen</span><input class="inp sm" data-cur="coins" type="number" value="${d.coins}"></div>
        <div class="adm-row"><span>Juwelen</span><input class="inp sm" data-cur="gems" type="number" value="${d.gems}"></div>
        <div class="adm-row"><span>Credits</span><input class="inp sm" data-cur="credits" type="number" value="${d.credits}"></div>
        <div class="row"><button class="btn tiny yellow cur-save">Übernehmen</button><button class="btn tiny green cur-add">+10.000 von allem</button><button class="btn tiny ${d.infinite ? 'red' : 'blue'} cur-inf">${d.infinite ? 'Unendlich aus' : 'Unendlich an'}</button></div></div>
      <div class="setc"><h3>Freischalten</h3>
        <div class="row"><button class="btn tiny yellow all">Alles freischalten (wie Code 67)</button><button class="btn tiny blue passmax">Pass: Premium + alle Stufen</button><button class="btn tiny red resetme">Eigenen Fortschritt zurücksetzen</button></div></div>
      <div class="setc"><h3>Kämpfer bearbeiten</h3>
        <select class="adm-b">${ROSTER.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}${bData(c.id) ? '' : ' (gesperrt)'}</option>`).join('')}</select>
        ${b ? `<div class="adm-row"><span>Level</span><input class="inp sm adm-lv" type="number" min="1" max="${MAX_LEVEL}" value="${b.level}"></div><div class="adm-row"><span>Trophäen</span><input class="inp sm adm-tr" type="number" min="0" value="${b.trophies}"></div><div class="row"><button class="btn tiny yellow b-save">Speichern</button><button class="btn tiny red b-lock">Sperren</button></div>`
          : '<div class="row"><button class="btn tiny green b-unlock">Freischalten</button></div>'}</div>
      <div class="setc"><h3>Match-Cheats <small>(nur für dich)</small></h3>
        <label class="adm-tg"><input type="checkbox" class="t-god" ${ad.god ? 'checked' : ''}> Unverwundbar</label>
        <label class="adm-tg"><input type="checkbox" class="t-sup" ${ad.instantSuper ? 'checked' : ''}> Super & Form sofort voll</label>
        <label class="adm-tg"><input type="checkbox" class="t-fps" ${ad.showFps ? 'checked' : ''}> FPS anzeigen</label>
        <label class="adm-row"><span>Bot-Stärke ${ad.botDiff == null ? '(auto)' : Math.round(ad.botDiff * 100) + ' %'}</span><input type="range" class="t-diff" min="0" max="100" value="${ad.botDiff == null ? 50 : ad.botDiff * 100}"></label>
        <div class="row"><button class="btn tiny ghost diff-auto">Bot-Stärke: automatisch</button></div></div>
      <div class="setc"><h3>Codes erstellen</h3>
        <div class="adm-row"><span>Code</span><input class="inp sm c-code" maxlength="16" placeholder="z. B. SOMMER"></div>
        <div class="adm-row"><span>Münzen / Juwelen</span><input class="inp sm c-coins" type="number" value="1000"><input class="inp sm c-gems" type="number" value="50"></div>
        <div class="adm-row"><span>Kämpfer (optional)</span><select class="c-br"><option value="">—</option>${ROSTER.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
        <div class="row"><button class="btn tiny green c-add">Code anlegen</button></div>
        <div class="adm-codes">${Accounts.db.codes.map(c => `<div class="adm-code"><b>${esc(c.code)}</b><small>${c.used.length}× eingelöst</small><button class="btn tiny red c-del" data-c="${esc(c.code)}">✕</button></div>`).join('') || '<small>Noch keine eigenen Codes.</small>'}</div></div>
      <div class="setc"><h3>Accounts auf diesem Gerät (${accounts.length})</h3>
        <div class="adm-accs">${accounts.map(a => { const s = savedSummary(a.id); return `<div class="adm-acc"><div><b>${Accounts.isOwner(a.id) ? '👑 ' : ''}${esc(a.name)}</b><small>${icon('trophy')} ${fmt(s.trophies)} · ${s.n} Kämpfer · seit ${new Date(a.created).toLocaleDateString('de-DE')}</small></div>${Accounts.isOwner(a.id) ? '' : `<button class="btn tiny ghost a-ren" data-id="${a.id}">Umbenennen</button><button class="btn tiny ghost a-pin" data-id="${a.id}">PIN löschen</button><button class="btn tiny red a-del" data-id="${a.id}">Löschen</button>`}</div>`; }).join('')}</div></div>
      <div class="setc"><h3>Nachricht an alle Accounts</h3>
        <input class="inp msg" maxlength="140" placeholder="Nachricht…"><div class="row"><button class="btn tiny blue send">Senden</button></div></div>
      <div class="setc"><h3>Besitzer-PIN ändern</h3><input class="inp sm opin" type="password" inputmode="numeric" maxlength="8" placeholder="Neue PIN"><div class="row"><button class="btn tiny yellow opin-save">Speichern</button></div></div>
    </div></div>`;
  const $ = (q) => app.ui.querySelector(q), $$ = (q) => app.ui.querySelectorAll(q);
  const redraw = () => adminScreen(app);
  $('.back').onclick = () => app.show('lobby');
  $('.cur-save').onclick = () => { $$('[data-cur]').forEach(i => d[i.dataset.cur] = Math.max(0, Math.floor(+i.value || 0))); d.infinite = false; Save.save(); app.toast('Gespeichert', 'gold'); redraw(); };
  $('.cur-add').onclick = () => { d.coins += 10000; d.gems += 10000; d.credits += 10000; Save.save(); redraw(); };
  $('.cur-inf').onclick = () => { d.infinite = !d.infinite; Save.save(); redraw(); };
  $('.all').onclick = () => { const r = redeemCode('67'); app.toast(r.text, 'gold'); redraw(); };
  $('.passmax').onclick = () => { d.pass.premium = true; d.pass.xp = PASS.tiers * PASS.xpPerTier; Save.save(); app.toast('Pass maximiert', 'gold'); };
  $('.resetme').onclick = () => { const m = app.modal(`<h2>Fortschritt zurücksetzen?</h2><p>Dein Besitzer-Status bleibt erhalten.</p><div class="row"><button class="btn ghost no">Abbrechen</button><button class="btn red yes">Zurücksetzen</button></div>`); m.el.querySelector('.no').onclick = () => m.close(); m.el.querySelector('.yes').onclick = () => { Save.reset(); m.close(); app.setStageChar(); redraw(); }; };
  $('.adm-b').onchange = (e) => { app.adminSel = e.target.value; redraw(); };
  $('.b-save')?.addEventListener('click', () => { b.level = Math.max(1, Math.min(MAX_LEVEL, +$('.adm-lv').value || 1)); b.trophies = Math.max(0, +$('.adm-tr').value || 0); b.highest = Math.max(b.highest, b.trophies); Save.save(); app.toast('Gespeichert', 'gold'); });
  $('.b-lock')?.addEventListener('click', () => { if (Object.keys(d.brawlers).length <= 1) return app.toast('Mindestens ein Kämpfer muss bleiben'); delete d.brawlers[sel]; if (d.selected === sel) d.selected = Object.keys(d.brawlers)[0]; Save.save(); redraw(); });
  $('.b-unlock')?.addEventListener('click', () => { d.brawlers[sel] = newBrawler(); Save.save(); redraw(); });
  $('.t-god').onchange = (e) => { ad.god = e.target.checked; Save.save(); };
  $('.t-sup').onchange = (e) => { ad.instantSuper = e.target.checked; Save.save(); };
  $('.t-fps').onchange = (e) => { ad.showFps = e.target.checked; Save.save(); };
  $('.t-diff').onchange = (e) => { ad.botDiff = +e.target.value / 100; Save.save(); redraw(); };
  $('.diff-auto').onclick = () => { ad.botDiff = null; Save.save(); redraw(); };
  $('.c-add').onclick = () => { const err = Accounts.addCode($('.c-code').value, { coins: +$('.c-coins').value || 0, gems: +$('.c-gems').value || 0, brawler: $('.c-br').value || null }); if (err) return app.toast(err); app.toast('Code angelegt', 'gold'); redraw(); };
  $$('.c-del').forEach(x => x.onclick = () => { Accounts.removeCode(x.dataset.c); redraw(); });
  $$('.a-del').forEach(x => x.onclick = () => { const a = Accounts.get(x.dataset.id); const m = app.modal(`<h2>${esc(a.name)} löschen?</h2><p>Der Spielstand dieses Accounts wird gelöscht.</p><div class="row"><button class="btn ghost no">Abbrechen</button><button class="btn red yes">Löschen</button></div>`); m.el.querySelector('.no').onclick = () => m.close(); m.el.querySelector('.yes').onclick = () => { const err = Accounts.remove(a.id); if (err) app.toast(err); m.close(); redraw(); }; });
  $$('.a-ren').forEach(x => x.onclick = () => { const a = Accounts.get(x.dataset.id); const m = app.modal(`<h2>Umbenennen</h2><input class="inp nn" maxlength="16" value="${esc(a.name)}"><div class="acc-err"></div><button class="btn yellow ok">Speichern</button>`); m.el.querySelector('.ok').onclick = () => { const v = m.el.querySelector('.nn').value; const err = Accounts.rename(a.id, v); if (err) { m.el.querySelector('.acc-err').textContent = err; return; } try { const k = 'animebrawl.save.' + a.id; const sd = JSON.parse(localStorage.getItem(k)); if (sd) { sd.player.name = v.trim(); localStorage.setItem(k, JSON.stringify(sd)); } } catch {} m.close(); redraw(); }; });
  $$('.a-pin').forEach(x => x.onclick = async () => { await Accounts.setPin(x.dataset.id, ''); app.toast('PIN entfernt'); redraw(); });
  $('.send').onclick = () => { const t = $('.msg').value.trim(); if (!t) return; for (const a of Accounts.list()) { try { const k = 'animebrawl.save.' + a.id; const sd = a.id === Save.accountId ? null : JSON.parse(localStorage.getItem(k)); if (sd) { sd.notes = [{ t: Date.now(), text: '👑 ' + t, unread: true }, ...(sd.notes || [])].slice(0, 30); localStorage.setItem(k, JSON.stringify(sd)); } } catch {} } note('👑 ' + t); Save.save(); app.toast('Nachricht gesendet', 'gold'); $('.msg').value = ''; };
  $('.opin-save').onclick = async () => { const err = await Accounts.setPin(Save.accountId, $('.opin').value.trim()); app.toast(err || 'PIN geändert', err ? '' : 'gold'); };
}
