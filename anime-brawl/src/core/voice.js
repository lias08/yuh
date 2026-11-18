// Custom voice lines recorded by the player with the device microphone.
// Stored per account + character + slot in IndexedDB, played in battle.
// (The game ships no voice audio from the anime — those recordings are
// copyrighted; players can record their own lines here.)
export const VOICE_SLOTS = [
  { id: 'super', name: 'Super / Ultimate', hint: 'Wird beim Einsatz der Super abgespielt.' },
  { id: 'trans', name: 'Transformation', hint: 'Wird beim Verwandeln abgespielt.' },
  { id: 'win', name: 'Sieg', hint: 'Wird nach einem Sieg abgespielt.' },
];
const DB = 'animebrawl.voices', STORE = 'clips';
let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
  return dbp;
}
const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction(STORE, mode); const st = t.objectStore(STORE); const r = fn(st); t.oncomplete = () => res(r?.result); t.onerror = () => rej(t.error); }); };

let owner = 'guest';
const urls = new Map();
const key = (char, slot) => `${owner}|${char}|${slot}`;
export const Voice = {
  setOwner(id) { owner = id || 'guest'; urls.clear(); this.index = null; this.loadIndex(); },
  index: null,
  async loadIndex() {
    try { const keys = await tx('readonly', st => st.getAllKeys()); this.index = new Set(keys.filter(k => String(k).startsWith(owner + '|'))); }
    catch { this.index = new Set(); }
    return this.index;
  },
  has(char, slot) { return !!this.index?.has(key(char, slot)); },
  async get(char, slot) {
    const k = key(char, slot);
    if (urls.has(k)) return urls.get(k);
    const blob = await tx('readonly', st => st.get(k)).catch(() => null);
    if (!blob) return null;
    const u = URL.createObjectURL(blob); urls.set(k, u); return u;
  },
  async save(char, slot, blob) { await tx('readwrite', st => st.put(blob, key(char, slot))); urls.delete(key(char, slot)); this.index?.add(key(char, slot)); },
  async remove(char, slot) { await tx('readwrite', st => st.delete(key(char, slot))); urls.delete(key(char, slot)); this.index?.delete(key(char, slot)); },
  volume: 1,
  lastPlay: 0,
  async play(char, slot) {
    if (!this.has(char, slot)) return;
    const now = performance.now(); if (now - this.lastPlay < 1200) return; this.lastPlay = now;
    const u = await this.get(char, slot); if (!u) return;
    const a = new Audio(u); a.volume = Math.min(1, this.volume); a.play().catch(() => {});
  },
  supported() { return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder); },
  /** record up to `seconds`; onLevel(0..1) for a live meter. Resolves with a Blob. */
  async record(seconds = 3, onLevel = null) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(m => MediaRecorder.isTypeSupported?.(m)) || '';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    let raf = 0, ac = null;
    if (onLevel) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const an = ac.createAnalyser(); an.fftSize = 256; ac.createMediaStreamSource(stream).connect(an);
        const buf = new Uint8Array(an.fftSize);
        const tick = () => { an.getByteTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v - 128)); onLevel(m / 128); raf = requestAnimationFrame(tick); };
        tick();
      } catch { /* meter is optional */ }
    }
    return new Promise((res) => {
      rec.onstop = () => { cancelAnimationFrame(raf); ac?.close(); stream.getTracks().forEach(t => t.stop()); res(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })); };
      rec.start();
      this.stopRec = () => rec.state === 'recording' && rec.stop();
      setTimeout(() => this.stopRec(), seconds * 1000);
    });
  },
};
