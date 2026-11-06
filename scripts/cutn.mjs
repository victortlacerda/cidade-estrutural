// Uso: node scripts/cutn.mjs prefixo "t1,t2,..." [w] [h] [tema] [obra]
// Abre o build único por file://, entra na obra, pausa em cada t e salva /tmp/e/<prefixo><i>.png
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const [pref = 'v', ts = '5', w = '1440', h = '860', tema = 'claro', obra = 'viga'] = process.argv.slice(2);
mkdirSync('/tmp/e', { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const erros = [];
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erros.push(m.text()); });
p.on('pageerror', (e) => erros.push('PAGEERROR ' + e.message));
await p.goto('file://' + resolve('dist/cidade-estrutural.html') + (obra === 'cidade' ? '' : '#' + obra));
await p.waitForFunction(() => window.__app, null, { timeout: 60000 });
await p.evaluate((t) => { if (t === 'escuro') window.__app.motor.aplicarTema('escuro'); }, tema);
await p.waitForTimeout(2500);
let i = 0;
for (const t of ts.split(',')) {
  await p.evaluate(([t, obra]) => {
    const a = window.__app;
    if (obra !== 'cidade') { const o = a.obras[obra]; o.state.paused = true; o.state.tc = +t; o.state.hold = 0; o.render(+t);
      o.render(+t); a.motor.pular(a.ui.camPara(o, o.state.step)); }
  }, [t, obra]);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `/tmp/e/${pref}${i}.png` });
  i++;
}
console.log(erros.length ? 'ERROS:\n' + erros.join('\n') : 'sem erros');
await b.close();
