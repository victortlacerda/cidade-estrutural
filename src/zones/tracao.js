// Obra E2 — Tração da barra de aço CA-50 φ16 (marcação, garras, elástico, escoamento, estricção, ruptura).
// Tudo é função do tempo t. Números de EXEMPLO, não são de projeto.
import * as THREE from 'three';
import { box, cyl, at, mat, pessoa, andar, parar, painel, caixaArred, win, ease, clamp, lerp } from '../core/kit.js';
import { criarObra } from '../core/obra.js';
import { salaLab, metal } from './lab.js';
import { BARRA, sigmaAco, areaBarra, resultadoBarra } from '../calc/ensaios.js';
import { fmt } from '../calc/viga.js';

const RB = resultadoBarra();
const T = { marca: 0, fix: 12, elast: 22, esc: 36, enc: 48, rup: 72, leit: 80, FIM: 100 };
const EY = BARRA.fy / BARRA.E;
function epsDe(t) {
  if (t < T.elast + 1) return 0;
  if (t < T.esc) return EY * win(t, T.elast + 1, T.esc);
  if (t < T.enc) return lerp(EY, BARRA.epsSh, win(t, T.esc, T.enc));
  if (t < 64) return lerp(BARRA.epsSh, BARRA.epsU, win(t, T.enc, 64));
  return lerp(BARRA.epsU, BARRA.epsR, win(t, 64, T.rup));
}

export const STEPS = [
  { t: 'Barra e marcação', d: `Do lote de barras CA-50 φ16 que foi para a viga, corta-se um pedaço de 50 cm. No meio dele marca-se a base de medida de 10 diâmetros, ${fmt(BARRA.Lo * 1000, 0)} mm. É a distância entre essas marcas que vai dizer o quanto o aço se alonga até romper.` },
  { t: 'Fixação nas garras', d: 'A barra é presa nas garras da máquina universal de ensaios: a de baixo fica parada e a de cima sobe devagar, puxando a barra. Um extensômetro preso na barra mede as deformações pequenas do começo com precisão de milésimos de milímetro.' },
  { t: 'Regime elástico', d: `No começo a tensão cresce em linha reta com a deformação: é a lei de Hooke, com módulo E = ${fmt(BARRA.E / 1000, 0)} GPa. Até aqui o aço se comporta como uma mola. Se a força for retirada, a barra volta ao tamanho original. Esse trecho termina com só ${fmt(RB.ey, 2)}% de alongamento.` },
  { t: 'Escoamento', d: `Com fy = ${BARRA.fy} MPa (força de ${fmt(RB.Fy, 1)} kN) o aço "escoa": a deformação cresce sem a força aumentar, formando um patamar. A partir daqui a deformação é permanente. O CA-50 precisa ter fy de pelo menos 500 MPa, e é esse valor (com o coeficiente 1,15) que entra no cálculo da armadura.` },
  { t: 'Encruamento e estricção', d: `Depois do patamar o aço endurece de novo (encruamento) e volta a aguentar mais força, até a resistência máxima fu = ${BARRA.fu} MPa (${fmt(RB.Fu, 1)} kN). Daí em diante a deformação se concentra num ponto: a barra afina ali, formando o "pescoço" da estricção, e a força nominal começa a cair.` },
  { t: 'Ruptura', d: 'A barra rompe no pescoço. A ruptura de um aço dúctil vem depois de muito aviso: a barra alongou e afinou bastante antes de quebrar. É exatamente isso que se quer numa estrutura, que ela deforme e fissure visivelmente antes de colapsar.' },
  { t: 'Leitura do resultado', d: `Encostando as duas partes, a distância entre as marcas passou de ${fmt(BARRA.Lo * 1000, 0)} para ${fmt(RB.Lu, 1)} mm: alongamento de ${fmt(RB.along, 0)}%, acima dos 8% exigidos. A relação fu/fy = ${fmt(RB.razao, 2)} passa do mínimo de 1,08. Com fy ≥ 500 MPa, a barra atende ao CA-50.` },
];
export const STARTS = [T.marca, T.fix, T.elast, T.esc, T.enc, T.rup, T.leit];

