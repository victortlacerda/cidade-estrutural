// A cidade: chão, ruas, lotes, placas de zona e vinhetas (miniaturas) das obras.
import * as THREE from 'three';
import { LOTE, ZONAS, CORES, MAT, MAPA } from './config.js';
import { box, cyl, at, mat, placa, pessoa } from './core/kit.js';

export function criarCidade(motor) {
  const raiz = new THREE.Group(); raiz.name = 'cidade';
  motor.scene.add(raiz);

  const chaoMat = new THREE.MeshStandardMaterial({ color: CORES.claro.chao, roughness: 1, flatShading: true });
  const loteMat = new THREE.MeshStandardMaterial({ color: CORES.claro.lote, roughness: 1 });
  const ruaMat = new THREE.MeshStandardMaterial({ color: CORES.claro.rua, roughness: 1 });
  const faixaMat = new THREE.MeshStandardMaterial({ color: CORES.claro.faixa, roughness: 1 });
  const calcMat = new THREE.MeshStandardMaterial({ color: CORES.claro.calcada, roughness: 1 });
  const arvMat = new THREE.MeshStandardMaterial({ color: CORES.claro.arvore, roughness: 1, flatShading: true });
  motor.aoTema((t) => {
    const c = CORES[t];
    chaoMat.color.set(c.chao); loteMat.color.set(c.lote); ruaMat.color.set(c.rua);
    faixaMat.color.set(c.faixa); calcMat.color.set(c.calcada); arvMat.color.set(c.arvore);
  });

  const plano = (w, d, m, x, y, z) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; raiz.add(p); return p; };
  const R = MAPA.rio, AV = MAPA.av, LW = MAPA.ruaW - 3;
  const ZMIN = MAPA.Z[0] - 7, ZMAX = MAPA.Z[3] + 7, XMIN = MAPA.X[0] - 7, XMAX = MAPA.X[4] + 7;

  // chão das duas margens (o rio fica no meio, em canal)
  [-1, 1].forEach((s) => plano(760, 300, chaoMat, 0, -0.02, s * (R.meia + 150)));

  // rio: leito, água, cais e calçadão com guarda-corpo
  const aguaMat = new THREE.MeshStandardMaterial({ color: 0x4f8fb8, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.88 });
  motor.aoTema((t) => aguaMat.color.set(t === 'claro' ? 0x4f8fb8 : 0x24506e));
  const leito = at(box(760, 0.3, R.meia * 2, 0x6b6556, { sombra: false }), 0, R.fundo, 0); leito.name = 'leito'; raiz.add(leito);
  const agua = plano(760, R.meia * 2, aguaMat, 0, R.agua, 0); agua.name = 'agua';
  [-1, 1].forEach((s) => {
    raiz.add(at(box(760, -R.fundo + 0.1, 0.8, 0xa9a69e), 0, R.fundo / 2, s * (R.meia + 0.4)));
    plano(760, R.margem - 0.8, calcMat, 0, 0.02, s * (R.meia + 0.8 + (R.margem - 0.8) / 2));
    raiz.add(at(box(760, 0.08, 0.08, 0x56677a, { sombra: false }), 0, 1.0, s * (R.meia + 0.9)));
    for (let x = -370; x <= 370; x += 4) raiz.add(at(box(0.08, 1.0, 0.08, 0x56677a, { sombra: false }), x, 0.5, s * (R.meia + 0.9)));
  });

  // ruas horizontais (externas e marginais)
  MAPA.Z.forEach((z, j) => {
    plano(XMAX - XMIN + 14, LW, ruaMat, 0, 0.006, z);
    for (let k = XMIN; k < XMAX; k += 6) if (Math.abs(k) > AV.meia + 1) plano(2.6, 0.25, faixaMat, k, 0.016, z);
  });
  // ruas verticais comuns (sem a avenida); as que têm ponte continuam sobre o rio
  MAPA.X.forEach((x) => {
    if (x === 0) return;
    const temPonte = MAPA.pontes.includes(x);
    const trechos = temPonte ? [[ZMIN, ZMAX]] : [[ZMIN, MAPA.Z[1]], [MAPA.Z[2], ZMAX]];
    for (const [z0, z1] of trechos) {
      const meio = (z0 + z1) / 2, len = z1 - z0;
      if (!temPonte) plano(LW, len, ruaMat, x, 0.004, meio);
      else { plano(LW, MAPA.Z[1] - ZMIN, ruaMat, x, 0.004, (ZMIN + MAPA.Z[1]) / 2 - 0); plano(LW, ZMAX - MAPA.Z[2], ruaMat, x, 0.004, (ZMAX + MAPA.Z[2]) / 2); plano(LW, (MAPA.Z[2] - MAPA.Z[1]), ruaMat, x, 0.09, 0); }
      for (let k = z0; k < z1; k += 6) if (!MAPA.Z.some((zz) => Math.abs(zz - k) < 7)) plano(0.25, 2.6, faixaMat, x, Math.abs(k) < R.meia + R.margem ? 0.1 : 0.014, k);
    }
  });
  // avenida central: duas pistas de 2 faixas, canteiro com árvores, calçadas largas
  const verdeMat = new THREE.MeshStandardMaterial({ color: 0x86a36f, roughness: 1, flatShading: true });
  motor.aoTema((t) => verdeMat.color.set(t === 'claro' ? 0x86a36f : 0x415637));
  const larg = AV.pista - AV.canteiro;
  [-1, 1].forEach((s) => {
    const xc = s * (AV.canteiro + larg / 2);
    [[ZMIN, -R.meia - R.margem], [R.meia + R.margem, ZMAX]].forEach(([z0, z1]) => plano(larg, z1 - z0, ruaMat, xc, 0.008, (z0 + z1) / 2));
    plano(larg, (R.meia + R.margem) * 2, ruaMat, xc, 0.09, 0);
    plano(AV.meia - AV.pista, ZMAX - ZMIN, calcMat, s * (AV.pista + (AV.meia - AV.pista) / 2), 0.03, 0);
    for (let k = ZMIN; k < ZMAX; k += 6) if (!MAPA.Z.some((zz) => Math.abs(zz - k) < 7)) {
      const y = Math.abs(k) < R.meia + R.margem ? 0.1 : 0.018;
      plano(0.25, 2.6, faixaMat, xc, y, k);
    }
    const RB = R.meia + R.margem;   // linhas contínuas em três trechos (o do meio fica sobre a ponte)
    [AV.canteiro + 0.15, AV.pista - 0.15].forEach((xl) => [[ZMIN, -RB, 0.02], [-RB, RB, 0.1], [RB, ZMAX, 0.02]]
      .forEach(([z0, z1, y]) => plano(0.18, z1 - z0, faixaMat, s * xl, y, (z0 + z1) / 2)));
  });
  [[ZMIN, -R.meia - R.margem], [R.meia + R.margem, ZMAX]].forEach(([z0, z1]) => {
    const c = box(AV.canteiro * 2, 0.22, z1 - z0, 0xb9b8b1); c.position.set(0, 0.11, (z0 + z1) / 2); raiz.add(c);
    plano(AV.canteiro * 2 - 0.4, z1 - z0 - 0.4, verdeMat, 0, 0.225, (z0 + z1) / 2);
    for (let z = z0 + 6; z < z1 - 3; z += 12) if (!MAPA.Z.some((zz) => Math.abs(zz - z) < 8)) arvore(raiz, 0, z, arvMat, 0.8);
  });

  // pista e faixas da avenida sobre o rio num grupo próprio (a obra C3 esconde enquanto constrói)
  const pistaEst = new THREE.Group(); pistaEst.name = 'ponte-estaiada-pista'; raiz.add(pistaEst);
  raiz.children.filter((o) => o.isMesh && o.geometry.type === 'PlaneGeometry' && Math.abs(o.position.x) <= AV.pista && Math.abs(o.position.z) < R.meia + R.margem + 0.1 && o.position.y > 0.08)
    .forEach((o) => pistaEst.add(o));
  // pista e faixas sobre a ponte em vigas num grupo próprio (a obra C2 esconde enquanto constrói)
  const pistaPV = new THREE.Group(); pistaPV.name = 'ponte-vigas-pista'; raiz.add(pistaPV);
  raiz.children.filter((o) => o.isMesh && Math.abs(o.position.x - MAPA.pontes[1]) < 0.01 && Math.abs(o.position.z) < R.meia + R.margem + 0.1 && o.position.y > 0.08)
    .forEach((o) => pistaPV.add(o));
  criarPontes(raiz);
  const vinhetas = {};
  for (const zn of ZONAS) {
    const g = new THREE.Group(); g.position.set(zn.x, 0, zn.z); raiz.add(g);
    if (zn.tipo === 'rio') {   // zona sem lote: só o grupo das vinhetas, que fica no rio
      const vin = new THREE.Group(); vin.name = 'vin-' + zn.id; g.add(vin); VINHETAS[zn.id]?.(vin); vinhetas[zn.id] = vin; continue;
    }
    const calc = new THREE.Mesh(new THREE.BoxGeometry(LOTE.w + 1.6, 0.14, LOTE.d + 1.6), calcMat);
    calc.position.y = 0.07; calc.receiveShadow = true; g.add(calc);
    const lote = new THREE.Mesh(new THREE.BoxGeometry(LOTE.w, 0.1, LOTE.d), loteMat);
    lote.position.y = 0.15; lote.receiveShadow = true; g.add(lote);
    const pl = placa(zn.id, zn.nome); pl.position.set(-LOTE.w / 2 + 6, 0.2, (zn.r === 0 ? 1 : -1) * (LOTE.d / 2 - 2)); g.add(pl);
    const vin = new THREE.Group(); vin.name = 'vin-' + zn.id; vin.position.y = 0.2; g.add(vin);
    VINHETAS[zn.id]?.(vin);
    vinhetas[zn.id] = vin;
    // árvores nos cantos
    [[-1, -1], [1, -1], [1, 1]].forEach(([sx, sz], i) => arvore(g, sx * (LOTE.w / 2 - 2.5), sz * (LOTE.d / 2 - 2.5), arvMat, 1 + (i % 2) * 0.3));
  }
  return { raiz, vinhetas };
}

