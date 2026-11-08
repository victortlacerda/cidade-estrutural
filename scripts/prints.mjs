// Gera as imagens de apresentação em docs/img (PNG temporário em /tmp/prints; o README usa os JPG).
// Uso: node scripts/prints.mjs [filtro]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const filtro = process.argv[2] || '';
const SHOTS = [
  { nome: '01-cidade', w: 1600, h: 900, limpo: true, cidade: 30, cam: { alvo: [6, 0, 4], dist: 205, yaw: 0.42, pitch: 0.6 } },
  { nome: '02-rio-pontes', w: 1600, h: 900, limpo: true, cidade: 20, cam: { alvo: [28, 4, 0], dist: 105, yaw: 0.85, pitch: 0.32 } },
  { nome: '03-logistica', w: 1600, h: 900, cidade: 40, cam: { alvo: [-40, 0, -20], dist: 120, yaw: 0.5, pitch: 0.55 } },
  { nome: '04-viga', w: 1600, h: 900, obra: 'viga', t: 112 },
  { nome: '05-compressao', w: 1600, h: 900, obra: 'compressao', t: 74 },
  { nome: '06-tracao', w: 1600, h: 900, obra: 'tracao', t: 70 },
  { nome: '07-protensao', w: 1600, h: 900, obra: 'protensao', t: 92 },
  { nome: '08-icamento', w: 1600, h: 900, obra: 'icamento', t: 30 },
  { nome: '09-estaiada', w: 1600, h: 900, obra: 'estaiada', t: 66 },
  { nome: '10-estaiada-fundacao', w: 1600, h: 900, obra: 'estaiada', t: 12 },
  { nome: '11-escuro', w: 1600, h: 900, obra: 'estaiada', t: 108, tema: 'escuro' },
  { nome: '12-celular', w: 390, h: 844, obra: 'protensao', t: 86 },
].filter((s) => s.nome.includes(filtro));

mkdirSync('/tmp/prints', { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
for (const s of SHOTS) {
  const p = await b.newPage({ viewport: { width: s.w, height: s.h } });
  const erros = [];
  p.on('pageerror', (e) => erros.push(e.message));
  await p.goto('file://' + resolve('dist/cidade-estrutural.html') + (s.obra ? '#' + s.obra : ''));
  await p.waitForFunction(() => window.__app, null, { timeout: 60000 });
  await p.evaluate((s) => {
    const a = window.__app;
    if (s.tema === 'escuro') a.motor.aplicarTema('escuro');
    if (s.cidade) for (let i = 0; i < s.cidade * 10; i++) a.vida.update(0.1);
    if (s.obra) {
      const o = a.obras[s.obra]; o.state.paused = true; o.state.tc = s.t; o.state.hold = 0; o.render(s.t);
      a.motor.pular(a.ui.camPara(o, o.state.step));
    } else if (s.cam) a.motor.pular(s.cam);
    if (s.limpo) document.querySelectorAll('.barra, #agora, #ajuda, #placas').forEach((e) => { e.style.visibility = 'hidden'; });
    document.body.classList.toggle('print', true);
  }, s);
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const a = window.__app; a.ui.atualizar(); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `/tmp/prints/${s.nome}.png` });
  console.log(s.nome, erros.length ? 'ERRO ' + erros.join(' | ') : 'ok');
  await p.close();
}
await b.close();
