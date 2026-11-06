// Obra A1 — Viga biapoiada de concreto armado, em corte longitudinal.
// Tudo é função do relógio da sequência (t). Números de EXEMPLO, não são de projeto.
import * as THREE from 'three';
import { MAT } from '../config.js';
import { box, cyl, at, mat, pessoa, andar, parar, painel, caixaArred, win, ease, clamp, lerp, rng } from '../core/kit.js';
import { VIGA, resumo, momento, cortante, flecha, tensoes, fmt } from '../calc/viga.js';

const R = resumo();
const L = VIGA.L, H = VIGA.h, B = VIGA.b;
const YB = 3.0, YT = YB + H, XE = L / 2 + 0.1;  // fundo, topo, ponta da viga
const ZC = 0;                                    // plano do corte (eixo da viga)
const AMP = 40;                                  // exagero da deformada
const VIS = 1.5;                                 // exagero do diâmetro das barras (só visual)
const G_PP = 25 * B * H;                         // peso próprio (kN/m)

// Linha do tempo (s)
const T = { apoio: 0, forma: 12, arm: 28, conc: 48, cura: 66, carga: 80, leitura: 104, FIM: 124 };
const CARGA0 = 82, CARGA1 = 100;
const qDe = (t) => t < T.cura + 10 ? 0 : t < CARGA0 ? G_PP : lerp(G_PP, VIGA.qServ, ease(win(t, CARGA0, CARGA1)));
// instante em que q atinge a carga de fissuração (para o texto concordar com a animação)
function tempoDe(q) { let a = CARGA0, b = CARGA1; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; (qDe(m) < q ? (a = m) : (b = m)); } return a; }
const T_FISS = tempoDe(R.qr);

export const STEPS = [
  { t: 'Os apoios', d: `Uma viga biapoiada vence um vão apoiada só nas duas pontas. Aqui o vão teórico é de ${fmt(R.L, 2)} m e a seção tem ${R.b} × ${R.h} cm. Os pilares já estão prontos; no cálculo, um apoio segura a viga na vertical e na horizontal e o outro deixa a ponta girar e deslizar um pouco, por isso a viga não fica "engastada" nos pilares.` },
  { t: 'Fôrma e escoramento', d: 'O carpinteiro monta as escoras metálicas a cada 0,80 m e, sobre elas, o fundo e as laterais da fôrma de compensado. Enquanto o concreto não endurece, é a fôrma que carrega todo o peso. A lateral da frente aparece transparente porque estamos olhando a viga em corte.' },
  { t: 'Armadura', d: `O momento fletor puxa a parte de baixo da viga, e o concreto resiste mal à tração. Por isso as barras principais ficam embaixo: ${R.nL} φ${R.phiL} mm somam ${fmt(R.AsEf, 2)} cm², acima dos ${fmt(R.AsNec, 2)} cm² que o cálculo pede. Os estribos seguram o cisalhamento e ficam mais juntos perto dos apoios, onde a força cortante é maior. Os espaçadores garantem 3 cm de cobrimento, a capa de concreto que protege o aço da corrosão.` },
  { t: 'Concretagem e adensamento', d: 'O caminhão-betoneira entrega o concreto C25 e a bomba-lança o lança dentro da fôrma, de uma ponta à outra. Logo atrás, o operador mergulha o vibrador para tirar o ar preso e fazer o concreto envolver bem as barras. Sem vibração ficam vazios (bicheiras) e a aderência com o aço se perde.' },
  { t: 'Cura e desforma', d: `Durante a cura o concreto precisa ficar úmido para a reação do cimento continuar e ele ganhar resistência sem fissurar por retração. Depois a fôrma lateral sai, e só então as escoras são retiradas. A viga passa a carregar o próprio peso, ${fmt(G_PP, 1)} kN/m, e flete ${fmt(flecha(G_PP), 1)} mm no meio.` },
  { t: 'Carregamento', d: `A sobrecarga cresce até a carga total de serviço de ${R.q} kN/m. O diagrama de cortante é uma reta (máximo de ${R.V} kN nos apoios) e o de momento é uma parábola (máximo de ${R.M} kN·m no meio). Quando o momento passa de Mr = ${fmt(R.Mr, 1)} kN·m, com q ≈ ${fmt(R.qr, 1)} kN/m, o concreto tracionado embaixo fissura e o aço assume a tração. A partir daí a viga fica mais flexível e a flecha cresce mais rápido.` },
  { t: 'Leitura do resultado', d: `As fissuras ficam no trecho central, onde o momento é maior, e sobem até perto da linha neutra (x ≈ ${fmt(R.xII, 1)} cm do topo). Fissuras finas como essas são esperadas no concreto armado. A flecha imediata é de ${fmt(R.flecha, 1)} mm, abaixo do limite L/250 = ${fmt(R.limite, 0)} mm. O aço trabalha a ${fmt(tensoes(R.q).ss, 0)} MPa, bem abaixo do escoamento de 435 MPa.` },
];
export const STARTS = [T.apoio, T.forma, T.arm, T.conc, T.cura, T.carga, T.leitura];

