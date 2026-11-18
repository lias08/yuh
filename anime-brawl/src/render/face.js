// Procedural anime face textures, painted onto an equirectangular canvas that
// wraps the head sphere. The face is centred on u = 0.25 (the +Z side).
import * as THREE from 'three';

const W = 512, H = 256, CX = 128, EY = 136;
const cache = new Map();

function hex(c) { return '#' + c.toString(16).padStart(6, '0'); }

function shade(c, f) {
  const r = Math.min(255, Math.max(0, ((c >> 16) & 255) * f)) | 0;
  const g = Math.min(255, Math.max(0, ((c >> 8) & 255) * f)) | 0;
  const b = Math.min(255, Math.max(0, (c & 255) * f)) | 0;
  return `rgb(${r},${g},${b})`;
}

function eye(ctx, x, y, side, e) {
  const type = e.type || 'normal';
  const iris = e.color ?? 0x3a2a1a;
  const w = type === 'sharp' || type === 'demon' ? 18 : 17;
  const h = type === 'sharp' || type === 'demon' ? 14 : 20;
  ctx.save();
  ctx.translate(x, y);
  if (type === 'closed') {
    ctx.strokeStyle = '#1b1220'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -2, 11, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.restore(); return;
  }
  // sclera
  ctx.fillStyle = type === 'hollow' ? '#141014' : type === 'blank' ? '#f6f6ff' : '#ffffff';
  ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); ctx.fill();
  if (type !== 'blank') {
    // iris with vertical gradient
    const ir = type === 'dots' ? 4 : 13.5;
    const g = ctx.createLinearGradient(0, -ir, 0, ir);
    g.addColorStop(0, shade(iris, 0.55)); g.addColorStop(0.55, hex(iris)); g.addColorStop(1, shade(iris, 1.45));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(side * 1.2, 1.5, ir * 0.82, ir * (type === 'sharp' || type === 'demon' ? 0.9 : 1.05), 0, 0, Math.PI * 2); ctx.fill();
    if (type === 'sharingan' || type === 'mangekyo' || type === 'emangekyo') {
      ctx.fillStyle = '#111';
      if (type === 'sharingan') {
        ctx.beginPath(); ctx.arc(side * 1.2, 1.5, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(20,0,0,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(side * 1.2, 1.5, 5.5, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 3; i++) {
          const a = i * 2.094 + 0.4;
          ctx.beginPath(); ctx.arc(side * 1.2 + Math.cos(a) * 5.5, 1.5 + Math.sin(a) * 5.5, 1.9, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        for (let i = 0; i < (type === 'emangekyo' ? 6 : 3); i++) {
          const a = i * (Math.PI * 2 / (type === 'emangekyo' ? 6 : 3));
          ctx.save(); ctx.translate(side * 1.2, 1.5); ctx.rotate(a);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -2, 7.5, 3); ctx.quadraticCurveTo(3, 2, 0, 0); ctx.fill();
          ctx.restore();
        }
        ctx.beginPath(); ctx.arc(side * 1.2, 1.5, 2, 0, Math.PI * 2); ctx.fill();
      }
    } else if (type === 'rinnegan') {
      ctx.strokeStyle = 'rgba(30,10,50,0.85)'; ctx.lineWidth = 1.1;
      for (let r = 2; r < 10; r += 2.4) { ctx.beginPath(); ctx.arc(side * 1.2, 1.5, r, 0, Math.PI * 2); ctx.stroke(); }
    } else if (type === 'byakugan' || type === 'glow') {
      // glowing iris: no pupil, bright core
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.arc(side * 1.2, 1.5, 3.2, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'hollow') {
      ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.ellipse(side * 1.2, 1.5, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#141014'; ctx.beginPath(); ctx.ellipse(side * 1.2, 1.5, 2.2, 6, 0, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'demon' || type === 'slit') {
      ctx.fillStyle = '#120808'; ctx.beginPath(); ctx.ellipse(side * 1.2, 1.5, 1.6, 7, 0, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'sixeyes') {
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(side * 1.2, 1.5, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0b3a8a'; ctx.beginPath(); ctx.arc(side * 1.2, 1.5, 2.8, 0, Math.PI * 2); ctx.fill();
    } else if (type !== 'dots') {
      ctx.fillStyle = shade(iris, 0.25);
      ctx.beginPath(); ctx.ellipse(side * 1.2, 2, 4.2, 5.4, 0, 0, Math.PI * 2); ctx.fill();
    }
    // highlights
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.ellipse(side * 1.2 - 3.5, -3.5, 3.2, 3.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(side * 1.2 + 4, 5, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  // eyelid shadow over the top of the iris
  if (type !== 'blank') { ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = 'rgba(40,20,40,0.22)'; ctx.fillRect(-w, -h, w * 2, h * 0.55); ctx.restore(); }
  // upper lash line (thick, anime-style flick at outer corner)
  ctx.strokeStyle = '#1b1220'; ctx.lineCap = 'round'; ctx.lineWidth = type === 'sharp' || type === 'demon' ? 4.5 : 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, w + 0.5, h + 0.5, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(side * (w - 1), -h * 0.45); ctx.lineTo(side * (w + 5), -h * 0.75); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, Math.PI * 0.25, Math.PI * 0.75); ctx.stroke();
  ctx.lineWidth = 5.5; ctx.beginPath(); ctx.ellipse(0, -1, w + 0.5, h + 0.5, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  ctx.restore();
}

/**
 * face: { skin, eyes:{type,color}, brows, mouth:'smile'|'grin'|'flat'|'smirk'|'open'|'fangs', marks:[] }
 */
export function faceTexture(face) {
  const key = JSON.stringify(face);
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const skin = face.skin ?? 0xffd9bd;
  ctx.fillStyle = hex(skin); ctx.fillRect(0, 0, W, H);
  // soft cheek blush
  if (!face.noBlush) {
    ctx.fillStyle = 'rgba(255,120,120,0.16)';
    ctx.beginPath(); ctx.ellipse(CX - 30, EY + 24, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(CX + 30, EY + 24, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
  }
  const marks = face.marks || [];
  const e = face.eyes || {};
  const sep = 29;
  if (marks.includes('fourEyes')) {
    eye(ctx, CX - sep - 6, EY + 12, -1, { ...e, type: 'demon' });
    eye(ctx, CX + sep + 6, EY + 12, 1, { ...e, type: 'demon' });
  }
  if (!marks.includes('blindfold')) {
    eye(ctx, CX - sep, EY, -1, e);
    eye(ctx, CX + sep, EY, 1, e);
  }
  // brows
  if (face.brows !== false) {
    ctx.strokeStyle = hex(face.browColor ?? 0x2a1a14); ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    const angry = e.type === 'sharp' || e.type === 'demon' || face.angry;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(CX + s * (sep - 14), EY - 27 + (angry ? 5 : 0));
      ctx.quadraticCurveTo(CX + s * sep, EY - 34, CX + s * (sep + 16), EY - 29 - (angry ? 3 : 0));
      ctx.stroke();
    }
  }
  // mouth
  ctx.strokeStyle = '#4a1f22'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  const my = EY + 38;
  switch (face.mouth || 'smile') {
    case 'grin':
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(CX - 12, my - 2); ctx.quadraticCurveTo(CX, my + 12, CX + 12, my - 2); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'fangs':
      ctx.fillStyle = '#5a1a20'; ctx.beginPath(); ctx.moveTo(CX - 12, my - 2); ctx.quadraticCurveTo(CX, my + 13, CX + 12, my - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(CX - 8, my - 1); ctx.lineTo(CX - 5, my + 5); ctx.lineTo(CX - 2, my); ctx.fill();
      ctx.beginPath(); ctx.moveTo(CX + 8, my - 1); ctx.lineTo(CX + 5, my + 5); ctx.lineTo(CX + 2, my); ctx.fill(); break;
    case 'open':
      ctx.fillStyle = '#5a1a20'; ctx.beginPath(); ctx.ellipse(CX, my + 2, 6, 7, 0, 0, Math.PI * 2); ctx.fill(); break;
    case 'flat':
      ctx.beginPath(); ctx.moveTo(CX - 6, my); ctx.lineTo(CX + 6, my); ctx.stroke(); break;
    case 'smirk':
      ctx.beginPath(); ctx.moveTo(CX - 7, my + 1); ctx.quadraticCurveTo(CX + 2, my + 4, CX + 9, my - 3); ctx.stroke(); break;
    case 'frown':
      ctx.beginPath(); ctx.moveTo(CX - 7, my + 3); ctx.quadraticCurveTo(CX, my - 3, CX + 7, my + 3); ctx.stroke(); break;
    default:
      ctx.beginPath(); ctx.moveTo(CX - 7, my); ctx.quadraticCurveTo(CX, my + 6, CX + 7, my); ctx.stroke();
  }
  // nose hint
  ctx.fillStyle = 'rgba(120,60,50,0.35)'; ctx.beginPath(); ctx.arc(CX + 1, EY + 22, 1.6, 0, Math.PI * 2); ctx.fill();

  for (const m of marks) {
    ctx.save();
    switch (m) {
      case 'whiskers':
        ctx.strokeStyle = '#3a2218'; ctx.lineWidth = 2;
        for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.moveTo(CX + s * 30, EY + 18 + i * 6); ctx.lineTo(CX + s * 46, EY + 16 + i * 7); ctx.stroke();
        }
        break;
      case 'sukuna':
        ctx.fillStyle = '#1a1014'; ctx.lineWidth = 2.5; ctx.strokeStyle = '#1a1014';
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(CX + s * 18, EY + 16); ctx.lineTo(CX + s * 40, EY + 14); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(CX + s * 20, EY + 23); ctx.lineTo(CX + s * 38, EY + 22); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(CX + s * 8, EY - 34); ctx.lineTo(CX + s * 30, EY - 40); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(CX - 6, my + 12); ctx.lineTo(CX + 6, my + 12); ctx.stroke();
        break;
      case 'scarX': // Kenpachi-style long scar
        ctx.strokeStyle = 'rgba(150,40,40,0.9)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(CX - 40, EY - 40); ctx.lineTo(CX - 18, EY + 40); ctx.stroke(); break;
      case 'scarEye':
        ctx.strokeStyle = 'rgba(150,40,40,0.9)'; ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(CX - 34 + i * 6, EY - 26); ctx.lineTo(CX - 26 + i * 6, EY + 18); ctx.stroke(); }
        break;
      case 'scarCheek':
        ctx.strokeStyle = 'rgba(140,40,40,0.9)'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(CX - 26, EY + 16); ctx.lineTo(CX - 14, EY + 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(CX - 22, EY + 12); ctx.lineTo(CX - 20, EY + 26); ctx.stroke(); break;
      case 'stitches':
        ctx.strokeStyle = '#3a2a3a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(CX - 46, EY - 30); ctx.lineTo(CX - 6, EY + 6); ctx.lineTo(CX - 10, EY + 50); ctx.stroke();
        for (let i = 0; i < 6; i++) { const t = i / 5; const x = CX - 46 + 40 * t, y = EY - 30 + 36 * t; ctx.beginPath(); ctx.moveTo(x - 4, y + 4); ctx.lineTo(x + 4, y - 4); ctx.stroke(); }
        break;
      case 'tearLines':
        ctx.strokeStyle = 'rgba(40,20,30,0.8)'; ctx.lineWidth = 2;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(CX + s * 16, EY + 12); ctx.lineTo(CX + s * 14, EY + 32); ctx.stroke(); }
        break;
      case 'ulquiorra':
        ctx.strokeStyle = '#1a7a5a'; ctx.lineWidth = 4;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(CX + s * sep, EY + 14); ctx.lineTo(CX + s * (sep + 2), EY + 52); ctx.stroke(); }
        break;
      case 'grimmjow':
        ctx.fillStyle = '#2aa0a8';
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(CX + s * 14, EY + 14); ctx.lineTo(CX + s * 40, EY + 6); ctx.lineTo(CX + s * 38, EY + 20); ctx.fill(); }
        break;
      case 'beard':
        ctx.fillStyle = hex(face.beardColor ?? 0x2a1a10);
        ctx.beginPath(); ctx.moveTo(CX - 44, EY + 10); ctx.quadraticCurveTo(CX - 40, EY + 80, CX, EY + 92); ctx.quadraticCurveTo(CX + 40, EY + 80, CX + 44, EY + 10);
        ctx.quadraticCurveTo(CX + 30, EY + 40, CX + 14, my - 2); ctx.lineTo(CX - 14, my - 2); ctx.quadraticCurveTo(CX - 30, EY + 40, CX - 44, EY + 10); ctx.fill();
        break;
      case 'stubble':
        ctx.fillStyle = 'rgba(60,40,30,0.35)';
        ctx.beginPath(); ctx.ellipse(CX, my + 6, 22, 12, 0, 0, Math.PI * 2); ctx.fill(); break;
      case 'mustache':
        ctx.fillStyle = hex(face.beardColor ?? 0x2a1a10);
        ctx.beginPath(); ctx.ellipse(CX - 8, my - 6, 9, 3, 0.2, 0, Math.PI * 2); ctx.ellipse(CX + 8, my - 6, 9, 3, -0.2, 0, Math.PI * 2); ctx.fill(); break;
      case 'mask': // Kakashi cloth mask over lower face
        ctx.fillStyle = hex(face.maskColor ?? 0x2c3550);
        ctx.fillRect(0, EY + 18, W, H); break;
      case 'piercings':
        ctx.fillStyle = '#c8c8d0';
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(CX - 4 + i * 4, EY + 22, 1.8, 0, Math.PI * 2); ctx.fill(); }
        for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(CX + s * 30, my - 10 + i * 5, 1.7, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'buuMarks':
        ctx.fillStyle = 'rgba(30,20,30,0.3)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(CX + s * 20, EY - 36, 3, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'cellSpots':
        ctx.fillStyle = 'rgba(20,60,30,0.5)';
        for (let i = 0; i < 18; i++) { const a = i * 2.39; ctx.beginPath(); ctx.arc((CX + 200 + Math.cos(a) * 120 * (i / 18)) % W, 40 + (i * 37) % 70, 3, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#8a2a7a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(CX + s * 30, EY + 20, 4, 8, 0, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'friezaMarks':
        ctx.fillStyle = '#8c3fbf'; ctx.beginPath(); ctx.ellipse(CX, 30, 34, 26, 0, 0, Math.PI * 2); ctx.fill();
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(CX + s * 38, EY + 2, 5, 9, 0, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'yamamotoScar':
        ctx.strokeStyle = 'rgba(150,60,60,0.8)'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(CX - 30, EY - 60); ctx.lineTo(CX + 30, EY - 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(CX + 30, EY - 64); ctx.lineTo(CX - 26, EY - 32); ctx.stroke();
        break;
      case 'ichigoHollow':
        ctx.fillStyle = '#f4f2ee'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#b02020'; ctx.lineWidth = 6;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(CX + s * 20, EY - 50); ctx.lineTo(CX + s * 30, EY + 60); ctx.stroke(); }
        eye(ctx, CX - sep, EY, -1, { type: 'hollow' }); eye(ctx, CX + sep, EY, 1, { type: 'hollow' });
        ctx.fillStyle = '#222'; for (let i = -3; i <= 3; i++) ctx.fillRect(CX + i * 6 - 1, my - 6, 2, 14);
        break;
      case 'gear5':
        ctx.fillStyle = 'rgba(255,255,255,0.0)'; break;
      case 'tattoos':
        ctx.fillStyle = 'rgba(30,30,60,0.55)'; ctx.fillRect(CX + 180, 60, 120, 6); ctx.fillRect(CX + 180, 80, 120, 6); break;
    }
    ctx.restore();
  }
  if (marks.includes('blindfold')) {
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(0, EY - 22, W, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(0, EY - 20, W, 6);
  }
  if (marks.includes('dotsEyes')) { /* reserved */ }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}
