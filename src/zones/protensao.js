// Obra I1 — Viga pré-moldada pré-tracionada na pista de protensão, em corte longitudinal.
// Tudo é função do tempo t. Números de EXEMPLO, não são de projeto.
import * as THREE from 'three';
import { MAT } from '../config.js';
import { box, cyl, at, mat, pessoa, andar, parar, painel, caixaArred, win, ease, clamp, lerp, rng } from '../core/kit.js';
import { criarObra } from '../core/obra.js';
import { PRE, secao, pista, transferencia, forcaEm, comLaje, curaTermica } from '../calc/protendida.js';
import { fmt } from '../calc/viga.js';

const S = secao(), PI = pista(), TR = transferencia(), CL = comLaje();
const L = PRE.L, H = PRE.h, XA = PRE.Lpista / 2;   // meia pista (ancoragens em ±11 m)
const YB = 0.45;                                    // topo do berço da pista (fundo da viga)
const AMP = 40, VIS = 2.6;                          // exagero da contraflecha e do diâmetro das cordoalhas
const T = { pista: 0, cord: 8, arm: 32, conc: 44, cura: 58, lib: 72, leit: 88, saque: 102, FIM: 118 };
const TC = (k) => T.cord + 4 + k * 1.9;             // início da protensão da cordoalha k (dura 1,6 s)
const CORTE0 = T.lib + 3, CORTE1 = T.lib + 11;      // corte das cordoalhas (maçarico)
const fracCorte = (t) => clamp((t - CORTE0) / (CORTE1 - CORTE0));
const horasCura = (t) => win(t, T.cura, T.lib) * 18;

// cordoalhas: [y, z]; as duas isoladas nas pontas são as centrais da camada de baixo
const CORD = [];
PRE.camadas.forEach(([n, y]) => { for (let i = 0; i < n; i++) CORD.push([y, (i - (n - 1) / 2) * (n === 6 ? 0.075 : 0.08)]); });
const ISOL = [2, 3];

export const STEPS = [
  { t: 'A pista de protensão', d: `Vigas pré-moldadas são feitas em série numa pista: uma laje comprida com duas cabeceiras muito rígidas nas pontas, aqui a ${fmt(PRE.Lpista, 0)} m uma da outra. As cabeceiras seguram a força das cordoalhas enquanto o concreto não existe. Esta viga tem ${fmt(L, 0)} m e vai para o vão central da ponte do rio.` },
  { t: 'Cordoalhas e macaco', d: `São ${PRE.n} cordoalhas CP-190 RB de 12,7 mm, quase todas na mesa de baixo. Uma a uma, o macaco hidráulico puxa cada cordoalha com ${fmt(PI.Fmacaco, 1)} kN (${PRE.sMacaco} MPa, abaixo do limite de ${fmt(PI.limite, 0)} MPa) e ela alonga ${fmt(PI.dl * 1000, 1)} mm. Medir esse alongamento confere a força. Ao soltar o macaco, as cunhas escorregam ${fmt(PRE.cravacao * 1000, 0)} mm e a tensão cai para ${fmt(PI.sPi, 0)} MPa.` },
  { t: 'Armadura passiva e fôrma', d: `Os estribos e as barras que não são protendidas entram por cima, e as laterais metálicas da fôrma fecham a seção em I. Duas cordoalhas recebem tubos plásticos nos ${fmt(PRE.lIsol, 1)} m de cada ponta: ali elas não grudam no concreto. Sem esse isolamento, o topo da viga perto do apoio racharia na liberação.` },
  { t: 'Concretagem e cura térmica', d: `O concreto C40 é lançado e vibrado. Para a pista girar uma viga por dia, a cura é acelerada com vapor: 3 h de espera, aquecimento de 15 °C por hora até 60 °C, 6 h de patamar e resfriamento lento. Em cerca de 18 h o concreto passa de ${PRE.fckj} MPa, conferidos em corpos de prova curados junto com a viga.` },
  { t: 'Liberação da protensão', d: `As cordoalhas são cortadas com maçarico, alternando os lados. A força que estava nas cabeceiras passa para o concreto pela aderência, em cerca de ${fmt(PRE.lt * 100, 0)} cm. Como as cordoalhas estão abaixo do centro da seção (excentricidade de ${fmt(S.e * 100, 1)} cm), a viga encurva para cima e se descola da fôrma no meio: é a contraflecha de ${fmt(TR.contraflecha, 1)} mm. A tensão cai ${fmt(TR.perc * 100, 1)}% por encurtamento elástico.` },
  { t: 'Leitura do resultado', d: `Na liberação, o meio do vão fica com ${fmt(TR.meio.base, 1)} MPa de compressão embaixo (limite ${fmt(TR.lim.compr, 1)}) e ${fmt(-TR.meio.top, 2)} MPa de tração em cima (limite ${fmt(TR.lim.tracao, 2)}). Na ponta, o topo chegaria a ${fmt(-TR.pontaSemIsol.top, 2)} MPa de tração sem o isolamento; com ele, fica em ${fmt(-TR.ponta.top, 2)} MPa. A contraflecha de ${fmt(TR.contraflecha, 1)} mm existe para ser "gasta" pela laje da ponte.` },
  { t: 'Saque e estoque', d: `O pórtico rolante iça a viga pelas alças e a leva para o estoque. Cada viga pesa ${fmt(CL.pesoViga, 0)} kN (cerca de ${fmt(CL.pesoViga / 9.81, 0)} t). No estoque ela fica apoiada só nas pontas, como vai ficar na ponte, para não trabalhar de um jeito diferente do que foi calculado.` },
];
export const STARTS = [T.pista, T.cord, T.arm, T.conc, T.lib, T.leit, T.saque];

