// Obra E1 — Compressão do corpo de prova de concreto (moldagem, cura, retificação, prensa, resultado).
// Tudo é função do tempo t. Números de EXEMPLO, não são de projeto.
import * as THREE from 'three';
import { box, cyl, at, mat, pessoa, andar, parar, painel, caixaArred, win, ease, clamp, lerp, rng } from '../core/kit.js';
import { criarObra } from '../core/obra.js';
import { salaLab, metal } from './lab.js';
import { CP, areaCP, forcaDe, sigmaConcreto, epsDeSigma, estatistica, moduloSecante } from '../calc/ensaios.js';
import { fmt } from '../calc/viga.js';

const FC = CP.exemplares[CP.ensaiado];
const EST = estatistica();
const ESEC = moduloSecante(FC);
const T = { mold: 0, cura: 16, ret: 28, ens: 38, res: 82, leit: 96, FIM: 110 };
const C0 = 41, C1 = 73;                         // carregamento até a ruptura
const ACEL = (FC / CP.taxa) / (C1 - C0);        // quanto a animação acelera o ensaio real
const sigmaDe = (t) => t < C0 ? 0 : t < C1 ? FC * (t - C0) / (C1 - C0) : 0;

export const STEPS = [
  { t: 'Moldagem', d: 'Na hora da concretagem da viga, o laboratorista enche moldes cilíndricos de 10 × 20 cm com o mesmo concreto. São duas camadas, e cada uma leva 12 golpes da haste para sair o ar, como faz o vibrador na obra. O topo é rasado com a colher. Cada par de cilindros é um "exemplar" daquele caminhão.' },
  { t: 'Cura', d: 'Depois de 24 horas o cilindro sai do molde e vai para o tanque de água (ou câmara úmida), a cerca de 23 °C, até a idade do ensaio. A idade padrão é de 28 dias, a mesma em que o projeto define a resistência característica fck.' },
  { t: 'Retificação', d: 'As duas faces do cilindro precisam ficar planas e paralelas. Se a face tiver um ressalto, a força se concentra num ponto e o resultado sai menor do que o concreto realmente aguenta. Por isso as faces são retificadas (ou capeadas) antes do ensaio.' },
  { t: 'Ensaio na prensa', d: `O cilindro vai centrado entre os pratos da prensa e a força sobe a uma velocidade constante de ${fmt(CP.taxa, 2)} MPa/s. A tensão é a força dividida pela área da face, ${fmt(areaCP() * 1e4, 2)} cm². Perto do pico aparecem fissuras verticais e o cilindro rompe de forma brusca, em geral formando cones. Este cilindro rompeu com ${fmt(forcaDe(FC), 1)} kN, ou seja, fc = ${fmt(FC, 1)} MPa.` },
  { t: 'Resultado do lote', d: `Um resultado sozinho não diz muito: o concreto varia de caminhão para caminhão. Com os ${EST.n} exemplares do lote, a média é ${fmt(EST.fcm, 1)} MPa e o desvio-padrão ${fmt(EST.sd, 2)} MPa. A resistência característica estimada, que tem só 5% de chance de não ser atingida, é fcm − 1,65·s = ${fmt(EST.fckEst, 1)} MPa, acima dos 25 MPa pedidos. Lote aceito.` },
  { t: 'Leitura da curva', d: `A curva tensão × deformação sobe quase reta no começo e vai se curvando: o concreto já começa a microfissurar por dentro. O pico acontece com cerca de 2‰ de encurtamento. A inclinação no começo dá o módulo de elasticidade, aqui cerca de ${fmt(ESEC / 1000, 1)} GPa. É esse fck = 25 MPa que entrou no cálculo da viga da zona A.` },
];
export const STARTS = [T.mold, T.cura, T.ret, T.ens, T.res, T.leit];

