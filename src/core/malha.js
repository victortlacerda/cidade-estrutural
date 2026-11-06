// Malha viária da cidade (funções puras, sem Three.js): cruzamentos, entradas dos lotes,
// rotas mais curtas e trajetos com mão de direção (faixa da direita).
import { LOTE, ZONAS, MAPA } from '../config.js';

export const FAIXA = 2.2;                  // rua comum: do eixo ao meio da faixa da direita (m)
export const FAIXAS_AV = MAPA.av.faixas;   // avenida: faixa da esquerda e da direita de cada sentido
const XS = MAPA.X, ZS = MAPA.Z;

// Cruzamentos: 5 ruas verticais × 4 horizontais (n{i}{j})
export const NOS = {};
XS.forEach((x, i) => ZS.forEach((z, j) => { NOS[`n${i}${j}`] = [x, z]; }));

// Ligações: horizontais em toda a linha; verticais só dentro de cada margem,
// e entre as marginais (j = 1 ↔ 2) só onde há ponte.
export const VIZ = {};
const liga = (a, b) => { (VIZ[a] ??= []).push(b); (VIZ[b] ??= []).push(a); };
XS.forEach((x, i) => ZS.forEach((z, j) => {
  if (i < XS.length - 1) liga(`n${i}${j}`, `n${i + 1}${j}`);
  if (j === 0 || j === 2) liga(`n${i}${j}`, `n${i}${j + 1}`);
  if (j === 1 && MAPA.pontes.includes(x)) liga(`n${i}1`, `n${i}2`);
}));

// Entrada de cada lote: na marginal do rio, em frente ao lote; portão na borda do lote voltada para o rio
export const ENTRADA = {};
for (const z of ZONAS) {
  if (z.entrada) { ENTRADA[z.id] = { ...z.entrada, sinal: 1 }; continue; }
  const j = z.r === 0 ? 1 : 2, sinal = z.r === 0 ? 1 : -1;
  ENTRADA[z.id] = {
    rua: [z.x, ZS[j]],
    portao: [z.x, z.z + sinal * (LOTE.d / 2 - 0.5)],
    vizinhos: [`n${z.c}${j}`, `n${z.c + 1}${j}`],
    sinal,
  };
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const pos = (id) => (id.startsWith('e:') ? ENTRADA[id.slice(2)].rua : NOS[id]);

// Rota mais curta entre duas entradas de lote (Dijkstra na malha + entradas)
export function rota(deZona, paraZona) {
  const ini = 'e:' + deZona, fim = 'e:' + paraZona;
  const viz = (id) => {
    if (id.startsWith('e:')) return ENTRADA[id.slice(2)].vizinhos;
    const v = [...VIZ[id]];
    for (const [zid, e] of Object.entries(ENTRADA)) if (e.vizinhos.includes(id) && 'e:' + zid === fim) v.push(fim);
    return v;
  };
  const d = { [ini]: 0 }, de = {}, aberto = new Set([ini]), feito = new Set();
  while (aberto.size) {
    let u = null; for (const k of aberto) if (u === null || d[k] < d[u]) u = k;
    aberto.delete(u); feito.add(u);
    if (u === fim) break;
    for (const w of viz(u)) {
      if (feito.has(w)) continue;
      const nd = d[u] + dist(pos(u), pos(w));
      if (d[w] === undefined || nd < d[w]) { d[w] = nd; de[w] = u; aberto.add(w); }
    }
  }
  const ids = [fim]; while (ids[0] !== ini) ids.unshift(de[ids[0]]);
  return ids.map(pos);
}

// Desloca uma sequência de pontos do eixo da rua para a faixa da direita.
// Direção (dx,dz) → direita = (−dz, dx). Em curvas usa a soma dos dois deslocamentos (esquina certa).
export function naFaixa(pts, faixa = FAIXA, pista = 1) {
  const dir = (a, b) => { const l = dist(a, b) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l, a[0] === 0 && b[0] === 0 ? FAIXAS_AV[pista] : faixa]; };
  const dire = (d) => [-d[1] * d[2], d[0] * d[2]];
  const out = [];
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k];
    if (k === 0) { const r = dire(dir(p, pts[1])); out.push([p[0] + r[0], p[1] + r[1]]); continue; }
    if (k === pts.length - 1) { const r = dire(dir(pts[k - 1], p)); out.push([p[0] + r[0], p[1] + r[1]]); continue; }
    const di = dir(pts[k - 1], p), dout = dir(p, pts[k + 1]);
    const ri = dire(di), ro = dire(dout);
    const dot = di[0] * dout[0] + di[1] * dout[1];
    if (dot > 0.99) out.push([p[0] + ri[0], p[1] + ri[1]]);
    else if (dot < -0.99) { out.push([p[0] + ri[0], p[1] + ri[1]], [p[0] + ro[0], p[1] + ro[1]]); }
    else out.push([p[0] + ri[0] + ro[0], p[1] + ri[1] + ro[1]]);
  }
  return out;
}

// Passeio aleatório determinístico entre cruzamentos (sem voltar, salvo em ponta de rua)
export function passeio(rnd, atual, anterior, n) {
  const seq = [atual]; let prev = anterior;
  for (let k = 0; k < n; k++) {
    const op = VIZ[atual].filter((v) => v !== prev);
    const prox = op.length ? op[Math.floor(rnd() * op.length)] : prev;
    prev = atual; atual = prox; seq.push(atual);
  }
  return { seq, ultimo: atual, penultimo: prev };
}

// Comprimento e amostragem de uma polilinha [[x,z],...]
export function polilinha(pts) {
  const acum = [0];
  for (let k = 1; k < pts.length; k++) acum.push(acum[k - 1] + dist(pts[k - 1], pts[k]));
  const total = acum[acum.length - 1];
  function em(s) {
    s = Math.max(0, Math.min(total, s));
    let k = 1; while (k < acum.length - 1 && acum[k] < s) k++;
    const a = pts[k - 1], b = pts[k], seg = acum[k] - acum[k - 1] || 1, u = (s - acum[k - 1]) / seg;
    return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, dx: (b[0] - a[0]) / seg, dz: (b[1] - a[1]) / seg };
  }
  return { total, em };
}