export function criarProtensao(motor, origem) {
  const o = criarObra(motor, origem, {
    id: 'protensao', nome: 'Protensão da viga', tit: 'Viga pré-moldada protendida', sub: 'Zona I · Pré-moldados',
    hide: 'I', steps: STEPS, starts: STARTS, fim: T.FIM,
    cams: [[0, 1.6, 0, 20, 0.18, 0.2], [12.3, 0.7, 0.3, 5.5, 1.0, 0.18], [0, 1.2, 0, 15, 0.12, 0.14], [0, 1.8, 0, 17, 0.12, 0.12],
      [0, 2.2, 0, 15.5, 0.05, 0.06], [-2.5, 2.2, 0, 13.5, 0.05, 0.06], [0, 3.0, -2, 24, 0.35, 0.2]],
    render,
  });
  const root = o.group, P = o.P;

  // ---------- pista ----------
  root.add(at(box(27, 0.35, 4.2, 0xa9a69e), 0, 0.175, 0));
  root.add(at(box(XA * 2 - 1, 0.1, 0.9, 0x8d99a3), 0, YB - 0.05, 0));        // berço metálico (fundo de fôrma)
  [-1, 1].forEach((s) => {
    const cab = new THREE.Group(); cab.position.set(s * (XA + 0.6), 0, 0); root.add(cab);
    cab.add(at(box(1.2, 1.6, 2.4, 0x6f7c86), 0, 0.8 + 0.35, 0));
    cab.add(at(box(0.15, 0.5, 0.7, 0x40546a), -s * 0.68, YB + 0.1, 0));       // placa de ancoragem
    cab.add(at(box(2.2, 0.35, 2.8, 0x8d99a3), 0, 0.17, 0));
  });
  // trilhos do pórtico
  [-1, 1].forEach((s) => root.add(at(box(30, 0.12, 0.3, 0x56677a), 0, 0.06, s * 3.2)));

  // ---------- cordoalhas: trecho externo esquerdo, interno (deformável) e externo direito ----------
  const cordMat = mat(0x5f6870, { r: 0.35, m: 0.6 });
  const rC = 0.0127 / 2 * VIS;
  const geoX = (x0, x1, segs) => { const g = new THREE.CylinderGeometry(rC, rC, x1 - x0, 6, segs); g.rotateZ(Math.PI / 2); g.translate((x0 + x1) / 2, 0, 0); return g; };
  const cords = CORD.map(([y, z], k) => {
    const g = new THREE.Group(); g.position.set(0, YB + y, z); root.add(g);
    const dentro = new THREE.Mesh(geoX(-L / 2, L / 2, 48), cordMat);
    const esq = new THREE.Mesh(geoX(-XA - 1.3, -L / 2, 1), cordMat), dir = new THREE.Mesh(geoX(L / 2, XA + 1.3, 1), cordMat);
    g.add(dentro, esq, dir);
    const base = dentro.geometry.attributes.position.array.slice();
    const isol = ISOL.includes(k) ? [-1, 1].map((s) => { const m = new THREE.Mesh(geoX(-PRE.lIsol / 2, PRE.lIsol / 2, 1), mat(0xe8e6df)); m.scale.set(1, 1.6, 1.6); m.position.x = s * (L / 2 - PRE.lIsol / 2); g.add(m); return m; }) : [];
    return { g, dentro, esq, dir, base, y, z, isol, k };
  });

  // macaco hidráulico (ponta ativa, +x)
  const macaco = new THREE.Group(); root.add(macaco);
  macaco.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.7, 14).rotateZ(Math.PI / 2), mat(0xc0392b, { r: 0.5 })), 0.35, 0, 0));
  const embolo = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12).rotateZ(Math.PI / 2), mat(0xb8c0c6, { r: 0.3, m: 0.6 }));
  macaco.add(embolo);
  const mangueira = at(box(0.04, 0.04, 1.6, 0x202326), 0.6, -0.3, 0.8); macaco.add(mangueira);
  root.add(at(box(0.5, 0.7, 0.4, 0x3b6fb6), XA + 2.1, 0.7, 1.4));             // bomba hidráulica

  // ---------- estribos, fôrma lateral ----------
  const est = [];
  for (let x = -L / 2 + 0.1; x <= L / 2 - 0.09; x += Math.abs(x) > L / 2 - 2 ? 0.15 : 0.3) {
    const g = new THREE.Group(); g.position.set(x, YB, 0); root.add(g);
    const m = mat(MAT.estribo, { r: 0.55, m: 0.2 });
    [[0.01, 0.9, 0.01, 0.48, 0.05], [0.01, 0.9, 0.01, 0.48, -0.05], [0.01, 0.01, 0.42, 0.06, 0], [0.01, 0.01, 0.5, 0.92, 0]]
      .forEach(([w, h, d, y, z]) => g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w * 1.6, h, d), m), 0, y, z)));
    est.push({ g, x });
  }
  const formaTras = at(box(L + 0.4, 1.12, 0.05, 0x8d99a3), 0, YB + 0.55, -0.34);
  const formaFrente = at(box(L + 0.4, 1.12, 0.03, 0x8d99a3, { op: 0.15, sombra: false }), 0, YB + 0.55, 0.34);
  root.add(formaTras, formaFrente);
  const lona = at(box(L + 1, 1.5, 1.4, 0x3f5b6b, { op: 0.55, sombra: false }), 0, YB + 0.75, 0); root.add(lona);
  const vapor = Array.from({ length: 10 }, (_, i) => { const m = at(box(0.3, 0.3, 0.3, 0xf2f3f4, { op: 0.35, sombra: false }), -7 + i * 1.55, YB + 1.6, 0.4); root.add(m); return m; });

  // ---------- concreto (metade de trás da seção I, face cortada com mapa de tensões) ----------
  const CW = 800, CH = 100;
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const cx = cv.getContext('2d');
  const viga = new THREE.Group(); root.add(viga);
  const pour = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  const ladoMat = new THREE.MeshStandardMaterial({ color: 0xc9c7c0, roughness: 0.95, flatShading: true, clippingPlanes: [pour] });
  const texs = [];
  const partes = PRE.partes.map(([b, h, y0]) => {
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    tex.repeat.set(1, h / H); tex.offset.set(0, y0 / H); texs.push(tex);
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, clippingPlanes: [pour] });
    const geo = new THREE.BoxGeometry(L, h, b / 2, 64, 1, 1); geo.translate(0, YB + y0 + h / 2, -b / 4);
    const m = new THREE.Mesh(geo, [ladoMat, ladoMat, ladoMat, ladoMat, face, ladoMat]);
    m.castShadow = true; m.receiveShadow = true; viga.add(m);
    return { m, base: geo.attributes.position.array.slice() };
  });
  const alcas = [-1, 1].map((s) => { const m = at(box(0.05, 0.25, 0.25, 0x8b5a3c), s * (L / 2 - 1.2), YB + H + 0.1, -0.05); viga.add(m); return m; });

  const r1 = rng(11), graos = Array.from({ length: 700 }, () => [r1() * CW, r1() * CH, 1 + r1() * 2.5, r1()]);
  const corTensao = (s) => {
    if (s >= 0) { const u = clamp(s / 20); return `rgb(${Math.round(225 - 175 * u)},${Math.round(228 - 120 * u)},${Math.round(232 - 30 * u)})`; }
    const u = clamp(-s / TR.lim.tracao); return `rgb(${Math.round(232 - 10 * u)},${Math.round(225 - 150 * u)},${Math.round(220 - 160 * u)})`;
  };
  let chaveFace = '';
  function desenharFace(t, f, fg) {
    const modo = t < T.lib ? 'cinza' : 'tensao';
    const k = modo === 'cinza' ? `c|${t < T.cura + 6}` : `t|${f.toFixed(2)}|${fg.toFixed(2)}`;
    if (k === chaveFace) return; chaveFace = k;
    if (modo === 'cinza') {
      cx.fillStyle = t < T.cura + 6 ? '#9a9993' : '#c9c7c0'; cx.fillRect(0, 0, CW, CH);
      for (const [x, y, r, q] of graos) { cx.fillStyle = q > 0.5 ? 'rgba(80,78,72,0.35)' : 'rgba(240,238,230,0.35)'; cx.fillRect(x, y, r, r); }
    } else {
      const nx = 160, ny = 25;
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const x = (i + 0.5) / nx * L, y = (1 - (j + 0.5) / ny) * H;
        const Px = forcaEm(x) * f, M = S.g * x * (L - x) / 2 * fg;
        const s = (Px / S.A + (Px * S.e - M) * (S.yb - y) / S.I) / 1000;
        cx.fillStyle = corTensao(s); cx.fillRect(i * CW / nx, j * CH / ny, CW / nx + 1, CH / ny + 1);
      }
      for (const [x, y, r] of graos) { cx.fillStyle = 'rgba(60,60,60,0.12)'; cx.fillRect(x, y, r, r); }
      // linha do centro de gravidade e das cordoalhas
      cx.setLineDash([10, 8]); cx.strokeStyle = 'rgba(30,40,50,0.6)'; cx.lineWidth = 2;
      const yg = (1 - S.yb / H) * CH; cx.beginPath(); cx.moveTo(0, yg); cx.lineTo(CW, yg); cx.stroke(); cx.setLineDash([]);
    }
    texs.forEach((tx) => { tx.needsUpdate = true; });
  }

  // contraflecha: parábola ao longo do vão
  const wn = (x) => clamp(1 - (2 * x / L) ** 2, 0, 1);
  let ultimaD = -1;
  function curvar(d) {
    if (Math.abs(d - ultimaD) < 1e-5) return; ultimaD = d;
    for (const { m, base } of partes) {
      const p = m.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) p[i + 1] = base[i + 1] + wn(base[i]) * d;
      m.geometry.attributes.position.needsUpdate = true; m.geometry.computeBoundingSphere();
    }
    for (const c of cords) {
      const p = c.dentro.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) p[i + 1] = c.base[i + 1] + wn(c.base[i]) * d;
      c.dentro.geometry.attributes.position.needsUpdate = true; c.dentro.geometry.computeBoundingSphere();
      c.isol.forEach((m) => { m.position.y = wn(m.position.x) * d; });
    }
    est.forEach((e) => { e.g.position.y = YB + wn(e.x) * d; });
  }

  // ---------- pórtico rolante ----------
  const portico = new THREE.Group(); root.add(portico);
  [-1, 1].forEach((s) => {
    portico.add(at(box(0.5, 6.5, 0.5, 0xe0b021), 0, 3.25, s * 3.2));
    portico.add(at(box(1.2, 0.4, 1.0, 0xe0b021), 0, 0.2, s * 3.2));
  });
  portico.add(at(box(0.8, 0.9, 7.2, 0xe0b021), 0, 6.9, 0));
  const ganchos = [-1, 1].map((s) => {
    const g = new THREE.Group(); root.add(g);
    g.add(at(box(0.04, 1, 0.04, 0x2b2b2b), 0, 0.5, 0));
    g.add(at(box(0.5, 0.3, 0.4, 0x40546a), 0, 1.05, 0));
    g.userData.s = s; return g;
  });
  const portico2 = portico.clone(); root.add(portico2);

  // ---------- pessoas e maçarico ----------
  const op = pessoa(MAT.laranja); root.add(op.group);
  const aj = pessoa(MAT.verde, MAT.pele2); root.add(aj.group);
  const eng = pessoa(MAT.azul); eng.group.position.set(-9.5, 0.35, 2.4); eng.group.rotation.y = 2.6; root.add(eng.group);
  eng.bracoD.add(at(box(0.25, 0.32, 0.02, 0xeeeeea), 0.1, -0.35, 0.18)); eng.bracoD.rotation.x = -0.9;
  const chama = at(box(0.06, 0.06, 0.3, 0x5aa9ff, { e: 1 }), 0, 0, 0); root.add(chama);
  const faiscas = Array.from({ length: 8 }, () => { const m = at(box(0.04, 0.04, 0.04, 0xffb347, { e: 1, sombra: false }), 0, 0, 0); root.add(m); return m; });

  // ---------- painéis ----------
  const pn = painel(9.6, 2.7, 1440, 405, desenharPainel);
  pn.position.set(0, YB + H + 3.0, -1.6); root.add(pn);
  const most = painel(0.9, 0.5, 450, 250, (c, w, h, k, F, dl) => {
    caixaArred(c, 0, 0, w, h, 16, '#151a1f');
    c.fillStyle = '#7fd38f'; c.font = '500 24px "JetBrains Mono", monospace'; c.textAlign = 'left';
    c.fillText(`CORDOALHA ${k}/${PRE.n}`, 22, 40);
    c.font = '700 54px "JetBrains Mono", monospace'; c.textAlign = 'right';
    c.fillText(`${fmt(F, 1)} kN`, w - 22, 112); c.fillText(`${fmt(dl, 1)} mm`, w - 22, 200);
    c.font = '500 20px "JetBrains Mono", monospace'; c.fillStyle = '#5ea36d'; c.textAlign = 'left'; c.fillText('Δl', 22, 200);
  });
  most.position.set(XA + 2.1, 1.75, 1.62); most.rotation.y = 0.6; root.add(most);

  const f = '"Barlow", Arial, sans-serif', mono = '"JetBrains Mono", monospace';
  function desenharPainel(c, w, h, modo, t) {
    caixaArred(c, 0, 0, w, h, 24, 'rgba(20,24,30,0.86)');
    c.textAlign = 'left'; c.fillStyle = '#cfd6dc'; c.font = `600 34px ${f}`;
    if (modo === 'pista') {
      c.fillText('Pista de protensão', 30, 52);
      c.font = `500 28px ${f}`; c.fillStyle = '#e9eef2';
      [['comprimento entre cabeceiras', `${fmt(PRE.Lpista, 0)} m`], ['viga', `${fmt(L, 0)} m · seção I · h = ${fmt(H * 100, 0)} cm`],
        ['concreto', `C${PRE.fck} · liberação com ${PRE.fckj} MPa`], ['cordoalhas', `${PRE.n} × CP-190 RB φ12,7`]]
        .forEach(([a, b], i) => { c.fillStyle = '#9aa7b2'; c.fillText(a, 30, 120 + i * 62); c.fillStyle = '#e9eef2'; c.font = `600 28px ${mono}`; c.fillText(b, 480, 120 + i * 62); c.font = `500 28px ${f}`; });
      return;
    }
    if (modo === 'cord') {
      c.fillText('Força em cada cordoalha (kN)', 30, 52);
      const x0 = 70, W = w - 380, bw = W / PRE.n;
      for (let k = 0; k < PRE.n; k++) {
        const u = ease(win(t, TC(k), TC(k) + 1.4)), solto = t > TC(k) + 1.5;
        const F = solto ? PI.sPi * 1000 * PRE.ap : u * PI.Fmacaco;
        const hh = F / 160 * 250;
        c.fillStyle = solto ? '#7cc0f5' : '#f29a5c'; c.fillRect(x0 + k * bw + 10, 345 - hh, bw - 20, hh);
        c.fillStyle = '#9aa7b2'; c.font = `500 20px ${f}`; c.textAlign = 'center'; c.fillText(k + 1, x0 + k * bw + bw / 2, 375);
      }
      c.strokeStyle = '#f4d35e'; c.setLineDash([10, 8]); c.lineWidth = 2;
      const yl = 345 - PI.Fmacaco / 160 * 250; c.beginPath(); c.moveTo(x0, yl); c.lineTo(x0 + W, yl); c.stroke(); c.setLineDash([]);
      c.textAlign = 'left'; c.fillStyle = '#f4d35e'; c.font = `600 22px ${f}`; c.fillText(`macaco ${fmt(PI.Fmacaco, 1)}`, x0 + W + 12, yl + 8);
      c.fillStyle = '#7cc0f5'; c.fillText(`ancorada ${fmt(PI.sPi * 1000 * PRE.ap, 1)}`, x0 + W + 12, yl + 40);
      c.fillStyle = '#cfd6dc'; c.font = `500 22px ${f}`; c.fillText(`cravação das cunhas: −${fmt(PI.dCrav, 0)} MPa`, x0 + W + 12, yl + 90);
      return;
    }
    if (modo === 'cura') {
      c.fillText('Cura térmica (temperatura × horas)', 30, 52);
      const x0 = 90, y0 = h - 60, W = w - 140, HH = h - 140, X = (hr) => x0 + hr / 18 * W, Y = (T2) => y0 - (T2 - 20) / 45 * HH;
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1.5; c.font = `500 20px ${f}`; c.fillStyle = '#9aa7b2';
      for (let T2 = 20; T2 <= 65; T2 += 10) { c.beginPath(); c.moveTo(x0, Y(T2)); c.lineTo(x0 + W, Y(T2)); c.stroke(); c.textAlign = 'right'; c.fillText(`${T2} °C`, x0 - 10, Y(T2) + 7); }
      for (let hr = 0; hr <= 18; hr += 3) { c.textAlign = 'center'; c.fillText(`${hr} h`, X(hr), y0 + 30); }
      const hAt = horasCura(t);
      c.strokeStyle = '#f29a5c'; c.lineWidth = 4; c.beginPath();
      for (let i = 0; i <= 90; i++) { const hr = hAt * i / 90; i ? c.lineTo(X(hr), Y(curaTermica(hr))) : c.moveTo(X(hr), Y(curaTermica(hr))); }
      c.stroke();
      c.fillStyle = '#fff1e6'; c.beginPath(); c.arc(X(hAt), Y(curaTermica(hAt)), 8, 0, 7); c.fill();
      c.textAlign = 'left'; c.font = `600 24px ${f}`; c.fillStyle = '#e9eef2';
      c.fillText(`${fmt(curaTermica(hAt), 0)} °C · ${fmt(hAt, 1)} h`, X(hAt) + 14, Y(curaTermica(hAt)) - 14);
      return;
    }
    // transferência / leitura: tensões no meio e na ponta
    c.fillText(modo === 'leit' ? 'Tensões na liberação (MPa, compressão +)' : 'Tensões na seção (MPa, compressão +)', 30, 52);
    const fr = fracCorte(t);
    const colunas = [
      ['Meio do vão', TR.meio.top * fr + (fr ? 0 : 0), TR.meio.base * fr],
      ['Ponta com isolamento', TR.ponta.top * fr, TR.ponta.base * fr],
      ['Ponta sem isolamento', TR.pontaSemIsol.top * fr, null],
    ];
    const k = 15;
    colunas.forEach(([nome, top, base], i) => {
      const cx0 = 60 + i * 460, xe = cx0 + 170, yt = 110, yb2 = 350;
      c.fillStyle = '#9aa7b2'; c.font = `600 24px ${f}`; c.textAlign = 'left'; c.fillText(nome, cx0, 92 + (i === 2 ? 0 : 0));
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(xe, yt); c.lineTo(xe, yb2); c.stroke();
      if (base === null) {
        const ok = -top <= TR.lim.tracao;
        c.fillStyle = ok ? 'rgba(124,204,143,0.8)' : 'rgba(232,96,80,0.85)';
        c.fillRect(xe - Math.max(0, -top) * k * 2, yt, Math.max(0, -top) * k * 2, 22);
        c.fillStyle = '#e9eef2'; c.font = `600 24px ${mono}`; c.fillText(`${fmt(top, 2)}`, xe + 12, yt + 20);
        c.fillStyle = ok ? '#7ccc8f' : '#e86050'; c.font = `700 24px ${f}`;
        if (fr > 0.99) c.fillText(ok ? 'dentro do limite' : `passa de −${fmt(TR.lim.tracao, 2)}: racharia`, cx0, 400);
        return;
      }
      c.fillStyle = 'rgba(92,150,230,0.6)'; c.beginPath();
      c.moveTo(xe, yt); c.lineTo(xe + top * k, yt); c.lineTo(xe + base * k, yb2); c.lineTo(xe, yb2); c.closePath(); c.fill();
      c.fillStyle = '#e9eef2'; c.font = `600 24px ${mono}`; c.textAlign = 'left';
      c.fillText(fmt(top, 2), xe + Math.max(top * k, 0) + 10, yt + 20); c.fillText(fmt(base, 1), xe + base * k + 10, yb2);
      if (fr > 0.99) {
        const ok = -top <= TR.lim.tracao && base <= TR.lim.compr;
        c.fillStyle = ok ? '#7ccc8f' : '#e86050'; c.font = `700 24px ${f}`; c.fillText(ok ? 'dentro dos limites' : 'fora do limite', cx0, 400);
      }
    });
    c.fillStyle = '#9aa7b2'; c.font = `500 20px ${f}`; c.textAlign = 'right';
    c.fillText(`limites: tração ${fmt(TR.lim.tracao, 2)} · compressão ${fmt(TR.lim.compr, 1)}`, w - 30, 52);
  }

  o.rotulos([
    ['Cabeceira de ancoragem', 1, 7, () => P(-XA - 0.6, 1.9, 0)],
    ['Berço da pista', 3, 7.5, () => P(-3, YB, 0.3)],
    ['Macaco hidráulico', T.cord + 1, T.cord + 8, () => P(XA + 0.6, YB + 0.5, 0)],
    [`Alongamento ${fmt(PI.dl * 1000, 1)} mm`, T.cord + 8, T.arm - 1, () => P(XA + 0.4, YB + 0.35, 0.2)],
    ['Isolamento nas pontas (2 cordoalhas)', T.arm + 1, T.arm + 7, () => P(L / 2 - 0.8, YB + 0.15, 0.15)],
    ['Estribos', T.arm + 6, T.conc - 1, () => P(-4, YB + 1.05, 0)],
    ['Concreto C40', T.conc + 4, T.conc + 10, () => P(-2, YB + 0.6, 0)],
    ['Lona e vapor a 60 °C', T.cura + 3, T.lib - 1, () => P(0, YB + 1.6, 0.6)],
    ['Corte com maçarico', CORTE0, CORTE0 + 5, () => P(L / 2 + 0.5, YB + 0.3, 0.2)],
    ['Mapa de tensões na face cortada', CORTE1 - 2, CORTE1 + 4, () => P(-3, YB + 0.5, 0)],
    [`Contraflecha ${fmt(TR.contraflecha, 1)} mm`, CORTE1 + 3, T.saque, () => P(0, YB + H + 0.55 + TR.contraflecha / 1000 * AMP, 0)],
    ['Pórtico rolante', T.saque + 1, T.saque + 7, () => P(-L / 2 + 1.2, 7.3, 0)],
    ['Topo tracionado perto da ponta', T.leit + 1, T.leit + 7, () => P(-L / 2 + 0.9, YB + H + 0.05, 0)],
    ['Base comprimida no meio do vão', T.leit + 7, T.saque, () => P(0, YB + 0.05 + TR.contraflecha / 1000 * AMP, 0)],
  ]);
  const fixo = motor.rotulo('Contraflecha desenhada 40× maior', 'discreto');

  function render(t) {
    const fr = fracCorte(t);
    const lift = clamp((fr * TR.cP - TR.cG) / (TR.cP - TR.cG));         // 0 enquanto a viga apoia na fôrma
    const camber = t < CORTE0 ? 0 : Math.max(0, fr * TR.cP - TR.cG);    // mm
    const d = camber / 1000 * AMP;
    curvar(d);

    // cordoalhas: deitadas no berço até a protensão; somem por fora depois do corte
    cords.forEach((c) => {
      c.g.visible = t >= T.cord + 0.5 + c.k * 0.25;
      const u = ease(win(t, TC(c.k), TC(c.k) + 1.4));
      c.g.position.y = YB + lerp(0.008 + c.k * 0.002, c.y, u);
      const cortada = t >= CORTE0 + c.k * (CORTE1 - CORTE0) / PRE.n;
      c.esq.visible = c.dir.visible = !cortada || t < CORTE0;
      c.isol.forEach((m) => { m.visible = t >= T.arm + 1; });
    });
    // macaco acompanha a cordoalha em protensão
    const kAt = clamp(Math.floor((t - T.cord - 4) / 1.9), 0, PRE.n - 1);
    macaco.visible = t >= T.cord && t < T.arm;
    const c = CORD[kAt], uK = ease(win(t, TC(kAt), TC(kAt) + 1.4));
    macaco.position.set(XA + 1.25, YB + c[0], c[1]);
    embolo.position.x = 0.7 + 0.25 + uK * PI.dl * 1.5;
    most.visible = t >= T.cord && t < T.arm + 2;
    const kMost = t < TC(0) ? 0 : kAt + 1;
    most.userData.atualizar(`${kMost}|${uK.toFixed(2)}`, kMost, uK * PI.Fmacaco, uK * PI.dl * 1000);

    // estribos e fôrmas
    est.forEach((e, i) => { const u = ease(win(t, T.arm + 2 + i * 0.07, T.arm + 3 + i * 0.07)); e.g.visible = u > 0 && t < CORTE0; e.g.scale.y = Math.max(0.001, u); });
    const fF = ease(win(t, T.arm + 8, T.arm + 10)), dF = ease(win(t, T.lib - 2, T.lib));
    formaTras.visible = fF > 0 && dF < 1; formaTras.position.z = -0.34 - (1 - fF) * 1.2 - dF * 1.2;
    formaFrente.visible = formaTras.visible; formaFrente.position.z = 0.34 + (1 - fF) * 1.2 + dF * 1.2;

    // concreto
    viga.visible = t >= T.conc + 3;
    pour.constant = origem[0] + lerp(-L / 2 - 0.1, L / 2 + 0.1, win(t, T.conc + 3, T.conc + 12));
    ladoMat.color.setHex(t < T.cura + 6 ? 0x9a9993 : 0xc9c7c0);
    desenharFace(t, fr, lift);
    lona.visible = t >= T.cura && t < T.lib - 2;
    vapor.forEach((v, i) => { v.visible = lona.visible; v.position.y = YB + 1.6 + ((t * 0.6 + i * 0.37) % 1) * 1.2; v.scale.setScalar(0.7 + ((t * 0.6 + i * 0.37) % 1)); });
    alcas.forEach((a) => { a.visible = t >= T.conc + 12; });

    // saque com pórtico: sobe 2,5 m e recua 4 m
    const sobe = ease(win(t, T.saque + 3, T.saque + 6)), recua = ease(win(t, T.saque + 6, T.saque + 10));
    viga.position.set(0, sobe * 2.5, -recua * 4);
    cords.forEach((cc) => { cc.dentro.position.y = 0; cc.g.position.z = cc.z - recua * 4; cc.dentro.visible = true; });
    if (t >= CORTE1) cords.forEach((cc) => { cc.g.position.y = YB + cc.y + sobe * 2.5; });
    est.forEach((e) => { e.g.position.z = -recua * 4; if (t >= T.saque) e.g.position.y = YB + wn(e.x) * d + sobe * 2.5; });
    portico.position.set(-L / 2 + 1.2, 0, -recua * 4); portico2.position.set(L / 2 - 1.2, 0, -recua * 4);
    portico.visible = portico2.visible = t >= T.saque;
    ganchos.forEach((g) => {
      g.visible = t >= T.saque + 1;
      const desce = ease(win(t, T.saque + 1, T.saque + 3));
      const y = lerp(4.6, YB + H - 0.85, desce) + sobe * 2.5;
      g.position.set(g.userData.s * (L / 2 - 1.2), y, -recua * 4);
      const Lc = Math.max(0.05, 6.45 - y - 1.2);
      g.children[0].scale.y = Lc; g.children[0].position.y = 1.2 + Lc / 2;
    });

    // pessoas
    op.group.position.set(XA + 2.4, 0.35, -0.9); op.group.rotation.y = -Math.PI / 2 - 0.4;
    op.bracoD.rotation.x = op.bracoE.rotation.x = (t >= T.cord && t < T.arm) ? -1.2 : 0;
    op.group.visible = t < T.conc;
    let ax = -6, az = 1.0, anda = false;
    if (t >= T.arm && t < T.conc) { ax = lerp(-7, 7, win(t, T.arm + 1, T.arm + 10)); anda = t < T.arm + 10; }
    else if (t >= T.conc && t < T.cura) { ax = lerp(-L / 2, L / 2, win(t, T.conc + 3, T.conc + 12)); anda = true; }
    else if (t >= CORTE0 - 1 && t < CORTE1 + 1) {
      const kk = clamp(Math.floor((t - CORTE0) / ((CORTE1 - CORTE0) / PRE.n)), 0, PRE.n - 1);
      ax = (kk % 2 ? -1 : 1) * (L / 2 + 0.9); az = 0.8;
    }
    aj.group.position.set(ax, 0.35, az); aj.group.rotation.y = anda ? Math.PI / 2 : Math.PI;
    anda ? andar(aj, t * 6) : parar(aj);
    if (t >= T.arm && t < T.arm + 10) aj.bracoD.rotation.x = aj.bracoE.rotation.x = -1.3;
    const cortando = t >= CORTE0 && t < CORTE1;
    chama.visible = cortando; faiscas.forEach((s) => { s.visible = cortando; });
    if (cortando) {
      const xs = ax > 0 ? L / 2 + 0.35 : -L / 2 - 0.35;
      aj.bracoD.rotation.x = -1.4;
      chama.position.set(xs, YB + 0.1, 0.25);
      faiscas.forEach((s, i) => { const u = (t * 3 + i / 8) % 1; s.position.set(xs + Math.sin(i * 2.3) * u * 0.5, YB + 0.1 - u * 0.1 + Math.sin(u * 3) * 0.2, 0.2 + Math.cos(i * 1.7) * u * 0.4); });
    }
    eng.group.visible = true;

    // painel
    const modo = t < T.cord ? 'pista' : t < T.arm + 2 ? 'cord' : t < T.cura ? null : t < T.lib ? 'cura' : t < T.leit ? 'trans' : 'leit';
    pn.visible = !!modo;
    if (modo) pn.userData.atualizar(`${modo}|${modo === 'cord' ? t.toFixed(1) : modo === 'cura' ? horasCura(t).toFixed(1) : fr.toFixed(2)}`, modo, t);

    fixo.vis = o.state.active && t >= CORTE1; fixo.pos.copy(P(-L / 2, YB - 0.35, 0.4));

    // legenda
    if (t < T.cord) return `Pista de ${fmt(PRE.Lpista, 0)} m · viga I de ${fmt(L, 0)} m · C${PRE.fck}`;
    if (t < T.arm) return t < TC(0) ? `${PRE.n} cordoalhas CP-190 RB φ12,7 estendidas na pista`
      : `Cordoalha ${kAt + 1}/${PRE.n} · F = ${fmt(uK * PI.Fmacaco, 1)} kN · Δl = ${fmt(uK * PI.dl * 1000, 1)} mm`;
    if (t < T.conc) return `Estribos e fôrma · 2 cordoalhas isoladas em ${fmt(PRE.lIsol, 1)} m nas pontas`;
    if (t < T.cura) return `Concretagem ${Math.round(win(t, T.conc + 3, T.conc + 12) * 100)}% · C${PRE.fck}`;
    if (t < T.lib) return `Cura térmica · ${fmt(horasCura(t), 1)} h · ${fmt(curaTermica(horasCura(t)), 0)} °C`;
    if (t < T.leit) return t < CORTE0 ? `Liberação com fcj ≥ ${PRE.fckj} MPa · desforma`
      : `Cortadas ${Math.round(fr * PRE.n)}/${PRE.n} · P = ${fmt(TR.P * fr, 0)} kN · contraflecha ${fmt(camber, 1)} mm`;
    if (t < T.saque) return `Meio: topo ${fmt(TR.meio.top, 2)} · base ${fmt(TR.meio.base, 1)} MPa · ponta topo ${fmt(TR.ponta.top, 2)} MPa · contraflecha ${fmt(TR.contraflecha, 1)} mm`;
    return `Saque com pórtico · ${fmt(CL.pesoViga, 0)} kN (≈ ${fmt(CL.pesoViga / 9.81, 0)} t) · para o estoque`;
  }

  const exit0 = o.exit; o.exit = () => { fixo.vis = false; exit0(); };
  return o;
}
