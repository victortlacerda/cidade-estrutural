// Sala de laboratório em corte (piso, parede do fundo com janela, parede lateral baixa e bancada).
import * as THREE from 'three';
import { box, at, mat } from '../core/kit.js';

export function salaLab(root, { w = 5.2, d = 3.6, bancadaX = -1.5 } = {}) {
  root.add(at(box(w, 0.1, d, 0xb8bcbf, { sombra: false }), 0, -0.05, 0));
  root.add(at(box(w, 0.012, d - 0.2, 0x9fb2a2, { sombra: false, r: 0.5 }), 0, 0.006, 0));     // faixa de piso epóxi
  root.add(at(box(w, 3.0, 0.12, 0xe6e4de), 0, 1.5, -d / 2));                                  // parede do fundo
  root.add(at(box(0.12, 1.2, d, 0xdedcd5), -w / 2, 0.6, 0));                                  // lateral cortada
  root.add(at(box(w + 0.1, 0.14, 0.2, 0x8b8f93), 0, 3.05, -d / 2 + 0.02));                    // viga de borda
  // bancada
  const b = new THREE.Group(); b.position.set(bancadaX, 0, -0.05);
  b.add(at(box(1.3, 0.84, 0.66, 0x8c96a0), 0, 0.42, 0));
  b.add(at(box(1.36, 0.06, 0.72, 0xd4d2cb), 0, 0.87, 0));
  root.add(b);
  return { topoBancada: 0.9 };
}

export const metal = (cor = 0x7d8790) => mat(cor, { r: 0.45, m: 0.35 });
