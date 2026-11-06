// Ensaios de laboratório (funções puras). Valores de EXEMPLO didático, não são de projeto.

// ---------- E1: compressão do corpo de prova de concreto (NBR 5738 / 5739 / 12655) ----------
export const CP = {
  d: 0.10, h: 0.20,                 // m (10 × 20 cm)
  taxa: 0.45,                       // MPa/s (0,45 ± 0,15)
  eps0: 0.0021,                     // deformação no pico
  fck: 25,
  // 6 exemplares do lote (MPa); o ensaiado na animação é o índice 3
  exemplares: [29.8, 31.2, 28.6, 30.4, 27.9, 30.9],
  ensaiado: 3,
};

export const areaCP = (d = CP.d) => Math.PI * d * d / 4;            // m2
export const forcaDe = (fc, d = CP.d) => fc * 1000 * areaCP(d);     // kN (fc em MPa)
export const tensaoDe = (F, d = CP.d) => F / areaCP(d) / 1000;      // MPa

// Curva tensão × deformação (parábola até o pico, queda depois — só referência)
export function sigmaConcreto(eps, fc, eps0 = CP.eps0) {
  if (eps <= 0) return 0;
  const r = eps / eps0;
  if (r <= 1) return fc * (2 * r - r * r);
  return Math.max(0, fc * (1 - 0.45 * (r - 1) / 0.75));
}
// Deformação para uma tensão no trecho ascendente
export function epsDeSigma(s, fc, eps0 = CP.eps0) {
  const u = Math.min(1, Math.max(0, s / fc));
  return eps0 * (1 - Math.sqrt(1 - u));
}

export function estatistica(v = CP.exemplares) {
  const n = v.length;
  const fcm = v.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - fcm) ** 2, 0) / (n - 1));
  const fckEst = fcm - 1.65 * sd;
  return { n, fcm, sd, fckEst, min: Math.min(...v), max: Math.max(...v), aprovado: fckEst >= CP.fck };
}

// Módulo secante entre 0,5 MPa e 30% de fc (aprox. NBR 8522) a partir da curva
export function moduloSecante(fc, eps0 = CP.eps0) {
  const sa = 0.5, sb = 0.3 * fc;
  return (sb - sa) / (epsDeSigma(sb, fc, eps0) - epsDeSigma(sa, fc, eps0)); // MPa
}

// ---------- E2: tração da barra de aço CA-50 (NBR 7480 / ISO 6892-1) ----------
export const BARRA = {
  phi: 0.016, L: 0.50, Lo: 0.160,   // base de medida 10φ
  E: 210000, fy: 560, fu: 680,      // MPa
  epsSh: 0.015, epsU: 0.11, epsR: 0.16, // fim do patamar, carga máxima, ruptura
};
export const areaBarra = (phi = BARRA.phi) => Math.PI * phi * phi / 4;  // m2

export function sigmaAco(eps, b = BARRA) {
  if (eps <= 0) return 0;
  const ey = b.fy / b.E;
  if (eps <= ey) return b.E * eps;
  if (eps <= b.epsSh) return b.fy;
  if (eps <= b.epsU) { const u = (eps - b.epsSh) / (b.epsU - b.epsSh); return b.fy + (b.fu - b.fy) * (1 - (1 - u) ** 2); }
  const u = Math.min(1, (eps - b.epsU) / (b.epsR - b.epsU));
  return b.fu * (1 - 0.16 * u * u);  // estricção: tensão nominal cai
}

export function resultadoBarra(b = BARRA) {
  const A = areaBarra(b.phi);
  return {
    A: A * 1e6, Fy: b.fy * 1000 * A, Fu: b.fu * 1000 * A,
    razao: b.fu / b.fy, along: b.epsR * 100, Lu: b.Lo * (1 + b.epsR) * 1000,
    ey: b.fy / b.E * 100,
    atende: { fy: b.fy >= 500, razao: b.fu / b.fy >= 1.08, along: b.epsR * 100 >= 8 },
  };
}
