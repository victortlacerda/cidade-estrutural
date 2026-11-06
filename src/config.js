// Configuração da cidade: paleta da cena, grade de lotes, zonas e obras.

export const LOTE = { w: 46, d: 52, rua: 14 };

export const CORES = {
  claro: {
    ceu: 0xdfe5ea, nevoa: 0xdfe5ea, chao: 0xc9cfc6, lote: 0xe4e2da, rua: 0x5d646b, faixa: 0xf2f0e6,
    calcada: 0xd2d0c8, arvore: 0x7f9a6b, tronco: 0x7a5c44, luz: 1.0, hemi: 0.75,
  },
  escuro: {
    ceu: 0x1b2127, nevoa: 0x1b2127, chao: 0x2a3036, lote: 0x343a40, rua: 0x202429, faixa: 0x8d8a7c,
    calcada: 0x3a4046, arvore: 0x4f6544, tronco: 0x4d3b2d, luz: 0.7, hemi: 0.45,
  },
};

// Materiais "clay": cores sólidas e foscas
export const MAT = {
  concreto: 0xb9b8b1, concretoFresco: 0x9c9b95, pilar: 0xc4c2ba, aco: 0x8b5a3c, estribo: 0xa36a45,
  madeira: 0xc79a5b, compensado: 0xd8b77c, escora: 0x6f7c86, metal: 0x7d8790, laranja: 0xe07b2a,
  azul: 0x3b6fb6, verde: 0x4f9a5c, pele: 0xc99a76, pele2: 0x8d6248, capacete: 0xf2c230,
  bloco: 0x8f969c, agua: 0x6aa3c8, vidro: 0x9fb8c8, tijolo: 0xb2603f, branco: 0xeeeeea,
};

// Grade 4 × 2. centro em coordenadas de mundo
const cx = (c) => (c - 1.5) * (LOTE.w + LOTE.rua);
const cz = (r) => (r - 0.5) * (LOTE.d + LOTE.rua);

export const ZONAS = [
  { id: 'A', nome: 'Concreto armado', c: 0, r: 0, obras: [
    { id: 'viga', nome: 'Viga biapoiada', pronta: true },
    { id: 'pilar', nome: 'Pilar e flambagem' },
    { id: 'laje', nome: 'Laje maciça e nervurada' },
    { id: 'sapata', nome: 'Sapata isolada' },
  ] },
  { id: 'B', nome: 'Estruturas de aço', c: 1, r: 0, obras: [
    { id: 'trelica', nome: 'Treliça de cobertura' },
    { id: 'ligacao', nome: 'Ligação parafusada e soldada' },
    { id: 'portico', nome: 'Pórtico de galpão' },
  ] },
  { id: 'C', nome: 'Pontes', c: 2, r: 0, obras: [
    { id: 'ponte-viga', nome: 'Ponte em vigas protendidas' },
    { id: 'arco', nome: 'Ponte em arco' },
    { id: 'estaiada', nome: 'Ponte estaiada' },
  ] },
  { id: 'D', nome: 'Edifícios altos', c: 3, r: 0, obras: [
    { id: 'vento', nome: 'Vento e deslocamento lateral' },
    { id: 'nucleo', nome: 'Núcleo rígido e contraventamento' },
  ] },
  { id: 'E', nome: 'Laboratório de materiais', c: 0, r: 1, obras: [
    { id: 'compressao', nome: 'Compressão do corpo de prova' },
    { id: 'tracao', nome: 'Tração da barra de aço' },
    { id: 'slump', nome: 'Abatimento (slump test)' },
  ] },
  { id: 'F', nome: 'Patologias e reforço', c: 1, r: 1, obras: [
    { id: 'corrosao', nome: 'Corrosão de armadura' },
    { id: 'reforco', nome: 'Reforço com fibra de carbono' },
  ] },
  { id: 'G', nome: 'Madeira e alvenaria', c: 2, r: 1, obras: [
    { id: 'telhado', nome: 'Tesoura de telhado' },
    { id: 'alvenaria', nome: 'Alvenaria estrutural' },
  ] },
  { id: 'H', nome: 'Praça da Estrutura', c: 3, r: 1, obras: [] },
].map((z) => ({ ...z, x: cx(z.c), z: cz(z.r) }));

export const zona = (id) => ZONAS.find((z) => z.id === id);
