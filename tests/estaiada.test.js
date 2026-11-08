import test from 'node:test';
import assert from 'node:assert/strict';
import { EST, gTab, estai, resumo, desequilibrio, ancMastro } from '../src/calc/estaiada.js';
const perto = (a, b, t) => assert.ok(Math.abs(a - b) <= t, `${a} ≠ ${b}`);

test('peso do tabuleiro e da aduela', () => {
  perto(gTab(), 148.75, 1e-9);
  perto(resumo().aduela, 446.25, 1e-9);
});
test('estais mais longos ficam mais deitados e mais carregados', () => {
  const e1 = estai(1), e7 = estai(7);
  assert.ok(e1.ang > 80 && e7.ang < 50);
  assert.ok(e7.T > e1.T);
  assert.ok(e7.H > e1.H * 5);
});
test('equilíbrio do estai: componentes batem com a força', () => {
  for (let k = 1; k <= EST.n; k++) { const e = estai(k); perto(Math.hypot(e.V, e.H), e.T, 1e-6); }
});
test('cordoalhas suficientes em cada estai', () => {
  for (let k = 1; k <= EST.n; k++) { const e = estai(k); assert.ok(e.cord * e.cap >= e.T); }
});
test('mastro e tabuleiro comprimidos com tensões moderadas', () => {
  const r = resumo();
  assert.ok(r.sMastro > 1 && r.sMastro < 0.6 * 40, `σ mastro ${r.sMastro}`);
  assert.ok(r.sTab > 0 && r.sTab < 5);
});
test('desequilíbrio cresce com o balanço', () => {
  assert.ok(desequilibrio(7) > desequilibrio(1) * 6.9);
  assert.ok(ancMastro(1) > ancMastro(7));
});
