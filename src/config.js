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

// Mapa: rio de leste a oeste dividindo a cidade em norte (linha 0) e sul (linha 1);
// avenida central (x = 0) com 2 × 2 faixas e canteiro, atravessando o rio por uma ponte estaiada.
export const MAPA = {
  rio: { meia: 18, margem: 4, agua: -4.4, fundo: -6.5 },
  ruaW: 14, av: { meia: 13, canteiro: 1.3, faixas: [2.95, 6.25], pista: 7.9 },
  X: [-126, -66, 0, 66, 126],      // eixos das ruas verticais (índice 2 = avenida)
  Z: [-95, -29, 29, 95],           // externa norte, marginal norte, marginal sul, externa sul
  pontes: [0, 66],                 // ruas verticais que atravessam o rio (avenida e ponte em vigas)
  passarela: 36,                   // passarela em arco (pedestres), em frente à zona C
};
const COLS = [-96, -36, 36, 96], ROWS = [-62, 62];
const cx = (c) => COLS[c];
const cz = (r) => ROWS[r];

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
  // C não é um lote: é o trecho do rio com as três pontes
  { id: 'C', nome: 'Pontes', tipo: 'rio', x: 33, z: 0,
    entrada: { rua: [66, 0], portao: [63.8, 0], vaga: [63.8, 3], vizinhos: ['n31', 'n32'] }, obras: [
    { id: 'estaiada', nome: 'Ponte estaiada da avenida' },
    { id: 'icamento', nome: 'Ponte em vigas: içamento e laje', pronta: true },
    { id: 'arco', nome: 'Passarela em arco atirantado' },
  ] },
  { id: 'D', nome: 'Edifícios altos', c: 3, r: 0, obras: [
    { id: 'vento', nome: 'Vento e deslocamento lateral' },
    { id: 'nucleo', nome: 'Núcleo rígido e contraventamento' },
  ] },
  { id: 'E', nome: 'Laboratório de materiais', c: 0, r: 1, obras: [
    { id: 'compressao', nome: 'Compressão do corpo de prova', pronta: true },
    { id: 'tracao', nome: 'Tração da barra de aço', pronta: true },
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
  { id: 'H', nome: 'Central de concreto e aço', c: 3, r: 1, obras: [] },
  { id: 'I', nome: 'Pré-moldados', c: 2, r: 0, obras: [
    { id: 'protensao', nome: 'Protensão de viga pré-moldada', pronta: true },
    { id: 'estoque', nome: 'Estoque, transporte e controle de qualidade' },
  ] },
].map((z) => (z.tipo === 'rio' ? z : { ...z, x: cx(z.c), z: cz(z.r) }));

export const LOTES = ZONAS.filter((z) => z.tipo !== 'rio');

export const zona = (id) => ZONAS.find((z) => z.id === id);
