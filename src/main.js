// Monta motor, cidade, obras e interface, e roda o laço de animação.
import { criarMotor } from './core/engine.js';
import { criarCidade } from './world.js';
import { criarViga } from './zones/viga.js';
import { criarCompressao } from './zones/compressao.js';
import { criarTracao } from './zones/tracao.js';
import { criarUI, VISTA_GERAL } from './ui/ui.js';
import { criarVida } from './vida.js';
import { zona } from './config.js';

const motor = criarMotor(document.getElementById('cena'));
const cidade = criarCidade(motor);
const A = zona('A');
const E = zona('E');
const obras = {
  viga: criarViga(motor, [A.x, 0.2, A.z + 4]),
  compressao: criarCompressao(motor, [E.x - 9, 0.2, E.z + 10]),
  tracao: criarTracao(motor, [E.x + 8, 0.2, E.z + 10]),
};
// ligações entre obras: o concreto e o aço da viga são os ensaiados no laboratório
obras.viga.ligacoes = [
  { texto: 'Ensaio do concreto desta viga (E1)', obra: 'compressao' },
  { texto: 'Ensaio do aço destas barras (E2)', obra: 'tracao' },
];
obras.compressao.ligacoes = [
  { texto: 'Ver a concretagem da viga (A1)', obra: 'viga', etapa: 3 },
  { texto: 'Ensaio do aço (E2)', obra: 'tracao' },
];
obras.tracao.ligacoes = [
  { texto: 'Ver as barras na viga (A1)', obra: 'viga', etapa: 2 },
  { texto: 'Ensaio do concreto (E1)', obra: 'compressao' },
];
const vida = criarVida(motor, cidade);
const ui = criarUI(motor, cidade, obras, vida);

let temaInicial = 'claro';
try { if (window.matchMedia('(prefers-color-scheme: dark)').matches) temaInicial = 'escuro'; } catch { /* sem matchMedia */ }
motor.aplicarTema(temaInicial);
document.getElementById('btnTema').textContent = temaInicial === 'claro' ? 'Tema escuro' : 'Tema claro';
motor.pular(VISTA_GERAL);

const id = location.hash.slice(1);
if (obras[id]) ui.abrir(id);

let antes = performance.now();
function laco(agora) {
  const dt = Math.min(0.1, (agora - antes) / 1000); antes = agora;
  motor.atualizarVoo(dt);
  motor.controls.update();
  vida.update(dt);
  for (const o of Object.values(obras)) o.update(dt);
  ui.atualizar();
  motor.renderer.render(motor.scene, motor.camera);
  motor.projetarRotulos();
  requestAnimationFrame(laco);
}
requestAnimationFrame(laco);

window.__app = { motor, cidade, obras, ui, vida, viga: obras.viga };
