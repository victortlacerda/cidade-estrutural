// Monta motor, cidade, obras e interface, e roda o laço de animação.
import { criarMotor } from './core/engine.js';
import { criarCidade } from './world.js';
import { criarViga } from './zones/viga.js';
import { criarUI, VISTA_GERAL } from './ui/ui.js';
import { zona } from './config.js';

const motor = criarMotor(document.getElementById('cena'));
const cidade = criarCidade(motor);
const A = zona('A');
const obras = { viga: criarViga(motor, [A.x, 0.2, A.z + 4]) };
const ui = criarUI(motor, cidade, obras);

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
  for (const o of Object.values(obras)) o.update(dt);
  ui.atualizar();
  motor.renderer.render(motor.scene, motor.camera);
  motor.projetarRotulos();
  requestAnimationFrame(laco);
}
requestAnimationFrame(laco);

window.__app = { motor, cidade, obras, ui, viga: obras.viga };
