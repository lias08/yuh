// Map layouts. 3v3 maps are written as the top half (+ centre row) and
// rotated 180° to build the bottom half, so both teams get exactly the same
// map. Showdown maps are one quadrant mirrored on both axes.
// Legend: . floor  # wall  B bush  W water  X crate  R rope fence
//         1/2 team spawns  G crystal mine  O ball  s/S vault  Z zone  g/h goal
//         P showdown spawn  C power-cube crate  K boss  D training dummy
const SWAP = { '2': '1', '1': '2', s: 'S', S: 's', g: 'h', h: 'g' };

function mirror3v3(half) {
  const rows = [...half];
  const W = half[0].length;
  for (let i = half.length - 2; i >= 0; i--) {
    rows.push(half[i].split('').reverse().map(c => SWAP[c] ?? c).join(''));
  }
  for (const r of rows) if (r.length !== W) throw new Error('map row width mismatch: ' + r);
  return rows;
}
function mirror4(q) {
  const N = q.length; const S = N * 2 - 1; const out = [];
  for (let y = 0; y < S; y++) {
    let row = '';
    for (let x = 0; x < S; x++) row += q[Math.min(y, S - 1 - y)][Math.min(x, S - 1 - x)];
    out.push(row);
  }
  return out;
}

export const MAPS = {
  crystal: { name: 'Kristallmine', rows: mirror3v3([
    'BBB.....##.##.....BBB',
    'BB......2.2.2......BB',
    'B...................B',
    '....XX.........XX....',
    '..WW....BBBBB....WW..',
    '..WW...#######...WW..',
    'BB.................BB',
    'BBB...XX.....XX...BBB',
    '......BB.....BB......',
    '..#...BB..R..BB...#..',
    '..#.......R.......#..',
    '..###.....R.....###..',
    'BB.......BBB.......BB',
    'BB...X.........X...BB',
    '.....X....#....X.....',
    'BB......#.G.#......BB',
  ]) },
  ball: { name: 'Seelenstadion', rows: mirror3v3([
    '######..ggggg..######',
    'B.....#.......#.....B',
    'BB......2.2.2......BB',
    'B...................B',
    '..XX....BBBBB....XX..',
    '..XX.............XX..',
    'BB.....##...##.....BB',
    'BBB...............BBB',
    '......WW.....WW......',
    '..BB..WW.....WW..BB..',
    '..BB.............BB..',
    '......XX.....XX......',
    '####.............####',
    'BB.................BB',
    'BB.......BBB.......BB',
    '.....#....O....#.....',
  ]) },
  vault: { name: 'Tresorfestung', rows: mirror3v3([
    'BBBB.....###.....BBBB',
    'BB.......#s#.......BB',
    'B.......2.2.2.......B',
    '...XX...........XX...',
    '...XX....BBB....XX...',
    'BB.................BB',
    'BBB....##...##....BBB',
    '.......##...##.......',
    '..WWW...........WWW..',
    '..WWW....BBB....WWW..',
    'BB.................BB',
    'BB....X.......X....BB',
    '......X..###..X......',
    'BBB...............BBB',
    'BB.......BBB.......BB',
    '......#.......#......',
  ]) },
  zone: { name: 'Zonenkreuzung', rows: mirror3v3([
    'BBBBB.....#.....BBBBB',
    'BB......2.2.2......BB',
    'B...................B',
    '...##.....B.....##...',
    '...##....BBB....##...',
    'BB.................BB',
    'BB...XXX.....XXX...BB',
    '.....................',
    '..BBB...........BBB..',
    '..BBB...#...#...BBB..',
    '........#...#........',
    'BB.................BB',
    'BB..WW.........WW..BB',
    '....WW...BBB...WW....',
    '........X...X........',
    'BBB.......Z.......BBB',
  ]) },
  knockout: { name: 'Duellplatz', rows: mirror3v3([
    'BBB......###......BBB',
    'BB......2.2.2......BB',
    'B...................B',
    '....##.........##....',
    '....##...BBB...##....',
    'BB.................BB',
    'BB..XX....#....XX..BB',
    '..........#..........',
    '...BBB.........BBB...',
    '...BBB...WWW...BBB...',
    '.........WWW.........',
    'BB.................BB',
    'BB...##.......##...BB',
    '.....##...B...##.....',
    '..........B..........',
    'BBB.......#.......BBB',
  ]) },
  showdown: { name: 'Überlebensinsel', rows: mirror4([
    'BBBBB..WWW.......',
    'BB......WW.......',
    'B..P.....C...BB..',
    '......XX....BB...',
    '..BB..X.........C',
    '..BB.....##......',
    'W.....C..##..BB..',
    'WW..........BBB..',
    'W...BB...P.......',
    '....BB..XX....C..',
    '..C.......X......',
    '......BB.........',
    '.BB...BB...##....',
    '.BB........##..C.',
    '....C............',
    '........BB....BB.',
    '.....P..BB....BB.',
  ]) },
  boss: { name: 'Bossarena', rows: [
    'BBB.......#.......BBB',
    'BB.................BB',
    'B...................B',
    '....##.........##....',
    '....##....K....##....',
    '.....................',
    'BB.................BB',
    'BB...XX.......XX...BB',
    '.....................',
    '..###...........###..',
    '.....................',
    'BB.......BBB.......BB',
    'BB.................BB',
    '.....................',
    '...WW...........WW...',
    '...WW....###....WW...',
    '.....................',
    'BB.................BB',
    'BB...XX.......XX...BB',
    '.....................',
    'B...................B',
    'BB......1.1.1......BB',
    'BBB...............BBB',
  ] },
  training: { name: 'Trainingsplatz', rows: [
    'BBB.........BBB',
    'B....D...D....B',
    '...............',
    '.......D.......',
    '..XX.......XX..',
    '...............',
    'BB....###....BB',
    '...............',
    '..D.........D..',
    '...............',
    '....BB...BB....',
    '...............',
    '.......1.......',
    'B.............B',
    'BB...........BB',
  ] },
};

