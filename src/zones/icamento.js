// Obra C2 — Ponte em vigas protendidas: apoios, içamento das vigas do pátio I, transversinas, laje e tráfego.
// Vista lateral da ponte sobre o rio. Tudo é função do tempo t. Números de EXEMPLO, não são de projeto.
import * as THREE from 'three';
import { MAT, MAPA } from '../config.js';
import { box, cyl, at, mat, pessoa, andar, parar, painel, caixaArred, win, ease, clamp, lerp } from '../core/kit.js';
import { criarObra } from '../core/obra.js';
import { PRE, transferencia, comLaje } from '../calc/protendida.js';
import { fmt } from '../calc/viga.js';

const TR = transferencia(), CL = comLaje();
const L = PRE.L, AMP = 60;
const XS = [-4.5, -1.5, 1.5, 4.5];                 // posição das 4 longarinas (m)
const YP = -1.10, YT = YP + PRE.h, YL = YT + PRE.hLaje;   // topo do aparelho, topo da viga, topo da laje
const R = MAPA.rio;
const GUIN = new THREE.Vector3(-9.5, 0, -27);     // guindaste na marginal norte
const ESPERA = new THREE.Vector3(0, 1.45, -36);   // viga sobre a carreta (fundo da viga)
const T = { apoio: 0, chega: 10, ica: 22, trans: 58, laje: 66, pav: 82, leit: 92, FIM: 108 };
const JAN = [[T.ica, T.ica + 16], [T.ica + 16.5, T.ica + 22.5], [T.ica + 23, T.ica + 29], [T.ica + 29.5, T.ica + 35.5]];
const PESO = CL.pesoViga / 9.81, ACESS = 1.5;      // t
const raio = (bx) => Math.hypot(bx - GUIN.x, -GUIN.z);
const capacidade = (r) => 640 / r;                   // tabela de carga (exemplo) em t
const R_MAX = raio(XS[3]);

export const STEPS = [
  { t: 'Pilares e aparelhos de apoio', d: `A ponte atravessa o rio em três vãos. Os pilares-parede e os encontros já estão prontos, e os vãos laterais já têm suas vigas. Agora é a vez do vão central, de ${fmt(L, 0)} m. Sobre cada pilar vão os aparelhos de apoio de neoprene fretado: almofadas de borracha com chapas de aço que deixam a viga girar e se dilatar com a temperatura sem empurrar o pilar.` },
  { t: 'Chegada da viga', d: `A carreta traz do pátio de pré-moldados (zona I) a viga protendida, já com a contraflecha de ${fmt(TR.contraflecha, 1)} mm. O guindaste fica na marginal norte, com as patolas abertas e calçadas para distribuir o peso no pavimento. A rua fica interditada durante o içamento.` },
  { t: 'Içamento das vigas', d: `Cada viga pesa ${fmt(PESO, 1)} t, mais ${fmt(ACESS, 1)} t de cintas e moitão. No raio mais longo, de ${fmt(R_MAX, 1)} m, a tabela do guindaste permite ${fmt(capacidade(R_MAX), 1)} t, então a carga usa ${fmt((PESO + ACESS) / capacidade(R_MAX) * 100, 0)}% da capacidade. A viga sobe, o guindaste gira e ela desce devagar até apoiar nas almofadas. As outras três vêm do mesmo jeito (aqui mostradas mais rápido).` },
  { t: 'Transversinas', d: 'Vigas soltas lado a lado podem tombar e não dividem bem as cargas. As transversinas, vigas transversais nas pontas e no meio do vão, travam as longarinas e fazem com que um caminhão sobre uma delas seja dividido também com as vizinhas.' },
  { t: 'Concretagem da laje', d: `A laje de ${fmt(PRE.hLaje * 100, 0)} cm é concretada sobre pré-lajes apoiadas nas vigas. Cada viga recebe ${fmt(CL.q, 0)} kN/m e flete ${fmt(CL.flechaLaje, 1)} mm para baixo. A contraflecha da protensão, que era de ${fmt(TR.contraflecha, 1)} mm, cai para ${fmt(CL.contraflechaFinal, 1)} mm: a viga termina quase reta. Foi para isso que ela nasceu encurvada.` },
  { t: 'Pavimento e tráfego', d: 'Depois que a laje endurece, entram as barreiras laterais, o pavimento e a sinalização. A partir daqui a laje trabalha junto com as vigas (seção composta) e a ponte é liberada para os carros.' },
  { t: 'Leitura do resultado', d: `Com a laje e as perdas de protensão ao longo do tempo (adotadas em ${fmt(PRE.perdasDif * 100, 0)}%), a força cai para ${fmt(CL.Pinf, 0)} kN. No meio do vão, a base da viga ainda fica comprimida, com ${fmt(CL.base, 2)} MPa, e o topo com ${fmt(CL.top, 1)} MPa, abaixo do limite de ${fmt(CL.limCompr, 0)} MPa. A sobra de compressão embaixo é o que vai segurar a tração que os caminhões provocam.` },
];
export const STARTS = [T.apoio, T.chega, T.ica, T.trans, T.laje, T.pav, T.leit];

