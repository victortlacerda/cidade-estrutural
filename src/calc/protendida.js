// Viga pré-moldada pré-tracionada (seção I) — funções puras. Valores de EXEMPLO, não são de projeto.
// Base: NBR 6118 simplificada (pré-tração, verificação na transferência e após a laje).

export const PRE = {
  L: 16.0,                 // vão (m) — vão central da ponte em vigas
  Lpista: 22.0,            // comprimento da pista entre ancoragens (m)
  fck: 40, fckj: 28,       // MPa (na liberação, após cura térmica de ~18 h)
  // seção I: [largura, altura, y da base] (m)
  partes: [[0.50, 0.15, 0.00], [0.15, 0.70, 0.15], [0.60, 0.15, 0.85]],
  h: 1.0,
  n: 10, ap: 0.987e-4,     // cordoalhas CP-190 RB φ12,7 (m² cada)
  camadas: [[6, 0.05], [4, 0.10]],   // [quantidade, altura do centro] (m)
  fptk: 1900, fpyk: 1710, Ep: 200000,
  sMacaco: 1450,           // tensão aplicada pelo macaco (MPa)
  cravacao: 0.005,         // acomodação das cunhas (m)
  nIsol: 2, lIsol: 1.5,    // cordoalhas isoladas perto das pontas e trecho isolado (m)
  lt: 0.64,                // comprimento de transferência ≈ 50φ (m)
  perdasDif: 0.15,         // perdas diferidas (retração, fluência, relaxação) — adotado
  espVigas: 3.0, hLaje: 0.20,
};

export function secao(v = PRE) {
  let A = 0, S = 0;
  for (const [b, h, y0] of v.partes) { A += b * h; S += b * h * (y0 + h / 2); }
  const yb = S / A;
  let I = 0;
  for (const [b, h, y0] of v.partes) I += b * h ** 3 / 12 + b * h * (y0 + h / 2 - yb) ** 2;
  const yt = v.h - yb;
  const yp = v.camadas.reduce((s, [n, y]) => s + n * y, 0) / v.n;
  return { A, yb, yt, I, Wb: I / yb, Wt: I / yt, e: yb - yp, yp, g: 25 * A };
}

const Eci = (f) => 5600 * Math.sqrt(f);
const Ecs = (f) => Math.min(1, 0.8 + 0.2 * f / 80) * Eci(f);
const fctm = (f) => 0.3 * f ** (2 / 3);

// Protensão na pista
export function pista(v = PRE) {
  const dl = v.sMacaco / v.Ep * v.Lpista;                    // alongamento medido (m)
  const dCrav = v.cravacao / v.Lpista * v.Ep;                // perda por cravação (MPa)
  const sPi = v.sMacaco - dCrav;
  return {
    Fmacaco: v.sMacaco * 1000 * v.ap,                        // kN por cordoalha
    dl, dCrav, sPi, limite: Math.min(0.77 * v.fptk, 0.85 * v.fpyk),
  };
}

// Transferência (corte das cordoalhas): perda por encurtamento elástico e tensões
export function transferencia(v = PRE) {
  const s = secao(v), p = pista(v);
  const Mg = s.g * v.L ** 2 / 8;
  const P0 = p.sPi * 1000 * v.n * v.ap;
  const ap = v.Ep / Eci(v.fckj);
  const scp = (P0 / s.A + P0 * s.e ** 2 / s.I - Mg * s.e / s.I) / 1000;  // MPa no nível das cordoalhas
  const dEl = ap * scp;
  const sP = p.sPi - dEl;
  const P = sP * 1000 * v.n * v.ap;
  const meio = { top: (P / s.A - P * s.e / s.Wt + Mg / s.Wt) / 1000, base: (P / s.A + P * s.e / s.Wb - Mg / s.Wb) / 1000 };
  const Pp = P * (v.n - v.nIsol) / v.n;  // na ponta, só as cordoalhas aderentes
  const ponta = { top: (Pp / s.A - Pp * s.e / s.Wt) / 1000, base: (Pp / s.A + Pp * s.e / s.Wb) / 1000 };
  const pontaSemIsol = { top: (P / s.A - P * s.e / s.Wt) / 1000 };
  const lim = { tracao: 1.2 * fctm(v.fckj), compr: 0.7 * v.fckj };
  const E = Eci(v.fckj) * 1000;
  const cP = P * s.e * v.L ** 2 / (8 * E * s.I) * 1000;
  const cG = 5 * s.g * v.L ** 4 / (384 * E * s.I) * 1000;
  return { P0, P, Mg, ap, dEl, perc: dEl / p.sPi, meio, ponta, pontaSemIsol, lim, contraflecha: cP - cG, cP, cG };
}

// Força de protensão efetiva ao longo da viga (kN), x medido da ponta (m)
export function forcaEm(x, v = PRE, P = transferencia(v).P) {
  const d = Math.min(x, v.L - x);
  const ader = (v.n - v.nIsol) / v.n * Math.min(1, d / v.lt);
  const isol = v.nIsol / v.n * Math.min(1, Math.max(0, (d - v.lIsol) / v.lt));
  return P * (ader + isol);
}
// Tensão (MPa, compressão +) num ponto (x da ponta, y da base) na transferência
export function tensaoEm(x, y, v = PRE) {
  const s = secao(v), t = transferencia(v);
  const P = forcaEm(x, v, t.P), M = s.g * x * (v.L - x) / 2;
  return (P / s.A + (P * s.e - M) * (s.yb - y) / s.I) / 1000;
}

// Laje concretada sobre a viga (seção simples) e situação final com perdas diferidas
export function comLaje(v = PRE) {
  const s = secao(v), t = transferencia(v);
  const q = 25 * v.hLaje * v.espVigas;                         // kN/m por viga
  const Ml = q * v.L ** 2 / 8;
  const E28 = Ecs(v.fck) * 1000;
  const fl = 5 * q * v.L ** 4 / (384 * E28 * s.I) * 1000;
  const Pinf = t.P * (1 - v.perdasDif);
  const M = t.Mg + Ml;
  return {
    q, Ml, flechaLaje: fl, contraflechaFinal: t.contraflecha - fl, Pinf,
    top: (Pinf / s.A - Pinf * s.e / s.Wt + M / s.Wt) / 1000,
    base: (Pinf / s.A + Pinf * s.e / s.Wb - M / s.Wb) / 1000,
    limCompr: 0.6 * v.fck,
    pesoViga: s.g * v.L, // kN
  };
}

// Cura térmica: temperatura (°C) por hora desde a concretagem
export function curaTermica(h) {
  if (h < 3) return 25;                        // pré-cura (espera)
  if (h < 5.33) return 25 + (h - 3) * 15;      // subida de 15 °C/h até 60 °C
  if (h < 12) return 60;                       // patamar
  if (h < 16) return 60 - (h - 12) * 8.75;     // resfriamento lento até 25 °C
  return 25;
}
