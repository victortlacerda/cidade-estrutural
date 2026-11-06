// A cidade: chão, ruas, lotes, placas de zona e vinhetas (miniaturas) das obras.
import * as THREE from 'three';
import { LOTE, ZONAS, CORES, MAT } from './config.js';
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

  const chao = new THREE.Mesh(new THREE.PlaneGeometry(600, 400), chaoMat);
  chao.rotation.x = -Math.PI / 2; chao.position.y = -0.02; chao.receiveShadow = true;
  raiz.add(chao);

  // Ruas: verticais entre colunas e horizontais entre linhas, mais o anel externo
  const passoX = LOTE.w + LOTE.rua, passoZ = LOTE.d + LOTE.rua;
  const W = 4 * passoX + LOTE.rua, D = 2 * passoZ + LOTE.rua;
  for (let i = 0; i <= 4; i++) {
    const x = (i - 2) * passoX;
    const r = new THREE.Mesh(new THREE.PlaneGeometry(LOTE.rua - 3, D), ruaMat);
    r.rotation.x = -Math.PI / 2; r.position.set(x, 0, 0); r.receiveShadow = true; raiz.add(r);
    for (let k = -D / 2 + 3; k < D / 2; k += 6) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 2.6), faixaMat);
      f.rotation.x = -Math.PI / 2; f.position.set(x, 0.01, k); raiz.add(f);
    }
  }
  for (let j = 0; j <= 2; j++) {
    const z = (j - 1) * passoZ;
    const r = new THREE.Mesh(new THREE.PlaneGeometry(W, LOTE.rua - 3), ruaMat);
    r.rotation.x = -Math.PI / 2; r.position.set(0, 0.005, z); r.receiveShadow = true; raiz.add(r);
    for (let k = -W / 2 + 3; k < W / 2; k += 6) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.25), faixaMat);
      f.rotation.x = -Math.PI / 2; f.position.set(k, 0.015, z); raiz.add(f);
    }
  }

  const vinhetas = {};
  for (const zn of ZONAS) {
    const g = new THREE.Group(); g.position.set(zn.x, 0, zn.z); raiz.add(g);
    const calc = new THREE.Mesh(new THREE.BoxGeometry(LOTE.w + 1.6, 0.14, LOTE.d + 1.6), calcMat);
    calc.position.y = 0.07; calc.receiveShadow = true; g.add(calc);
    const lote = new THREE.Mesh(new THREE.BoxGeometry(LOTE.w, 0.1, LOTE.d), loteMat);
    lote.position.y = 0.15; lote.receiveShadow = true; g.add(lote);
    const pl = placa(zn.id, zn.nome); pl.position.set(-LOTE.w / 2 + 6, 0.2, LOTE.d / 2 - 2); g.add(pl);
    const vin = new THREE.Group(); vin.name = 'vin-' + zn.id; vin.position.y = 0.2; g.add(vin);
    VINHETAS[zn.id]?.(vin);
    vinhetas[zn.id] = vin;
    // árvores nos cantos
    [[-1, -1], [1, -1], [1, 1]].forEach(([sx, sz], i) => arvore(g, sx * (LOTE.w / 2 - 2.5), sz * (LOTE.d / 2 - 2.5), arvMat, 1 + (i % 2) * 0.3));
  }
  return { raiz, vinhetas };
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
  C(g) {
    // rio raso atravessando o lote
    g.add(at(box(46, 0.06, 7, C.agua, { sombra: false, r: 0.3 }), 0, 0.02, 0));
    // ponte em vigas
    [-9, -3, 3, 9].forEach((x) => g.add(at(box(0.8, 2.4, 0.8, C.pilar), x, 1.2, -14)));
    g.add(at(box(22, 0.7, 4, C.concreto), 0, 2.7, -14));
    // arco
    for (let i = 0; i < 18; i++) {
      const a = Math.PI * (i + 0.5) / 18, x = -9 * Math.cos(a), y = 6 * Math.sin(a);
      const s = box(1.7, 0.5, 2.4, C.concreto); s.position.set(x, y, 0); s.rotation.z = a - Math.PI / 2; g.add(s);
    }
    g.add(at(box(22, 0.5, 3.4, C.concreto), 0, 6.4, 0));
    // estaiada
    g.add(at(box(22, 0.5, 3.4, C.concreto), 0, 3, 14));
    g.add(at(box(0.9, 12, 0.9, C.pilar), 0, 6, 14));
    for (let i = 1; i <= 5; i++) [-1, 1].forEach((s) => {
      const x = s * i * 1.9, L = Math.hypot(x, 11.5 - 3.3);
      const c = box(0.06, L, 0.06, 0xd9d9d0); c.position.set(x / 2, (11.5 + 3.3) / 2, 14);
      c.rotation.z = Math.atan2(x, 11.5 - 3.3); g.add(c);
    });
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
