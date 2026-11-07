import test from 'node:test';
import assert from 'node:assert/strict';
import { PRE, secao, pista, transferencia, forcaEm, tensaoEm, comLaje, curaTermica } from '../src/calc/protendida.js';
const perto = (a, b, t) => assert.ok(Math.abs(a - b) <= t, `${a} ≠ ${b}`);

test('seção I: área, centroide e excentricidade', () => {
  const s = secao();
  perto(s.A, 0.27, 1e-9);
  perto(s.yb, 0.5236, 0.001);
  perto(s.I, 0.03425, 0.0002);
  perto(s.e, 0.4536, 0.001);
});
test('macaco dentro do limite e cravação calculada', () => {
  const p = pista();
  assert.ok(PRE.sMacaco <= p.limite, `${PRE.sMacaco} > ${p.limite}`);
  perto(p.dl * 1000, 159.5, 0.1);
  perto(p.dCrav, 45.45, 0.01);
});
test('transferência: tensões dentro dos limites no meio e na ponta (com isolamento)', () => {
  const t = transferencia();
  assert.ok(t.meio.base <= t.lim.compr && t.meio.base > 0);
  assert.ok(-t.meio.top <= t.lim.tracao);
  assert.ok(-t.ponta.top <= t.lim.tracao, 'ponta com isolamento');
  assert.ok(-t.pontaSemIsol.top > t.lim.tracao, 'sem isolamento a ponta passaria do limite (motivo do isolamento)');
  assert.ok(t.perc > 0.03 && t.perc < 0.08);
});
test('contraflecha para cima e quase zerada pela laje', () => {
  const t = transferencia(), l = comLaje();
  assert.ok(t.contraflecha > 8 && t.contraflecha < 20);
  assert.ok(l.contraflechaFinal > 0 && l.contraflechaFinal < 4);
  assert.ok(l.top < l.limCompr && l.base > 0, 'base continua comprimida com perdas diferidas');
});
test('força cresce na transferência e tensão no meio bate com o resumo', () => {
  assert.equal(forcaEm(0), 0);
  assert.ok(forcaEm(1.0) < forcaEm(3.0));
  const t = transferencia();
  perto(forcaEm(PRE.L / 2), t.P, 1e-6);
  perto(tensaoEm(PRE.L / 2, 0), t.meio.base, 1e-6);
  perto(tensaoEm(PRE.L / 2, PRE.h), t.meio.top, 1e-6);
});
test('cura térmica: sobe a 15 °C/h até 60 °C e resfria', () => {
  assert.equal(curaTermica(1), 25);
  assert.equal(curaTermica(8), 60);
  perto(curaTermica(4), 40, 1e-9);
  assert.equal(curaTermica(20), 25);
});
