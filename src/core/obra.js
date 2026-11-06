// Base de uma obra: relógio da sequência, ciclo com pausa no fim, rótulos e câmera por etapa.
import * as THREE from 'three';

export function criarObra(motor, origem, cfg) {
  const root = new THREE.Group(); root.name = 'obra-' + cfg.id;
  root.position.set(...origem); root.visible = false;
  motor.scene.add(root);
  const P = (x, y, z) => new THREE.Vector3(origem[0] + x, origem[1] + y, origem[2] + z);
  const state = { active: false, speed: 1, paused: false, tc: 0, hold: 0, step: 0, progress: 0, note: '' };
  let rotulos = [];

  const obra = {
    id: cfg.id, group: root, state, P,
    nome: cfg.nome, tit: cfg.tit, sub: cfg.sub, hide: cfg.hide,
    steps: cfg.steps, starts: cfg.starts, fim: cfg.fim,
    // câmeras por etapa em coordenadas locais: [alvo x,y,z, dist, yaw, pitch]
    camEtapa: (i) => {
      const c = cfg.cams[Math.min(i, cfg.cams.length - 1)];
      return { alvo: [origem[0] + c[0], origem[1] + c[1], origem[2] + c[2]], dist: c[3], yaw: c[4] ?? 0, pitch: c[5] ?? 0.12 };
    },
    rotulos(lista) {
      rotulos = lista.map(([texto, a, b, pos, classe]) => ({ r: motor.rotulo(texto, classe ?? 'destaque'), a, b, pos }));
    },
    render(t) {
      const note = cfg.render(t);
      for (const R of rotulos) { R.r.vis = state.active && t >= R.a && t < R.b; if (R.r.vis) R.r.pos.copy(R.pos(t)); }
      let s = 0; while (s + 1 < cfg.starts.length && t >= cfg.starts[s + 1]) s++;
      state.step = s; state.progress = t / cfg.fim; state.note = note ?? '';
    },
    update(dt) {
      if (!state.active) return;
      if (!state.paused) {
        if (state.hold > 0) { state.hold -= dt; if (state.hold <= 0) { state.hold = 0; state.tc = 0; } }
        else { state.tc += dt * state.speed; if (state.tc >= cfg.fim) { state.tc = cfg.fim; state.hold = 3.5; } }
      }
      obra.render(state.tc);
    },
    enter() { state.active = true; state.tc = 0; state.hold = 0; state.paused = false; root.visible = true; obra.render(0); },
    exit() { state.active = false; root.visible = false; rotulos.forEach((R) => { R.r.vis = false; }); },
  };
  obra.cam = obra.camEtapa(0);
  return obra;
}
