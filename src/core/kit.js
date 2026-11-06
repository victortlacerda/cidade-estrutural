// Kit de peças low-poly "clay": materiais em cache, caixas, pessoas, painéis de texto.
import * as THREE from 'three';

const cache = new Map();
export function mat(cor, o = {}) {
  const k = cor + JSON.stringify(o);
  if (!cache.has(k)) {
    cache.set(k, new THREE.MeshStandardMaterial({
      color: cor, roughness: o.r ?? 0.85, metalness: o.m ?? 0,
      flatShading: true, transparent: o.op != null, opacity: o.op ?? 1,
      emissive: o.e ? cor : 0x000000, emissiveIntensity: o.e ?? 0,
      depthWrite: o.op == null || o.op > 0.6,
    }));
  }
  return cache.get(k);
}

export function box(w, h, d, cor, o = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.mat ?? mat(cor, o));
  m.castShadow = o.sombra ?? true; m.receiveShadow = true;
  return m;
}
export function at(m, x, y, z) { m.position.set(x, y, z); return m; }
export function cyl(r1, r2, h, cor, seg = 8, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), o.mat ?? mat(cor, o));
  m.castShadow = o.sombra ?? true; m.receiveShadow = true;
  return m;
}

// Tempo: janelas e suavização
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const win = (t, a, b) => clamp((t - a) / (b - a));
export const ease = (u) => u * u * (3 - 2 * u);
export const lerp = (a, b, u) => a + (b - a) * u;

// Gerador determinístico (sem Math.random nos quadros)
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

// Pessoa articulada simples. camisa: azul (engenheiro), laranja (operador), verde (ajudante)
export function pessoa(camisa, pele = 0xc99a76) {
  const g = new THREE.Group();
  const calca = mat(0x3d4650), pc = mat(pele), cm = mat(camisa);
  const pernaE = new THREE.Group(), pernaD = new THREE.Group();
  [pernaE, pernaD].forEach((p, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.8, 0.16), calca);
    m.position.y = -0.4; m.castShadow = true; p.add(m);
    p.position.set(i ? 0.1 : -0.1, 0.84, 0); g.add(p);
  });
  const upper = new THREE.Group(); upper.position.y = 0.84; g.add(upper);
  const tronco = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.24), cm);
  tronco.position.y = 0.32; tronco.castShadow = true; upper.add(tronco);
  const cabeca = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.22), pc);
  cabeca.position.y = 0.76; cabeca.castShadow = true; upper.add(cabeca);
  const capacete = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.1, 8), mat(0xf2c230));
  capacete.position.y = 0.92; upper.add(capacete);
  const bracoE = new THREE.Group(), bracoD = new THREE.Group();
  [bracoE, bracoD].forEach((b, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.56, 0.12), cm);
    m.position.y = -0.27; m.castShadow = true; b.add(m);
    const mao = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), pc);
    mao.position.y = -0.58; b.add(mao);
    b.position.set(i ? 0.28 : -0.28, 0.6, 0); upper.add(b);
  });
  return { group: g, upper, pernaE, pernaD, bracoE, bracoD };
}
// Passo de caminhada (fase em radianos)
export function andar(p, fase, amp = 0.5) {
  const s = Math.sin(fase) * amp;
  p.pernaE.rotation.x = s; p.pernaD.rotation.x = -s;
  p.bracoE.rotation.x = -s * 0.8; p.bracoD.rotation.x = s * 0.8;
}
export function parar(p) { andar(p, 0, 0); }

// Painel de texto (canvas 2D em plano). Redesenha só quando a chave muda.
export function painel(w, h, cw, ch, desenhar) {
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  m.renderOrder = 12;
  let ultima = null;
  m.userData.atualizar = (chave, ...args) => {
    if (chave === ultima) return;
    ultima = chave;
    ctx.clearRect(0, 0, cw, ch);
    desenhar(ctx, cw, ch, ...args);
    tex.needsUpdate = true;
  };
  return m;
}

export function caixaArred(ctx, x, y, w, h, r, fill) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
}

// Placa da zona (letra + nome), em pé sobre dois postes
export function placa(letra, nome, cor = 0x2a3138) {
  const g = new THREE.Group();
  const p = painel(7.2, 1.8, 720, 180, (c, w, h) => {
    caixaArred(c, 0, 0, w, h, 18, 'rgba(32,38,44,0.94)');
    c.fillStyle = '#e8a33d'; c.beginPath(); c.roundRect(14, 14, 152, 152, 12); c.fill();
    c.fillStyle = '#1b2026'; c.font = '700 120px "Barlow Condensed", "Arial Narrow", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(letra, 90, 96);
    c.fillStyle = '#eef0f1'; c.textAlign = 'left'; c.font = '600 58px "Barlow Condensed", "Arial Narrow", sans-serif';
    c.fillText(nome, 192, 92, w - 210);
  });
  p.userData.atualizar('x');
  p.material.depthWrite = true; p.material.transparent = false; p.material.alphaTest = 0.5;
  p.position.y = 2.6; g.add(p);
  [-3, 3].forEach((x) => g.add(at(box(0.14, 2.0, 0.14, cor), x, 0.9, -0.05)));
  return g;
}