// ---------- as três pontes sobre o rio ----------
function criarPontes(raiz) {
  const R = MAPA.rio, C = MAT;
  const vao = (R.meia + R.margem) * 2;
  // 1) estaiada da avenida (x = 0): tabuleiro único, mastro no meio do rio, leque de estais no canteiro
  const est = new THREE.Group(); est.name = 'ponte-estaiada'; raiz.add(est);
  est.add(at(box(MAPA.av.pista * 2 + 1.2, 1.4, vao, C.concreto), 0, -0.64, 0));
  est.add(at(box(4.5, -R.fundo, 6, C.pilar), 0, R.fundo / 2, 0));
  const H = 34;
  est.add(at(box(2.0, H, 2.8, 0xd7d5ce), 0, H / 2, 0));
  est.add(at(box(2.4, 1.2, 3.2, 0xb9b8b1), 0, H + 0.6, 0));
  for (let k = 1; k <= 7; k++) [-1, 1].forEach((s) => {
    const a = new THREE.Vector3(0, H - 1.5 - k * 1.6, s * 1.2), b = new THREE.Vector3(0, 0.35, s * k * 3.0);
    const d = new THREE.Vector3().subVectors(b, a);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, d.length(), 5), mat(0xeeeeea));
    c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); est.add(c);
  });
  [-1, 1].forEach((s) => est.add(at(box(0.25, 1.1, vao, 0x8d99a3), s * (MAPA.av.pista + 0.5), 0.6, 0)));
  est.add(at(box(MAPA.av.canteiro * 2, 0.3, vao, 0xb9b8b1), 0, 0.2, 0));

  // 2) ponte em vigas protendidas (x = 66): 4 longarinas sobre 2 pilares-parede no rio
  const xv = MAPA.pontes[1];
  const pv = new THREE.Group(); pv.name = 'ponte-vigas'; raiz.add(pv);
  pv.add(at(box(12, 0.35, vao, C.concreto), xv, -0.12, 0));
  [-4.5, -1.5, 1.5, 4.5].forEach((dx) => {
    pv.add(at(box(0.3, 1.5, vao, 0xb0afa8), xv + dx, -1.05, 0));
    pv.add(at(box(0.9, 0.25, vao, 0xb0afa8), xv + dx, -1.85, 0));
  });
  [-8, 8].forEach((z) => {
    pv.add(at(box(9, -R.fundo - 2.0, 1.0, C.pilar), xv, (R.fundo - 2.0) / 2, z));
    pv.add(at(box(12.4, 0.6, 1.6, C.pilar), xv, -2.3, z));
  });
  [-1, 1].forEach((s) => pv.add(at(box(0.25, 1.0, vao, 0x8d99a3), xv + s * 5.9, 0.55, 0)));

  // 3) passarela em arco atirantado (x = 36): tabuleiro de pedestres pendurado em dois arcos
  const xa = MAPA.passarela;
  const pa = new THREE.Group(); pa.name = 'passarela-arco'; raiz.add(pa);
  pa.add(at(box(4, 0.3, vao, 0xc9c7c0), xa, 0.2, 0));
  [-1, 1].forEach((s) => pa.add(at(box(0.08, 1.0, vao, 0x56677a), xa + s * 1.9, 0.85, 0)));
  const L = 38, F = 9, N = 18;
  const arco = (z) => F * (1 - (2 * z / L) ** 2);
  [-1.9, 1.9].forEach((dx) => {
    for (let i = 0; i < N; i++) {
      const z0 = -L / 2 + i * L / N, z1 = z0 + L / N, y0 = arco(z0) + 0.35, y1 = arco(z1) + 0.35;
      const sg = box(0.35, 0.5, Math.hypot(z1 - z0, y1 - y0) + 0.05, 0xe07b2a);
      sg.position.set(xa + dx, (y0 + y1) / 2, (z0 + z1) / 2); sg.rotation.x = -Math.atan2(y1 - y0, z1 - z0); pa.add(sg);
    }
    for (let z = -L / 2 + 2.5; z < L / 2 - 1; z += 2.5) pa.add(at(box(0.05, arco(z), 0.05, 0xd9d9d0), xa + dx, 0.35 + arco(z) / 2, z));
  });
  [-6, 0, 6].forEach((z) => pa.add(at(box(3.8, 0.25, 0.25, 0xe07b2a), xa, arco(z) + 0.35, z)));
}

