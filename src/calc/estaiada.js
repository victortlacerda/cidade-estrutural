// Ponte estaiada da avenida em balanço sucessivo (funções puras). Valores de EXEMPLO, não são de projeto.
// Modelo simples: cada par de estais segura o peso de uma aduela de cada lado (área de influência a).

export const EST = {
  H: 34,                 // altura do mastro acima do tabuleiro (m)
  n: 7, a: 3.0,          // pares de estais por lado e comprimento da aduela (m)
  largura: 17, espEq: 0.35,   // tabuleiro: largura e espessura equivalente de concreto (m)
  gPerm: 25,             // pavimento, barreiras e guarda-corpos (kN/m)
  carro: 450,            // carro de avanço (fôrma móvel) na ponta do balanço (kN)
  fptk: 1860, apCord: 1.5e-4, fatorEstai: 0.45,   // cordoalhas φ15,7 e limite de serviço dos estais
  mastro: [2.0, 2.8],    // seção do mastro (m)
};

export const gTab = (e = EST) => 25 * e.largura * e.espEq;                // kN/m
export const ancMastro = (k, e = EST) => e.H - 1.5 - k * 1.6;              // altura da ancoragem k no mastro (m)
export const ancTab = (k, e = EST) => k * e.a;                             // distância da ancoragem no tabuleiro (m)

export function estai(k, perm = true, e = EST) {
  const dy = ancMastro(k, e) - 0.35, dz = ancTab(k, e) - 1.2;
  const L = Math.hypot(dy, dz), th = Math.atan2(dy, dz);
  const V = (gTab(e) + (perm ? e.gPerm : 0)) * e.a;                         // kN
  const T = V / Math.sin(th), Hh = V / Math.tan(th);
  const cap = e.fatorEstai * e.fptk * 1000 * e.apCord;                      // kN por cordoalha
  return { k, L, ang: th * 180 / Math.PI, V, T, H: Hh, cord: Math.ceil(T / cap), cap };
}

export function resumo(e = EST) {
  const est = Array.from({ length: e.n }, (_, i) => estai(i + 1, true, e));
  const Nmastro = 2 * est.reduce((s, x) => s + x.V, 0);                     // kN (só estais)
  const pesoMastro = 25 * e.mastro[0] * e.mastro[1] * e.H;
  const Ntab = est.reduce((s, x) => s + x.H, 0);                            // compressão do tabuleiro junto ao mastro (kN)
  const Amastro = e.mastro[0] * e.mastro[1];
  return {
    est, Nmastro, pesoMastro, Ntotal: Nmastro + pesoMastro,
    sMastro: (Nmastro + pesoMastro) / Amastro / 1000,                        // MPa
    Ntab, sTab: Ntab / (e.largura * e.espEq) / 1000,                          // MPa
    Tmax: Math.max(...est.map((x) => x.T)), cordTotal: 2 * est.reduce((s, x) => s + x.cord, 0),
    gTab: gTab(e), aduela: gTab(e) * e.a,
  };
}

// Desequilíbrio ao concretar uma aduela de um lado só (antes do lado oposto): momento na base do mastro
export function desequilibrio(k, e = EST) {
  return (gTab(e) * e.a + e.carro) * ancTab(k, e);                           // kN·m
}
