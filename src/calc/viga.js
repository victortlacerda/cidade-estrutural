// Cálculos da viga biapoiada de concreto armado (funções puras, sem Three.js).
// Valores de EXEMPLO didático, não são de projeto. Base: NBR 6118 simplificada.

export const VIGA = {
  L: 6.0,        // vão (m)
  b: 0.20,       // largura (m)
  h: 0.50,       // altura (m)
  cob: 0.03,     // cobrimento (m)
  fck: 25,       // MPa
  fyk: 500,      // MPa (CA-50)
  Es: 210000,    // MPa
  qServ: 20,     // carga de serviço (kN/m)
  phiL: 0.016,   // barra longitudinal (m)
  nL: 4,         // nº de barras longitudinais
  phiE: 0.0063,  // estribo (m)
};

export function propriedades(v = VIGA) {
  const Eci = 5600 * Math.sqrt(v.fck);              // MPa
  const alphaI = Math.min(1, 0.8 + 0.2 * v.fck / 80);
  const Ecs = alphaI * Eci;                          // MPa
  const Ic = v.b * v.h ** 3 / 12;                    // m4
  const fctm = 0.3 * v.fck ** (2 / 3);               // MPa
  const d = v.h - v.cob - v.phiE - v.phiL / 2;       // altura útil (m)
  const As = v.nL * Math.PI * v.phiL ** 2 / 4;       // m2
  const Mr = 1.5 * fctm * 1000 * Ic / (v.h / 2);     // kN·m (seção retangular α=1,5)
  return { Eci, Ecs, Ic, fctm, d, As, Mr };
}

export const momento = (q, x, L = VIGA.L) => q * x * (L - x) / 2;   // kN·m
export const cortante = (q, x, L = VIGA.L) => q * (L / 2 - x);      // kN
export const Mmax = (q, L = VIGA.L) => q * L * L / 8;
export const Vmax = (q, L = VIGA.L) => q * L / 2;

// Carga que provoca a primeira fissura de flexão (M = Mr no meio do vão)
export function qFissura(v = VIGA) {
  return 8 * propriedades(v).Mr / v.L ** 2;
}

// Estádio II: linha neutra e inércia fissurada
export function estadioII(v = VIGA) {
  const p = propriedades(v);
  const ae = v.Es / p.Ecs;
  const A = v.b / 2, B = ae * p.As, C = -ae * p.As * p.d;
  const x = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
  const III = v.b * x ** 3 / 3 + ae * p.As * (p.d - x) ** 2;
  return { ae, x, III };
}

// Flecha imediata no meio do vão (mm), com inércia efetiva de Branson
export function flecha(q, v = VIGA) {
  if (q <= 0) return 0;
  const p = propriedades(v);
  const Ma = Mmax(q, v.L);
  let I = p.Ic;
  if (Ma > p.Mr) {
    const r = (p.Mr / Ma) ** 3;
    I = r * p.Ic + (1 - r) * estadioII(v).III;
  }
  const E = p.Ecs * 1000; // kPa
  return 5 * q * v.L ** 4 / (384 * E * I) * 1000;
}

// Tensões na seção do meio do vão (MPa). Estádio I antes de fissurar, II depois.
export function tensoes(q, v = VIGA) {
  const p = propriedades(v);
  const M = Mmax(q, v.L);
  if (M <= p.Mr) {
    const s = M * (v.h / 2) / p.Ic / 1000;
    return { estadio: 'I', M, x: v.h / 2, sc: s, st: s, ss: s * v.Es / p.Ecs };
  }
  const e = estadioII(v);
  const z = p.d - e.x / 3;
  return { estadio: 'II', M, x: e.x, sc: 2 * M / (v.b * e.x * z) / 1000, st: 0, ss: M / (p.As * z) / 1000 };
}

// Dimensionamento à flexão (domínio 2/3, diagrama retangular simplificado)
export function armaduraNecessaria(v = VIGA) {
  const p = propriedades(v);
  const Md = 1.4 * Mmax(v.qServ, v.L);   // kN·m
  const fcd = v.fck / 1.4 * 1000;         // kPa
  const fyd = v.fyk / 1.15 * 1000;        // kPa
  const kmd = Md / (v.b * p.d ** 2 * fcd);
  const kx = (0.68 - Math.sqrt(0.68 ** 2 - 4 * 0.272 * kmd)) / (2 * 0.272);
  const kz = 1 - 0.4 * kx;
  const AsNec = Md / (kz * p.d * fyd);    // m2
  return { Md, kmd, kx, kz, AsNec, AsEf: p.As, x: kx * p.d };
}

// Resumo com números arredondados para os textos (texto e gráfico sempre concordam)
export function resumo(v = VIGA) {
  const p = propriedades(v);
  const a = armaduraNecessaria(v);
  const f = flecha(v.qServ, v);
  return {
    L: v.L, b: v.b * 100, h: v.h * 100,
    q: v.qServ,
    M: Mmax(v.qServ, v.L), V: Vmax(v.qServ, v.L),
    Md: a.Md,
    AsNec: a.AsNec * 1e4, AsEf: p.As * 1e4,
    nL: v.nL, phiL: v.phiL * 1000,
    Mr: p.Mr, qr: qFissura(v),
    flechaI: 5 * v.qServ * v.L ** 4 / (384 * p.Ecs * 1000 * p.Ic) * 1000,
    flecha: f, limite: v.L / 250 * 1000,
    Ecs: p.Ecs, d: p.d * 100, xII: estadioII(v).x * 100,
  };
}

export const fmt = (n, c = 1) => n.toFixed(c).replace('.', ',');
