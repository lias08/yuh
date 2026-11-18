// Accounts on this device. Every account has its own save slot
// ("animebrawl.save.<id>"). Names are unique (case-insensitive, look-alike
// characters normalised). The first account named OWNER_NAME becomes the
// game owner: owner title + admin panel, always protected by a PIN.
//
// NOTE: there is no backend yet, so uniqueness is enforced per device. The
// AccountService interface (create/login/rename/remove) is what a future
// server implementation has to provide.
export const OWNER_NAME = 'zlias';
const STORE = 'animebrawl.accounts.v1';
const LEGACY_SAVE = 'animebrawl.save.v1';
export const saveKey = (id) => 'animebrawl.save.' + id;

// look-alike characters → canonical form (blocks "zIias", "z1ias", "ƶlias" …)
const CONFUSABLE = { '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', 'i': 'l', '|': 'l', '!': 'l', 'ı': 'l', 'ł': 'l', 'ƶ': 'z', 'ž': 'z', 'ż': 'z', 'ź': 'z', 'à': 'a', 'á': 'a', 'â': 'a', 'ä': 'a', 'å': 'a', 'ś': 's', 'š': 's', '$': 's', '@': 'a', '_': '', '-': '', '.': '', ' ': '' };
export function skeleton(name) {
  const n = String(name).normalize('NFKC').toLowerCase();
  let out = '';
  for (const ch of n) out += CONFUSABLE[ch] ?? ch;
  return out.replace(/(.)\1+/g, '$1');
}
const nameKey = (n) => String(n).normalize('NFKC').toLowerCase().trim();

export function validateName(name) {
  const n = String(name ?? '').trim();
  if (n.length < 3) return 'Der Name braucht mindestens 3 Zeichen.';
  if (n.length > 16) return 'Höchstens 16 Zeichen.';
  if (!/^[\p{L}\p{N}_\-. ]+$/u.test(n)) return 'Nur Buchstaben, Zahlen, Leerzeichen, _ - . erlaubt.';
  if (/\s{2,}/.test(n)) return 'Keine doppelten Leerzeichen.';
  return null;
}

