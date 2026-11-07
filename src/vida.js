// Vida da cidade: trânsito, pedestres, operários, gruas e a logística que liga as obras
// (betoneira da central para a viga, carreta de aço, van de corpos de prova para o laboratório).
// É ambiente contínuo (não segue o relógio das obras).
import * as THREE from 'three';
import { ZONAS, LOTE, MAT, MAPA, zona } from './config.js';
import { box, cyl, at, mat, pessoa, andar, rng, clamp, lerp } from './core/kit.js';
import { NOS, ENTRADA, FAIXA, rota, naFaixa, passeio, polilinha } from './core/malha.js';

const CORES_CARRO = [0xd24b3e, 0x3b6fb6, 0xeeeeea, 0x2f3a46, 0xe0a33a, 0x5c8f63, 0x8d99a3, 0x6b4f8a];

// ---------- modelos de veículo (frente para +x) ----------
function rodas(g, xs, larg, r = 0.42) {
  xs.forEach((x) => [-1, 1].forEach((s) => { const w = cyl(r, r, 0.3, 0x1f2326, 10); w.rotation.x = Math.PI / 2; w.position.set(x, r, s * larg / 2); g.add(w); }));
}
function cabine(g, x, cor) {
  g.add(at(box(1.8, 1.9, 2.3, cor), x, 1.9, 0));
  g.add(at(box(0.08, 0.8, 2.0, 0x9fb8c8), x + 0.92, 2.3, 0));
}
const MODELOS = {
  carro(cor) {
    const g = new THREE.Group();
    g.add(at(box(4.0, 0.75, 1.75, cor), 0, 0.72, 0));
    g.add(at(box(2.1, 0.62, 1.55, 0x9fb8c8), -0.25, 1.38, 0));
    g.add(at(box(2.1, 0.08, 1.6, cor), -0.25, 1.72, 0));
    rodas(g, [-1.3, 1.3], 1.6, 0.36);
    return g;
  },
  onibus() {
    const g = new THREE.Group();
    g.add(at(box(11, 2.6, 2.5, 0x2f7d6b), 0, 1.8, 0));
    g.add(at(box(10.4, 0.8, 2.54, 0x9fb8c8), -0.2, 2.4, 0));
    g.add(at(box(0.1, 1.4, 2.2, 0x9fb8c8), 5.5, 2.2, 0));
    rodas(g, [-3.6, 3.4], 2.3, 0.5);
    return g;
  },
  betoneira() {
    const g = new THREE.Group();
    g.add(at(box(7, 0.5, 2.3, 0x3a3f45), 0, 0.9, 0));
    cabine(g, 2.6, 0xe8e6df);
    const tambor = new THREE.Group(); tambor.position.set(-0.9, 2.5, 0); g.add(tambor);
    const tg = new THREE.CylinderGeometry(1.1, 0.75, 3.8, 10); tg.rotateZ(Math.PI / 2 + 0.12);
    tambor.add(new THREE.Mesh(tg, mat(0xd86a2a)));
    for (let i = 0; i < 3; i++) { const f = box(0.1, 0.12, 2.25, 0x9c3f12); f.position.set(-1.2 + i * 1.1, 1.0, 0); f.rotation.x = i; tambor.add(f); }
    rodas(g, [-2.6, -1.2, 2.6], 2.2, 0.5);
    g.userData.tambor = tambor;
    return g;
  },
  carretaViga() {
    const g = new THREE.Group();
    g.add(at(box(15, 0.4, 2.4, 0x3a3f45), -4, 1.0, 0));
    cabine(g, 4.2, 0x6b4f8a);
    const viga = new THREE.Group(); g.add(viga);
    viga.add(at(box(16, 0.22, 0.8, 0xc9c7c0), -4.5, 1.35, 0));
    viga.add(at(box(16, 0.9, 0.22, 0xc9c7c0), -4.5, 1.9, 0));
    viga.add(at(box(16, 0.2, 0.65, 0xc9c7c0), -4.5, 2.45, 0));
    rodas(g, [-10.5, -9.3, 3.9], 2.3, 0.5);
    g.userData.carga = viga;
    return g;
  },
  carreta() {
    const g = new THREE.Group();
    g.add(at(box(9, 0.4, 2.4, 0x3a3f45), -1, 1.0, 0));
    cabine(g, 3.7, 0x3b6fb6);
    for (let k = 0; k < 3; k++) for (let i = 0; i < 8; i++) g.add(at(box(7, 0.14, 0.14, 0x8b5a3c, { sombra: i === 0 }), -1.6, 1.3 + k * 0.16, -0.7 + i * 0.2));
    [-4.5, 1.6].forEach((x) => g.add(at(box(0.12, 1.2, 2.4, 0x56677a), x, 1.7, 0)));
    rodas(g, [-4.4, -3.2, 3.6], 2.3, 0.5);
    g.userData.carga = g.children.slice(4, 28);
    return g;
  },
  van() {
    const g = new THREE.Group();
    g.add(at(box(5, 2.0, 2.0, 0xeeeeea), 0, 1.4, 0));
    g.add(at(box(0.1, 0.8, 1.8, 0x9fb8c8), 2.52, 1.9, 0));
    g.add(at(box(3.0, 0.4, 2.02, 0x3b6fb6), -0.6, 1.5, 0));
    rodas(g, [-1.6, 1.6], 1.9, 0.4);
    return g;
  },
  basculante() {
    const g = new THREE.Group();
    g.add(at(box(7, 0.5, 2.3, 0x3a3f45), 0, 0.9, 0));
    cabine(g, 2.6, 0xe0a33a);
    g.add(at(box(4.6, 1.5, 2.3, 0xb6862f), -1.1, 1.95, 0));
    g.add(at(box(4.4, 0.4, 2.1, 0x8f8a80), -1.1, 2.75, 0));
    rodas(g, [-2.6, -1.2, 2.6], 2.2, 0.5);
    return g;
  },
};
function sombra(g) { g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g; }

