import test from 'node:test';
import assert from 'node:assert/strict';
import { NOS, VIZ, ENTRADA, rota, naFaixa, passeio, polilinha, FAIXA, FAIXAS_AV } from '../src/core/malha.js';
import { rng } from '../src/core/kit.js';

test('malha 5 × 4; norte e sul ligados só pelas pontes', () => {
  assert.equal(Object.keys(NOS).length, 20);
  assert.equal(VIZ.n00.length, 2);
  assert.equal(VIZ.n21.length, 4);                 // avenida na marginal norte: tem ponte
  assert.equal(VIZ.n11.length, 3);                 // rua sem ponte termina no rio
  const pontes = Object.keys(NOS).filter((k) => k[2] === '1' && VIZ[k].some((v) => v[2] === '2'));
  assert.deepEqual(pontes.sort(), ['n21', 'n31']);
});
test('avenida usa faixas da avenida', () => {
  const f = naFaixa([[0, -29], [0, 29]], 2.2, 1);
  assert.equal(Math.abs(f[0][0]), FAIXAS_AV[1]);
});
test('toda zona tem rota para toda outra, começando e terminando nas entradas', () => {
  const ids = Object.keys(ENTRADA);
  for (const a of ids) for (const b of ids) {
    if (a === b) continue;
    const r = rota(a, b);
    assert.deepEqual(r[0], ENTRADA[a].rua);
    assert.deepEqual(r[r.length - 1], ENTRADA[b].rua);
    for (let k = 1; k < r.length; k++) assert.ok(r[k][0] === r[k - 1][0] || r[k][1] === r[k - 1][1], 'só trechos retos');
  }
});
test('faixa da direita: indo para +x fica em +z', () => {
  const f = naFaixa([[0, 0], [10, 0]]);
  assert.deepEqual(f[0], [0, FAIXA]);
  const c = naFaixa([[0, 0], [10, 0], [10, 10]]);   // vira à direita (para +z)
  assert.deepEqual(c[1], [10 - FAIXA, FAIXA]);
});
test('passeio não volta para trás fora de ponta de rua', () => {
  const p = passeio(rng(3), 'n21', 'n11', 40);
  for (let k = 2; k < p.seq.length; k++) if (VIZ[p.seq[k - 1]].length > 1) assert.notEqual(p.seq[k], p.seq[k - 2]);
});
test('polilinha mede e amostra', () => {
  const p = polilinha([[0, 0], [3, 0], [3, 4]]);
  assert.equal(p.total, 7);
  assert.deepEqual([p.em(5).x, p.em(5).z], [3, 2]);
});
