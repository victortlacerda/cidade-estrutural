// Obra C3 — Ponte estaiada da avenida em balanço sucessivo: estacas, mastro, aduelas, estais, fechamento.
// Vista lateral com o leito do rio em corte. Tudo é função do tempo t. Números de EXEMPLO, não são de projeto.
import * as THREE from 'three';
import { MAT, MAPA } from '../config.js';
import { box, cyl, at, mat, pessoa, andar, parar, painel, caixaArred, win, ease, clamp, lerp } from '../core/kit.js';
import { criarObra } from '../core/obra.js';
import { EST, estai, resumo, desequilibrio, ancMastro, ancTab } from '../calc/estaiada.js';
import { fmt } from '../calc/viga.js';

const RS = resumo();
const R = MAPA.rio, W = EST.largura, A = EST.a, N = EST.n;
const YT = 0.06, HT = 1.4, YF = R.fundo;            // topo do tabuleiro, altura do tabuleiro, fundo do rio
const YM0 = YT - HT, YMT = YT + EST.H;               // base e topo do mastro
const T = { fund: 0, mastro: 14, disp: 30, bal: 38, fech: 82, acab: 90, leit: 100, FIM: 116 };
const PASSO = (T.fech - 2 - T.bal) / N;              // tempo por par de aduelas
const tK = (k) => T.bal + (k - 1) * PASSO;           // início do passo k (lado norte, sul, estais)

export const STEPS = [
  { t: 'Fundação no leito do rio', d: 'Uma balsa com perfuratriz crava 6 estacas escavadas até a rocha, atravessando a lama e a areia do fundo. Sobre elas é concretado o bloco de coroamento, que reparte a carga do mastro entre as estacas. O leito aparece em corte para mostrar o que fica embaixo da água.' },
  { t: 'Mastro em fôrma trepante', d: `O mastro sobe em etapas de 4 m. A fôrma trepante é concretada, espera o concreto endurecer, sobe apoiada no trecho de baixo e repete o ciclo até ${fmt(EST.H, 0)} m acima do tabuleiro. Nos últimos ${fmt(N * 1.6 + 1.5, 0)} m ficam embutidas as ancoragens dos estais.` },
  { t: 'Aduela de disparo', d: `Junto ao mastro é concretada a primeira aduela, que já nasce presa ao mastro. Sobre ela montam-se dois carros de avanço, fôrmas móveis que vão "andar" para fora a cada nova aduela de ${fmt(A, 0)} m. Cada aduela pesa ${fmt(RS.aduela, 0)} kN, e cada carro, ${fmt(EST.carro, 0)} kN.` },
  { t: 'Balanço sucessivo e estais', d: `As aduelas são concretadas alternando os lados norte e sul, e cada nova aduela recebe um par de estais. O estai é passado cordoalha por cordoalha e tensionado até segurar o peso da aduela. Quando um lado está uma aduela à frente, o mastro sofre um desequilíbrio, que chega a ${fmt(desequilibrio(N) / 1000, 1)} MN·m no último passo. Por isso nunca se avança mais de uma aduela de um lado só.` },
  { t: 'Fechamento nos encontros', d: 'As últimas aduelas chegam às margens e são ligadas aos encontros. A partir daí a ponte deixa de ser dois balanços e passa a funcionar como uma estrutura contínua. Os carros de avanço são desmontados.' },
  { t: 'Acabamento e tráfego', d: 'O tabuleiro recebe canteiro central, barreiras, pavimento e sinalização. Os estais recebem o ajuste final de força com a carga permanente. A avenida volta a ligar o norte e o sul da cidade.' },
  { t: 'Leitura do resultado', d: `O estai mais curto, quase vertical (${fmt(estai(1).ang, 0)}°), leva ${fmt(estai(1).T, 0)} kN. O mais longo, a ${fmt(estai(N).ang, 0)}°, leva ${fmt(estai(N).T, 0)} kN para segurar o mesmo peso: quanto mais deitado, maior a força e maior o empurrão horizontal. Os componentes horizontais dos dois lados se anulam no mastro e comprimem o tabuleiro com ${fmt(RS.Ntab, 0)} kN. O mastro recebe ${fmt(RS.Ntotal / 1000, 1)} MN de compressão, cerca de ${fmt(RS.sMastro, 1)} MPa.` },
];
export const STARTS = [T.fund, T.mastro, T.disp, T.bal, T.fech, T.acab, T.leit];