function arvore(g, x, z, m, s = 1) {
  const t = cyl(0.18 * s, 0.24 * s, 1.6 * s, 0x7a5c44, 6); at(t, x, 0.95 * s, z); g.add(t);
  const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4 * s, 0), m);
  c.position.set(x, 2.6 * s, z); c.castShadow = true; g.add(c);
}

// ---------- miniaturas ----------
const C = MAT;
function pilarCol(g, x, z, h, s = 0.4) { g.add(at(box(s, h, s, C.pilar), x, h / 2, z)); }

function vigaPronta(g, x, z) {
  pilarCol(g, x - 3, z, 3, 0.25); pilarCol(g, x + 3, z, 3, 0.25);
  g.add(at(box(6.4, 0.5, 0.25, C.concreto), x, 3.25, z));
}

const VINHETAS = {
  A(g) {
    vigaPronta(g, 0, 4);
    // pilar com fôrma e escoramento
    pilarCol(g, -13, -13, 2.2); g.add(at(box(0.6, 1.8, 0.6, C.compensado), -13, 3.1, -13));
    for (let i = 0; i < 4; i++) g.add(at(box(0.1, 4.5, 0.1, C.escora), -13 + (i % 2 ? 0.9 : -0.9), 2.25, -13 + (i < 2 ? 0.9 : -0.9)));
    // laje sobre quatro pilares
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => pilarCol(g, 12 + a * 3.2, -13 + b * 3.2, 3));
    g.add(at(box(8, 0.25, 8, C.concreto), 12, 3.12, -13));
    g.add(at(box(8, 0.5, 0.3, C.concreto), 12, 2.8, -16.2));
    // sapata na vala
    g.add(at(box(5, 0.05, 5, 0x9b8463, { sombra: false }), -12, 0.03, 14));
    g.add(at(box(2.4, 0.6, 2.4, C.concreto), -12, 0.3, 14));
    pilarCol(g, -12, 14, 2, 0.4);
    const p = pessoa(MAT.azul); p.group.position.set(-9.5, 0, 14.5); p.group.rotation.y = -1.2; g.add(p.group);
  },
  B(g) {
    // treliça sobre dois pilares metálicos
    const aco = 0x6f8291;
    [-6, 6].forEach((x) => g.add(at(box(0.3, 4, 0.3, aco), x, 2, -12)));
    g.add(at(box(12.4, 0.15, 0.2, aco), 0, 4.05, -12));
    for (let i = 0; i <= 8; i++) {
      const x = -6 + i * 1.5, hh = 2.2 * (1 - Math.abs(x) / 6.6);
      if (hh > 0.1) g.add(at(box(0.1, hh, 0.1, aco), x, 4.1 + hh / 2, -12));
      if (i < 8) {
        const x2 = x + 1.5, h2 = 2.2 * (1 - Math.abs(x2) / 6.6);
        const d = box(0.08, Math.hypot(1.5, h2), 0.08, aco);
        d.position.set((x + x2) / 2, 4.1 + h2 / 2, -12); d.rotation.z = Math.atan2(1.5, h2) * (x < 0 ? -1 : 1);
        g.add(d);
      }
    }
    // pórtico de galpão
    for (let k = 0; k < 4; k++) {
      const z = 6 + k * 3.2;
      [-6, 6].forEach((x) => g.add(at(box(0.35, 5, 0.35, aco), x, 2.5, z)));
      [-1, 1].forEach((s) => {
        const r = box(6.5, 0.35, 0.3, aco); r.position.set(s * 3, 5.6, z); r.rotation.z = -s * 0.2; g.add(r);
      });
    }
    // ligação parafusada (miniatura ampliada)
    g.add(at(box(0.3, 3, 0.3, aco), 14, 1.5, -2));
    g.add(at(box(2.4, 0.3, 0.3, aco), 15.2, 2.6, -2));
    g.add(at(box(0.05, 0.6, 0.5, 0x9aa7b1), 14.18, 2.6, -2));
  },
  I(g) {
    // pátio de vigas pré-moldadas protendidas (as vigas da ponte do rio saem daqui)
    const sinal = 1;   // lado do rio (+z)
    for (let k = 0; k < 3; k++) {
      const z = -14 + k * 7;
      g.add(at(box(34, 0.4, 2.2, 0xa9a69e), -2, 0.2, z));                     // pista de protensão
      [-19.5, 15.5].forEach((x) => g.add(at(box(1.2, 1.6, 2.4, 0x6f7c86), x, 0.8, z))); // cabeceiras de ancoragem
      if (k < 2) {  // viga em I pronta na pista
        g.add(at(box(30, 0.25, 0.9, 0xc9c7c0), -2, 0.55, z));
        g.add(at(box(30, 1.1, 0.22, 0xc9c7c0), -2, 1.2, z));
        g.add(at(box(30, 0.22, 0.7, 0xc9c7c0), -2, 1.86, z));
      } else {      // fôrma metálica com cordoalhas esticadas
        g.add(at(box(30, 1.6, 0.06, 0x8d99a3), -2, 1.2, z - 0.5));
        for (let c = 0; c < 6; c++) g.add(at(box(34, 0.03, 0.03, 0x2b2b2b, { sombra: false }), -2, 0.6 + (c % 3) * 0.1, z - 0.2 + Math.floor(c / 3) * 0.4));
      }
    }
    // estoque de vigas e caminhão de transporte
    for (let i = 0; i < 3; i++) g.add(at(box(30, 1.8, 0.8, 0xc9c7c0), -2, 0.9, 10 + i * 1.2));
    g.add(at(box(0.6, 0.5, 4.4, 0x5c3b22), -14, 0.25, 11.2)); g.add(at(box(0.6, 0.5, 4.4, 0x5c3b22), 10, 0.25, 11.2));
    // pórtico rolante sobre trilhos (anima em vida.js)
    [-1, 1].forEach((s) => g.add(at(box(40, 0.15, 0.3, 0x56677a), -2, 0.08, -7 + s * 11)));
    const portico = new THREE.Group(); portico.name = 'portico'; g.add(portico);
    [-1, 1].forEach((s) => {
      portico.add(at(box(0.6, 7.5, 0.6, 0xe0b021), 0, 3.75, -7 + s * 11));
      portico.add(at(box(1.6, 0.5, 1.2, 0xe0b021), 0, 0.3, -7 + s * 11));
    });
    portico.add(at(box(0.9, 1.0, 23, 0xe0b021), 0, 7.8, -7));
    const carro = new THREE.Group(); carro.name = 'carro'; portico.add(carro);
    carro.add(at(box(1.4, 0.8, 1.4, 0x40546a), 0, 7.0, 0));
    carro.add(at(box(0.05, 3.2, 0.05, 0x2b2b2b), 0, 5.0, 0));
    carro.add(at(box(0.6, 0.3, 2.4, 0x6f7c86), 0, 3.3, 0));
    g.userData.portico = portico; g.userData.carroPortico = carro;
    void sinal;
  },
  C(g) {
    // balsa com guindaste de inspeção das pontes (origem da zona: x = 33, no eixo do rio)
    const balsa = new THREE.Group(); balsa.name = 'balsa'; balsa.position.set(14, MAPA.rio.agua, 11); g.add(balsa);
    balsa.add(at(box(12, 1.0, 5, 0x6f7c86), 0, 0.2, 0));
    balsa.add(at(box(3, 2, 3, 0xeeeeea), -4, 1.7, 0));
    balsa.add(at(box(1.2, 1.2, 1.2, 0xe0b021), 2.5, 1.3, 0));
    const lanca = box(0.5, 0.5, 11, 0xe0b021); lanca.position.set(2.5, 4.6, -4.2); lanca.rotation.x = 0.68; balsa.add(lanca);
    balsa.add(at(box(0.04, 3.2, 0.04, 0x2b2b2b), 2.5, 6.2, -8.6));
    g.userData.balsa = balsa;
  },
  D(g) {
    const torre = (x, z, n, cor) => {
      for (let i = 0; i < n; i++) {
        g.add(at(box(9, 0.3, 9, C.concreto), x, 0.3 + i * 3.2 + 2.9, z));
        g.add(at(box(8.6, 2.9, 8.6, cor, { r: 0.4, op: 0.55 }), x, 1.6 + i * 3.2, z));
      }
      g.add(at(box(2.4, n * 3.2, 2.4, C.pilar), x, n * 1.6, z));
    };
    torre(-9, -6, 12, C.vidro); torre(9, 8, 8, C.vidro);
    // contraventamento em X
    [-1, 1].forEach((s) => { const d = box(0.15, 14, 0.15, 0x6f8291); d.position.set(9 + s * 0.0, 13, 3.6); d.rotation.z = s * 0.55; g.add(d); });
  },
  E(g) {
    // pavilhão do laboratório
    g.add(at(box(16, 5, 10, 0xd8d6cf), 0, 2.5, -8));
    g.add(at(box(16.6, 0.4, 10.6, 0x8b8f93), 0, 5.2, -8));
    g.add(at(box(6, 3, 0.1, C.vidro, { op: 0.6 }), 0, 1.8, -2.95));
    // prensa
    g.add(at(box(2, 0.4, 1.4, 0x40546a), 8, 0.2, 8));
    [-0.7, 0.7].forEach((x) => g.add(at(cyl(0.08, 0.08, 3, 0x8d99a3), 8 + x, 1.9, 8)));
    g.add(at(box(2, 0.5, 1.4, 0x40546a), 8, 3.4, 8));
    g.add(at(cyl(0.3, 0.3, 0.9, C.concreto, 12), 8, 0.85, 8));
    // cone de abatimento
    g.add(at(cyl(0.25, 0.5, 0.75, 0x8d99a3, 12), -8, 0.4, 9));
  },
  F(g) {
    g.add(at(box(10, 6, 8, 0xc9c2b4), -4, 3, -6));
    for (let i = 0; i < 5; i++) g.add(at(box(0.12, 5.8, 0.12, C.escora), -9.4, 2.9, -9 + i * 1.5));
    g.add(at(box(0.3, 0.3, 8, 0x2b2b2b), -9.1, 4.2, -6));
    // pilar com armadura exposta (corrosão)
    g.add(at(box(0.6, 4, 0.6, C.pilar), 10, 2, 8));
    g.add(at(box(0.62, 1.0, 0.62, 0x8a4b2c), 10, 1.0, 8));
  },
  G(g) {
    // tesoura de madeira sobre paredes
    g.add(at(box(10, 3, 0.25, C.tijolo), 0, 1.5, -10));
    g.add(at(box(10, 3, 0.25, C.tijolo), 0, 1.5, -4));
    for (let k = 0; k < 4; k++) {
      const z = -10 + k * 2;
      [-1, 1].forEach((s) => { const r = box(5.8, 0.2, 0.15, C.madeira); r.position.set(s * 2.6, 4.2, z); r.rotation.z = -s * 0.42; g.add(r); });
      g.add(at(box(10.6, 0.2, 0.15, C.madeira), 0, 3.1, z));
      g.add(at(box(0.15, 2.3, 0.15, C.madeira), 0, 4.2, z));
    }
    // parede de alvenaria estrutural em fiadas
    for (let f = 0; f < 10; f++) for (let b = 0; b < 8; b++)
      g.add(at(box(0.38, 0.19, 0.14, f % 2 ? 0xa9a69e : 0xb7b4ac, { sombra: b % 2 === 0 }), 6 + b * 0.4 + (f % 2) * 0.2, 0.1 + f * 0.2, 10));
  },
  H(g) {
    // central dosadora de concreto: silos, misturador elevado, correia, baias de agregados
    [-14, -9.5, -5].forEach((x) => {
      g.add(at(cyl(1.6, 1.6, 9, 0xd9d8d2, 14), x, 6.5, -14));
      g.add(at(cyl(1.6, 0.4, 1.6, 0xc9c8c2, 14), x, 1.2, -14));
      [-1, 1].forEach((s) => g.add(at(box(0.2, 2, 0.2, C.metal), x + s * 1.2, 1, -14)));
    });
    g.add(at(box(6, 3.5, 5, 0x6f7c86), 4, 6.2, -14));
    [-1, 1].forEach((s) => [-1, 1].forEach((k) => g.add(at(box(0.3, 4.5, 0.3, C.metal), 4 + s * 2.6, 2.25, -14 + k * 2.2))));
    const esteira = box(16, 0.4, 1.2, 0x40546a); esteira.position.set(14, 4.2, -14); esteira.rotation.z = 0.32; g.add(esteira);
    [0xb09a7a, 0x8f8a80, 0xc8b48d].forEach((c, i) => g.add(at(box(6, 1.6, 6, c), 8 + i * 6.5, 0.8, 2)));
    [-1, 1].forEach((s) => g.add(at(box(0.4, 2, 20, 0xb9b8b1), 4.6 + s * 0, 1, 2)));
    // depósito de aço: pilhas de barras e perfis
    for (let k = 0; k < 4; k++) for (let i = 0; i < 6; i++) g.add(at(box(12, 0.12, 0.12, 0x8b5a3c, { sombra: i === 0 }), -10, 0.15 + k * 0.14, 6 + i * 0.16));
    for (let k = 0; k < 3; k++) g.add(at(box(10, 0.35, 0.3, 0x6f8291), -10, 0.2 + k * 0.36, 10));
    g.add(at(box(8, 3, 6, 0xd8d6cf), -12, 1.5, 18));
    g.add(at(box(8.4, 0.3, 6.4, 0x8b8f93), -12, 3.1, 18));
  },
};