export const THEMES = {
  shibuya: {
    name: 'Shibuya', anime: 'jjk', sky: 0x2a2a48, fog: 0x2a2a48, floor: [0x5a5c66, 0x52545e], line: 0xe8e8f0, wall: 0x7a7c88, wallTop: 0x9a9caa, wallStyle: 'building',
    bush: 0x3a7a4a, bush2: 0x2a6a3a, water: 0x2a4a7a, crate: 0xc8a04a, light: 0xd8d8ff, hemi: [0xb8c0ff, 0x3a3a50], props: 'city',
  },
  namek: {
    name: 'Namek', anime: 'db', sky: 0x7ad8b8, fog: 0x9ae8c8, floor: [0x8ac86a, 0x7ab85a], line: 0xd8f0a8, wall: 0x5a9a8a, wallTop: 0x7ab8a8, wallStyle: 'rock',
    bush: 0x4aaa7a, bush2: 0x3a9a6a, water: 0x3ab8b8, crate: 0xc89a5a, light: 0xffffe8, hemi: [0xe8fff0, 0x6a9a7a], props: 'namek',
  },
  konoha: {
    name: 'Konoha', anime: 'naruto', sky: 0x8ac8ff, fog: 0xb8e0ff, floor: [0xc8a878, 0xb89868], line: 0xe8d8b0, wall: 0x9a6a4a, wallTop: 0xb84a3a, wallStyle: 'house',
    bush: 0x4a9a3a, bush2: 0x3a8a2a, water: 0x4a8ad8, crate: 0xa8783a, light: 0xfff4e0, hemi: [0xfff8e8, 0x8a7a5a], props: 'village',
  },
  soul: {
    name: 'Soul Society', anime: 'bleach', sky: 0xa8c8f0, fog: 0xd0e0f8, floor: [0xe8e4dc, 0xdcd8d0], line: 0xc8c0b0, wall: 0xf2f0ea, wallTop: 0x4a5a7a, wallStyle: 'house',
    bush: 0xe88ab0, bush2: 0xd87aa0, water: 0x5a9ad8, crate: 0xb8905a, light: 0xffffff, hemi: [0xffffff, 0x9a9aaa], props: 'seireitei',
  },
  wano: {
    name: 'Wano Kuni', anime: 'op', sky: 0xff9a6a, fog: 0xffb88a, floor: [0xa87a5a, 0x986a4a], line: 0xd8a87a, wall: 0x6a3a2a, wallTop: 0xc8302a, wallStyle: 'bamboo',
    bush: 0xd85a7a, bush2: 0x6a9a3a, water: 0x3a6ab8, crate: 0xc8783a, light: 0xffd8b0, hemi: [0xffe0c8, 0x7a4a3a], props: 'wano',
  },
};