// ---------- grua (guindaste de torre) ----------
function grua(g, x, z, h, lanca) {
  const amarelo = 0xe0b021;
  for (let k = 0; k < h; k += 3) g.add(at(box(1.0, 3, 1.0, amarelo), x, k + 1.5, z));
  const topo = new THREE.Group(); topo.position.set(x, h, z); g.add(topo);
  topo.add(at(box(lanca, 0.7, 0.8, amarelo), lanca / 2 - 4, 0.6, 0));
  topo.add(at(box(2.5, 1.4, 1.6, 0x6f7c86), -4.5, 0.1, 0));
  topo.add(at(box(1.4, 1.2, 1.2, 0x3b6fb6), 0, -0.4, 1.0));
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 4), mat(0x2b2b2b)); topo.add(cabo);
  const carga = at(box(1.6, 0.8, 1.6, 0x8b5a3c), 0, 0, 0); topo.add(carga);
  return { topo, cabo, carga, lanca };
}

export function criarVida(motor, cidade) {
  const raiz = new THREE.Group(); raiz.name = 'vida'; motor.scene.add(raiz);
  const camada = document.getElementById('placas');
  const rnd = rng(2026);
  const eventos = [];   // { texto, alvo, t }
  let relogio = 0;
  const avisar = (texto, alvo) => { eventos.unshift({ texto, alvo, t: relogio }); if (eventos.length > 6) eventos.pop(); };

  // ---------- trânsito comum ----------
  const ids = Object.keys(NOS);
  const carros = [];
  function novoTrecho(c) {
    const p = passeio(c.rnd, c.ultimo, c.penultimo, 6);
    c.ultimo = p.ultimo; c.penultimo = p.penultimo;
    c.trecho = polilinha(naFaixa(p.seq.map((id) => NOS[id]), FAIXA, c.pista));
    c.s = 0;
  }
  for (let k = 0; k < 24; k++) {
    const onibus = k < 2;
    const g = sombra(onibus ? MODELOS.onibus() : MODELOS.carro(CORES_CARRO[k % CORES_CARRO.length]));
    raiz.add(g);
    const a = ids[Math.floor(rnd() * ids.length)];
    const c = { g, rnd: rng(100 + k), ultimo: a, penultimo: null, v: onibus ? 7 : 9 + rnd() * 5, onibus, pista: onibus || k % 2 ? 1 : 0 };
    novoTrecho(c); c.s = rnd() * c.trecho.total * 0.8;
    carros.push(c);
  }

  // ---------- logística entre as obras ----------
  // dz positivo = para o lado do rio (no norte é +z, no sul é −z)
  const ponto = (zid, dx, dz) => { const z = zona(zid); return [z.x + dx, z.z + (z.r === 0 ? dz : -dz)]; };
  const VAGA = {   // onde cada veículo estaciona dentro do lote
    A: ponto('A', 13, 17), B: ponto('B', 12, 15), I: ponto('I', 14, 21), E: ponto('E', -2, 19), H: ponto('H', 4, 8),
    C: zona('C').entrada.vaga,   // em cima da ponte em vigas
  };
  const LOG = [
    { id: 'betoneira', nome: 'Betoneira', modelo: 'betoneira', v: 8, viagens: [
      { de: 'H', para: 'A', espera: 16, ida: 'Betoneira sai da central (H) e cruza a ponte estaiada com C25 para a viga (A)', chegada: 'Betoneira descarregando concreto na viga (A)', estado: 'C25 → Viga (A)' },
      { de: 'A', para: 'H', espera: 10, ida: 'Betoneira vazia voltando à central (H)', chegada: 'Central carregando a betoneira', estado: 'voltando à central' },
    ] },
    { id: 'van', nome: 'Van do laboratório', modelo: 'van', v: 10, viagens: [
      { de: 'A', para: 'E', espera: 14, ida: 'Van leva 6 corpos de prova da viga (A) para o laboratório (E)', chegada: 'Corpos de prova da viga chegaram ao laboratório (E)', estado: 'CPs da viga → Lab (E)' },
      { de: 'E', para: 'A', espera: 18, ida: 'Van volta para a obra da viga (A)', chegada: 'Laboratorista moldando novos corpos de prova na viga (A)', estado: 'voltando à obra' },
    ] },
    { id: 'carreta', nome: 'Carreta de aço', modelo: 'carreta', v: 7, viagens: [
      { de: 'H', para: 'A', espera: 12, ida: 'Carreta leva barras CA-50 do depósito (H) para a viga (A)', chegada: 'Descarregando barras na viga (A)', estado: 'CA-50 → Viga (A)' },
      { de: 'A', para: 'E', espera: 10, ida: 'Carreta leva uma amostra das barras para ensaio (E)', chegada: 'Amostra de barra entregue ao laboratório (E)', estado: 'amostra → Lab (E)' },
      { de: 'E', para: 'B', espera: 12, ida: 'Carreta segue para buscar perfis da treliça (B)', chegada: 'Carreta na obra da treliça (B)', estado: 'rumo à treliça (B)' },
      { de: 'B', para: 'H', espera: 10, ida: 'Carreta volta ao depósito de aço (H)', chegada: 'Carreta carregando aço no depósito (H)', estado: 'voltando ao depósito' },
    ] },
    { id: 'carretaViga', nome: 'Carreta de vigas', modelo: 'carretaViga', v: 6, viagens: [
      { de: 'I', para: 'C', espera: 14, carga: true, ida: 'Carreta leva uma viga pré-moldada do pátio (I) para a ponte em vigas (C)', chegada: 'Viga pré-moldada entregue na ponte em vigas (C)', estado: 'viga → Ponte (C)' },
      { de: 'C', para: 'I', espera: 16, carga: false, ida: 'Carreta volta vazia ao pátio de pré-moldados (I)', chegada: 'Pórtico carregando a próxima viga na carreta (I)', estado: 'voltando ao pátio' },
    ] },
    { id: 'basculante', nome: 'Caminhão basculante', modelo: 'basculante', v: 8, viagens: [
      { de: 'H', para: 'I', espera: 12, ida: 'Basculante cruza a ponte estaiada levando brita para os pré-moldados (I)', chegada: 'Brita descarregada no pátio de pré-moldados (I)', estado: 'brita → Pré-moldados (I)' },
      { de: 'I', para: 'H', espera: 10, ida: 'Basculante volta à central (H)', chegada: 'Basculante carregando agregados (H)', estado: 'voltando à central' },
    ] },
  ];
  function rotaViagem(v) {
    const ea = ENTRADA[v.de], eb = ENTRADA[v.para];
    const ruas = naFaixa(rota(v.de, v.para));
    return polilinha([VAGA[v.de], ea.portao, ...ruas, eb.portao, VAGA[v.para]]);
  }
  const logistica = LOG.map((L, k) => {
    const g = sombra(MODELOS[L.modelo]()); raiz.add(g);
    const tag = etiqueta('veiculo');
    const veic = { ...L, g, tag, k: 0, fase: 'parado', s: 0, espera: 3 + k * 6, trecho: null, estado: 'na base', pos: new THREE.Vector3() };
    const [x, z] = VAGA[L.viagens[0].de]; g.position.set(x, 0.2, z);
    tag.el.onclick = () => seguir(veic);
    return veic;
  });
  function atualizarLogistica(dt) {
    for (const L of logistica) {
      const v = L.viagens[L.k];
      if (L.fase === 'parado') {
        L.espera -= dt;
        if (L.g.userData.tambor) L.g.userData.tambor.rotation.x += dt * 1.5;
        if (L.espera <= 0) {
          if (v.carga !== undefined && L.g.userData.carga?.isObject3D) L.g.userData.carga.visible = v.carga;
          L.fase = 'indo'; L.trecho = rotaViagem(v); L.s = 0; L.estado = v.estado;
          avisar(v.ida, L);
        }
      } else {
        L.s += L.v * dt;
        const p = L.trecho.em(L.s);
        L.g.position.set(p.x, 0.2, p.z);
        L.g.rotation.y = Math.atan2(-p.dz, p.dx);
        if (L.g.userData.tambor) L.g.userData.tambor.rotation.x += dt * 3;
        if (L.s >= L.trecho.total) {
          L.fase = 'parado'; L.espera = v.espera; L.estado = v.chegada.replace(/ \([A-H]\)$/, '').replace(new RegExp('^' + L.nome.split(' ')[0] + ' ', 'i'), '');
          avisar(v.chegada, L);
          ocupado[v.para] = { texto: curto(v.chegada), ate: relogio + v.espera };
          L.k = (L.k + 1) % L.viagens.length;
        }
      }
      L.pos.copy(L.g.position);
      L.g.visible = !bloqueado(L.pos.x, L.pos.z);
    }
  }
  const curto = (t) => t.replace(/ \([A-H]\)/g, '').replace(/^(Betoneira|Carreta|Van|Basculante|Central|Laboratorista|Amostra de barra|Corpos de prova da viga) /, (m) => m);
  const ocupado = {};

  // ---------- pedestres nas calçadas ----------
  const pedestres = [];
  const CAMISAS = [0xd24b3e, 0x3b6fb6, 0x5c8f63, 0xe0a33a, 0x6b4f8a, 0xeeeeea, 0x2f7d6b];
  ZONAS.forEach((z, zi) => {
    if (z.tipo === 'rio') return;
    for (let k = 0; k < 3; k++) {
      const p = pessoa(CAMISAS[(zi + k) % CAMISAS.length], k % 2 ? MAT.pele : MAT.pele2);
      p.upper.children[2].visible = false;   // sem capacete na rua
      raiz.add(p.group);
      pedestres.push({ p, z, s: rnd() * 1000, v: (0.9 + rnd() * 0.6) * (k === 1 ? -1 : 1), fase: rnd() * 6 });
    }
  });
  const HW = LOTE.w / 2 + 0.45, HD = LOTE.d / 2 + 0.45, PER = 4 * (HW + HD);
  function naCalcada(z, s) {
    s = ((s % PER) + PER) % PER;
    const lados = [[2 * HW, [-HW, -HD], [1, 0]], [2 * HD, [HW, -HD], [0, 1]], [2 * HW, [HW, HD], [-1, 0]], [2 * HD, [-HW, HD], [0, -1]]];
    for (const [l, o, d] of lados) { if (s <= l) return { x: z.x + o[0] + d[0] * s, z: z.z + o[1] + d[1] * s, dx: d[0], dz: d[1] }; s -= l; }
    return { x: z.x, z: z.z, dx: 1, dz: 0 };
  }

  // ---------- canteiros vivos (dentro das vinhetas: somem quando a obra abre) ----------
  const animados = [];
  const V = cidade.vinhetas;
  const operario = (zid, x, z, ry, tipo, cor = MAT.laranja) => {
    const p = pessoa(cor); p.group.position.set(x, 0, z); p.group.rotation.y = ry; V[zid].add(p.group);
    animados.push((t) => {
      if (tipo === 'martelar') { p.bracoD.rotation.x = -1.6 + Math.abs(Math.sin(t * 5 + x)) * 0.9; }
      else if (tipo === 'apontar') { p.bracoD.rotation.x = -1.4 + Math.sin(t * 0.8 + z) * 0.2; p.upper.rotation.y = Math.sin(t * 0.5 + x) * 0.4; }
      else if (tipo === 'andar') { const u = Math.sin(t * 0.25 + x); p.group.position.x = x + u * 4; p.group.rotation.y = Math.cos(t * 0.25 + x) > 0 ? Math.PI / 2 : -Math.PI / 2; andar(p, t * 6); }
      else if (tipo === 'carregar') { p.bracoD.rotation.x = p.bracoE.rotation.x = -1.2; const u = Math.sin(t * 0.3 + z); p.group.position.z = z + u * 3; p.group.rotation.y = Math.cos(t * 0.3 + z) > 0 ? 0 : Math.PI; andar(p, t * 6); }
    });
  };
  operario('A', -11.5, -12, -0.6, 'martelar'); operario('A', 10, -9, 2.6, 'apontar', MAT.azul); operario('A', -14, 15, 1.2, 'martelar', MAT.verde); operario('A', 0, 12, 0, 'andar', MAT.verde);
  operario('B', -2, -9, 0.2, 'apontar', MAT.azul); operario('B', 4, 12, 0, 'andar'); operario('B', 13, -0.5, -1.4, 'martelar');
  operario('C', -6, -11, 0.3, 'apontar', MAT.azul); operario('C', 12, 18, 0, 'andar');
  operario('D', 2, 0, 0.4, 'apontar', MAT.azul); operario('D', 16, 14, 0, 'carregar', MAT.verde);
  operario('E', 4, -1.5, 0, 'andar', 0xeeeeea); operario('E', 9.4, 8.6, -0.8, 'apontar', 0xeeeeea);
  operario('F', -8.5, -1, 0.5, 'martelar'); operario('F', 8.6, 9, 1.4, 'apontar', MAT.azul);
  operario('G', 0, -6.6, 0, 'andar'); operario('G', 5, 12, 0.6, 'martelar', MAT.verde);
  operario('H', 2, -6, 0, 'carregar', MAT.verde); operario('H', -6, 9, 0.3, 'apontar', MAT.azul);

  // gruas
  const gruas = [grua(V.A, 18, -2, 18, 22), grua(V.D, 16, -14, 42, 26)];
  animados.push((t) => gruas.forEach((G, i) => {
    G.topo.rotation.y = Math.sin(t * 0.12 + i * 2) * 1.6;
    const raio = G.lanca * (0.45 + 0.25 * Math.sin(t * 0.2 + i)), desce = 6 + 4 * Math.sin(t * 0.3 + i);
    G.carga.position.set(raio - 4, -desce, 0); G.cabo.position.set(raio - 4, -desce / 2 + 0.3, 0); G.cabo.scale.y = desce - 0.4;
  }));
  // pátio de pré-moldados (zona C): pórtico rolante corre nos trilhos e o carro iça a viga
  const port = V.I.userData.portico, carroP = V.I.userData.carroPortico;
  const balsa = V.C.userData.balsa;
  animados.push((t) => {
    port.position.x = Math.sin(t * 0.09) * 14; carroP.position.z = -7 + Math.sin(t * 0.21) * 8;
    balsa.position.y = MAPA.rio.agua + Math.sin(t * 1.1) * 0.06; balsa.rotation.z = Math.sin(t * 0.8) * 0.01;
  });
  // barcos no rio, passando por baixo das pontes
  [[-1, 5, 3.2, 0xd24b3e], [1, -5, 2.6, 0x2f7d6b], [1, 5, 2.2, 0xe0a33a]].forEach(([sent, z, v, cor], i) => {
    const b = new THREE.Group();
    b.add(at(box(9, 1.1, 3.2, cor), 0, 0.55, 0));
    b.add(at(box(3, 1.4, 2.4, 0xeeeeea), -2, 1.8, 0));
    b.add(at(box(2.2, 0.5, 2.6, 0x8b5a3c), 2.2, 1.3, 0));
    sombra(b); raiz.add(b);
    animados.push((t) => {
      const L = 680, x = ((t * v + i * 230) % L) - L / 2;
      b.position.set(sent * x, MAPA.rio.agua - 0.35 + Math.sin(t * 1.3 + i) * 0.05, z);
      b.rotation.y = sent > 0 ? 0 : Math.PI;
    });
  });
  // pedestres atravessando a passarela em arco
  for (let k = 0; k < 5; k++) {
    const p = pessoa(CAMISAS[k % CAMISAS.length], k % 2 ? MAT.pele : MAT.pele2); p.upper.children[2].visible = false; raiz.add(p.group);
    animados.push((t) => {
      const u = ((t * 0.035 + k * 0.21) % 1), ida = k % 2 === 0, w = MAPA.rio.meia + 3;
      const z = ida ? lerp(-w, w, u) : lerp(w, -w, u);
      p.group.position.set(MAPA.passarela + (ida ? 0.8 : -0.8), 0.35, z); p.group.rotation.y = ida ? 0 : Math.PI; andar(p, t * 6.5 + k, 0.45);
    });
  }
  // elevadores nos prédios (zona D)
  [[-9, -6, 12], [9, 8, 8]].forEach(([x, z, n], i) => {
    const cab = at(box(1.1, 2.4, 0.3, 0xe0a33a, { e: 0.25 }), x, 1.4, z + 1.3); V.D.add(cab);
    animados.push((t) => { cab.position.y = 1.4 + (0.5 - 0.5 * Math.cos(t * 0.22 + i * 2)) * (n - 1) * 3.2; });
  });
  // misturador e esteira da central (zona H) e prensa do laboratório (zona E)
  const pas = at(box(3.5, 0.2, 0.4, 0x2b2b2b), 4, 7.8, -11.4); V.H.add(pas);
  const pistao = at(cyl(0.18, 0.18, 0.5, 0x9aa4ad, 10), 8, 2.95, 8); V.E.add(pistao);
  animados.push((t) => { pas.rotation.z = t * 2; pistao.position.y = 2.95 - Math.max(0, Math.sin(t * 0.7)) * 0.4; });

  // ---------- etiquetas clicáveis (placas de zona, veículos, obras) ----------
  function etiqueta(classe) {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'placa ' + classe; el.hidden = true;
    camada.appendChild(el);
    return { el, pos: new THREE.Vector3(), vis: true };
  }
  const placas = ZONAS.map((z) => {
    const e = etiqueta('zona'); e.pos.set(z.x, 11, z.z - 6);
    e.el.innerHTML = `<b>${z.id}</b><span class="nm"></span><span class="at"></span>`;
    e.el.querySelector('.nm').textContent = z.nome;
    e.zona = z; return e;
  });
  const ATIV = {
    A: 'viga, pilar, laje e sapata em execução', B: 'montagem da treliça e do pórtico', C: 'estaiada, vigas e arco · balsa de inspeção', I: 'vigas sendo protendidas · pórtico rolante',
    D: 'grua içando · elevadores rodando', E: 'ensaios do dia', F: 'escoramento e reparo', G: 'telhado e alvenaria', H: 'abastecendo as obras',
  };
  const botoesObra = [];
  function botaoObra(id, texto, x, y, z) {
    const e = etiqueta('obra'); e.pos.set(x, y, z); e.el.textContent = '▶ ' + texto; e.obra = id; botoesObra.push(e); return e;
  }
  const A = zona('A'), E = zona('E');
  botaoObra('viga', 'Viga biapoiada', A.x, 5.2, A.z + 4);
  botaoObra('compressao', 'Compressão do CP', E.x + 8, 5.0, E.z + 8);
  botaoObra('tracao', 'Tração do aço', E.x - 2, 6.2, E.z - 8);
  const I = zona('I');
  botaoObra('protensao', 'Protensão da viga', I.x, 4.5, I.z - 2);
  botaoObra('icamento', 'Içamento na ponte', MAPA.pontes[1], 5, -2);

  // ---------- seguir um veículo ----------
  let seguindo = null;
  function seguir(v) {
    seguindo = v;
    motor.voar({ alvo: [v.pos.x, 2, v.pos.z], dist: 38, yaw: 0.5, pitch: 0.55, dur: 1.2 });
    ouvintesSeguir.forEach((f) => f(v));
  }
  const ouvintesSeguir = [];
  function pararSeguir() { if (seguindo) { seguindo = null; ouvintesSeguir.forEach((f) => f(null)); } }
  motor.controls.addEventListener('start', pararSeguir);
  const delta = new THREE.Vector3();

  let emObra = false, bloqueio = null;
  const bloqueado = (x, z) => !!bloqueio && x > bloqueio[0] && x < bloqueio[1] && z > bloqueio[2] && z < bloqueio[3];
  const v3 = new THREE.Vector3();
  function projetar() {
    const w = motor.renderer.domElement.clientWidth, h = motor.renderer.domElement.clientHeight;
    const dCam = motor.camera.position.distanceTo(motor.controls.target);
    const mostrar = (e, cond) => {
      if (!cond) { if (!e.el.hidden) e.el.hidden = true; return; }
      v3.copy(e.pos).project(motor.camera);
      const fora = v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05;
      e.el.hidden = fora;
      if (!fora) e.el.style.transform = `translate(${((v3.x + 1) / 2 * w).toFixed(1)}px, ${((1 - v3.y) / 2 * h).toFixed(1)}px)`;
    };
    for (const p of placas) {
      const oc = ocupado[p.zona.id];
      const txt = oc && oc.ate > relogio ? oc.texto : ATIV[p.zona.id];
      const at = p.el.querySelector('.at'); if (at.textContent !== txt) { at.textContent = txt; p.el.classList.toggle('ativa', !!(oc && oc.ate > relogio)); }
      mostrar(p, !emObra && dCam > 45);
    }
    for (const L of logistica) {
      if (L.tag.el.textContent !== `${L.nome} · ${L.estado}`) L.tag.el.textContent = `${L.nome} · ${L.estado}`;
      L.tag.pos.set(L.pos.x, 5.5, L.pos.z);
      L.tag.el.classList.toggle('seguindo', seguindo === L);
      mostrar(L.tag, !emObra);
    }
    for (const b of botoesObra) mostrar(b, !emObra && dCam < 150);
  }

  function update(dt) {
    relogio += dt;
    // trânsito
    for (const c of carros) {
      c.s += c.v * dt;
      if (c.s >= c.trecho.total) novoTrecho(c);
      const p = c.trecho.em(c.s);
      c.g.position.set(p.x, 0.08, p.z);
      c.g.rotation.y = Math.atan2(-p.dz, p.dx);
      c.g.visible = !bloqueado(p.x, p.z);
    }
    atualizarLogistica(dt);
    for (const q of pedestres) {
      q.s += q.v * dt;
      const p = naCalcada(q.z, q.s);
      q.p.group.position.set(p.x, 0.14, p.z);
      q.p.group.rotation.y = Math.atan2(p.dx * Math.sign(q.v), p.dz * Math.sign(q.v));
      andar(q.p, relogio * 6.5 + q.fase, 0.45);
    }
    for (const f of animados) f(relogio);
    if (seguindo) {
      delta.set(seguindo.pos.x - motor.controls.target.x, 0, seguindo.pos.z - motor.controls.target.z).multiplyScalar(Math.min(1, dt * 3));
      motor.controls.target.add(delta); motor.camera.position.add(delta);
    }
    projetar();
  }

  // abre placas de zona para quem usa a vida (a UI liga os cliques)
  return {
    update, eventos, logistica, placas, botoesObra, seguir, pararSeguir,
    aoSeguir: (f) => ouvintesSeguir.push(f), get seguindo() { return seguindo; },
    set emObra(v) { emObra = v; if (v) pararSeguir(); },
    set bloqueio(b) { bloqueio = b; }, get relogio() { return relogio; },
  };
}