async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(salt + ':' + pin);
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 2166136261; for (const b of data) { h ^= b; h = Math.imul(h, 16777619); } return 'f' + (h >>> 0).toString(16);
}
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const Accounts = {
  db: null,
  load() {
    try { this.db = JSON.parse(localStorage.getItem(STORE)) || null; } catch { this.db = null; }
    if (!this.db) this.db = { accounts: [], current: null, ownerId: null, codes: [] };
    this.db.codes ||= [];
    // migrate the single pre-account save into the first account
    try {
      const legacy = localStorage.getItem(LEGACY_SAVE);
      if (legacy && !this.db.accounts.length) {
        const data = JSON.parse(legacy);
        let name = data?.player?.name || 'Spieler';
        if (validateName(name) || skeleton(name) === skeleton(OWNER_NAME)) name = 'Spieler' + Math.floor(1000 + Math.random() * 9000);
        const id = rid();
        localStorage.setItem(saveKey(id), legacy);
        localStorage.removeItem(LEGACY_SAVE);
        this.db.accounts.push({ id, name, key: nameKey(name), skel: skeleton(name), created: Date.now(), pin: null, salt: rid(), owner: false });
        this.db.current = id;
        this.persist();
      }
    } catch { /* ignore */ }
    return this;
  },
  persist() { try { localStorage.setItem(STORE, JSON.stringify(this.db)); } catch {} },
  list() { return this.db.accounts; },
  get(id) { return this.db.accounts.find(a => a.id === id) || null; },
  current() { return this.get(this.db.current); },
  isOwner(id = this.db.current) { return !!id && this.db.ownerId === id; },
  ownerExists() { return !!this.db.ownerId && !!this.get(this.db.ownerId); },

  /** returns an error string or null */
  nameError(name, exceptId = null) {
    const v = validateName(name); if (v) return v;
    const k = nameKey(name), sk = skeleton(name);
    if (this.db.accounts.some(a => a.id !== exceptId && a.key === k)) return 'Dieser Name ist bereits vergeben.';
    const isOwnerName = k === OWNER_NAME;
    if (!isOwnerName && sk === skeleton(OWNER_NAME)) return 'Dieser Name ist reserviert.';
    if (isOwnerName && this.ownerExists() && this.db.ownerId !== exceptId) return 'Dieser Name ist bereits vergeben.';
    if (this.db.accounts.some(a => a.id !== exceptId && a.skel === sk && a.key !== k && (a.owner || isOwnerName))) return 'Zu ähnlich zu einem bestehenden Namen.';
    return null;
  },
  async create(name, pin = '') {
    name = String(name).trim();
    const err = this.nameError(name); if (err) return { ok: false, error: err };
    const owner = nameKey(name) === OWNER_NAME && !this.ownerExists();
    if (owner && !/^\d{4,8}$/.test(pin)) return { ok: false, error: 'Der Besitzer-Account braucht eine PIN (4–8 Ziffern).' };
    if (pin && !/^\d{4,8}$/.test(pin)) return { ok: false, error: 'Die PIN muss aus 4–8 Ziffern bestehen.' };
    const salt = rid();
    const acc = { id: rid(), name, key: nameKey(name), skel: skeleton(name), created: Date.now(), pin: pin ? await hashPin(pin, salt) : null, salt, owner };
    this.db.accounts.push(acc);
    if (owner) this.db.ownerId = acc.id;
    this.db.current = acc.id;
    this.persist();
    return { ok: true, account: acc };
  },
  async login(id, pin = '') {
    const a = this.get(id); if (!a) return { ok: false, error: 'Account nicht gefunden.' };
    if (a.pin && (await hashPin(pin, a.salt)) !== a.pin) return { ok: false, error: 'Falsche PIN.' };
    this.db.current = id; this.persist();
    return { ok: true };
  },
  logout() { this.db.current = null; this.persist(); },
  rename(id, name) {
    const a = this.get(id); if (!a) return 'Account nicht gefunden.';
    if (this.isOwner(id)) return 'Der Besitzer-Name kann nicht geändert werden.';
    const err = this.nameError(name, id); if (err) return err;
    if (nameKey(name) === OWNER_NAME) return 'Dieser Name ist reserviert.';
    a.name = name.trim(); a.key = nameKey(a.name); a.skel = skeleton(a.name);
    this.persist(); return null;
  },
  async setPin(id, pin) {
    const a = this.get(id); if (!a) return 'Account nicht gefunden.';
    if (!pin) { if (this.isOwner(id)) return 'Der Besitzer-Account braucht eine PIN.'; a.pin = null; this.persist(); return null; }
    if (!/^\d{4,8}$/.test(pin)) return 'Die PIN muss aus 4–8 Ziffern bestehen.';
    a.pin = await hashPin(pin, a.salt); this.persist(); return null;
  },
  remove(id) {
    if (this.isOwner(id)) return 'Der Besitzer-Account kann nicht gelöscht werden.';
    this.db.accounts = this.db.accounts.filter(a => a.id !== id);
    try { localStorage.removeItem(saveKey(id)); } catch {}
    if (this.db.current === id) this.db.current = null;
    this.persist(); return null;
  },
  // ---- owner-created codes (redeemable once per account on this device) ----
  addCode(code, reward) {
    code = String(code).trim().toUpperCase();
    if (!/^[A-Z0-9]{3,16}$/.test(code)) return 'Code: 3–16 Buchstaben/Ziffern.';
    if (code === '67' || this.db.codes.some(c => c.code === code)) return 'Diesen Code gibt es schon.';
    this.db.codes.push({ code, reward, created: Date.now(), used: [] }); this.persist(); return null;
  },
  removeCode(code) { this.db.codes = this.db.codes.filter(c => c.code !== code); this.persist(); },
  findCode(code) { return this.db.codes.find(c => c.code === String(code).trim().toUpperCase()) || null; },
};