export const MODES = {
  crystal: { id: 'crystal', name: 'Kristallrausch', short: 'Kristalle', map: 'crystal', teams: 2, size: 3, time: 150, respawn: 5, icon: '💎', color: '#b45cff',
    desc: '3 gegen 3. Sammelt 10 Seelenkristalle aus der Mine und haltet sie, bis der Countdown abläuft. Wer besiegt wird, lässt seine Kristalle fallen.' },
  ball: { id: 'ball', name: 'Spirit Ball', short: 'Ball', map: 'ball', teams: 2, size: 3, time: 150, respawn: 5, icon: '⚽', color: '#3b9cff',
    desc: '3 gegen 3. Trag oder schieß den Ball ins gegnerische Tor. Zwei Tore gewinnen. Mit Ball kann man nicht angreifen — aber schießen (Angriff) und passen.' },
  showdown: { id: 'showdown', name: 'Überleben', short: 'Solo', map: 'showdown', teams: 10, size: 1, time: 240, respawn: 0, icon: '☠', color: '#3ddc84',
    desc: 'Jeder gegen jeden, 10 Kämpfer. Zerstöre Kisten für Kraftwürfel (+10 % Schaden & LP). Giftwolken ziehen sich zusammen. Der Letzte gewinnt.' },
  duo: { id: 'duo', name: 'Duo-Überleben', short: 'Duo', map: 'showdown', teams: 5, size: 2, time: 240, respawn: 8, icon: '👥', color: '#3ddc84',
    desc: '5 Teams à 2. Solange dein Partner lebt, kehrst du nach 8 s zurück. Das letzte Duo gewinnt.' },
  vault: { id: 'vault', name: 'Tresorraub', short: 'Tresor', map: 'vault', teams: 2, size: 3, time: 150, respawn: 5, icon: '🏦', color: '#ff8a2a',
    desc: '3 gegen 3. Zerstört den gegnerischen Tresor, bevor sie euren knacken. Bei Zeitablauf gewinnt, wer mehr Schaden am Tresor verursacht hat.' },
  zone: { id: 'zone', name: 'Zonenkontrolle', short: 'Zone', map: 'zone', teams: 2, size: 3, time: 150, respawn: 5, icon: '◎', color: '#ffd23f',
    desc: '3 gegen 3. Steht in der Zone, um sie für euer Team zu erobern. Erstes Team mit 100 % gewinnt.' },
  knockout: { id: 'knockout', name: 'Knockout', short: 'K.O.', map: 'knockout', teams: 2, size: 3, time: 90, respawn: 0, icon: '✖', color: '#ff3b5c',
    desc: '3 gegen 3, ohne Wiederbelebung. Wer das gegnerische Team zuerst auslöscht, gewinnt die Runde. Zwei Runden gewinnen das Match.' },
  boss: { id: 'boss', name: 'Bosskampf', short: 'Boss', map: 'boss', teams: 2, size: 3, time: 180, respawn: 6, icon: '👹', color: '#ff3b5c', coop: true,
    desc: 'Kooperativ: Drei Spieler gegen einen gigantischen Anime-Boss. Er wird mit der Zeit wütender. Besiegt ihn, bevor die Zeit abläuft.' },
  tournament: { id: 'tournament', name: 'Anime-Turnier', short: 'Turnier', map: null, teams: 2, size: 3, time: 120, respawn: 5, icon: '🏆', color: '#ffffff',
    desc: 'Ein Turnier über drei Runden mit wechselnden Regeln (z. B. doppelte Form-Ladung, Supers ab Start, Riesen-Modus). Gewinne zwei Runden.' },
  training: { id: 'training', name: 'Training', short: 'Training', map: 'training', teams: 2, size: 1, time: 9999, respawn: 1, icon: '🎯', color: '#9fb4c8',
    desc: 'Teste jeden Kämpfer an Trainingspuppen. Super, Gadget und Form laden sofort.' },
};

export const TOURNAMENT_RULES = [
  { id: 'surge', name: 'Energieflut', desc: 'Form-Anzeige lädt doppelt so schnell.', transRate: 2 },
  { id: 'supers', name: 'Supers ab Start', desc: 'Alle beginnen mit voller Super.', startSuper: true },
  { id: 'giants', name: 'Riesen-Modus', desc: 'Alle Kämpfer haben +50 % LP.', hpMult: 1.5 },
  { id: 'glass', name: 'Glaskanonen', desc: '+40 % Schaden für alle, −30 % LP.', dmgMult: 1.4, hpMult: 0.7 },
  { id: 'speed', name: 'Turbo', desc: '+25 % Tempo, schnelleres Nachladen.', speedMult: 1.25 },
  { id: 'formstart', name: 'Erwachte', desc: 'Alle beginnen mit voller Form-Anzeige.', startTrans: true },
];