export function criarCompressao(motor, origem) {
  const o = criarObra(motor, origem, {
    id: 'compressao', nome: 'Compressão do corpo de prova', tit: 'Compressão do corpo de prova de concreto',
    sub: 'Zona E · Laboratório de materiais', hide: 'E', steps: STEPS, starts: STARTS, fim: T.FIM,
    cams: [[-1.6, 1.0, 0, 2.0, 0, 0.2], [-0.1, 0.9, 0, 4.2, 0, 0.22], [-1.2, 1.12, 0, 1.4, 0, 0.18],
      [0.3, 1.5, -0.5, 3.8, 0, 0.1], [-0.6, 1.75, -0.8, 4.4, 0, 0.08], [-0.6, 1.75, -0.8, 4.4, 0, 0.08]],
    render,
  });
  const root = o.group, P = o.P;
  salaLab(root);

  // ---------- molde em corte ----------
  const M = new THREE.Vector3(-1.75, 0.9, 0.05);
  const corte = new THREE.Plane(new THREE.Vector3(0, 0, -1), origem[2] + M.z);
  const moldeMat = new THREE.MeshStandardMaterial({ color: 0x8d99a3, metalness: 0.4, roughness: 0.4, side: THREE.DoubleSide, clippingPlanes: [corte], flatShading: true });
  const molde = new THREE.Group(); molde.position.copy(M); root.add(molde);
  const casca = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.2, 24, 1, true), moldeMat); casca.position.y = 0.11; molde.add(casca);
  molde.add(at(box(0.16, 0.01, 0.16, 0x6f7c86), 0, 0.005, 0));
  const frescoMat = new THREE.MeshStandardMaterial({ color: 0x8e8d87, roughness: 1, side: THREE.DoubleSide, clippingPlanes: [corte], flatShading: true });
  const recheio = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 1, 24), frescoMat); molde.add(recheio);
  const haste = cyl(0.008, 0.008, 0.6, 0x50585f, 8); root.add(haste);
  const colher = new THREE.Group(); colher.add(at(box(0.12, 0.005, 0.06, 0x9aa4ad), 0.06, 0, 0)); colher.add(at(box(0.1, 0.02, 0.02, 0x5c3b22), -0.04, 0.02, 0)); root.add(colher);
  const balde = cyl(0.12, 0.1, 0.22, 0x3b6fb6, 12); balde.position.set(-1.25, 1.01, 0.08); root.add(balde);

  // ---------- tanque de cura ----------
  const TK = new THREE.Vector3(1.6, 0, 0.0);
  const tanque = new THREE.Group(); tanque.position.copy(TK); root.add(tanque);
  tanque.add(at(box(1.0, 0.06, 0.6, 0x6f7c86), 0, 0.03, 0));
  tanque.add(at(box(1.0, 0.58, 0.04, 0x6f7c86), 0, 0.29, -0.28));
  [-0.48, 0.48].forEach((x) => tanque.add(at(box(0.04, 0.58, 0.6, 0x6f7c86), x, 0.29, 0)));
  tanque.add(at(box(1.0, 0.2, 0.03, 0x6f7c86), 0, 0.1, 0.285));                   // frente baixa (corte)
  const agua = at(box(0.92, 0.46, 0.52, 0x6aa3c8, { op: 0.35, sombra: false }), 0, 0.29, 0); tanque.add(agua);
  for (let i = 0; i < 5; i++) tanque.add(at(cyl(0.05, 0.05, 0.2, 0xb9b8b1, 16), -0.36 + i * 0.13, 0.16, -0.1 + (i % 2) * 0.12));

  // ---------- retificadora ----------
  const RX = -1.15;
  root.add(at(box(0.3, 0.12, 0.3, 0x40546a), RX, 0.96, -0.02));
  root.add(at(box(0.06, 0.55, 0.06, 0x40546a), RX, 1.18, -0.16));
  const disco = new THREE.Group(); root.add(disco);
  disco.add(at(cyl(0.07, 0.07, 0.02, 0x9aa4ad, 16), 0, 0, 0));
  disco.add(at(box(0.04, 0.012, 0.02, 0x2b2b2b), 0.04, 0.012, 0));
  disco.add(at(box(0.05, 0.08, 0.05, 0x40546a), 0, 0.05, 0));

  // ---------- prensa ----------
  const PX = 0.15;
  root.add(at(box(0.7, 0.5, 0.55, 0x40546a), PX, 0.25, 0));
  root.add(at(cyl(0.11, 0.11, 0.04, 0x9aa4ad, 20), PX, 0.52, 0));
  [-0.28, 0.28].forEach((x) => root.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 10), metal()), PX + x, 1.05, 0)));
  root.add(at(box(0.72, 0.2, 0.55, 0x40546a), PX, 1.6, 0));
  const pistao = new THREE.Group(); root.add(pistao);
  pistao.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 16), metal(0xb8c0c6)), 0, 0.42, 0));
  pistao.add(at(cyl(0.11, 0.11, 0.04, 0x9aa4ad, 20), 0, 0.02, 0));
  // console e mostrador
  root.add(at(box(0.36, 1.0, 0.36, 0x8c96a0), 0.92, 0.5, -0.45));
  const mostrador = painel(0.46, 0.26, 460, 260, (c, w, h, F, s) => {
    caixaArred(c, 0, 0, w, h, 16, '#151a1f');
    c.fillStyle = '#7fd38f'; c.font = '500 26px "JetBrains Mono", monospace'; c.textAlign = 'left';
    c.fillText('FORÇA', 24, 46); c.fillText('TENSÃO', 24, 156);
    c.font = '700 60px "JetBrains Mono", monospace'; c.textAlign = 'right';
    c.fillText(`${fmt(F, 1)} kN`, w - 22, 108); c.fillText(`${fmt(s, 1)} MPa`, w - 22, 216);
    c.font = '500 20px "JetBrains Mono", monospace'; c.fillStyle = '#5ea36d'; c.fillText(`${fmt(CP.taxa, 2)} MPa/s`, w - 22, 246);
  });
  mostrador.position.set(0.92, 1.18, -0.26); mostrador.rotation.x = -0.35; root.add(mostrador);

  // ---------- corpo de prova (textura com agregados e fissuras) ----------
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const cpMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  const cp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 28, 6), [cpMat, mat(0xa9a8a1), mat(0xa9a8a1)]);
  cp.castShadow = true; root.add(cp);
  const r1 = rng(5), graos = Array.from({ length: 500 }, () => [r1() * 512, r1() * 512, 2 + r1() * 5, r1()]);
  const r2 = rng(19), micro = Array.from({ length: 14 }, () => ({ x: r2() * 512, y: 120 + r2() * 260, l: 40 + r2() * 90, k: 0.75 + r2() * 0.22 }));
  let chaveCP = '';
  function desenharCP(fresco, s, rompeu) {
    const k = `${fresco > 0.5}|${Math.round(s * 2)}|${rompeu}`;
    if (k === chaveCP) return; chaveCP = k;
    cx.fillStyle = fresco > 0.5 ? '#8e8d87' : '#b9b8b1'; cx.fillRect(0, 0, 512, 512);
    for (const [x, y, r, q] of graos) { cx.fillStyle = q > 0.5 ? 'rgba(70,68,62,0.4)' : 'rgba(235,233,225,0.4)'; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); }
    cx.strokeStyle = '#2b2b2b'; cx.lineCap = 'round';
    for (const m of micro) {
      if (!rompeu && s / FC < m.k) continue;
      cx.lineWidth = rompeu ? 3 : 1.6; cx.beginPath(); cx.moveTo(m.x, m.y); cx.lineTo(m.x + 6, m.y + m.l * 0.5); cx.lineTo(m.x - 3, m.y + m.l); cx.stroke();
    }
    if (rompeu) {  // cones: diagonais do topo e da base até o meio
      cx.lineWidth = 5;
      for (let i = 0; i < 8; i++) {
        const x = i * 64 + 20;
        cx.beginPath(); cx.moveTo(x, 6); cx.lineTo(x + 40, 250); cx.lineTo(x + 2, 506); cx.stroke();
      }
    }
    tex.needsUpdate = true;
  }
  // fragmentos que saltam na ruptura
  const r3 = rng(77);
  const cacos = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + r3() * 0.4;
    const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.018 + r3() * 0.015, 0), mat(0xb0afa8));
    m.castShadow = true; root.add(m);
    return { m, a, v: 0.35 + r3() * 0.4, vy: 0.4 + r3() * 0.5, y0: 0.6 + r3() * 0.1, spin: r3() * 8 };
  });

  // ---------- painéis: curva e tabela ----------
  const grafico = painel(2.1, 1.25, 840, 500, desenharGrafico);
  grafico.position.set(0.45, 2.15, -1.72); root.add(grafico);
  const tabela = painel(1.55, 1.25, 620, 500, desenharTabela);
  tabela.position.set(-1.55, 2.15, -1.72); root.add(tabela);

  function desenharGrafico(c, w, h, s, leitura) {
    caixaArred(c, 0, 0, w, h, 20, 'rgba(20,24,30,0.86)');
    const f = '"Barlow", Arial, sans-serif';
    const x0 = 86, y0 = h - 66, W = w - 120, H = h - 130;
    const X = (e) => x0 + e / 0.0035 * W, Y = (v) => y0 - v / 35 * H;
    c.fillStyle = '#cfd6dc'; c.font = `600 28px ${f}`; c.textAlign = 'left'; c.fillText('Tensão × deformação', 24, 42);
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1.5; c.font = `500 20px ${f}`; c.fillStyle = '#9aa7b2';
    for (let v = 0; v <= 35; v += 5) { c.beginPath(); c.moveTo(x0, Y(v)); c.lineTo(x0 + W, Y(v)); c.stroke(); c.textAlign = 'right'; c.fillText(v, x0 - 10, Y(v) + 7); }
    for (let e = 0; e <= 3.5; e += 0.5) { c.textAlign = 'center'; c.fillText(fmt(e, 1), X(e / 1000), y0 + 28); }
    c.textAlign = 'left'; c.fillText('MPa', 18, Y(35) + 7); c.textAlign = 'right'; c.fillText('deformação (‰)', x0 + W, y0 + 56);
    if (leitura) {  // trecho pós-pico só de referência
      c.setLineDash([10, 8]); c.strokeStyle = 'rgba(242,154,92,0.6)'; c.lineWidth = 3; c.beginPath();
      for (let i = 0; i <= 40; i++) { const e = CP.eps0 + i / 40 * (0.0035 - CP.eps0); i ? c.lineTo(X(e), Y(sigmaConcreto(e, FC))) : c.moveTo(X(e), Y(sigmaConcreto(e, FC))); }
      c.stroke(); c.setLineDash([]);
      // módulo secante
      const eb = epsDeSigma(0.3 * FC, FC);
      c.strokeStyle = '#7cc0f5'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(eb * 2.2), Y(0.3 * FC * 2.2)); c.stroke();
      c.fillStyle = '#7cc0f5'; c.font = `600 22px ${f}`; c.textAlign = 'left'; c.fillText(`E ≈ ${fmt(ESEC / 1000, 1)} GPa`, X(eb * 2.2) + 8, Y(0.3 * FC * 2.2) + 4);
    }
    if (s > 0) {
      const eAt = epsDeSigma(s, FC);
      c.strokeStyle = '#f29a5c'; c.lineWidth = 4; c.beginPath(); c.moveTo(X(0), Y(0));
      for (let i = 1; i <= 50; i++) { const e = eAt * i / 50; c.lineTo(X(e), Y(sigmaConcreto(e, FC))); }
      c.stroke();
      c.fillStyle = '#fff1e6'; c.beginPath(); c.arc(X(eAt), Y(s), 7, 0, 7); c.fill();
      if (s >= FC - 0.01) {
        c.fillStyle = '#f4d35e'; c.font = `700 24px ${f}`; c.textAlign = 'center';
        c.fillText(`fc = ${fmt(FC, 1)} MPa`, X(eAt), Y(s) - 18);
        c.font = `500 20px ${f}`; c.fillText(`ε ≈ ${fmt(eAt * 1000, 1)}‰`, X(eAt), y0 - 10);
      }
    }
  }

  function desenharTabela(c, w, h, n) {
    caixaArred(c, 0, 0, w, h, 20, 'rgba(20,24,30,0.86)');
    const f = '"Barlow", Arial, sans-serif';
    c.fillStyle = '#cfd6dc'; c.font = `600 28px ${f}`; c.textAlign = 'left'; c.fillText('Exemplares aos 28 dias', 24, 42);
    const x0 = 120, W = w - 210, X = (v) => x0 + (v - 20) / 15 * W;
    c.strokeStyle = '#f4d35e'; c.setLineDash([8, 6]); c.lineWidth = 2;
    c.beginPath(); c.moveTo(X(25), 60); c.lineTo(X(25), 60 + 6 * 46); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#f4d35e'; c.font = `600 18px ${f}`; c.textAlign = 'center'; c.fillText('fck 25', X(25), 60 + 6 * 46 + 22);
    CP.exemplares.forEach((v, i) => {
      if (i >= n) return;
      const y = 72 + i * 46;
      c.fillStyle = '#9aa7b2'; c.font = `500 22px ${f}`; c.textAlign = 'left'; c.fillText(`CP ${i + 1}`, 24, y + 22);
      c.fillStyle = i === CP.ensaiado ? '#f29a5c' : 'rgba(124,192,245,0.75)';
      c.fillRect(x0, y + 4, X(v) - x0, 26);
      c.fillStyle = '#e9eef2'; c.font = `600 22px "JetBrains Mono", monospace`; c.textAlign = 'left'; c.fillText(fmt(v, 1), X(v) + 8, y + 25);
    });
    if (n >= 6) {
      const y = h - 96;
      c.fillStyle = '#e9eef2'; c.font = `500 22px ${f}`; c.textAlign = 'left';
      c.fillText(`fcm = ${fmt(EST.fcm, 1)} MPa   s = ${fmt(EST.sd, 2)} MPa`, 24, y);
      c.fillStyle = EST.aprovado ? '#7ccc8f' : '#e86050'; c.font = `700 26px ${f}`;
      c.fillText(`fck,est = ${fmt(EST.fckEst, 1)} MPa ${EST.aprovado ? '≥ 25 · aceito' : '< 25 · recusado'}`, 24, y + 40);
    }
  }

  // ---------- pessoa ----------
  const lab = pessoa(0xeeeeea); root.add(lab.group);

  // trajetos do corpo de prova (centro do cilindro)
  const pM = new THREE.Vector3(M.x, M.y + 0.11, M.z);
  const pT = new THREE.Vector3(TK.x - 0.1, 0.16, 0.12);
  const pR = new THREE.Vector3(RX, 1.12, -0.02);
  const pP = new THREE.Vector3(PX, 0.64, 0);
  const arco = (a, b, u, alt) => new THREE.Vector3().lerpVectors(a, b, u).add(new THREE.Vector3(0, Math.sin(u * Math.PI) * alt, 0));

  function posCP(t) {
    if (t < T.cura + 1.5) return pM;
    if (t < T.cura + 5) return arco(pM, pT, ease(win(t, T.cura + 1.5, T.cura + 5)), 0.35);
    if (t < T.ret) return pT;
    if (t < T.ret + 3) return arco(pT, pR, ease(win(t, T.ret, T.ret + 3)), 0.4);
    if (t < T.ret + 8) return pR;
    if (t < T.ens + 1) return arco(pR, pP, ease(win(t, T.ret + 8, T.ens + 1)), 0.25);
    return pP;
  }

  o.rotulos([
    ['Molde 10 × 20 cm', 0.5, 4, () => P(M.x, M.y + 0.26, M.z)],
    ['12 golpes por camada', 4.5, 13, () => P(M.x + 0.02, M.y + 0.62, M.z)],
    ['Tanque de cura', T.cura + 5, T.ret - 0.5, () => P(TK.x, 0.68, 0)],
    ['Faces planas e paralelas', T.ret + 3.5, T.ens - 2, () => P(RX, 1.32, 0)],
    ['Prato com rótula', T.ens + 1, T.ens + 6, () => P(PX, 0.86, 0)],
    ['Fissuras verticais', C1 - 6, C1, () => P(PX, 0.66, 0.05)],
    ['Ruptura em cone', C1, C1 + 7, () => P(PX, 0.7, 0.05)],
    ['Lote: fck,est ≥ 25 MPa', T.res + 6, T.leit, () => P(-1.55, 1.45, -1.6)],
    ['Pico ≈ 2‰', T.leit + 1, T.leit + 7, () => P(0.25, 2.7, -1.6)],
    ['Módulo de elasticidade', T.leit + 7, T.FIM, () => P(-0.3, 1.95, -1.6)],
  ]);

  function render(t) {
    // moldagem
    const fill = t < 2 ? 0 : t < 4 ? 0.11 * win(t, 2, 4) : t < 9 ? lerp(0.11, 0.1, win(t, 4, 9))
      : t < 11 ? lerp(0.1, 0.21, win(t, 9, 11)) : t < 14 ? lerp(0.21, 0.205, win(t, 11, 14)) : lerp(0.205, 0.2, win(t, 14, 16));
    const desmolda = ease(win(t, T.cura, T.cura + 1.5));
    molde.visible = t < T.cura + 2;
    casca.position.y = 0.11 + desmolda * 0.35;
    recheio.visible = fill > 0 && t < T.cura;
    recheio.scale.y = Math.max(0.001, fill); recheio.position.y = 0.01 + fill / 2;
    const golpe = (t >= 4 && t < 9) ? (t - 4) / 5 * 12 : (t >= 11 && t < 14) ? (t - 11) / 3 * 12 : -1;
    haste.visible = golpe >= 0;
    if (haste.visible) haste.position.set(M.x + Math.sin(golpe * 2.1) * 0.02, M.y + 0.01 + fill + 0.3 + Math.abs(Math.sin(golpe * Math.PI)) * 0.12, M.z + Math.cos(golpe * 2.1) * 0.02);
    colher.visible = t >= 14 && t < 16;
    if (colher.visible) colher.position.set(M.x + lerp(-0.08, 0.08, win(t, 14, 16)), M.y + 0.215, M.z);
    balde.visible = t < T.cura;

    // corpo de prova
    const s = sigmaDe(t), rompeu = t >= C1;
    cp.visible = t >= T.cura;
    cp.position.copy(posCP(t));
    cp.scale.set(1, rompeu ? 0.96 : 1, 1);
    if (rompeu) { cp.scale.x = cp.scale.z = 0.86; }
    cp.visible = cp.visible && t < T.res + 1;
    desenharCP(t < T.cura + 6 ? 1 : 0, s, rompeu);

    // retificação
    const desce = ease(win(t, T.ret + 3, T.ret + 4)) * (1 - ease(win(t, T.ret + 7, T.ret + 8)));
    disco.position.set(RX, lerp(1.45, 1.235, desce), -0.02); disco.rotation.y = t * 30;

    // prensa
    const contato = 0.745;
    const yP = t < T.ens + 1 ? 0.95 : t < T.ens + 3 ? lerp(0.95, contato, ease(win(t, T.ens + 1, T.ens + 3)))
      : t < C1 ? contato - s / FC * 0.0006 : t < C1 + 4 ? contato - 0.015 : lerp(contato - 0.015, 0.95, ease(win(t, C1 + 4, C1 + 7)));
    pistao.position.set(PX, yP, 0);
    const F = forcaDe(s);
    mostrador.userData.atualizar(`${F.toFixed(1)}`, rompeu && t < T.res ? forcaDe(FC) : F, rompeu && t < T.res ? FC : s);

    // cacos
    cacos.forEach((k) => {
      const u = t - C1;
      k.m.visible = u > 0 && t < T.res + 1;
      if (!k.m.visible) return;
      const tt = Math.min(u, 1.2);
      const rr = 0.05 + k.v * tt;
      const x = Math.cos(k.a) * rr, z = Math.sin(k.a) * rr;
      const chao = Math.abs(x) < 0.35 && Math.abs(z) < 0.27 ? 0.53 : 0.02;
      k.m.position.set(PX + x, Math.max(chao, k.y0 + k.vy * tt - 4.9 * tt * tt), z);
      k.m.rotation.set(tt * k.spin, tt * k.spin * 0.7, 0);
    });

    // painéis
    grafico.visible = t >= T.ens;
    if (grafico.visible) grafico.userData.atualizar(`${s.toFixed(2)}|${rompeu}|${t > T.leit}`, rompeu ? FC : s, t > T.leit);
    tabela.visible = t >= T.ens + 2;
    const nTab = t < T.res ? (rompeu ? 1 : 0) : 1 + Math.floor(win(t, T.res, T.res + 6) * 5.01);
    if (tabela.visible) tabela.userData.atualizar(String(nTab), nTab === 1 ? 1 : nTab, nTab);

    // laboratorista
    let px = M.x, pz = -0.62, ry = 0, anda = false;
    if (t >= T.cura + 1.5 && t < T.ret + 8) { const c = posCP(t); px = c.x; anda = (t < T.cura + 5) || (t >= T.ret && t < T.ret + 3); }
    if (t >= T.cura + 5 && t < T.ret) { px = TK.x - 0.1; }
    if (t >= T.ret + 8) {
      const u = ease(win(t, T.ret + 8, T.ens + 3));
      px = lerp(RX, 1.3, u); pz = lerp(-0.62, -0.8, u); anda = u > 0 && u < 1; ry = u >= 1 ? -0.5 : 0;
    }
    lab.group.position.set(px, 0, pz); lab.group.rotation.y = ry;
    anda ? andar(lab, t * 7) : parar(lab);
    if (golpe >= 0) { lab.bracoD.rotation.x = -2.0 + Math.abs(Math.sin(golpe * Math.PI)) * 0.4; lab.bracoE.rotation.x = -0.6; }
    else if ((t >= T.cura + 1.5 && t < T.cura + 5) || (t >= T.ret && t < T.ret + 3) || (t >= T.ret + 8 && t < T.ens + 1)) { lab.bracoD.rotation.x = lab.bracoE.rotation.x = -1.3; }
    else if (t >= T.ens + 3 && t < T.res) { lab.bracoD.rotation.x = -0.9; lab.bracoE.rotation.x = 0; }

    // legenda ao vivo
    if (t < T.cura) {
      if (golpe >= 0) return `Camada ${t < 9 ? 1 : 2} de 2 · golpe ${Math.min(12, Math.floor(golpe) + 1)} de 12`;
      return 'Molde cilíndrico 10 × 20 cm · concreto da viga (C25)';
    }
    if (t < T.ret) return t < T.cura + 5 ? 'Desmoldagem após 24 h' : `Cura úmida a 23 °C · dia ${Math.max(1, Math.ceil(win(t, T.cura + 5, T.ret) * 28))} de 28`;
    if (t < T.ens) return 'Retificação das faces · planas e paralelas';
    if (t < C0) return 'Centralizando o cilindro entre os pratos';
    if (t < C1) return `F = ${fmt(F, 1)} kN · σ = ${fmt(s, 1)} MPa · ${fmt(CP.taxa, 2)} MPa/s (animação ${fmt(ACEL, 1)}× mais rápida)`;
    if (t < T.res) return `Ruptura: F = ${fmt(forcaDe(FC), 1)} kN ÷ ${fmt(areaCP() * 1e4, 2)} cm² → fc = ${fmt(FC, 1)} MPa`;
    if (t < T.leit) return `${EST.n} exemplares · fcm ${fmt(EST.fcm, 1)} · s ${fmt(EST.sd, 2)} · fck,est ${fmt(EST.fckEst, 1)} MPa`;
    return `fc ${fmt(FC, 1)} MPa · pico ≈ 2‰ · E ≈ ${fmt(ESEC / 1000, 1)} GPa`;
  }

  return o;
}
