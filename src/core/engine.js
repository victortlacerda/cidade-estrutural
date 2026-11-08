// Motor: renderizador, cena, luzes, câmera orbital com voo suave, tema e rótulos 3D.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CORES } from '../config.js';
import { ease, clamp } from './kit.js';

export function criarMotor(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xdfe5ea, 220, 560);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1200);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8f86, 0.75);
  scene.add(hemi);
  const sol = new THREE.DirectionalLight(0xfff4e6, 1.6);
  sol.position.set(-70, 120, 90);
  sol.castShadow = true;
  sol.shadow.mapSize.set(4096, 4096);
  const sc = sol.shadow.camera;
  sc.left = -150; sc.right = 150; sc.top = 125; sc.bottom = -125; sc.near = 10; sc.far = 400;
  sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.03;
  scene.add(sol, sol.target);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.47; controls.minDistance = 0.5; controls.maxDistance = 420;

  // Voo de câmera: alvo + distância + yaw + pitch
  let voo = null;
  function posDe(alvo, dist, yaw, pitch) {
    return new THREE.Vector3(
      alvo.x + dist * Math.cos(pitch) * Math.sin(yaw),
      alvo.y + dist * Math.sin(pitch),
      alvo.z + dist * Math.cos(pitch) * Math.cos(yaw));
  }
  function voar({ alvo, dist, yaw = 0.6, pitch = 0.6, dur = 1.6 }) {
    const a = new THREE.Vector3(...alvo);
    voo = { t: 0, dur, a0: controls.target.clone(), p0: camera.position.clone(), a1: a, p1: posDe(a, dist, yaw, pitch) };
  }
  function pular(cfg) { voar({ ...cfg, dur: 0.001 }); atualizarVoo(1); }
  function atualizarVoo(dt) {
    if (!voo) return;
    voo.t += dt;
    const u = ease(clamp(voo.t / voo.dur));
    controls.target.lerpVectors(voo.a0, voo.a1, u);
    camera.position.lerpVectors(voo.p0, voo.p1, u);
    if (u >= 1) voo = null;
  }
  controls.addEventListener('start', () => { voo = null; });

  // Tema
  let tema = 'claro';
  function aplicarTema(t) {
    tema = t;
    const c = CORES[t];
    scene.background = new THREE.Color(c.ceu);
    scene.fog.color.set(c.nevoa);
    hemi.intensity = c.hemi; sol.intensity = 1.6 * c.luz;
    hemi.groundColor.set(t === 'claro' ? 0x8a8f86 : 0x23282d);
    document.documentElement.dataset.theme = t === 'claro' ? 'light' : 'dark';
    ouvintesTema.forEach((f) => f(t));
  }
  const ouvintesTema = [];

  // Rótulos 3D (DOM projetado)
  const camada = document.getElementById('rotulos');
  const rotulos = [];
  function rotulo(texto, classe = '') {
    const el = document.createElement('div');
    el.className = 'rotulo ' + classe; el.textContent = texto; el.hidden = true;
    camada.appendChild(el);
    const r = { el, pos: new THREE.Vector3(), vis: false, set texto(v) { el.textContent = v; } };
    rotulos.push(r);
    return r;
  }
  const v = new THREE.Vector3();
  function projetarRotulos() {
    const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
    camera.updateMatrixWorld();
    for (const r of rotulos) {
      if (!r.vis) { if (!r.el.hidden) r.el.hidden = true; continue; }
      v.copy(r.pos).project(camera);
      const fora = v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1;
      r.el.hidden = fora;
      if (!fora) r.el.style.transform = `translate(${((v.x + 1) / 2 * w).toFixed(1)}px, ${((1 - v.y) / 2 * h).toFixed(1)}px)`;
    }
  }

  function redimensionar() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', redimensionar);
  redimensionar();

  return {
    raycasterClass: THREE.Raycaster,
    renderer, scene, camera, controls, sol, hemi, voar, pular, atualizarVoo, aplicarTema,
    get tema() { return tema; }, aoTema: (f) => ouvintesTema.push(f), rotulo, projetarRotulos, redimensionar,
  };
}
