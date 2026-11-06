import test from 'node:test';
import assert from 'node:assert/strict';
import { CP, areaCP, forcaDe, tensaoDe, sigmaConcreto, epsDeSigma, estatistica, moduloSecante,
  BARRA, sigmaAco, resultadoBarra } from '../src/calc/ensaios.js';
const perto = (a, b, t) => assert.ok(Math.abs(a - b) <= t, `${a} ≠ ${b}`);

test('área e força do CP 10×20', () => {
  perto(areaCP() * 1e4, 78.54, 0.01);
  perto(forcaDe(30), 235.6, 0.1);
  perto(tensaoDe(forcaDe(27.3)), 27.3, 1e-9);
});
test('curva do concreto: pico em eps0 e inversa coerente', () => {
  perto(sigmaConcreto(CP.eps0, 30), 30, 1e-9);
  perto(sigmaConcreto(epsDeSigma(18, 30), 30), 18, 1e-9);
  assert.ok(sigmaConcreto(CP.eps0 * 1.5, 30) < 30);
});
test('lote aprovado para C25', () => {
  const e = estatistica();
  assert.equal(e.n, 6);
  assert.ok(e.fckEst >= 25, `fck,est=${e.fckEst}`);
  assert.ok(e.min >= 25);
});
test('módulo secante plausível para C25–C30', () => {
  const E = moduloSecante(CP.exemplares[CP.ensaiado]);
  assert.ok(E > 20000 && E < 35000, `E=${E}`);
});
test('aço: elástico, patamar, máximo e queda', () => {
  perto(sigmaAco(0.001), 210, 1e-9);
  perto(sigmaAco(0.01), BARRA.fy, 1e-9);
  perto(sigmaAco(BARRA.epsU), BARRA.fu, 1e-9);
  assert.ok(sigmaAco(BARRA.epsR) < BARRA.fu);
});
test('barra atende CA-50 (NBR 7480)', () => {
  const r = resultadoBarra();
  assert.ok(r.atende.fy && r.atende.razao && r.atende.along);
  perto(r.A, 201.06, 0.01);
  perto(r.Fy, 112.6, 0.1);
});
