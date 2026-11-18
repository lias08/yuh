// Network layer. The match simulation is driven by per-player input commands
// (move vector, aim, attack/super/gadget/transform). Today every command is
// produced locally (human + bots) and applied the same frame: LocalTransport.
//
// To go online, a WebSocketTransport sends the local player's commands to an
// authoritative server running the same World simulation headless and applies
// the server's snapshots (positions, hp, events). The server protocol is:
//   client → server  { t:'join', match, token } | { t:'cmd', seq, move:[x,z], aim:[x,z], act:'attack'|'super'|'gadget'|'trans'|null, dist }
//   server → client  { t:'start', seed, lineups, mode, map, theme } | { t:'snap', tick, units:[...], events:[...] } | { t:'end', result }
// No backend exists yet, so WebSocketTransport is not used by the game.
export class LocalTransport {
  constructor() { this.world = null; this.online = false; }
  begin(world) { this.world = world; }
  end() { this.world = null; }
  get label() { return 'Offline (lokale Simulation mit Bots)'; }
}

export class WebSocketTransport {
  constructor(url) { this.url = url; this.online = true; this.ws = null; this.seq = 0; this.handlers = {}; }
  connect() {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => res(this);
      this.ws.onerror = rej;
      this.ws.onmessage = (e) => { const m = JSON.parse(e.data); (this.handlers[m.t] || []).forEach(h => h(m)); };
    });
  }
  on(t, fn) { (this.handlers[t] ||= []).push(fn); }
  sendCommand(cmd) { this.ws?.readyState === 1 && this.ws.send(JSON.stringify({ t: 'cmd', seq: ++this.seq, ...cmd })); }
  begin() {}
  end() { this.ws?.close(); }
  get label() { return 'Online'; }
}