export function criarTracao(motor, origem) {
  const o = criarObra(motor, origem, {
    id: 'tracao', nome: 'Tração da barra de aço', tit: 'Tração da barra de aço CA-50', sub: 'Zona E · Laboratório de materiais',
    hide: 'E', steps: STEPS, starts: STARTS, fim: T.FIM,
    cams: [[-1.45, 1.0, 0, 1.3, 0, 0.45], [0.0, 1.15, 0, 1.9, 0, 0.1], [0.75, 1.45, -0.5, 3.6, 0, 0.08], [0.75, 1.45, -0.5, 3.6, 0, 0.08],
      [0.08, 0.92, 0, 0.75, 0.15, 0.05], [0.08, 0.92, 0, 0.75, 0.15, 0.05], [0.0, 1.6, -0.8, 4.6, 0, 0.08]],
    render,
  });
  const root = o.group, P = o.P;
  salaLab(root, { bancadaX: -1.45 });

  // ---------- máquina universal ----------
  root.add(at(box(1.0, 0.62, 0.6, 0x40546a), 0, 0.31, 0));
  [-0.38, 0.38].forEach((x) => root.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.8, 12), metal()), x, 1.6, 0)));
  root.add(at(box(1.0, 0.25, 0.6, 0x40546a), 0, 2.5, 0));
  const travessa = new THREE.Group(); root.add(travessa);
  travessa.add(at(box(0.92, 0.16, 0.5, 0x56677a), 0, 0.24, 0));
  [-0.38, 0.38].forEach((x) => travessa.add(at(box(0.12, 0.2, 0.14, 0x40546a), x, 0.24, 0)));
  const garraSup = new THREE.Group(); travessa.add(garraSup);
  const garraInf = new THREE.Group(); garraInf.position.set(0, 0.78, 0); root.add(garraInf);
  const mordentes = [];
  [garraSup, garraInf].forEach((g, i) => {
    g.add(at(box(0.14, 0.16, 0.08, 0x56677a), 0, i ? -0.08 : 0.08, -0.07));
    [-1, 1].forEach((s) => { const m = box(0.04, 0.12, 0.08, 0x9aa4ad); m.position.set(s * 0.05, i ? -0.08 : 0.08, 0.02); g.add(m); mordentes.push({ m, s }); });
  });
  // console
  root.add(at(box(0.4, 1.0, 0.36, 0x8c96a0), 0.95, 0.5, -0.45));
  const mostrador = painel(0.46, 0.26, 460, 260, (c, w, h, F, dl) => {
    caixaArred(c, 0, 0, w, h, 16, '#151a1f');
    c.fillStyle = '#7fd38f'; c.font = '500 26px "JetBrains Mono", monospace'; c.textAlign = 'left';
    c.fillText('FORÇA', 24, 46); c.fillText('ALONGAMENTO', 24, 156);
    c.font = '700 60px "JetBrains Mono", monospace'; c.textAlign = 'right';
    c.fillText(`${fmt(F, 1)} kN`, w - 22, 108); c.fillText(`${fmt(dl, 2)} mm`, w - 22, 216);
  });
  mostrador.position.set(0.95, 1.18, -0.26); mostrador.rotation.x = -0.35; root.add(mostrador);

  // ---------- barra com nervuras (vértices deformáveis) ----------
  const LB = 0.5, Y0 = 0.62, GI = 0.16, GS = 0.40;   // base da barra; trecho preso embaixo até GI e em cima a partir de GS
  const LIVRE = GS - GI, YN = 0.27, R0 = BARRA.phi / 2;
  const geo = new THREE.CylinderGeometry(R0, R0, LB, 14, 260); geo.translate(0, LB / 2, 0);
  const base = geo.attributes.position.array.slice();
  const barraMat = mat(0xc07a44, { r: 0.45, m: 0.3, e: 0.12 });
  const barra = new THREE.Mesh(geo, barraMat); barra.castShadow = true; root.add(barra);
  const marcas = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(R0 * 1.12, 0.0016, 6, 20), mat(0xf2f0e6)); m.rotation.x = Math.PI / 2; barra.add(m); return m; });
  const yMarca = [YN - BARRA.Lo / 2, YN + BARRA.Lo / 2];
  const extens = new THREE.Group(); root.add(extens);
  [0, 1].forEach((i) => extens.add(at(box(0.05, 0.012, 0.03, 0x3b6fb6), 0, i * BARRA.Lo, 0.02)));
  extens.add(at(box(0.012, BARRA.Lo, 0.012, 0x3b6fb6), 0.025, BARRA.Lo / 2, 0.035));

  let chave = '';
  function deformar(eps, gap, deitada) {
    const k = `${eps.toFixed(5)}|${gap.toFixed(4)}|${deitada}`;
    if (k === chave) return; chave = k;
    const eU = Math.min(eps, BARRA.epsU), eN = Math.max(0, eps - BARRA.epsU);
    const dU = eU * LIVRE, dN = eN * LIVRE;
    const pesc = eN / (BARRA.epsR - BARRA.epsU);          // 0..1 até a ruptura
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i], y = base[i + 1], z = base[i + 2];
      const u = clamp((y - GI) / LIVRE);
      const s = (y - YN) / 0.018;
      const loc = clamp(0.5 + s * 0.5);
      let dy = dU * u + dN * (y < YN - 0.03 ? 0 : y > YN + 0.03 ? 1 : loc) + (y > YN ? gap : 0);
      const nerv = 1 + 0.09 * Math.max(0, Math.sin(y / 0.0105 * Math.PI * 2)) ** 6;
      const fino = (1 - 0.03 * clamp((eU - EY) / BARRA.epsU) * (y > GI && y < GS ? 1 : 0)) * (1 - 0.42 * pesc * Math.exp(-s * s));
      const r = Math.hypot(x, z) > 1e-6 ? fino * nerv : 1;
      p[i] = x * r; p[i + 1] = y + dy; p[i + 2] = z * r;
    }
    geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere();
    marcas.forEach((m, j) => { const y = yMarca[j]; m.position.y = y + dU * clamp((y - GI) / LIVRE) + (j ? dN + gap : 0); });
    return { dU, dN };
  }

  const tec = pessoa(0xeeeeea); root.add(tec.group);
  const marcador = cyl(0.006, 0.006, 0.12, 0x2b2b2b, 6); root.add(marcador);

  // ---------- gráfico tensão × deformação e quadro de resultados ----------
  const grafico = painel(1.9, 1.13, 840, 500, (c, w, h, eps, leitura) => {
    caixaArred(c, 0, 0, w, h, 20, 'rgba(20,24,30,0.86)');
    const f = '"Barlow", Arial, sans-serif';
    const x0 = 86, y0 = h - 66, W = w - 120, H = h - 130;
    const X = (e) => x0 + e / 0.18 * W, Y = (v) => y0 - v / 750 * H;
    c.fillStyle = '#cfd6dc'; c.font = `600 28px ${f}`; c.textAlign = 'left'; c.fillText('Tensão × deformação · CA-50 φ16', 24, 42);
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1.5; c.font = `500 20px ${f}`; c.fillStyle = '#9aa7b2';
    for (let v = 0; v <= 750; v += 150) { c.beginPath(); c.moveTo(x0, Y(v)); c.lineTo(x0 + W, Y(v)); c.stroke(); c.textAlign = 'right'; c.fillText(v, x0 - 10, Y(v) + 7); }
    for (let e = 0; e <= 18; e += 3) { c.textAlign = 'center'; c.fillText(e, X(e / 100), y0 + 28); }
    c.textAlign = 'left'; c.fillText('MPa', 18, Y(750) + 7); c.textAlign = 'right'; c.fillText('deformação (%)', x0 + W, y0 + 56);
    // linhas de fy e fu
    c.setLineDash([8, 6]); c.lineWidth = 2;
    c.strokeStyle = '#f4d35e'; c.beginPath(); c.moveTo(x0, Y(500)); c.lineTo(x0 + W, Y(500)); c.stroke();
    c.setLineDash([]); c.fillStyle = '#f4d35e'; c.font = `600 18px ${f}`; c.textAlign = 'right'; c.fillText('mínimo CA-50: 500', x0 + W - 4, Y(500) + 22);
    if (eps > 0) {
      c.strokeStyle = '#f29a5c'; c.lineWidth = 4; c.beginPath(); c.moveTo(X(0), Y(0));
      const n = 160; for (let i = 1; i <= n; i++) { const e = eps * i / n; c.lineTo(X(e), Y(sigmaAco(e))); }
      c.lineTo(X(eps), Y(sigmaAco(eps))); c.stroke();
      c.fillStyle = '#fff1e6'; c.beginPath(); c.arc(X(eps), Y(sigmaAco(eps)), 7, 0, 7); c.fill();
      c.font = `600 20px ${f}`; c.fillStyle = '#e9eef2'; c.textAlign = 'left';
      if (eps >= BARRA.epsSh) c.fillText(`fy = ${BARRA.fy}`, X(0.02), Y(BARRA.fy) + 26);
      if (eps >= BARRA.epsU) c.fillText(`fu = ${BARRA.fu}`, X(BARRA.epsU) - 30, Y(BARRA.fu) - 14);
    }
    // detalhe do trecho elástico
    const ix = 470, iy = 210, iw = 230, ih = 150;
    caixaArred(c, ix, iy, iw, ih, 10, 'rgba(255,255,255,0.06)');
    c.fillStyle = '#9aa7b2'; c.font = `500 17px ${f}`; c.textAlign = 'left'; c.fillText('detalhe: até 0,6%', ix + 10, iy + 22);
    const IX = (e) => ix + 14 + e / 0.006 * (iw - 28), IY = (v) => iy + ih - 12 - v / 650 * (ih - 44);
    if (eps > 0) {
      c.strokeStyle = '#7cc0f5'; c.lineWidth = 3; c.beginPath(); c.moveTo(IX(0), IY(0));
      const em = Math.min(eps, 0.006); for (let i = 1; i <= 40; i++) { const e = em * i / 40; c.lineTo(IX(e), IY(sigmaAco(e))); } c.stroke();
      if (eps >= EY * 0.6) { c.fillStyle = '#7cc0f5'; c.font = `600 17px ${f}`; c.fillText('E = 210 GPa', IX(0.0004), iy + 46); }
    }
    if (leitura) {
      c.fillStyle = '#7ccc8f'; c.font = `700 22px ${f}`; c.textAlign = 'right'; c.fillText(`ruptura com ${fmt(RB.along, 0)}%`, X(BARRA.epsR), Y(sigmaAco(BARRA.epsR)) + 40);
    }
  });
  grafico.position.set(1.55, 2.0, -1.72); root.add(grafico);

  const quadro = painel(1.55, 1.25, 620, 500, (c, w, h) => {
    caixaArred(c, 0, 0, w, h, 20, 'rgba(20,24,30,0.86)');
    const f = '"Barlow", Arial, sans-serif';
    c.fillStyle = '#cfd6dc'; c.font = `600 28px ${f}`; c.textAlign = 'left'; c.fillText('Resultado · NBR 7480', 24, 42);
    const linhas = [
      ['fy', `${BARRA.fy} MPa`, '≥ 500', RB.atende.fy],
      ['fu', `${BARRA.fu} MPa`, '', true],
      ['fu / fy', fmt(RB.razao, 2), '≥ 1,08', RB.atende.razao],
      ['Alongamento', `${fmt(RB.along, 0)}%`, '≥ 8%', RB.atende.along],
      ['Lo → Lu', `${fmt(BARRA.Lo * 1000, 0)} → ${fmt(RB.Lu, 1)} mm`, '', true],
    ];
    linhas.forEach(([a, b, lim, ok], i) => {
      const y = 104 + i * 64;
      c.fillStyle = '#9aa7b2'; c.font = `500 24px ${f}`; c.fillText(a, 24, y);
      c.fillStyle = '#e9eef2'; c.font = `600 24px "JetBrains Mono", monospace`; c.fillText(b, 210, y);
      if (lim) { c.fillStyle = ok ? '#7ccc8f' : '#e86050'; c.font = `600 22px ${f}`; c.textAlign = 'right'; c.fillText(`${lim} ${ok ? '✓' : '✗'}`, w - 24, y); c.textAlign = 'left'; }
    });
    c.fillStyle = '#7ccc8f'; c.font = `700 26px ${f}`; c.fillText('Barra aprovada como CA-50', 24, h - 30);
  });
  quadro.userData.atualizar('q'); quadro.position.set(-1.6, 2.0, -1.72); root.add(quadro);

  const BAN = new THREE.Vector3(-1.45, 0.9 + R0, 0.0);   // barra deitada na bancada (centro)
  const Fde = (eps) => sigmaAco(eps) * 1000 * areaBarra();

  o.rotulos([
    [`Base de medida 10φ = ${fmt(BARRA.Lo * 1000, 0)} mm`, 3, T.fix, () => P(BAN.x, BAN.y + 0.08, 0)],
    ['Garras', T.fix + 3, T.fix + 7, () => P(0.12, Y0 + 0.08, 0)],
    ['Extensômetro', T.fix + 7, T.elast + 6, () => P(0.03, Y0 + YN + 0.1, 0.03)],
    ['Lei de Hooke: σ = E·ε', T.elast + 6, T.esc, () => P(1.0, 2.4, -1.6)],
    ['Patamar de escoamento', T.esc + 2, T.enc, () => P(1.2, 2.3, -1.6)],
    ['Estricção (pescoço)', 64, T.rup, () => P(0.0, Y0 + YN + 0.01, 0.01)],
    ['Ruptura dúctil', T.rup, T.leit, () => P(0.0, Y0 + YN + 0.03, 0.01)],
    [`Lu = ${fmt(RB.Lu, 1)} mm`, T.leit + 4, T.FIM, () => P(0.04, Y0 + YN + 0.12, 0.02)],
  ]);

  function render(t) {
    const eps = epsDe(t);
    const rompeu = t >= T.rup;
    const gapMax = 0.012;
    const gap = !rompeu ? 0 : t < T.leit + 2 ? gapMax * ease(win(t, T.rup, T.rup + 1)) : gapMax * (1 - ease(win(t, T.leit + 2, T.leit + 4)));
    // posição da barra: deitada na bancada → em pé na máquina
    const vai = ease(win(t, T.fix, T.fix + 3));
    const deitada = vai < 1;
    const d = deformar(eps, gap, deitada) ?? { dU: Math.min(eps, BARRA.epsU) * LIVRE, dN: Math.max(0, eps - BARRA.epsU) * LIVRE };
    barra.position.set(lerp(BAN.x + LB / 2, 0, vai), lerp(BAN.y, Y0, vai), lerp(0, 0, vai));
    barra.rotation.z = lerp(Math.PI / 2, 0, vai);
    // travessa sobe junto com a ponta de cima
    const topo = Y0 + GS + d.dU + d.dN + gap;
    travessa.position.set(0, topo, 0);
    // mordentes fecham
    const fecha = ease(win(t, T.fix + 3, T.fix + 5));
    mordentes.forEach(({ m, s }) => { m.position.x = s * lerp(0.05, R0 + 0.02, fecha); });
    // extensômetro
    extens.visible = t >= T.fix + 7 && t < T.esc + 8;
    extens.position.set(0, Y0 + yMarca[0] + d.dU * clamp((yMarca[0] - GI) / LIVRE), 0);
    extens.scale.y = (BARRA.Lo + d.dU * BARRA.Lo / LIVRE) / BARRA.Lo;

    // técnico
    let px = -1.45, pz = -0.62, ry = 0, anda = false;
    if (t >= T.fix) { const u = ease(win(t, T.fix, T.fix + 3)); px = lerp(-1.45, -0.55, u); anda = u > 0 && u < 1; }
    if (t >= T.fix + 8) { const u = ease(win(t, T.fix + 8, T.fix + 10)); px = lerp(-0.55, 1.35, u); pz = lerp(-0.62, -0.8, u); anda = anda || (u > 0 && u < 1); if (u >= 1) ry = -0.5; }
    tec.group.position.set(px, 0, pz); tec.group.rotation.y = ry;
    anda ? andar(tec, t * 7) : parar(tec);
    marcador.visible = t > 1 && t < 9;
    if (marcador.visible) {
      const u = win(t, 2, 8);
      marcador.position.set(BAN.x + LB / 2 - (u < 0.5 ? yMarca[0] : yMarca[1]), BAN.y + 0.07, 0);
      tec.bracoD.rotation.x = -1.7;
    }
    marcas.forEach((m, j) => { m.visible = t > 2 + j * 3.5; });

    mostrador.userData.atualizar(`${eps.toFixed(5)}|${rompeu}`, rompeu ? 0 : Fde(eps), (d.dU * BARRA.Lo / LIVRE + d.dN) * 1000);
    grafico.visible = t >= T.elast;
    if (grafico.visible) grafico.userData.atualizar(`${eps.toFixed(5)}|${t > T.leit}`, eps, t > T.leit);
    quadro.visible = t >= T.leit + 5;

    const F = Fde(eps), s = sigmaAco(eps);
    if (t < T.fix) return `CA-50 φ16 · área ${fmt(RB.A, 1)} mm² · base de medida ${fmt(BARRA.Lo * 1000, 0)} mm`;
    if (t < T.elast) return 'Garras fechadas · extensômetro na base de medida';
    if (t < T.rup) return `F = ${fmt(F, 1)} kN · σ = ${fmt(s, 0)} MPa · ε = ${fmt(eps * 100, eps < 0.01 ? 3 : 1)}%`;
    if (t < T.leit) return `Ruptura com ${fmt(RB.along, 0)}% de alongamento · Fu = ${fmt(RB.Fu, 1)} kN`;
    return `fy ${BARRA.fy} MPa · fu ${BARRA.fu} MPa · fu/fy ${fmt(RB.razao, 2)} · A ${fmt(RB.along, 0)}% · atende CA-50`;
  }

  return o;
}