export function criarViga(motor, origem) {
  const root = new THREE.Group(); root.name = 'obra-viga';
  root.position.set(...origem); root.visible = false;
  motor.scene.add(root);
  const OX = origem[0];

  // ---------- deformada ----------
  const wn = (x) => { const s = clamp((x + L / 2) / L); return (16 / 5) * s * (1 - 2 * s * s + s * s * s); };
  const dobraveis = [];   // malhas com vértices deformados
  const seguidores = [];  // objetos que só sobem/descem com a deformada {o, x, y}
  const dobrar = (m) => { dobraveis.push({ m, base: m.geometry.attributes.position.array.slice() }); return m; };
  let deflAtual = -1;
  function aplicarDeformada(d) {
    if (Math.abs(d - deflAtual) < 1e-5) return;
    deflAtual = d;
    for (const { m, base } of dobraveis) {
      const p = m.geometry.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) p[i + 1] = base[i + 1] - wn(base[i]) * d;
      m.geometry.attributes.position.needsUpdate = true;
      m.geometry.computeBoundingSphere();
    }
    for (const s of seguidores) s.o.position.y = s.y - wn(s.x) * d;
  }

  // ---------- pilares e apoios ----------
  [-L / 2, L / 2].forEach((x) => {
    root.add(at(box(0.25, YB - 0.02, 0.25, MAT.pilar), x, (YB - 0.02) / 2, 0));
    root.add(at(box(0.25, 0.02, 0.22, 0x2e3236), x, YB - 0.01, 0));
  });

  // ---------- fôrma e escoras ----------
  const escoras = [];
  for (let x = -2.4; x <= 2.41; x += 0.8) {
    const g = new THREE.Group(); g.position.set(x, 0, 0);
    g.add(at(box(0.07, YB - 0.06, 0.07, MAT.escora), 0, (YB - 0.06) / 2, 0));
    g.add(at(box(0.1, 0.04, 0.5, MAT.madeira), 0, YB - 0.045, 0));
    g.add(at(box(0.3, 0.02, 0.3, MAT.metal), 0, 0.01, 0));
    root.add(g); escoras.push(g);
  }
  const formaFundo = at(box(6.4, 0.025, 0.36, MAT.compensado), 0, YB - 0.0125, 0);
  const formaTras = at(box(6.4, 0.6, 0.025, MAT.compensado), 0, YB + 0.27, -B / 2 - 0.0125);
  const formaFrente = at(box(6.4, 0.6, 0.025, MAT.compensado, { op: 0.18, sombra: false }), 0, YB + 0.27, B / 2 + 0.0125);
  const sarrafos = new THREE.Group();
  for (let x = -3; x <= 3.01; x += 0.6) sarrafos.add(at(box(0.05, 0.62, 0.05, MAT.madeira), x, YB + 0.27, -B / 2 - 0.05));
  root.add(formaFundo, formaTras, formaFrente, sarrafos);

  // ---------- armadura ----------
  const cob = VIGA.cob, fe = VIGA.phiE, fl = VIGA.phiL;
  const zBar = B / 2 - cob - fe - fl / 2;
  const yInf = YB + cob + fe + fl / 2, ySup = YT - cob - fe - 0.004;
  const barraGeo = (r, y, z) => {
    const g = new THREE.CylinderGeometry(r, r, L + 0.1, 8, 62); g.rotateZ(Math.PI / 2); g.translate(0, y, z); return g;
  };
  const acoMat = mat(MAT.aco, { r: 0.55, m: 0.2 });
  const barrasInf = [zBar, zBar / 3, -zBar / 3, -zBar].map((z) => {
    const m = dobrar(new THREE.Mesh(barraGeo(fl / 2 * VIS, yInf, z), acoMat)); m.castShadow = true; root.add(m); return m;
  });
  const barrasSup = [zBar, -zBar].map((z) => {
    const m = dobrar(new THREE.Mesh(barraGeo(0.004 * VIS, ySup, z), acoMat)); root.add(m); return m;
  });
  // estribos: c/10 perto dos apoios, c/20 no meio
  const xsEstribo = [];
  for (let x = -L / 2 + 0.05; x <= L / 2 - 0.049; x += Math.abs(x) > 1.8 ? 0.1 : 0.2) xsEstribo.push(+x.toFixed(3));
  const estMat = mat(MAT.estribo, { r: 0.55, m: 0.2 });
  const ew = B - 2 * cob, eh = H - 2 * cob, et = fe * VIS;
  const estribos = xsEstribo.map((x) => {
    const g = new THREE.Group();
    const add = (w, h, d, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), estMat); m.position.set(0, y, z); g.add(m); };
    add(et, eh, et, H / 2, ew / 2); add(et, eh, et, H / 2, -ew / 2);
    add(et, et, ew, cob, 0); add(et, et, ew, H - cob, 0);
    g.position.set(x, YB, 0); root.add(g);
    seguidores.push({ o: g, x, y: YB });
    return g;
  });
  const espacadores = [-2.2, -0.8, 0.8, 2.2].map((x) => {
    const m = cyl(0.018, 0.018, 0.03, 0xf0efe8, 8); m.position.set(x, YB + 0.015, zBar); root.add(m);
    seguidores.push({ o: m, x, y: YB + 0.015 }); return m;
  });

  // ---------- concreto (metade de trás, face do corte com textura) ----------
  const CW = 1488, CH = 120, PXM = CW / (L + 0.2);
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, flatShading: true });
  const ladoMat = new THREE.MeshStandardMaterial({ color: MAT.concreto, roughness: 0.95, flatShading: true });
  const pourPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  [faceMat, ladoMat].forEach((m) => { m.clippingPlanes = [pourPlane]; });
  const concGeo = new THREE.BoxGeometry(L + 0.2, H, B / 2, 62, 1, 1); concGeo.translate(0, YB + H / 2, -B / 4 + ZC / 2);
  const concreto = dobrar(new THREE.Mesh(concGeo, [ladoMat, ladoMat, ladoMat, ladoMat, faceMat, ladoMat]));
  concreto.castShadow = true; concreto.receiveShadow = true; root.add(concreto);

  // agregados e fissuras (determinísticos)
  const r1 = rng(7), grãos = Array.from({ length: 900 }, () => [r1() * CW, r1() * CH, 1 + r1() * 3, r1()]);
  const r2 = rng(31);
  const fissuras = xsEstribo.filter((x, i) => Math.abs(x) < 2.7 && i % 2 === 0).map((x) => ({
    x: x + (r2() - 0.5) * 0.06, j: r2() * 0.18, pts: Array.from({ length: 9 }, () => (r2() - 0.5) * 7),
  }));
  function desenharFace(t, q) {
    const fresco = 1 - win(t, T.conc + 6, T.cura + 6);
    const base = fresco > 0.5 ? '#8f8e88' : '#b9b8b1';
    cx.fillStyle = base; cx.fillRect(0, 0, CW, CH);
    for (const [x, y, r, k] of grãos) { cx.fillStyle = k > 0.5 ? 'rgba(80,78,72,0.35)' : 'rgba(235,233,225,0.35)'; cx.fillRect(x, y, r, r); }
    const T2 = tensoes(Math.max(q, 0.01));
    let n = 0;
    if (q > 0) {
      cx.strokeStyle = '#2a2a2a'; cx.lineCap = 'round';
      for (const f of fissuras) {
        const M = momento(q, f.x + L / 2), lim = R.Mr * (1 + f.j);
        if (M < lim) continue;
        n++;
        const hmax = (H - R.xII / 100) * PXM;
        const hc = hmax * clamp(0.3 + 0.7 * (M / lim - 1) / 1.1);
        const px = (f.x + L / 2 + 0.1) * PXM;
        cx.lineWidth = 2 + 1.5 * clamp((M / lim - 1) / 1.5);
        cx.beginPath(); cx.moveTo(px, CH);
        f.pts.forEach((dx, i) => cx.lineTo(px + dx * (i / 8), CH - hc * (i + 1) / f.pts.length));
        cx.stroke();
      }
    }
    // linha neutra na leitura
    if (t > T.leitura && T2.estadio === 'II') {
      cx.setLineDash([14, 10]); cx.strokeStyle = 'rgba(40,90,170,0.9)'; cx.lineWidth = 3;
      const y = T2.x * PXM; cx.beginPath(); cx.moveTo(0.9 * PXM, y); cx.lineTo(CW - 0.9 * PXM, y); cx.stroke(); cx.setLineDash([]);
    }
    tex.needsUpdate = true;
    return n;
  }

  // manta de cura
  const manta = at(box(6.3, 0.03, 0.24, 0x5c6e7a, { r: 1 }), 0, YT + 0.02, 0);
  root.add(manta);

  // ---------- andaime ----------
  const andaime = new THREE.Group();
  andaime.add(at(box(7.0, 0.06, 0.7, MAT.madeira), 0, 2.3, 1.0));
  for (let x = -3.3; x <= 3.31; x += 1.65) [0.68, 1.32].forEach((z) => andaime.add(at(box(0.05, 2.3, 0.05, MAT.metal), x, 1.15, z)));
  andaime.add(at(box(7.0, 0.04, 0.04, MAT.metal), 0, 3.3, 1.32));
  root.add(andaime);

  // ---------- pessoas ----------
  const eng = pessoa(MAT.azul); eng.group.position.set(-4.6, 0, 2.6); root.add(eng.group);
  const prancheta = at(box(0.25, 0.32, 0.02, 0xeeeeea), 0.1, -0.35, 0.18); eng.bracoD.add(prancheta); eng.bracoD.rotation.x = -0.9;
  const carp = pessoa(MAT.laranja, MAT.pele2); root.add(carp.group);
  const arm = pessoa(MAT.verde); root.add(arm.group);
  const vib = pessoa(MAT.laranja); root.add(vib.group);
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), mat(0x30363c)); root.add(haste);

  // ---------- caminhão-betoneira e bomba ----------
  const caminhao = new THREE.Group();
  caminhao.add(at(box(6, 0.5, 2.2, 0x3a3f45), 0, 0.85, 0));
  caminhao.add(at(box(1.8, 1.9, 2.2, 0xe8e6df), -2.2, 1.95, 0));
  caminhao.add(at(box(0.1, 0.8, 1.8, MAT.vidro), -3.12, 2.3, 0));
  const tambor = new THREE.Group(); tambor.position.set(1.0, 2.4, 0); caminhao.add(tambor);
  const tg = new THREE.CylinderGeometry(1.0, 0.7, 3.4, 10); tg.rotateZ(Math.PI / 2 - 0.12);
  tambor.add(new THREE.Mesh(tg, mat(0xd86a2a)));
  for (let i = 0; i < 3; i++) { const fx = box(0.08, 0.1, 2.05, 0x9c3f12); fx.position.set(-1 + i, 0.92, 0); fx.rotation.x = i; tambor.add(fx); }
  [-2.2, 0.6, 2.0].forEach((x) => [-1.1, 1.1].forEach((z) => { const r = cyl(0.5, 0.5, 0.35, 0x1f2326, 10); r.rotation.x = Math.PI / 2; r.position.set(x, 0.5, z); caminhao.add(r); }));
  caminhao.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  root.add(caminhao);
  const lanca = [0, 1, 2].map(() => { const m = box(0.22, 0.22, 1, 0x4a5560); root.add(m); return m; });
  const mangote = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 8), mat(0x202326)); root.add(mangote);
  const ligar = (m, a, b) => {
    const d = new THREE.Vector3().subVectors(b, a);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.scale.set(1, 1, d.length());
    m.lookAt(root.localToWorld(b.clone()));
  };

  // ---------- cargas ----------
  const blocos = [];
  for (let k = 0; k < 2; k++) for (let i = 0; i < 12; i++) {
    const x = -L / 2 + 0.25 + i * 0.5;
    const m = box(0.42, 0.2, 0.18, MAT.bloco); m.position.set(x, YT + 0.1 + k * 0.21, -0.01); root.add(m);
    blocos.push({ m, x, y: YT + 0.1 + k * 0.21 });
  }
  blocos.forEach((b) => seguidores.push({ o: b.m, x: b.x, y: b.y }));
  const ordemBlocos = blocos.map((b, i) => i).sort((a, b) => (a % 12 === b % 12 ? a - b : Math.abs(blocos[a].x) - Math.abs(blocos[b].x)) || a - b);

  // ---------- painéis: diagramas, seção, cota ----------
  const DW = 7.4, DH = 2.7, DPX = 200;
  const diag = painel(DW, DH, DW * DPX, DH * DPX, desenharDiagramas);
  diag.position.set(0, YT + 2.15, -0.9); root.add(diag);
  const secao = painel(2.0, 2.6, 400, 520, desenharSecao);
  secao.position.set(-4.95, YB + 0.45, 0.2); root.add(secao);
  const cota = painel(6.4, 0.34, 1280, 68, (c, w, h) => {
    c.strokeStyle = '#1f2a33'; c.fillStyle = '#1f2a33'; c.lineWidth = 3;
    const x0 = 0.2 * 200, x1 = 6.2 * 200, y = 20;
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.moveTo(x0, 4); c.lineTo(x0, 36); c.moveTo(x1, 4); c.lineTo(x1, 36); c.stroke();
    caixaArred(c, w / 2 - 210, 26, 420, 40, 8, 'rgba(244,245,246,0.92)');
    c.fillStyle = '#1f2a33'; c.font = '600 30px "Barlow", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(`vão teórico L = ${fmt(L, 2)} m`, w / 2, 47);
  });
  cota.userData.atualizar('cota'); cota.position.set(0, YB - 0.4, 0.3); root.add(cota);

  function desenharDiagramas(c, w, h, q) {
    caixaArred(c, 0, 0, w, h, 22, 'rgba(20,24,30,0.74)');
    const X = (x) => (x + DW / 2) * DPX;   // x da viga → px (alinhado com a viga)
    const f = '"Barlow", Arial, sans-serif';
    // cortante
    const y0V = 150, kV = 100 / 60;
    c.fillStyle = '#cfd6dc'; c.font = `600 30px ${f}`; c.textAlign = 'left'; c.fillText('Cortante V (kN)', 24, 44);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(X(-3), y0V); c.lineTo(X(3), y0V); c.stroke();
    c.beginPath(); c.moveTo(X(-3), y0V);
    for (let i = 0; i <= 60; i++) { const x = -3 + i * 0.1; c.lineTo(X(x), y0V - cortante(q, x + 3) * kV); }
    c.lineTo(X(3), y0V); c.closePath(); c.fillStyle = 'rgba(102,170,230,0.45)'; c.fill(); c.strokeStyle = '#7cc0f5'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#e9f3fb'; c.font = `700 28px ${f}`; c.textAlign = 'left';
    if (q > 0.5) {
      c.fillText(`+${fmt(q * 3, 1)}`, X(-3) + 10, y0V - q * 3 * kV * 0.45 + 10);
      c.textAlign = 'right'; c.fillText(`−${fmt(q * 3, 1)}`, X(3) - 10, y0V + q * 3 * kV * 0.45 + 10);
    }
    // momento (desenhado do lado tracionado, para baixo)
    const y0M = 300, kM = 200 / 90;
    c.fillStyle = '#cfd6dc'; c.font = `600 30px ${f}`; c.textAlign = 'left'; c.fillText('Momento fletor M (kN·m)', 24, y0M - 30);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(X(-3), y0M); c.lineTo(X(3), y0M); c.stroke();
    c.beginPath(); c.moveTo(X(-3), y0M);
    for (let i = 0; i <= 60; i++) { const x = -3 + i * 0.1; c.lineTo(X(x), y0M + momento(q, x + 3) * kM); }
    c.lineTo(X(3), y0M); c.closePath(); c.fillStyle = 'rgba(232,132,72,0.45)'; c.fill(); c.strokeStyle = '#f29a5c'; c.lineWidth = 3; c.stroke();
    // Mr
    c.setLineDash([12, 9]); c.strokeStyle = '#f4d35e'; c.lineWidth = 2.5;
    const yMr = y0M + R.Mr * kM; c.beginPath(); c.moveTo(X(-3), yMr); c.lineTo(X(3), yMr); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#f4d35e'; c.font = `600 24px ${f}`; c.textAlign = 'left'; c.fillText(`Mr = ${fmt(R.Mr, 1)}`, X(3) + 12, yMr + 8);
    const Mq = q * L * L / 8;
    c.fillStyle = '#fff1e6'; c.font = `700 30px ${f}`; c.textAlign = 'center';
    c.fillText(`${fmt(Mq, 1)}`, X(0), Math.min(h - 14, y0M + Mq * kM + 32));
    c.fillStyle = '#cfd6dc'; c.font = `600 26px ${f}`; c.textAlign = 'right'; c.fillText(`q = ${fmt(q, 1)} kN/m`, w - 24, 44);
  }

  function desenharSecao(c, w, h, q, t) {
    caixaArred(c, 0, 0, w, h, 18, 'rgba(20,24,30,0.78)');
    const f = '"Barlow", Arial, sans-serif';
    c.fillStyle = '#cfd6dc'; c.font = `600 24px ${f}`; c.textAlign = 'left'; c.fillText('Seção no meio do vão', 18, 34);
    const s = 700, x0 = 40, y0 = 70, sw = B * s, sh = H * s;   // 1 m = 700 px
    c.fillStyle = '#b9b8b1'; c.fillRect(x0, y0, sw, sh);
    const T2 = tensoes(Math.max(q, 0.01));
    if (T2.estadio === 'II') { c.fillStyle = 'rgba(70,70,70,0.35)'; c.fillRect(x0, y0 + T2.x * s, sw, sh - T2.x * s); }
    c.fillStyle = '#8b5a3c';
    [zBar, zBar / 3, -zBar / 3, -zBar].forEach((z) => { c.beginPath(); c.arc(x0 + sw / 2 + z * s, y0 + (YT - yInf) * s, fl / 2 * s, 0, 7); c.fill(); });
    [zBar, -zBar].forEach((z) => { c.beginPath(); c.arc(x0 + sw / 2 + z * s, y0 + (YT - ySup) * s, 0.004 * s, 0, 7); c.fill(); });
    c.strokeStyle = '#a36a45'; c.lineWidth = 3; c.strokeRect(x0 + cob * s, y0 + cob * s, (B - 2 * cob) * s, (H - 2 * cob) * s);
    c.fillStyle = '#cfd6dc'; c.font = `500 20px ${f}`; c.textAlign = 'center';
    c.fillText(`${R.b} cm`, x0 + sw / 2, y0 + sh + 26);
    // diagrama de tensões
    const dx = x0 + sw + 60, ky = (v) => y0 + v * s;
    c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(dx, y0); c.lineTo(dx, y0 + sh); c.stroke();
    if (q > 0.05) {
      const k = 6;  // px por MPa
      c.fillStyle = 'rgba(92,150,230,0.6)';
      c.beginPath(); c.moveTo(dx, ky(T2.x)); c.lineTo(dx + T2.sc * k, y0); c.lineTo(dx, y0); c.fill();
      if (T2.estadio === 'I') {
        c.fillStyle = 'rgba(232,96,80,0.6)'; c.beginPath(); c.moveTo(dx, ky(T2.x)); c.lineTo(dx - T2.st * k, y0 + sh); c.lineTo(dx, y0 + sh); c.fill();
      } else {
        const ys = ky(YT - yInf), ls = clamp(T2.ss / 3, 0, 120);
        c.strokeStyle = '#e86050'; c.lineWidth = 5; c.beginPath(); c.moveTo(dx, ys); c.lineTo(dx - ls, ys); c.stroke();
        c.beginPath(); c.moveTo(dx - ls, ys); c.lineTo(dx - ls + 14, ys - 9); c.lineTo(dx - ls + 14, ys + 9); c.fillStyle = '#e86050'; c.fill();
      }
      c.setLineDash([8, 6]); c.strokeStyle = '#8fb8ef'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 - 10, ky(T2.x)); c.lineTo(w - 16, ky(T2.x)); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#e9eef2'; c.font = `600 21px ${f}`; c.textAlign = 'left';
      c.fillText(`LN x = ${fmt(T2.x * 100, 1)} cm`, dx + 8, ky(T2.x) - 8);
      c.fillText(`σc = ${fmt(T2.sc, 1)} MPa`, dx + 8, y0 + 18);
      c.fillText(T2.estadio === 'I' ? `σt = ${fmt(T2.st, 2)} MPa` : `σs = ${fmt(T2.ss, 0)} MPa`, dx + 8 - (T2.estadio === 'II' ? 0 : 0), y0 + sh + 2);
      c.fillStyle = T2.estadio === 'I' ? '#9fd39f' : '#f4d35e'; c.font = `700 22px ${f}`;
      c.fillText(T2.estadio === 'I' ? 'Estádio I · sem fissura' : 'Estádio II · fissurada', 18, h - 22);
    } else {
      c.fillStyle = '#9aa4ad'; c.font = `500 20px ${f}`; c.textAlign = 'left'; c.fillText('sem carga', dx + 8, y0 + sh / 2);
    }
  }

  // ---------- rótulos ----------
  const P = (x, y, z) => new THREE.Vector3(origem[0] + x, origem[1] + y, origem[2] + z);
  const ROT = [
    ['Apoio fixo', T.apoio + 1, T.forma - 1, () => P(-L / 2, YB - 0.4, 0.2)],
    ['Apoio móvel', T.apoio + 3, T.forma - 1, () => P(L / 2, YB - 0.4, 0.2)],
    ['Escoras a cada 0,80 m', T.forma + 1, T.forma + 8, () => P(-0.8, 1.6, 0.1)],
    ['Fôrma de compensado', T.forma + 8, T.arm - 1, () => P(1.5, YB + 0.62, -0.1)],
    [`${R.nL} φ${R.phiL} · ${fmt(R.AsEf, 2)} cm²`, T.arm + 4, T.arm + 11, () => P(0.6, yInf - 0.1, 0.1)],
    ['Estribos φ6,3 c/10 perto do apoio', T.arm + 11, T.arm + 16, () => P(-2.4, YT + 0.12, 0.1)],
    ['Estribos c/20 no meio', T.arm + 14, T.arm + 18, () => P(0.4, YT + 0.12, 0.1)],
    ['Cobrimento 3 cm', T.arm + 17, T.conc - 1, () => P(2.2, YB - 0.05, zBar)],
    ['Concreto C25', T.conc + 5, T.conc + 11, () => P(-1.5, YB + 0.25, 0)],
    ['Vibrador de imersão', T.conc + 10, T.cura - 1, () => P(vibX(curT), YT + 0.9, 1.0)],
    ['Cura úmida', T.cura + 1, T.cura + 7, () => P(0, YT + 0.1, 0)],
    ['Diagrama de esforços', T.carga + 2, T.carga + 8, () => P(-2.6, YT + 3.3, -0.9)],
    ['1ª fissura de flexão', T_FISS, T_FISS + 6, () => P(0, YB - 0.05, 0)],
    ['Seção em estádio II', T_FISS + 6, T.leitura - 1, () => P(-4.95, YB + 1.75, 0.2)],
    ['Fissuras onde M é máximo', T.leitura + 0.5, T.leitura + 7, () => P(0, YB - 0.05 - flecha(VIGA.qServ) / 1000 * AMP, 0)],
    ['Linha neutra', T.leitura + 7, T.leitura + 13, () => P(-1.2, YT - R.xII / 100 - flecha(VIGA.qServ) / 1000 * AMP * 0.9, 0)],
    [`Flecha ${fmt(R.flecha, 1)} mm < L/250`, T.leitura + 13, T.FIM, () => P(0, YB - 0.2 - flecha(VIGA.qServ) / 1000 * AMP, 0.1)],
  ].map(([texto, a, b, pos]) => ({ r: motor.rotulo(texto, 'destaque'), a, b, pos }));
  const fixo = motor.rotulo('Deformada exagerada 40×', 'discreto');

  // posições ao longo do tempo
  const pf = (t) => lerp(-XE - 0.05, XE + 0.05, win(t, T.conc + 5, T.conc + 15));
  const vibX = (t) => clamp(pf(t) - 0.7, -2.9, 2.9);
  let curT = 0;

  const state = { active: false, speed: 1, paused: false, tc: 0, hold: 0, step: 0, progress: 0, note: '', fim: T.FIM };

  function render(t) {
    curT = t;
    const q = qDe(t);
    const d = flecha(q) / 1000 * AMP;
    aplicarDeformada(d);

    // engenheiro anda até o ponto e observa
    const ue = ease(win(t, 0, 4));
    eng.group.position.set(lerp(-8, -4.4, ue), 0, 1.7); eng.group.rotation.y = ue < 1 ? Math.PI / 2 : 2.6;
    ue < 1 ? andar(eng, t * 7) : parar(eng);

    // fôrma e escoras
    escoras.forEach((g, i) => {
      const u = ease(win(t, T.forma + i * 0.6, T.forma + 1 + i * 0.6));
      const sai = ease(win(t, T.cura + 10 + i * 0.4, T.cura + 11 + i * 0.4));
      g.visible = u > 0 && sai < 1; g.scale.y = Math.max(0.001, u); g.position.z = sai * 1.5;
    });
    const uF = ease(win(t, T.forma + 5, T.forma + 7)), uT = ease(win(t, T.forma + 7, T.forma + 9)), uR = ease(win(t, T.forma + 9, T.forma + 11));
    const desf = ease(win(t, T.cura + 6, T.cura + 9)), desfFundo = ease(win(t, T.cura + 10, T.cura + 13));
    formaFundo.visible = uF > 0 && desfFundo < 1; formaFundo.position.y = YB - 0.0125 + (1 - uF) * 1.2 - desfFundo * 2.5;
    formaTras.visible = sarrafos.visible = uT > 0 && desf < 1;
    formaTras.position.z = -B / 2 - 0.0125 - desf * 0.8 - (1 - uT) * 0.8; sarrafos.position.z = formaTras.position.z + B / 2 + 0.0125;
    formaFrente.visible = uR > 0 && desf < 1; formaFrente.position.z = B / 2 + 0.0125 + (1 - uR) * 0.8 + desf * 0.8;

    // carpinteiro
    carp.group.visible = t >= T.forma && t < T.arm;
    if (carp.group.visible) {
      const u = win(t, T.forma, T.arm - 2);
      carp.group.position.set(lerp(-3, 3, u), 0, 0.85); carp.group.rotation.y = Math.PI / 2;
      u < 1 ? andar(carp, t * 6) : parar(carp);
      carp.bracoD.rotation.x = -1.6 + Math.sin(t * 5) * 0.3;
    }

    // armadura
    barrasInf.forEach((m, i) => { const u = ease(win(t, T.arm + 1 + i * 0.8, T.arm + 4 + i * 0.8)); m.visible = u > 0; m.position.x = (1 - u) * -7.5; });
    espacadores.forEach((m, i) => { m.visible = t > T.arm + 3 + i * 0.3; });
    estribos.forEach((g, i) => { const u = ease(win(t, T.arm + 6 + i * 0.22, T.arm + 7 + i * 0.22)); g.visible = u > 0; g.scale.setScalar(Math.max(0.001, u)); });
    barrasSup.forEach((m, i) => { const u = ease(win(t, T.arm + 16 + i, T.arm + 18 + i)); m.visible = u > 0; m.position.x = (1 - u) * 7.5; });
    arm.group.visible = t >= T.arm && t < T.conc;
    if (arm.group.visible) {
      const xs = estribos.length ? xsEstribo[clamp(Math.floor((t - T.arm - 6) / 0.22), 0, xsEstribo.length - 1)] : 0;
      const alvo = clamp(xs, -2.8, 2.8);
      arm.group.position.set(alvo, 2.33, 1.0); arm.group.rotation.y = Math.PI;
      arm.bracoD.rotation.x = -2.2 + Math.sin(t * 6) * 0.25; arm.bracoE.rotation.x = -1.8;
    }
    andaime.visible = t >= T.arm - 1 && t < T.cura + 9;

    // concreto
    const front = pf(t);
    concreto.visible = t >= T.conc + 5;
    pourPlane.constant = OX + front;
    const cura = win(t, T.conc + 6, T.cura + 6);
    ladoMat.color.setHex(MAT.concretoFresco).lerp(new THREE.Color(MAT.concreto), cura);
    const nFiss = concreto.visible ? desenharFaceComChave(t, q) : 0;

    // caminhão
    const chega = ease(win(t, T.conc, T.conc + 4)), sai = ease(win(t, T.conc + 16, T.cura + 2));
    caminhao.visible = chega > 0 && sai < 1;
    caminhao.position.set(lerp(18, 7.5, chega) + sai * 14, 0, 4.6);
    tambor.rotation.x = t * 2.2;
    const bombaOn = t > T.conc + 4 && t < T.conc + 16;
    lanca.forEach((m) => { m.visible = bombaOn; }); mangote.visible = bombaOn;
    if (bombaOn) {
      const base = new THREE.Vector3(caminhao.position.x - 0.8, 3.4, 4.6);
      const tip = new THREE.Vector3(clamp(front, -XE, XE), 5.2, 0.15);
      const cot = new THREE.Vector3((base.x + tip.x) / 2 + 0.8, 7.0, 2.4);
      const a1 = base.clone().lerp(cot, 0.55).add(new THREE.Vector3(0, 0.8, 0));
      ligar(lanca[0], base, a1); ligar(lanca[1], a1, cot); ligar(lanca[2], cot, tip);
      const fim = new THREE.Vector3(tip.x, YT + 0.15, 0.05);
      mangote.position.copy(tip).lerp(fim, 0.5); mangote.scale.y = tip.y - fim.y;
    }
    // vibrador
    vib.group.visible = t >= T.conc + 5 && t < T.cura;
    if (vib.group.visible) {
      const x = vibX(t);
      vib.group.position.set(x, 2.33, 1.05); vib.group.rotation.y = Math.PI;
      vib.bracoD.rotation.x = -1.2; vib.bracoE.rotation.x = -1.2;
      const mergulho = 0.15 + 0.12 * Math.sin(t * 4);
      const topo = new THREE.Vector3(x, 3.55, 0.75), ponta = new THREE.Vector3(x + 0.05, YT - mergulho, 0.04);
      haste.visible = true; haste.position.copy(topo).lerp(ponta, 0.5); haste.scale.y = topo.distanceTo(ponta);
      haste.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(topo, ponta).normalize());
    } else haste.visible = false;

    manta.visible = t >= T.cura + 0.5 && t < T.cura + 6.5;

    // cargas
    const nBl = Math.round(clamp((q - G_PP) / (VIGA.qServ - G_PP)) * blocos.length);
    blocos.forEach((b) => { b.m.visible = false; });
    for (let i = 0; i < nBl; i++) blocos[ordemBlocos[i]].m.visible = true;

    // painéis
    const mostraDiag = t >= T.cura + 10;
    diag.visible = mostraDiag; if (mostraDiag) diag.userData.atualizar(q.toFixed(2), q);
    secao.visible = t >= T.carga - 2; if (secao.visible) secao.userData.atualizar(q.toFixed(2) + (t > T.leitura), q, t);
    cota.visible = t >= T.cura + 13;

    // rótulos
    for (const R1 of ROT) { R1.r.vis = state.active && t >= R1.a && t < R1.b; if (R1.r.vis) R1.r.pos.copy(R1.pos()); }
    fixo.vis = state.active && t >= T.carga + 4; fixo.pos.copy(P(-2.0, YB - 0.95, 0.3));

    // passo e legenda
    let s = 0; while (s + 1 < STARTS.length && t >= STARTS[s + 1]) s++;
    state.step = s; state.progress = t / T.FIM;
    state.note = notaDe(t, q, nFiss);
  }
  let chaveFace = '';
  let nCache = 0;
  function desenharFaceComChave(t, q) {
    const k = `${q.toFixed(2)}|${t > T.leitura}|${t < T.cura + 7 ? Math.round(win(t, T.conc + 6, T.cura + 6) * 10) : 'c'}`;
    if (k !== chaveFace) { chaveFace = k; nCache = desenharFace(t, q); }
    return nCache;
  }

  function notaDe(t, q, n) {
    if (t < T.forma) return `Vão ${fmt(L, 2)} m · seção ${R.b} × ${R.h} cm · C25 · CA-50`;
    if (t < T.arm) return 'Escoras metálicas a cada 0,80 m · fôrma de compensado';
    if (t < T.conc) return `${R.nL} φ${R.phiL} = ${fmt(R.AsEf, 2)} cm² (precisa ${fmt(R.AsNec, 2)} cm²) · cobrimento 3 cm`;
    if (t < T.cura) return `Concretagem ${Math.round(win(t, T.conc + 5, T.conc + 15) * 100)}% · C25 · abatimento 10 ± 2 cm`;
    if (t < T.cura + 7) return `Cura úmida · dia ${Math.max(1, Math.ceil(win(t, T.cura, T.cura + 6) * 7))} de 7`;
    if (t < T.carga) return `Desforma · peso próprio ${fmt(G_PP, 1)} kN/m · flecha ${fmt(flecha(q), 1)} mm`;
    const tt = tensoes(q);
    return `q = ${fmt(q, 1)} kN/m · M = ${fmt(q * L * L / 8, 1)} kN·m · flecha ${fmt(flecha(q), 1)} mm · ${n ? n + ' fissuras' : 'sem fissuras'} · estádio ${tt.estadio}`;
  }

  function update(dt) {
    if (!state.active) return;
    if (!state.paused) {
      if (state.hold > 0) { state.hold -= dt; if (state.hold <= 0) { state.hold = 0; state.tc = 0; } }
      else { state.tc += dt * state.speed; if (state.tc >= T.FIM) { state.tc = T.FIM; state.hold = 3.5; } }
    }
    render(state.tc);
  }

  function enter() { state.active = true; state.tc = 0; state.hold = 0; state.paused = false; root.visible = true; render(0); }
  function exit() { state.active = false; root.visible = false; ROT.forEach((r) => { r.r.vis = false; }); fixo.vis = false; }

  return {
    id: 'viga', group: root, state, update, enter, exit, render,
    nome: 'Viga biapoiada', tit: 'Viga biapoiada de concreto armado', sub: 'Zona A · Concreto armado',
    steps: STEPS, starts: STARTS, fim: T.FIM, hide: 'A',
    cam: { alvo: [origem[0] + 1.1, origem[1] + 4.6, origem[2]], dist: 13.5, yaw: 0.1, pitch: 0.08 },
    mcam: { alvo: [origem[0] - 1.1, origem[1] + 0.9, origem[2]], dist: 30, yaw: 0.1, pitch: 0.05 },
  };
}
