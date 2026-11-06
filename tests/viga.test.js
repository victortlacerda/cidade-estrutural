import test from 'node:test';
import assert from 'node:assert/strict';
import { VIGA, propriedades, momento, cortante, Mmax, Vmax, qFissura, flecha, armaduraNecessaria, resumo, fmt } from '../src/calc/viga.js';

const perto = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (±${tol})`);

test('momento e cortante da biapoiada', () => {
  perto(Mmax(20, 6), 90, 1e-9);
  perto(Vmax(20, 6), 60, 1e-9);
  perto(momento(20, 3, 6), 90, 1e-9);
  perto(momento(20, 0, 6), 0, 1e-9);
  perto(cortante(20, 0, 6), 60, 1e-9);
  perto(cortante(20, 3, 6), 0, 1e-9);
  perto(cortante(20, 6, 6), -60, 1e-9);
});

test('propriedades do concreto C25', () => {
  const p = propriedades();
  perto(p.Eci, 28000, 1);
  perto(p.Ecs, 24150, 1);
  perto(p.fctm, 2.565, 0.01);
  perto(p.Ic, 0.2 * 0.125 / 12, 1e-12);
  perto(p.As * 1e4, 8.04, 0.01);
});

test('fissura começa bem antes da carga de serviço', () => {
  const qr = qFissura();
  assert.ok(qr > 5 && qr < 10, `qr=${qr}`);
  assert.ok(qr < VIGA.qServ);
});

test('flecha cresce mais rápido depois de fissurar', () => {
  const qr = qFissura();
  const antes = flecha(qr * 0.9) / (qr * 0.9);
  const depois = flecha(VIGA.qServ) / VIGA.qServ;
  assert.ok(depois > antes * 1.5);
  assert.equal(flecha(0), 0);
});

test('flecha de serviço dentro do limite L/250', () => {
  const r = resumo();
  assert.ok(r.flecha < r.limite, `${r.flecha} >= ${r.limite}`);
});

test('armadura adotada atende à necessária', () => {
  const a = armaduraNecessaria();
  assert.ok(a.AsEf >= a.AsNec);
  assert.ok(a.kx < 0.45, 'linha neutra dentro do limite de ductilidade');
});

test('fmt usa vírgula', () => {
  assert.equal(fmt(6.7), '6,7');
  assert.equal(fmt(90, 0), '90');
});

import { tensoes } from '../src/calc/viga.js';
test('tensões: estádio I antes, II depois, aço abaixo do escoamento em serviço', () => {
  assert.equal(tensoes(5).estadio, 'I');
  const t = tensoes(VIGA.qServ);
  assert.equal(t.estadio, 'II');
  assert.ok(t.ss < VIGA.fyk / 1.15, `σs=${t.ss}`);
  assert.ok(t.sc < 0.7 * VIGA.fck, `σc=${t.sc}`);
});
