// Interface: índice das zonas, ficha da obra (etapas, texto, linha do tempo), tour e tema.
import { ZONAS, LOTE } from '../config.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const celular = () => window.innerWidth <= 860;

export const VISTA_GERAL = { alvo: [0, 0, 0], dist: 300, yaw: 0.3, pitch: 0.82 };
export const VISTA_RIO = { alvo: [30, 2, 0], dist: 120, yaw: 0.75, pitch: 0.42 };
export const vistaZona = (z) => (z.id === 'C'
  ? { alvo: [z.x + 6, 2, z.z + 30], dist: celular() ? 130 : 95, yaw: 0.55, pitch: 0.5 }
  : { alvo: [z.x, 2, z.z], dist: celular() ? 95 : 68, yaw: 0.45, pitch: 0.62 });

// Ajusta a câmera de uma etapa: no computador desloca o alvo para a área livre à esquerda da ficha;
// no celular afasta e desce o alvo para a cena ficar acima da ficha.
function ajustarCam(c) {
  const [x, y, z] = c.alvo;
  if (celular()) return { ...c, alvo: [x, y - 0.42 * c.dist, z], dist: c.dist * 1.9 };
  return { ...c, alvo: [x + 0.17 * c.dist, y, z] };
}

export function criarUI(motor, cidade, obras, vida) {
  let atual = null, tour = null, arrastando = false, camManual = false;
  motor.controls.addEventListener('start', () => { camManual = true; });

  // índice
  $('listaZonas').innerHTML = ZONAS.map((z) => `
    <div class="zona">
      <button class="zona-cab" type="button" data-zona="${z.id}"><span class="letra">${z.id}</span><span class="nome">${esc(z.nome)}</span></button>
      <ul class="obras">${z.obras.map((o) => o.pronta
        ? `<li><button type="button" data-obra="${o.id}">${esc(o.nome)} <span class="pronta">abrir</span></button></li>`
        : `<li><span>${esc(o.nome)}</span><span class="breve">em breve</span></li>`).join('') || '<li><span>Entrada da cidade</span></li>'}</ul>
    </div>`).join('');
  $('listaZonas').addEventListener('click', (e) => {
    const zb = e.target.closest('[data-zona]'), ob = e.target.closest('[data-obra]');
    pararTour();
    if (ob) abrir(ob.dataset.obra);
    else if (zb) { sair(); motor.voar(vistaZona(ZONAS.find((z) => z.id === zb.dataset.zona))); }
    fecharIndice();
  });
  const fecharIndice = () => { $('indice').classList.add('fechado'); $('abrirIndice').setAttribute('aria-expanded', 'false'); };
  $('abrirIndice').onclick = () => {
    const f = $('indice').classList.toggle('fechado');
    $('abrirIndice').setAttribute('aria-expanded', String(!f));
  };

  $('btnGeral').onclick = () => { pararTour(); sair(); vida?.pararSeguir(); motor.voar(VISTA_GERAL); };
  $('btnTema').onclick = () => { motor.aplicarTema(motor.tema === 'claro' ? 'escuro' : 'claro'); textoTema(); };
  const textoTema = () => { $('btnTema').textContent = motor.tema === 'claro' ? 'Tema escuro' : 'Tema claro'; };
  textoTema();

  // obra
  function abrir(id, etapa = 0) {
    const o = obras[id]; if (!o) return;
    pararTour();
    if (atual && atual !== o) { atual.exit(); if (cidade.vinhetas[atual.hide]) cidade.vinhetas[atual.hide].visible = true; }
    atual = o;
    if (cidade.vinhetas[o.hide]) cidade.vinhetas[o.hide].visible = false;
    o.enter();
    if (etapa) { o.state.tc = o.starts[etapa] + 0.01; o.render(o.state.tc); }
    camManual = false;
    if (vida) vida.emObra = true;
    motor.voar({ ...(o.camEtapa ? ajustarCam(o.camEtapa(etapa)) : (celular() ? o.mcam : o.cam)), dur: 2.0 });
    $('obra').hidden = false; $('nota').hidden = false; $('ajuda').hidden = true;
    document.body.classList.add('em-obra'); fecharIndice();
    $('obraSub').textContent = o.sub; $('obraTit').textContent = o.tit;
    $('etapas').innerHTML = o.steps.map((s, i) => `<li><button type="button" data-passo="${i}">${esc(s.t)}</button></li>`).join('');
    ultimoPasso = -1;
    $('ligacoes').innerHTML = (o.ligacoes || []).map((l, i) => `<button type="button" data-lig="${i}">${esc(l.texto)}</button>`).join('');
    $('ligacoes').hidden = !(o.ligacoes || []).length;
    try { history.replaceState(null, '', '#' + id); } catch { /* sem histórico */ }
  }
  function sair() {
    if (!atual) return;
    atual.exit();
    if (cidade.vinhetas[atual.hide]) cidade.vinhetas[atual.hide].visible = true;
    atual = null;
    if (vida) vida.emObra = false;
    $('obra').hidden = true; $('nota').hidden = true; $('ajuda').hidden = false;
    document.body.classList.remove('em-obra');
    try { history.replaceState(null, '', location.pathname + location.search); } catch { /* sem histórico */ }
  }
  $('etapas').addEventListener('click', (e) => {
    const b = e.target.closest('[data-passo]'); if (!b || !atual) return;
    atual.state.tc = atual.starts[+b.dataset.passo] + 0.01; atual.state.hold = 0;
  });
  $('btnSair').onclick = () => { const z = ZONAS.find((zz) => zz.id === atual?.hide); sair(); if (z) motor.voar(vistaZona(z)); };
  $('btnPlay').onclick = () => { if (!atual) return; atual.state.paused = !atual.state.paused; textoPlay(); };
  const textoPlay = () => {
    const p = atual?.state.paused;
    $('btnPlay').textContent = p ? 'Continuar' : 'Pausar'; $('btnPlay').setAttribute('aria-label', p ? 'Continuar' : 'Pausar');
  };
  $('vel').onchange = (e) => { if (atual) atual.state.speed = +e.target.value; };
  const linha = $('linha');
  linha.addEventListener('input', () => { if (!atual) return; arrastando = true; atual.state.tc = +linha.value / 1000 * atual.fim; atual.state.hold = 0; });
  linha.addEventListener('change', () => { arrastando = false; });

  let ultimoPasso = -1, ultimaNota = '';
  function atualizar() {
    atualizarAgora();
    if (!atual) return;
    const s = atual.state;
    if (!arrastando) linha.value = Math.round(s.tc / atual.fim * 1000);
    $('tempo').textContent = `${mmss(s.tc)} / ${mmss(atual.fim)}`;
    if (s.step !== ultimoPasso) {
      ultimoPasso = s.step;
      [...$('etapas').querySelectorAll('button')].forEach((b, i) => {
        b.toggleAttribute('aria-current', i === s.step); if (i === s.step) b.setAttribute('aria-current', 'step');
        b.classList.toggle('feita', i < s.step);
      });
      if (atual.camEtapa && !camManual) motor.voar({ ...ajustarCam(atual.camEtapa(s.step)), dur: 1.6 });
      const st = atual.steps[s.step];
      $('texto').innerHTML = `<h3>${s.step + 1}. ${esc(st.t)}</h3><p>${esc(st.d)}</p>
        <p class="exemplo">Números de exemplo didático, não são de projeto.</p>`;
      if (celular()) $('etapas').children[s.step]?.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
    if (s.note !== ultimaNota) { ultimaNota = s.note; $('nota').textContent = s.note; }
  }

  // ligações entre obras
  $('ligacoes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lig]'); if (!b || !atual) return;
    const l = atual.ligacoes[+b.dataset.lig]; abrir(l.obra, l.etapa ?? 0);
  });

  // vida da cidade: placas, botões de obra, veículos, painel "Agora na cidade"
  let ultimoEvento = null;
  function atualizarAgora() {
    if (!vida) return;
    const ev = vida.eventos[0];
    if (ev === ultimoEvento) return;
    ultimoEvento = ev;
    $('eventos').innerHTML = vida.eventos.slice(0, 4).map((e, i) =>
      `<li><span>${esc(e.texto)}</span>${e.alvo ? `<button type="button" data-seguir="${i}">Seguir</button>` : ''}</li>`).join('')
      || '<li><span>Veículos saindo para as primeiras entregas…</span></li>';
  }
  if (vida) {
    vida.placas.forEach((p) => { p.el.onclick = () => { pararTour(); sair(); vida.pararSeguir(); motor.voar(vistaZona(p.zona)); }; });
    vida.botoesObra.forEach((b) => { b.el.onclick = () => abrir(b.obra); });
    $('eventos').addEventListener('click', (e) => {
      const b = e.target.closest('[data-seguir]'); if (!b) return;
      pararTour(); vida.seguir(vida.eventos[+b.dataset.seguir].alvo);
    });
    vida.aoSeguir((v) => { $('seguindo').hidden = !v; if (v) $('seguindo').textContent = `Seguindo ${v.nome} · parar`; });
    $('seguindo').onclick = () => vida.pararSeguir();
  }

  // tour: sobrevoa as zonas e termina dentro da obra pronta
  function iniciarTour() {
    sair();
    const paradas = [VISTA_GERAL, VISTA_RIO, ...ZONAS.map(vistaZona)];
    let i = 0;
    const passo = () => {
      if (i < paradas.length) { motor.voar({ ...paradas[i], dur: 2.2 }); i++; tour = setTimeout(passo, 3600); }
      else { tour = null; $('btnTour').textContent = 'Tour guiado'; abrir('viga'); }
    };
    $('btnTour').textContent = 'Parar tour';
    passo();
  }
  function pararTour() { if (tour) { clearTimeout(tour); tour = null; } $('btnTour').textContent = 'Tour guiado'; }
  $('btnTour').onclick = () => (tour ? pararTour() : iniciarTour());
  motor.controls.addEventListener('start', pararTour);

  // teclado: espaço pausa, Esc sai
  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === 'Escape') $('btnSair').click();
    if (e.key === ' ' && atual) { e.preventDefault(); $('btnPlay').click(); }
  });

  const camPara = (o, i) => (o.camEtapa ? ajustarCam(o.camEtapa(i)) : (celular() ? o.mcam : o.cam));
  return { abrir, sair, atualizar, camPara, get atual() { return atual; }, LOTE };
}
