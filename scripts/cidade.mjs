// Fotos da cidade viva: avança o relógio da cidade e fotografa vistas. Uso: node scripts/cidade.mjs prefixo [w] [h]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const [pref = 'c', w = '1440', h = '860'] = process.argv.slice(2);
mkdirSync('/tmp/e', { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const erros = [];
p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
p.on('pageerror', (e) => erros.push('PAGEERROR ' + e.message));
await p.goto('file://' + resolve('dist/cidade-estrutural.html'));
await p.waitForFunction(() => window.__app, null, { timeout: 60000 });
const avanca = (s) => p.evaluate((s) => { for (let i = 0; i < s * 10; i++) window.__app.vida.update(0.1); }, s);
await avanca(25); await p.waitForTimeout(2000);
await p.screenshot({ path: `/tmp/e/${pref}0.png` });
await p.evaluate(() => { const a = window.__app; const z = a.cidade.vinhetas.A.parent.position; a.motor.pular({ alvo: [z.x, 2, z.z], dist: 70, yaw: 0.45, pitch: 0.6 }); });
await avanca(8); await p.waitForTimeout(2000);
await p.screenshot({ path: `/tmp/e/${pref}1.png` });
await p.evaluate(() => { const a = window.__app; a.vida.seguir(a.vida.logistica[1]); a.motor.atualizarVoo(5); });
await avanca(6); await p.evaluate(() => window.__app.motor.atualizarVoo(5)); await p.waitForTimeout(2000);
await p.screenshot({ path: `/tmp/e/${pref}2.png` });
const ev = await p.evaluate(() => window.__app.vida.eventos.map((e) => e.texto));
console.log(ev.join('\n'));
console.log(erros.length ? 'ERROS:\n' + erros.join('\n') : 'sem erros');
await b.close();