export function criarIcamento(motor, origem) {
  const o = criarObra(motor, origem, {
    id: 'icamento', nome: 'Içamento na ponte', tit: 'Ponte em vigas: içamento e laje', sub: 'Zona C · Pontes',
    hide: 'C', steps: STEPS, starts: STARTS, fim: T.FIM,
    esconder: ['ponte-vigas', 'ponte-vigas-pista'],
    bloqueio: [origem[0] - 9, origem[0] + 9, -45, 25],
    cams: [[0, -1.0, 7.6, 14, 0.9, 0.3], [-4, 1.5, -24, 36, 1.15, 0.32], [-3, 1.5, -12, 46, 1.25, 0.3],
      [0, -0.6, 0, 26, 1.3, 0.22], [0, -0.6, 0, 30, 1.42, 0.14], [0, 0, 0, 34, 1.15, 0.32], [0, -0.6, 0, 30, 1.42, 0.14]],
    render,
  });
  const root = o.group, P = o.P;
  const concV = mat(0xe2dccb);

  // ---------- pilares-parede, encontros, aparelhos ----------
  [-1, 1].forEach((s) => {
    root.add(at(box(9, YP - 0.55 - R.fundo, 1.0, MAT.pilar), 0, (YP - 0.55 + R.fundo) / 2, s * 8));
    root.add(at(box(12.4, 0.5, 1.6, MAT.pilar), 0, YP - 0.3, s * 8));
    root.add(at(box(12.4, YP - 0.05 - R.fundo, 1.0, MAT.pilar), 0, (YP - 0.05 + R.fundo) / 2, s * 18.1));
  });
  const neop = [];
  XS.forEach((x) => [-1, 1].forEach((s) => [7.6, 8.4, 17.8].forEach((z, i) => {
    const m = at(box(0.45, 0.05, 0.35, 0x2b2f33), x, YP - 0.025, s * z); root.add(m);
    if (i === 0) neop.push(m);
  })));

  // ---------- vigas I ao longo de z ----------
  function vigaI(Lb, segs) {
    const g = new THREE.Group(); const pecas = [];
    for (const [b, h, y0] of PRE.partes) {
      const geo = new THREE.BoxGeometry(b, h, Lb, 1, 1, segs); geo.translate(0, y0 + h / 2, 0);
      const m = new THREE.Mesh(geo, concV); m.castShadow = true; m.receiveShadow = true; g.add(m);
      pecas.push({ m, base: geo.attributes.position.array.slice() });
    }
    g.userData.curvar = (d) => {
      for (const { m, base } of pecas) {
        const p = m.geometry.attributes.position.array;
        for (let i = 0; i < p.length; i += 3) p[i + 1] = base[i + 1] + clamp(1 - (2 * base[i + 2] / Lb) ** 2) * d;
        m.geometry.attributes.position.needsUpdate = true; m.geometry.computeBoundingSphere();
      }
    };
    return g;
  }
  // vãos laterais (prontos)
  XS.forEach((x) => [-1, 1].forEach((s) => { const v = vigaI(9.2, 1); v.position.set(x, YP, s * 13.1); root.add(v); }));
  // vão central (as 4 vigas desta obra)
  const vigas = XS.map((x) => { const v = vigaI(L - 0.1, 32); root.add(v); v.userData.alvo = new THREE.Vector3(x, YP, 0); return v; });

  // ---------- transversinas, laje, pavimento, barreiras ----------
  const wn = (z) => clamp(1 - (2 * z / L) ** 2);
  const trans = [];
  [-7.4, 0, 7.4].forEach((z) => [-3, 0, 3].forEach((x) => { const m = at(box(2.85, 0.7, 0.25, 0xb9b8b1), x, YP + 0.55, z); m.userData.z = z; root.add(m); trans.push(m); }));
  const cortaLaje = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  const lajeMat = new THREE.MeshStandardMaterial({ color: 0xb9b8b1, roughness: 0.95, flatShading: true, clippingPlanes: [cortaLaje] });
  const lajeFresca = new THREE.Color(0x8f8e88), lajeSeca = new THREE.Color(0xb9b8b1);
  const lajeGeo = new THREE.BoxGeometry(12.4, PRE.hLaje, 36.4, 1, 1, 96); lajeGeo.translate(0, YT + PRE.hLaje / 2, 0);
  const laje = new THREE.Mesh(lajeGeo, lajeMat); laje.castShadow = true; laje.receiveShadow = true; root.add(laje);
  const lajeBase = lajeGeo.attributes.position.array.slice();
  const pavGeo = new THREE.BoxGeometry(11, 0.05, 36.4, 1, 1, 96); pavGeo.translate(0, YL + 0.025, 0);
  const pav = new THREE.Mesh(pavGeo, mat(0x3d4247)); pav.receiveShadow = true; root.add(pav);
  const pavBase = pavGeo.attributes.position.array.slice();
  const barreiras = [-1, 1].map((s) => { const m = at(box(0.4, 0.85, 36.4, 0xd7d5ce), s * 5.95, YL + 0.42, 0); root.add(m); return m; });
  const faixas = [];
  for (let z = -17; z < 17; z += 4) { const m = at(box(0.15, 0.01, 2, 0xf2f0e6, { sombra: false }), 0, YL + 0.06, z); m.userData.z = z; root.add(m); faixas.push(m); }
  function dobrar(geo, base, d) {
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) p[i + 1] = base[i + 1] + (Math.abs(base[i + 2]) < L / 2 ? wn(base[i + 2]) * d : 0);
    geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere();
  }

  // ---------- carreta ----------
  const carreta = new THREE.Group(); root.add(carreta);
  carreta.add(at(box(2.4, 0.4, 17, 0x3a3f45), 0, 1.0, 0));
  carreta.add(at(box(2.3, 1.9, 1.8, 0x6b4f8a), 0, 1.9, 9.6));
  carreta.add(at(box(2.0, 0.8, 0.08, MAT.vidro), 0, 2.3, 10.52));
  [-7, -5.8, 9.2].forEach((z) => [-1.1, 1.1].forEach((x) => { const r = cyl(0.5, 0.5, 0.3, 0x1f2326, 10); r.rotation.z = Math.PI / 2; r.position.set(x, 0.5, z); carreta.add(r); }));
  carreta.traverse((m) => { if (m.isMesh) m.castShadow = true; });

  // ---------- guindaste ----------
  const guin = new THREE.Group(); guin.position.copy(GUIN); root.add(guin);
  guin.add(at(box(2.8, 1.0, 12, 0xe0b021), 0, 1.0, 0));
  guin.add(at(box(2.6, 1.6, 2.2, 0xe0b021), 0, 2.0, 5.2));
  [-4.5, -3, 3, 4.5].forEach((z) => [-1.3, 1.3].forEach((x) => { const r = cyl(0.55, 0.55, 0.35, 0x1f2326, 10); r.rotation.z = Math.PI / 2; r.position.set(x, 0.55, z); guin.add(r); }));
  const patolas = [-4, 4].flatMap((z) => [-1, 1].map((s) => { const p = new THREE.Group(); p.position.set(0, 0.8, z); guin.add(p);
    p.add(at(box(3.0, 0.3, 0.35, 0x40546a), s * 1.5, 0, 0)); p.add(at(box(0.25, 0.8, 0.25, 0x40546a), s * 3.0, -0.4, 0)); p.add(at(box(0.9, 0.1, 0.9, 0x6f4f2a), s * 3.0, -0.78, 0)); p.userData.s = s; return p; }));
  const giro = new THREE.Group(); giro.position.set(0, 1.5, -1.5); guin.add(giro);
  giro.add(at(box(3, 1.4, 4.2, 0xe0b021), 0, 0.7, 0));
  giro.add(at(box(2.8, 1.2, 1.6, 0x6f7c86), 0, 0.6, -2.6));   // contrapeso
  const lanca = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 1), mat(0xe0b021)); lanca.castShadow = true; root.add(lanca);
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 4), mat(0x2b2b2b)); root.add(cabo);
  const moitao = at(box(0.6, 0.6, 0.6, 0xc0392b), 0, 0, 0); root.add(moitao);
  const balancim = at(box(0.3, 0.3, 10, 0x40546a), 0, 0, 0); root.add(balancim);
  const cintas = [-1, 1].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1, 0.08), mat(0xe07b2a)); root.add(m); return m; });
  const pivo = new THREE.Vector3(GUIN.x, 3.8, GUIN.z - 1.5);

  // ---------- pessoas ----------
  const eng = pessoa(MAT.azul); eng.bracoD.add(at(box(0.25, 0.32, 0.02, 0xeeeeea), 0.1, -0.35, 0.18)); eng.bracoD.rotation.x = -0.9; root.add(eng.group);
  const sin = pessoa(MAT.laranja); root.add(sin.group);        // sinaleiro
  const aj = pessoa(MAT.verde, MAT.pele2); root.add(aj.group);
  const carros = [0xd24b3e, 0x3b6fb6, 0xeeeeea].map((c) => {
    const g = new THREE.Group();
    g.add(at(box(1.75, 0.75, 4.0, c), 0, 0.72, 0)); g.add(at(box(1.55, 0.62, 2.1, 0x9fb8c8), 0, 1.38, -0.25));
    [-1.3, 1.3].forEach((z) => [-0.8, 0.8].forEach((x) => { const r = cyl(0.36, 0.36, 0.25, 0x1f2326, 10); r.rotation.z = Math.PI / 2; r.position.set(x, 0.36, z); g.add(r); }));
    g.traverse((m) => { if (m.isMesh) m.castShadow = true; }); root.add(g); return g;
  });

  // ---------- painel ----------
  const f = '"Barlow", Arial, sans-serif', mono = '"JetBrains Mono", monospace';
  const pn = painel(15, 4.2, 1500, 420, (c, w, h, modo, x) => {
    caixaArred(c, 0, 0, w, h, 24, 'rgba(20,24,30,0.86)');
    c.textAlign = 'left'; c.fillStyle = '#cfd6dc'; c.font = `600 34px ${f}`;
    const linhas = (lst) => lst.forEach(([a, b, cor], i) => {
      c.fillStyle = '#9aa7b2'; c.font = `500 28px ${f}`; c.fillText(a, 34, 122 + i * 62);
      c.fillStyle = cor || '#e9eef2'; c.font = `600 28px ${mono}`; c.fillText(b, 640, 122 + i * 62);
    });
    if (modo === 'apoio') {
      c.fillText('Aparelho de apoio de neoprene fretado', 34, 56);
      linhas([['por viga, em cada ponta', '1 almofada 45 × 35 cm'], ['reação de cada apoio (viga + laje)', `${fmt((CL.pesoViga + CL.q * L) / 2, 0)} kN`],
        ['deixa a viga', 'girar e dilatar'], ['vãos', `${fmt(9.2, 1)} + ${fmt(L, 0)} + ${fmt(9.2, 1)} m`]]);
    } else if (modo === 'ica') {
      c.fillText('Içamento · guindaste na marginal norte', 34, 56);
      linhas([['carga (viga + cintas e moitão)', `${fmt(PESO, 1)} + ${fmt(ACESS, 1)} = ${fmt(PESO + ACESS, 1)} t`],
        ['raio atual', `${fmt(x, 1)} m`], ['capacidade neste raio (tabela, exemplo)', `${fmt(capacidade(x), 1)} t`],
        ['uso da capacidade', `${fmt((PESO + ACESS) / capacidade(x) * 100, 0)}%`, (PESO + ACESS) / capacidade(x) < 0.75 ? '#7ccc8f' : '#e86050']]);
    } else if (modo === 'laje' || modo === 'leit') {
      c.fillText('Contraflecha no meio do vão (mm, para cima +)', 34, 56);
      const x0 = 60, y0 = 300, k = 12, bw = 300;
      const barras = [['na liberação', TR.contraflecha, '#7cc0f5'], ['peso da laje', -CL.flechaLaje * x, '#f29a5c'], ['resultado', TR.contraflecha - CL.flechaLaje * x, '#7ccc8f']];
      c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + 3 * (bw + 40), y0); c.stroke();
      barras.forEach(([nome, v, cor], i) => {
        const bx = x0 + 20 + i * (bw + 40);
        c.fillStyle = cor; c.fillRect(bx, v >= 0 ? y0 - v * k : y0, bw, Math.abs(v) * k);
        c.fillStyle = '#e9eef2'; c.font = `700 30px ${mono}`; c.fillText(`${v >= 0 ? '+' : ''}${fmt(v, 1)}`, bx + 10, v >= 0 ? y0 - v * k - 12 : y0 + Math.abs(v) * k + 34);
        c.fillStyle = '#9aa7b2'; c.font = `500 24px ${f}`; c.fillText(nome, bx + 10, 400);
      });
      if (modo === 'leit') {
        c.font = `600 24px ${f}`; c.fillStyle = '#e9eef2';
        c.fillText(`perdas ${fmt(PRE.perdasDif * 100, 0)}%: P = ${fmt(CL.Pinf, 0)} kN`, 1110, 120);
        c.fillText(`topo ${fmt(CL.top, 1)} MPa`, 1110, 170); c.fillText(`base ${fmt(CL.base, 2)} MPa`, 1110, 215);
        c.fillStyle = '#7ccc8f'; c.font = `700 24px ${f}`; c.fillText('base comprimida ✓', 1110, 270);
      }
    } else if (modo === 'trans') {
      c.fillText('Transversinas', 34, 56);
      linhas([['posições', 'pontas e meio do vão'], ['função', 'travar e repartir cargas'], ['concreto', `C${PRE.fck} moldado no local`]]);
    }
  });
  pn.rotation.y = 1.3; pn.position.set(-6.5, 7.2, 2.5); root.add(pn);

  // caminho da viga k: carreta → sobe → gira → desce
  function posViga(k, t) {
    const [a, b] = JAN[k], alvo = vigas[k].userData.alvo;
    const u = (t - a) / (b - a);
    const alto = 5.5;
    if (u <= 0) return ESPERA.clone();
    if (u < 0.25) return new THREE.Vector3(ESPERA.x, lerp(ESPERA.y, alto, ease(u / 0.25)), ESPERA.z);
    if (u < 0.7) {   // giro em torno do pivô do guindaste, interpolando raio e ângulo
      const v = ease((u - 0.25) / 0.45);
      const a0 = Math.atan2(ESPERA.x - GUIN.x, ESPERA.z - GUIN.z), a1 = Math.atan2(alvo.x - GUIN.x, alvo.z - GUIN.z);
      const r0 = Math.hypot(ESPERA.x - GUIN.x, ESPERA.z - GUIN.z), r1 = Math.hypot(alvo.x - GUIN.x, alvo.z - GUIN.z);
      const ang = lerp(a0, a1, v), r = lerp(r0, r1, v);
      return new THREE.Vector3(GUIN.x + Math.sin(ang) * r, alto, GUIN.z + Math.cos(ang) * r);
    }
    return new THREE.Vector3(alvo.x, lerp(alto, YP, ease(Math.min(1, (u - 0.7) / 0.27))), alvo.z);
  }

  o.rotulos([
    ['Pilar-parede no rio', 0.5, 4.5, () => P(0, -3.2, 8.5)],
    ['Aparelho de apoio de neoprene', 4, 10, () => P(XS[3], YP + 0.05, 7.6)],
    ['Vão lateral pronto', 2, 9, () => P(XS[3], YT + 0.2, 13)],
    ['Patolas abertas e calçadas', T.chega + 6, T.ica, () => P(GUIN.x + 3, 0.6, GUIN.z + 4)],
    ['Viga protendida com contraflecha', T.chega + 2, T.chega + 8, () => P(0, ESPERA.y + 1.6, ESPERA.z)],
    ['Balancim e cintas', T.ica + 3, T.ica + 8, () => P(ESPERA.x, 7.8, ESPERA.z)],
    ['Apoio no neoprene', T.ica + 13, T.ica + 16.5, () => P(XS[0], YP, 7.6)],
    ['Transversinas', T.trans + 2, T.laje, () => P(3, YP + 0.8, 0)],
    ['Laje de 20 cm', T.laje + 3, T.laje + 9, () => P(0, YL + 0.1, -10)],
    ['A contraflecha some com o peso da laje', T.laje + 9, T.pav, () => P(XS[3], YL + 0.3, 0)],
    ['Barreiras e pavimento', T.pav + 1, T.pav + 7, () => P(5.95, YL + 0.9, 10)],
    ['Ponte liberada', T.leit, T.leit + 6, () => P(0, YL + 2.2, 0)],
  ]);
  const fixo = motor.rotulo('Contraflecha desenhada 60× maior', 'discreto');

  function render(t) {
    // contraflecha atual (mm) e exagerada (m)
    const frenteLaje = lerp(-18.4, 18.4, win(t, T.laje + 2, T.laje + 13));
    const fl = clamp((frenteLaje + L / 2) / L);           // fração da laje sobre o vão central
    const cf = TR.contraflecha - CL.flechaLaje * fl;
    const d = cf / 1000 * AMP;

    // vigas do vão central
    vigas.forEach((v, k) => {
      const [a, b] = JAN[k];
      const espera = t < a && (k === 0 ? t >= T.chega : t >= JAN[k - 1][1]);
      v.visible = t >= a || espera;
      if (t >= b) v.position.copy(v.userData.alvo);
      else if (t >= a) v.position.copy(posViga(k, t));
      else v.position.set(ESPERA.x, ESPERA.y, carretaZ(t));
      v.userData.curvar(t >= b ? d : TR.contraflecha / 1000 * AMP);
    });
    // carreta: chega pela rua e espera
    carreta.visible = t >= T.chega && t < JAN[3][1] + 2;
    carreta.position.set(0, 0, carretaZ(t));

    // guindaste
    const pat = ease(win(t, T.chega + 3, T.chega + 6));
    patolas.forEach((p) => { p.children.forEach((m, i) => { if (i === 0) m.position.x = p.userData.s * lerp(0.6, 1.5, pat); else m.position.x = p.userData.s * lerp(1.3, 3.0, pat); }); });
    const kAt = JAN.findIndex(([a, b]) => t >= a && t < b);
    const carga = kAt >= 0 ? posViga(kAt, t) : ESPERA;
    const gancho = new THREE.Vector3(carga.x, carga.y + PRE.h + 3.4 + (kAt >= 0 ? 0 : 1.2), carga.z);
    giro.rotation.y = Math.atan2(gancho.x - GUIN.x, gancho.z - GUIN.z);
    const ponta = new THREE.Vector3(gancho.x, Math.max(gancho.y + 4, 12), gancho.z);
    lanca.position.copy(pivo).lerp(ponta, 0.5); lanca.scale.set(1, 1, pivo.distanceTo(ponta));
    lanca.lookAt(root.localToWorld(ponta.clone()));
    cabo.position.copy(ponta).lerp(gancho, 0.5); cabo.scale.y = ponta.y - gancho.y;
    moitao.position.copy(gancho);
    const comCarga = kAt >= 0 && (t - JAN[kAt][0]) / (JAN[kAt][1] - JAN[kAt][0]) < 0.97;
    balancim.visible = comCarga; cintas.forEach((c) => { c.visible = comCarga; });
    if (comCarga) {
      balancim.position.set(carga.x, carga.y + PRE.h + 2.0, carga.z);
      cintas.forEach((c, i) => { const z = carga.z + (i ? 4.5 : -4.5); c.position.set(carga.x, carga.y + PRE.h + 1.0, z); c.scale.y = 2.0; });
    }
    lanca.visible = cabo.visible = moitao.visible = t >= T.chega + 4 && t < T.trans + 2;
    guin.visible = t >= T.chega - 2 && t < T.trans + 4;

    // estrutura complementar
    trans.forEach((m, i) => { const u = ease(win(t, T.trans + 1 + i * 0.5, T.trans + 2 + i * 0.5)); m.visible = u > 0; m.scale.y = Math.max(0.001, u); m.position.y = YP + 0.55 + wn(m.userData.z) * d; });
    laje.visible = t >= T.laje + 2;
    cortaLaje.constant = origem[2] + frenteLaje;
    lajeMat.color.copy(lajeFresca).lerp(lajeSeca, win(t, T.laje + 13, T.pav));
    dobrar(lajeGeo, lajeBase, d);
    pav.visible = t >= T.pav + 2; dobrar(pavGeo, pavBase, d);
    barreiras.forEach((b) => { b.visible = t >= T.pav; });
    faixas.forEach((m) => { m.visible = t >= T.pav + 3; m.position.y = YL + 0.06 + (Math.abs(m.userData.z) < L / 2 ? wn(m.userData.z) * d : 0); });
    neop.forEach((m, i) => { m.visible = t >= 3 + i * 0.4; });

    // tráfego liberado
    carros.forEach((c, i) => {
      c.visible = t >= T.pav + 6;
      const u = ((t - T.pav - 6) * 0.07 + i * 0.33) % 1, ida = i % 2 === 0;
      const z = ida ? lerp(-25, 25, u) : lerp(25, -25, u);
      c.position.set(ida ? 2.95 : -2.95, YL + 0.05 + (Math.abs(z) < L / 2 ? wn(z) * d : 0), z); c.rotation.y = ida ? 0 : Math.PI;
    });

    // pessoas: engenheiro nos apoios, sinaleiro com o guindaste, ajudante guiando a viga
    eng.group.visible = t < T.chega + 2 || t >= T.leit;
    eng.group.position.set(t < T.chega ? 6.8 : 7.5, t < T.chega ? YP - 0.05 : YL + 0.05, t < T.chega ? 7.8 : 12); eng.group.rotation.y = t < T.chega ? -Math.PI / 2 : -2.2;
    sin.group.visible = t >= T.chega && t < T.trans;
    sin.group.position.set(-3, 0.12, -22.5); sin.group.rotation.y = Math.PI * 0.85;
    sin.bracoD.rotation.x = -2.6 + Math.sin(t * 3) * 0.2; sin.bracoE.rotation.x = -1.4;
    aj.group.visible = t >= T.trans && t < T.pav + 2;
    const ax = lerp(-4, 4, (Math.sin(t * 0.4) + 1) / 2);
    aj.group.position.set(ax, YL + (t >= T.laje ? 0.02 : -PRE.hLaje), -9 + (t >= T.laje ? frenteLaje * 0.0 : 0));
    aj.group.position.z = t >= T.laje ? Math.max(-17, frenteLaje - 1.2) : 3;
    aj.group.rotation.y = Math.cos(t * 0.4) > 0 ? Math.PI / 2 : -Math.PI / 2;
    andar(aj, t * 6, 0.35);

    // painel
    const modo = t < T.chega ? 'apoio' : t < T.trans ? 'ica' : t < T.laje ? 'trans' : t < T.leit ? 'laje' : 'leit';
    pn.visible = !(t >= T.chega && t < T.ica);
    const rAt = kAt >= 0 ? Math.hypot(carga.x - GUIN.x, carga.z - GUIN.z) : raio(XS[0]);
    pn.userData.atualizar(`${modo}|${modo === 'ica' ? rAt.toFixed(1) : fl.toFixed(2)}`, modo, modo === 'ica' ? rAt : fl);

    fixo.vis = o.state.active && t >= T.ica + 14; fixo.pos.copy(P(XS[3] + 0.6, YP - 0.6, 0));

    if (t < T.chega) return `3 vãos: ${fmt(9.2, 1)} + ${fmt(L, 0)} + ${fmt(9.2, 1)} m · aparelhos de neoprene sobre os pilares`;
    if (t < T.ica) return `Viga de ${fmt(L, 0)} m chegando do pátio (I) · ${fmt(PESO, 1)} t · contraflecha ${fmt(TR.contraflecha, 1)} mm`;
    if (t < T.trans) return kAt >= 0 ? `Viga ${kAt + 1}/4 · raio ${fmt(rAt, 1)} m · ${fmt(PESO + ACESS, 1)} t de ${fmt(capacidade(rAt), 1)} t (${fmt((PESO + ACESS) / capacidade(rAt) * 100, 0)}%)${kAt ? ' · mostrado 3× mais rápido' : ''}` : 'Viga apoiada · próxima viga a caminho';
    if (t < T.laje) return 'Transversinas nas pontas e no meio do vão';
    if (t < T.pav) return `Laje ${Math.round(win(t, T.laje + 2, T.laje + 13) * 100)}% · contraflecha ${fmt(cf, 1)} mm`;
    if (t < T.leit) return 'Barreiras, pavimento e sinalização · ponte liberada';
    return `Contraflecha final ${fmt(CL.contraflechaFinal, 1)} mm · base ${fmt(CL.base, 2)} MPa (comprimida) · topo ${fmt(CL.top, 1)} MPa`;
  }
  function carretaZ(t) { return lerp(-90, ESPERA.z, ease(win(t, T.chega, T.chega + 6))); }

  const exit0 = o.exit; o.exit = () => { fixo.vis = false; exit0(); };
  return o;
}