export function criarEstaiada(motor, origem) {
  const o = criarObra(motor, origem, {
    id: 'estaiada', nome: 'Ponte estaiada', tit: 'Ponte estaiada da avenida', sub: 'Zona C · Pontes',
    hide: 'C', steps: STEPS, starts: STARTS, fim: T.FIM,
    esconder: ['ponte-estaiada', 'ponte-estaiada-pista'],
    bloqueio: [origem[0] - 14, origem[0] + 14, -26, 26],
    cams: [[0, -10.5, 0, 30, -1.35, 0.04], [0, 15, 0, 54, -1.3, 0.12], [0, 3, 0, 24, -1.15, 0.28], [0, 14, 0, 70, -1.3, 0.12],
      [0, 2, 17, 28, -0.95, 0.25], [0, 8, 0, 64, -1.1, 0.28], [0, 14, 0, 70, -1.3, 0.12]],
    render,
  });
  const root = o.group, P = o.P;

  // ---------- leito em corte (metade de trás) e estacas ----------
  const solo = new THREE.Group(); root.add(solo);
  [[YF, YF - 3, 0x6e6455], [YF - 3, YF - 7, 0xb3a07a], [YF - 7, YF - 11, 0x7d7a73]].forEach(([y0, y1, c]) =>
    solo.add(at(box(14, y0 - y1, 40, c, { sombra: false }), 7, (y0 + y1) / 2, 0)));
  const aguaCorte = at(box(14, R.agua - YF, 36, 0x4f8fb8, { op: 0.22, sombra: false }), 7, (R.agua + YF) / 2, 0); root.add(aguaCorte);
  const estacas = [];
  [-2.4, 0, 2.4].forEach((z) => [-1.6, 1.6].forEach((x) => {
    const m = cyl(0.6, 0.6, 1, MAT.concreto, 12); root.add(m); m.userData = { x, z }; estacas.push(m);
  }));
  const YE = YF - 10.5;                                    // ponta das estacas (rocha)
  const bloco = at(box(8, 2.5, 8.4, MAT.pilar), 0, YF + 1.25, 0); root.add(bloco);
  const pilar = at(box(4.5, YM0 - (YF + 2.5), 6, MAT.pilar), 0, (YM0 + YF + 2.5) / 2, 0); root.add(pilar);
  const balsa = new THREE.Group(); root.add(balsa);
  balsa.add(at(box(8, 1.0, 6, 0x6f7c86), 0, 0.5, 0));
  balsa.add(at(box(0.6, 12, 0.6, 0xe0b021), 0, 6.5, 0));
  balsa.add(at(box(2.4, 1.6, 2, 0xe0b021), -1.6, 1.8, 0));
  const haste = cyl(0.2, 0.2, 1, 0x50585f, 8); root.add(haste);

  // ---------- mastro e fôrma trepante ----------
  const mastro = at(box(EST.mastro[0], 1, EST.mastro[1], 0xd7d5ce), 0, 0, 0); root.add(mastro);
  const topo = at(box(2.4, 1.2, 3.2, 0xb9b8b1), 0, YMT + 0.6, 0); root.add(topo);
  const trepante = new THREE.Group(); root.add(trepante);
  trepante.add(at(box(3.2, 4, 4.0, 0xe07b2a, { op: 0.75 }), 0, 0, 0));
  trepante.add(at(box(4.4, 0.15, 5.2, 0x8d99a3), 0, -2.1, 0));
  const operTrep = pessoa(MAT.laranja); operTrep.group.position.set(1.8, -2.0, 1.2); operTrep.group.rotation.y = -Math.PI / 2; trepante.add(operTrep.group);

  // ---------- aduelas ----------
  const aduelas = [];
  const novaAduela = (z) => { const m = at(box(W, HT, A, 0xc9c7c0), 0, YT - HT / 2, z); m.castShadow = true; m.receiveShadow = true; root.add(m); return m; };
  const disparo = novaAduela(0);
  for (let k = 1; k <= N; k++) aduelas.push([-1, 1].map((s) => novaAduela(s * ancTab(k))));
  const frescoC = new THREE.Color(0x8f8e88), secoC = new THREE.Color(0xc9c7c0);
  const matsAd = new Map();
  [disparo, ...aduelas.flat()].forEach((m) => { m.material = m.material.clone(); matsAd.set(m, m.material); });

  // carros de avanço (um em cada ponta)
  const carros = [-1, 1].map((s) => {
    const g = new THREE.Group(); root.add(g);
    [-W / 2 + 1, W / 2 - 1].forEach((x) => {
      g.add(at(box(0.5, 0.5, 7, 0xe0b021), x, YT + 2.6, s * 1.2));
      g.add(at(box(0.4, 2.6, 0.4, 0xe0b021), x, YT + 1.3, -s * 1.8));
      const d = box(0.3, 3.2, 0.3, 0xe0b021); d.position.set(x, YT + 1.3, s * 1.4); d.rotation.x = s * 0.6; g.add(d);
      g.add(at(box(0.15, 3.6, 0.15, 0x2b2b2b), x, YT + 0.8, s * 4.2));
    });
    g.add(at(box(W + 0.6, 0.3, 3.4, 0x8d99a3, { op: 0.8 }), 0, YT - HT - 0.35, s * 3.2));
    g.add(at(box(W, 0.4, 0.4, 0xe0b021), 0, YT + 2.6, s * 4.2));
    g.userData.s = s; return g;
  });

  // ---------- estais ----------
  const estais = [];
  const corEstai = { solto: new THREE.Color(0x8d99a3), tenso: new THREE.Color(0xf2f2ee) };
  for (let k = 1; k <= N; k++) for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 6), new THREE.MeshStandardMaterial({ color: 0x8d99a3, roughness: 0.4 }));
    m.castShadow = true; root.add(m);
    const a = new THREE.Vector3(0, YT + ancMastro(k), s * 1.2), b = new THREE.Vector3(0, YT + 0.35, s * ancTab(k));
    estais.push({ m, a, b, k, s });
  }
  const macacos = [-1, 1].map(() => { const m = at(box(0.8, 0.6, 0.8, 0xc0392b), 0, 0, 0); root.add(m); return m; });

  // ---------- acabamento ----------
  const acab = new THREE.Group(); root.add(acab);
  const L = (N + 0.5) * A * 2;
  acab.add(at(box(MAPA.av.canteiro * 2, 0.3, L, 0xb9b8b1), 0, YT + 0.15, 0));
  [-1, 1].forEach((s) => {
    acab.add(at(box(0.25, 1.1, L, 0x8d99a3), s * (MAPA.av.pista + 0.5), YT + 0.55, 0));
    acab.add(at(box(MAPA.av.pista - MAPA.av.canteiro, 0.04, L, 0x3d4247, { sombra: false }), s * (MAPA.av.canteiro + (MAPA.av.pista - MAPA.av.canteiro) / 2), YT + 0.02, 0));
    for (let z = -L / 2 + 2; z < L / 2; z += 6) acab.add(at(box(0.25, 0.01, 2.6, 0xf2f0e6, { sombra: false }), s * 4.6, YT + 0.05, z));
  });
  const carrosTr = [0xd24b3e, 0x3b6fb6, 0xeeeeea, 0xe0a33a].map((c) => {
    const g = new THREE.Group();
    g.add(at(box(1.75, 0.75, 4.0, c), 0, 0.72, 0)); g.add(at(box(1.55, 0.62, 2.1, 0x9fb8c8), 0, 1.38, -0.25));
    [-1.3, 1.3].forEach((z) => [-0.8, 0.8].forEach((x) => { const r = cyl(0.36, 0.36, 0.25, 0x1f2326, 10); r.rotation.z = Math.PI / 2; r.position.set(x, 0.36, z); g.add(r); }));
    g.traverse((m) => { if (m.isMesh) m.castShadow = true; }); root.add(g); return g;
  });

  // ---------- pessoas ----------
  const eng = pessoa(MAT.azul); eng.bracoD.add(at(box(0.25, 0.32, 0.02, 0xeeeeea), 0.1, -0.35, 0.18)); eng.bracoD.rotation.x = -0.9; root.add(eng.group);
  const opN = pessoa(MAT.laranja), opS = pessoa(MAT.verde, MAT.pele2); root.add(opN.group, opS.group);

  // ---------- painel ----------
  const f = '"Barlow", Arial, sans-serif', mono = '"JetBrains Mono", monospace';
  const pn = painel(18, 5.2, 1620, 468, (c, w, h, modo, nk, lado, frac) => {
    caixaArred(c, 0, 0, w, h, 26, 'rgba(20,24,30,0.86)');
    c.textAlign = 'left'; c.fillStyle = '#cfd6dc'; c.font = `600 36px ${f}`;
    const linhas = (lst) => lst.forEach(([a, b], i) => {
      c.fillStyle = '#9aa7b2'; c.font = `500 30px ${f}`; c.fillText(a, 36, 128 + i * 70);
      c.fillStyle = '#e9eef2'; c.font = `600 30px ${mono}`; c.fillText(b, 720, 128 + i * 70);
    });
    if (modo === 'fund') {
      c.fillText('Fundação do mastro', 36, 60);
      linhas([['estacas escavadas', '6 × φ1,2 m até a rocha'], ['bloco de coroamento', '8,0 × 8,4 × 2,5 m'],
        ['carga no topo das estacas', `${fmt(RS.Ntotal / 1000, 1)} MN (só peso)`], ['por estaca', `${fmt(RS.Ntotal / 6, 0)} kN`]]);
    } else if (modo === 'mastro') {
      c.fillText('Mastro', 36, 60);
      linhas([['altura acima do tabuleiro', `${fmt(nk, 1)} de ${fmt(EST.H, 0)} m`], ['seção', `${fmt(EST.mastro[0], 1)} × ${fmt(EST.mastro[1], 1)} m`],
        ['ciclo da fôrma trepante', '4 m por etapa'], ['ancoragens dos estais', `${N} por lado, a cada 1,6 m`]]);
    } else if (modo === 'bal' || modo === 'leit') {
      c.fillText(modo === 'bal' ? 'Força nos estais (kN) · par a par' : 'Força nos estais (kN) com carga permanente', 36, 60);
      const x0 = 70, y0 = 400, bw = 120, k0 = 0.42;
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + N * (bw + 14), y0); c.stroke();
      for (let k = 1; k <= N; k++) {
        const e = estai(k), on = modo === 'leit' ? 1 : k < nk ? 1 : k === nk ? frac : 0;
        if (on <= 0) continue;
        const bh = e.T * k0 * on, bx = x0 + (k - 1) * (bw + 14);
        c.fillStyle = k === nk && modo === 'bal' ? '#f29a5c' : '#7cc0f5'; c.fillRect(bx, y0 - bh, bw, bh);
        c.fillStyle = '#e9eef2'; c.font = `600 26px ${mono}`; c.textAlign = 'center'; c.fillText(fmt(e.T * on, 0), bx + bw / 2, y0 - bh - 12);
        c.fillStyle = '#9aa7b2'; c.font = `500 22px ${f}`; c.fillText(`E${k} · ${fmt(e.ang, 0)}°`, bx + bw / 2, y0 + 30);
        c.textAlign = 'left';
      }
      const xr = x0 + N * (bw + 14) + 40;
      c.font = `600 28px ${f}`;
      if (modo === 'bal') {
        const M = lado ? desequilibrio(nk) / 1000 : 0;
        c.fillStyle = '#9aa7b2'; c.fillText('Desequilíbrio no mastro', xr, 130);
        c.fillStyle = M ? '#f4d35e' : '#7ccc8f'; c.font = `700 40px ${mono}`; c.fillText(M ? `${fmt(M, 1)} MN·m` : 'equilibrado', xr, 190);
        c.font = `500 24px ${f}`; c.fillStyle = '#9aa7b2';
        c.fillText(M ? `aduela ${nk} só do lado ${lado}` : 'mesmo número de aduelas dos dois lados', xr, 236);
        c.fillText(`cada aduela: ${fmt(RS.aduela, 0)} kN + carro ${fmt(EST.carro, 0)} kN`, xr, 290);
      } else {
        [['compressão no mastro', `${fmt(RS.Ntotal / 1000, 1)} MN · ${fmt(RS.sMastro, 1)} MPa`], ['compressão no tabuleiro', `${fmt(RS.Ntab, 0)} kN`],
          ['cordoalhas φ15,7 no total', `${RS.cordTotal}`]].forEach(([a, b], i) => {
          c.fillStyle = '#9aa7b2'; c.font = `500 24px ${f}`; c.fillText(a, xr, 130 + i * 90);
          c.fillStyle = '#e9eef2'; c.font = `700 30px ${mono}`; c.fillText(b, xr, 166 + i * 90);
        });
      }
    } else if (modo === 'fech') {
      c.fillText('Fechamento', 36, 60);
      linhas([['vão total sobre o rio', `${fmt(L, 1)} m`], ['estais', `${N * 2} (${N} por lado)`], ['estai mais carregado', `${fmt(RS.Tmax, 0)} kN`]]);
    }
  });
  pn.rotation.y = -1.3; pn.position.set(6, 28, -14); root.add(pn);

  o.rotulos([
    ['Leito do rio em corte', 0.5, 5, () => P(0, YF - 4, -10)],
    ['Estaca escavada até a rocha', 4, 10, () => P(-1.6, YF - 6, -2.4)],
    ['Bloco de coroamento', 10, T.mastro, () => P(-4, YF + 2.6, -2)],
    ['Fôrma trepante', T.mastro + 2, T.mastro + 10, () => P(0, altMastro(curT) + 2.2, 0)],
    ['Ancoragens dos estais', T.mastro + 11, T.disp, () => P(0, YT + ancMastro(4), 1.4)],
    ['Aduela de disparo', T.disp + 1, T.disp + 4, () => P(0, YT + 0.2, 0)],
    ['Carro de avanço', T.disp + 4, T.bal + 2, () => P(0, YT + 3.0, 4.2)],
    ['Estai sendo tensionado', T.bal + 4, T.bal + 12, () => P(0, YT + 0.6, 3)],
    ['Lado norte uma aduela à frente', tK(5) + 0.2, tK(5) + PASSO / 3, () => P(0, YT + 0.4, -ancTab(5))],
    ['Ligação com o encontro', T.fech + 1, T.acab, () => P(0, YT + 0.3, 22.2)],
    ['Avenida liberada', T.acab + 6, T.leit, () => P(0, YT + 3, -8)],
    [`E${N}: ${fmt(estai(N).T, 0)} kN a ${fmt(estai(N).ang, 0)}°`, T.leit + 1, T.FIM, () => P(0, YT + 6, ancTab(N) * 0.75)],
    [`E1: ${fmt(estai(1).T, 0)} kN a ${fmt(estai(1).ang, 0)}°`, T.leit + 1, T.FIM, () => P(0, YT + 16, 2.2)],
  ]);

  let curT = 0;
  function altMastro(t) { return lerp(YM0, YMT, win(t, T.mastro + 1, T.disp - 2)); }

  function render(t) {
    curT = t;
    // leito em corte: o rio some na fundação e fica só a água sobre o corte
    const corte = o.state.active && t < T.mastro;
    ['agua', 'leito'].forEach((n) => { const ob = motor.scene.getObjectByName(n); if (ob) ob.visible = !corte; });
    aguaCorte.visible = t < T.mastro;
    // estacas e bloco
    estacas.forEach((m, i) => {
      const u = ease(win(t, 1 + i * 1.3, 2.5 + i * 1.3));
      m.visible = u > 0; const len = (YF + 0.2 - YE) * u;
      m.scale.y = Math.max(0.001, len); m.position.set(m.userData.x, YF + 0.2 - len / 2, m.userData.z);
    });
    const iEst = clamp(Math.floor((t - 1) / 1.3), 0, 5);
    balsa.visible = t < 10.5;
    balsa.position.set(-8, R.agua, estacas[iEst].userData.z);
    haste.visible = balsa.visible && t > 1;
    if (haste.visible) { const e = estacas[iEst]; const yb = Math.min(YF + 0.2 - e.scale.y, R.agua); haste.position.set(e.userData.x, (R.agua + 12 + yb) / 2, e.userData.z); haste.scale.y = R.agua + 12 - yb; }
    const ub = ease(win(t, 9, 11)); bloco.visible = ub > 0; bloco.scale.y = Math.max(0.001, ub); bloco.position.y = YF + 1.25 * ub;
    const up = ease(win(t, 11, 13.5)); pilar.visible = up > 0; pilar.scale.y = Math.max(0.001, up); pilar.position.y = YF + 2.5 + (YM0 - YF - 2.5) * up / 2;

    // mastro em etapas de 4 m
    const hTot = YMT - YM0, ciclos = Math.ceil(hTot / 4);
    const uM = win(t, T.mastro + 1, T.disp - 2) * ciclos;
    const hM = Math.min(hTot, Math.floor(uM) * 4 + ease(clamp((uM % 1) * 1.6)) * 4);
    mastro.visible = t >= T.mastro + 1; mastro.scale.y = Math.max(0.001, hM); mastro.position.y = YM0 + hM / 2;
    topo.visible = hM >= hTot - 0.01;
    trepante.visible = t >= T.mastro && t < T.disp;
    trepante.position.set(0, YM0 + Math.max(2, Math.min(hTot, Math.ceil(uM) * 4) - 2) + 0.05, 0);

    // aduelas
    const fresco = (m, t0) => matsAd.get(m).color.copy(frescoC).lerp(secoC, win(t, t0 + 1, t0 + 3));
    disparo.visible = t >= T.disp + 0.5; fresco(disparo, T.disp + 0.5);
    let nk = 0, lado = '', frac = 0;
    aduelas.forEach(([n, s], i) => {
      const k = i + 1, t0 = tK(k);
      n.visible = t >= t0; s.visible = t >= t0 + PASSO / 3;
      fresco(n, t0); fresco(s, t0 + PASSO / 3);
      if (t >= t0) { nk = k; lado = t < t0 + PASSO / 3 ? 'norte' : ''; frac = clamp((t - t0 - 2 * PASSO / 3) / (PASSO / 3 - 0.3)); }
    });
    // carros de avanço: na ponta de cada lado
    carros.forEach((g) => {
      const s = g.userData.s;
      const kLado = s < 0 ? nk : (nk > 0 && t >= tK(nk) + PASSO / 3 ? nk : nk - 1);
      g.visible = t >= T.disp + 3 && t < T.fech + 3;
      g.position.z = s * (kLado > 0 ? ancTab(kLado) + A / 2 : A / 2);
    });
    // estais: passam e tensionam junto com o par k
    estais.forEach((e) => {
      const t0 = tK(e.k) + 2 * PASSO / 3, u = ease(win(t, t0, t0 + PASSO / 6)), ten = win(t, t0 + PASSO / 6, t0 + PASSO / 3 - 0.2);
      e.m.visible = u > 0;
      const b = e.a.clone().lerp(e.b, u);
      const d = new THREE.Vector3().subVectors(b, e.a);
      e.m.position.copy(e.a).addScaledVector(d, 0.5); e.m.scale.y = Math.max(0.001, d.length());
      if (d.lengthSq() > 1e-6) e.m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      e.m.material.color.copy(corEstai.solto).lerp(corEstai.tenso, ten);
    });
    const tens = nk > 0 && t >= tK(nk) + 2 * PASSO / 3 && t < tK(nk) + PASSO - 0.2;
    macacos.forEach((m, i) => { m.visible = tens && t < T.fech; m.position.set(0, YT + 0.5, (i ? 1 : -1) * ancTab(nk)); m.scale.setScalar(1 + Math.sin(t * 12) * 0.05); });

    // acabamento e tráfego
    acab.visible = t >= T.acab;
    carrosTr.forEach((c, i) => {
      c.visible = t >= T.acab + 5;
      const u = ((t - T.acab - 5) * 0.06 + i * 0.25) % 1, ida = i % 2 === 0;
      const z = ida ? lerp(-30, 30, u) : lerp(30, -30, u);
      c.position.set((ida ? -1 : 1) * MAPA.av.faixas[i < 2 ? 1 : 0], YT, z); c.rotation.y = ida ? 0 : Math.PI;
    });

    // pessoas
    eng.group.visible = t >= T.disp;
    eng.group.position.set(-3, YT, t < T.fech ? 2.5 : 20); eng.group.rotation.y = t < T.fech ? Math.PI * 0.6 : Math.PI * 0.8;
    [opN, opS].forEach((p, i) => {
      const s = i ? 1 : -1, g = carros[i];
      p.group.visible = t >= T.bal && t < T.fech;
      p.group.position.set(2 + Math.sin(t * 0.5 + i) * 2, YT, g.position.z - s * 0.8);
      p.group.rotation.y = Math.cos(t * 0.5 + i) > 0 ? Math.PI / 2 : -Math.PI / 2; andar(p, t * 6, 0.35);
    });
    if (t < T.disp) { opN.group.visible = opS.group.visible = false; }

    // painel
    const modo = t < T.mastro ? 'fund' : t < T.disp ? 'mastro' : t < T.bal ? null : t < T.fech ? 'bal' : t < T.leit ? 'fech' : 'leit';
    pn.visible = !!modo;
    const hAcima = Math.max(0, YM0 + hM - YT);
    if (modo) pn.userData.atualizar(`${modo}|${modo === 'mastro' ? hAcima.toFixed(1) : modo === 'bal' ? `${nk}|${lado}|${frac.toFixed(2)}` : ''}`, modo, modo === 'mastro' ? hAcima : nk, lado, frac);

    if (t < T.mastro) return t < 10 ? `Estaca ${iEst + 1}/6 · φ1,2 m · até ${fmt(YF - YE, 1)} m abaixo do leito` : 'Bloco de coroamento sobre as 6 estacas';
    if (t < T.disp) return `Mastro ${fmt(hAcima, 1)} / ${fmt(EST.H, 0)} m acima do tabuleiro · fôrma trepante de 4 m`;
    if (t < T.bal) return `Aduela de disparo · carros de avanço de ${fmt(EST.carro, 0)} kN`;
    if (t < T.fech) {
      const e = estai(Math.max(1, nk));
      return lado ? `Aduela ${nk} norte · desequilíbrio ${fmt(desequilibrio(nk) / 1000, 1)} MN·m até a aduela sul`
        : frac > 0 ? `Estais E${nk} · ${fmt(e.T * frac, 0)} / ${fmt(e.T, 0)} kN · ${e.cord} cordoalhas φ15,7 · ${fmt(e.ang, 0)}°`
          : `Aduela ${nk} sul · balanço de ${fmt(ancTab(nk) + A / 2, 1)} m para cada lado`;
    }
    if (t < T.acab) return 'Fechamento nos encontros · a ponte vira uma estrutura contínua';
    if (t < T.leit) return 'Canteiro, barreiras e pavimento · avenida liberada';
    return `Estais ${fmt(estai(1).T, 0)} a ${fmt(RS.Tmax, 0)} kN · mastro ${fmt(RS.Ntotal / 1000, 1)} MN (${fmt(RS.sMastro, 1)} MPa) · tabuleiro ${fmt(RS.Ntab, 0)} kN`;
  }

  const exit0 = o.exit; o.exit = () => { ['agua', 'leito'].forEach((n) => { const ob = motor.scene.getObjectByName(n); if (ob) ob.visible = true; }); exit0(); };
  return o;
}
