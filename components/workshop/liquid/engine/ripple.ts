// PROTOTYPE, never merge. Liquid Pour workshop: a ping-pong height-field ripple tank
// (the classic discrete 2D wave equation). Impacts drop gaussian impulses in; waves
// propagate, interfere, reflect off the edges and decay. This is what makes a pool read
// as liquid instead of drifting noise.
//
// Packing: R = height now, G = height one step ago. Fixed 60 Hz steps, max 3 per frame.
import * as THREE from "three";

import { FULLSCREEN_VERT } from "./glsl";
import { createFullscreenTriangle } from "./post";

const SIM_FRAG = /* glsl */ `
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uDamp;
uniform vec4 uDrops[4];
uniform int uDropCount;
varying vec2 vUv;

void main() {
  vec4 c = texture2D(uState, vUv);
  float n = texture2D(uState, vUv + vec2(0.0, uTexel.y)).r;
  float s = texture2D(uState, vUv - vec2(0.0, uTexel.y)).r;
  float e = texture2D(uState, vUv + vec2(uTexel.x, 0.0)).r;
  float w = texture2D(uState, vUv - vec2(uTexel.x, 0.0)).r;
  float h = ((n + s + e + w) * 0.5 - c.g) * uDamp;
  for (int i = 0; i < 4; i++) {
    if (i >= uDropCount) break;
    vec4 d = uDrops[i];
    vec2 q = (vUv - d.xy) / max(d.z, 1e-4);
    h += d.w * exp(-dot(q, q));
  }
  gl_FragColor = vec4(clamp(h, -4.0, 4.0), c.r, 0.0, 1.0);
}
`;

interface Drop {
  u: number;
  v: number;
  radius: number;
  strength: number;
}

export class RippleField {
  enabled = true;
  private read: THREE.WebGLRenderTarget;
  private write: THREE.WebGLRenderTarget;
  private readonly material: THREE.ShaderMaterial;
  private readonly geometry: THREE.BufferGeometry;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly drops = Array.from({ length: 4 }, () => new THREE.Vector4());
  private queue: Drop[] = [];
  private acc = 0;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    readonly size: number,
  ) {
    const options: THREE.RenderTargetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.read = new THREE.WebGLRenderTarget(size, size, options);
    this.write = new THREE.WebGLRenderTarget(size, size, options);
    this.geometry = createFullscreenTriangle();
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uState: { value: null },
        uTexel: { value: new THREE.Vector2(1 / size, 1 / size) },
        uDamp: { value: 0.988 },
        uDrops: { value: this.drops },
        uDropCount: { value: 0 },
      },
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: SIM_FRAG,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.geometry, this.material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.clear();
  }

  get texture(): THREE.Texture {
    return this.read.texture;
  }

  /** u, v in [0, 1] texture space; radius in uv units; strength in height units. */
  addDrop(u: number, v: number, radius: number, strength: number): void {
    if (!this.enabled) return;
    if (this.queue.length > 12) this.queue.shift();
    this.queue.push({ u, v, radius, strength });
  }

  step(dt: number): void {
    if (!this.enabled) return;
    this.acc += dt;
    let steps = 0;
    while (this.acc >= 1 / 60 && steps < 3) {
      this.simulate();
      this.acc -= 1 / 60;
      steps++;
    }
    if (steps === 3) this.acc = 0;
  }

  clear(): void {
    const prev = this.renderer.getRenderTarget();
    for (const rt of [this.read, this.write]) {
      this.renderer.setRenderTarget(rt);
      this.renderer.clear(true, false, false);
    }
    this.renderer.setRenderTarget(prev);
    this.queue = [];
  }

  dispose(): void {
    this.read.dispose();
    this.write.dispose();
    this.material.dispose();
    this.geometry.dispose();
  }

  private simulate(): void {
    const n = Math.min(4, this.queue.length);
    for (let i = 0; i < n; i++) {
      const d = this.queue.shift() as Drop;
      this.drops[i].set(d.u, d.v, d.radius, d.strength);
    }
    this.material.uniforms.uDropCount.value = n;
    this.material.uniforms.uState.value = this.read.texture;
    this.renderer.setRenderTarget(this.write);
    this.renderer.render(this.scene, this.camera);
    const t = this.read;
    this.read = this.write;
    this.write = t;
  }
}
