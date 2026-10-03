// Renderer, scene, camera, PS1 helpers and the color-reduction post pass.
import * as THREE from 'three';

const W = () => innerWidth, H = () => innerHeight;
export const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(W(), H());
document.body.appendChild(renderer.domElement);
export const cvs = renderer.domElement;

export const scene = new THREE.Scene();
export const FOG = new THREE.Color(0x081020);
scene.fog = new THREE.FogExp2(FOG, 0.0065);
scene.background = FOG;
export const camera = new THREE.PerspectiveCamera(70, W() / H(), 0.1, 1200);
scene.add(camera);

// ---------- PS1: affine (warped) textures ----------
export function ps1(mat) {
  mat.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAff;')
      .replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef USE_MAP\nvAff = vec3(vMapUv * gl_Position.w, gl_Position.w);\n#endif');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAff;')
      .replace('#include <map_fragment>', '#ifdef USE_MAP\ndiffuseColor *= texture2D(map, mix(vMapUv, vAff.xy / vAff.z, 0.45));\n#endif');
  };
  return mat;
}

// ---------- tiny procedural textures, limited palette ----------
export function tex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapNearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export function noise(g, w, h, pal) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { g.fillStyle = pick(pal); g.fillRect(x, y, 1, 1); } }

// ---------- post: limited colors + subtle dither (full resolution) ----------
const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: rt.texture }, levels: { value: 20.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float levels; varying vec2 vUv;
    float bayer(vec2 p){ int x=int(mod(p.x,4.)), y=int(mod(p.y,4.)); int i=x+y*4;
      int m[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5); return float(m[i])/16.-0.5; }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      c = pow(max(c, 0.0), vec3(1.0/2.2));
      c += bayer(floor(gl_FragCoord.xy / 2.0)) / levels;
      c = floor(c * levels + 0.5) / levels;
      gl_FragColor = vec4(c, 1.0);
    }`,
  depthTest: false, depthWrite: false,
}));
const postScene = new THREE.Scene(); postScene.add(post);
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function resize() {
  renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix();
  const v = renderer.getDrawingBufferSize(new THREE.Vector2()); rt.setSize(v.x, v.y);
}
addEventListener('resize', resize); resize();

export function render() {
  renderer.setRenderTarget(rt); renderer.render(scene, camera);
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}
