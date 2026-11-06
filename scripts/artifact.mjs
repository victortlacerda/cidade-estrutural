// Gera dist/artifact.html (fragmento para publicar, título no topo) e dist/cidade-estrutural.html (abre por duplo clique).
import { readFileSync, writeFileSync } from 'node:fs';
let html = readFileSync('dist/index.html', 'utf8');
const scripts = [];
html = html.replace(/<script type="module"[^>]*>[\s\S]*?<\/script>/g, (s) => { scripts.push(s.replace(' crossorigin', '')); return ''; });
html = html.replace(/<\/?(html|head|body)[^>]*>/gi, '').replace(/<!doctype[^>]*>/i, '').replace(/<meta charset[^>]*>/i, '').trim();
const miolo = html + '\n' + scripts.join('\n');
writeFileSync('dist/artifact.html', miolo);
writeFileSync('dist/cidade-estrutural.html',
  `<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head><body style="margin:0">\n${miolo}\n</body></html>`);
console.log('artifact.html', (miolo.length / 1024).toFixed(0), 'KB · título no início:', miolo.slice(0, 40));
