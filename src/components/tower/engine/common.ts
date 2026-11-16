// What every layer of the tower scene shares: the blue-hour palette, the uniforms all materials read (one sky,
// one haze, one clock, one travelling light), the GLSL they include, and small batch builders so a layer is
// mostly a list of boxes and lights. World: metres, +X east, +Y up, +Z south; the tower stands on the origin.
import {
  AdditiveBlending, BoxGeometry, BufferGeometry, Color, DynamicDrawUsage, InstancedBufferAttribute, InstancedMesh, Matrix4,
  Object3D, PlaneGeometry, Quaternion, ShaderMaterial, Vector2, Vector3, type IUniform,
} from "three";

export type Tier = "high" | "low";
export type Layer = { object: Object3D; update?: (time: number, dt: number) => void; dispose: () => void };

// Colours are written as the eye sees them (sRGB hex); three converts them to its linear working space.
export const PALETTE = {
  zenith: "#0d1a40",
  skyHigh: "#1d3a78",
  skyLow: "#5f8cc0",
  horizonCool: "#6f8fbb",
  horizonWarm: "#eeae8a",
  ember: "#e8815a",      // the last band of afterglow, right on the horizon
  skyLight: "#5d7fb8",   // what the open sky pours on a surface
  groundLight: "#1a2238",
  glowLight: "#ff9e6e",  // the afterglow as a low side light
  bronze: "#6b4a38",
  bronzeDark: "#3a2b25",
  concrete: "#565c6b",
  asphalt: "#1b2030",
  roomWarm: "#ffb96e",   // an occupied office
  roomCool: "#dbe8ff",   // a monitor, a stairwell
  gold: "#ffcf5a",       // the idea. Nothing else in the scene is gold.
  goldHot: "#fff3cf",
  answer: "#9af0c2",     // the answer coming back
  late: "#ff5a1f",       // the product's orange for time: overdue
  sodium: "#ff9a3c",     // Berlin's street lamps
  tail: "#ff2a1f",
  beacon: "#ff3524",
} as const;

export type Shared = Record<
  | "uTime" | "uZenith" | "uSkyHigh" | "uSkyLow" | "uHorizonCool" | "uHorizonWarm" | "uEmber" | "uGlowDir" | "uFog"
  | "uSkyLight" | "uGroundLight" | "uGlowLight" | "uSparkPos" | "uSparkColor" | "uSparkPower" | "uDay" | "uDayColor",
  IUniform
>;

export function createShared(): Shared {
  const c = (hex: string) => ({ value: new Color(hex) });
  return {
    uTime: { value: 0 },
    uZenith: c(PALETTE.zenith), uSkyHigh: c(PALETTE.skyHigh), uSkyLow: c(PALETTE.skyLow),
    uHorizonCool: c(PALETTE.horizonCool), uHorizonWarm: c(PALETTE.horizonWarm), uEmber: c(PALETTE.ember),
    // The afterglow sits west-north-west, behind the Fernsehturm: a unit vector on the ground plane (x, z).
    uGlowDir: { value: new Vector2(-0.85, -0.53).normalize() },
    // Haze: density per metre, how fast it thins with height, and the most it may ever cover.
    uFog: { value: new Vector3(0.00032, 0.006, 0.86) },
    uSkyLight: c(PALETTE.skyLight), uGroundLight: c(PALETTE.groundLight), uGlowLight: c(PALETTE.glowLight),
    // The travelling light: the idea (or the answer) lights what it passes.
    uSparkPos: { value: new Vector3(0, -999, 0) }, uSparkColor: c(PALETTE.gold), uSparkPower: { value: 0 },
    // The end of the story: the scene lifts into the page's own light ground.
    uDay: { value: 0 }, uDayColor: c("#f0f5f9"), // the page's --g-alt
  };
}

// Included by every shader of the scene (after three's own prelude, which provides cameraPosition).
export const COMMON_GLSL = /* glsl */ `
uniform float uTime;
uniform vec3 uZenith; uniform vec3 uSkyHigh; uniform vec3 uSkyLow; uniform vec3 uHorizonCool; uniform vec3 uHorizonWarm; uniform vec3 uEmber;
uniform vec2 uGlowDir; uniform vec3 uFog;
uniform vec3 uSkyLight; uniform vec3 uGroundLight; uniform vec3 uGlowLight;
uniform vec3 uSparkPos; uniform vec3 uSparkColor; uniform float uSparkPower;
uniform float uDay; uniform vec3 uDayColor;

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float noise21(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}

// The blue-hour sky in a direction: deep blue overhead, pale toward the horizon, warm where the sun went down.
vec3 skyColor(vec3 dir) {
  float h = max(dir.y, 0.0);
  float toward = dot(normalize(dir.xz + vec2(1e-5)), uGlowDir) * 0.5 + 0.5;
  float warm = pow(toward, 2.6); // the glow keeps to its side of the sky; the far side stays cool
  vec3 c = mix(mix(uHorizonCool, uHorizonWarm, warm), mix(uSkyHigh, uSkyLow, 0.35 + 0.65 * warm), smoothstep(0.0, 0.13, h));
  c = mix(c, uSkyHigh, smoothstep(0.07, 0.36, h));
  c = mix(c, uZenith, smoothstep(0.3, 0.92, h));
  c += uEmber * pow(warm, 5.0) * exp(-h * 26.0) * 0.55;
  return c;
}

// Haze takes the colour of the horizon behind what it covers, so far things sink into the sky they stand against.
vec3 applyFog(vec3 color, vec3 worldPos) {
  vec3 v = worldPos - cameraPosition;
  float d = length(v);
  vec3 dir = v / max(d, 1e-4);
  float low = exp(-max(worldPos.y, 0.0) * uFog.y);
  float f = min(1.0 - exp(-d * uFog.x * mix(0.3, 1.0, low)), uFog.z);
  vec3 c = mix(color, skyColor(normalize(vec3(dir.x, 0.03, dir.z))), f);
  return mix(c, uDayColor, uDay);
}

// Light without a sun: the sky from above, the ground from below, the afterglow from the side.
vec3 duskLight(vec3 n) {
  vec3 l = mix(uGroundLight, uSkyLight, n.y * 0.5 + 0.5);
  l += uGlowLight * pow(max(dot(normalize(vec3(uGlowDir.x, 0.22, uGlowDir.y)), n), 0.0), 1.5) * 0.55;
  return l;
}

// What the travelling light adds to a surface at p facing n.
vec3 sparkLight(vec3 p, vec3 n) {
  vec3 v = uSparkPos - p;
  float d2 = dot(v, v);
  float reach = 1.0 / (1.0 + d2 * 0.035);
  float facing = 0.35 + 0.65 * max(dot(normalize(v), n), 0.0);
  return uSparkColor * uSparkPower * reach * reach * facing;
}
`;

// three's closing lines for a fragment shader: tone mapping and the output colour space.
export const FRAG_END = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

/* ----------------------------------------------------------------------------------------------------------------
   Boxes. Most of the scene is boxes: slabs, piers, desks, cars, a whole city. One InstancedMesh per batch.
   kind: 0 a plain solid · 1 a building with lit windows · 2 a floor slab of the tower (lit rooms above and below)
         3 something inside the tower, lit by its floor's lamps · 4 a body that glows by itself (a lamp, a screen)
   a: for kind 1 the share of lit windows (0..1); for kind 2 and 3 the floor number; for kind 4 the brightness. */
export type Box = { at: readonly [number, number, number]; size: readonly [number, number, number]; color: string; rotY?: number; kind?: number; a?: number; seed?: number };

const BOX_VERT = /* glsl */ `
attribute vec4 aInfo;   // kind, a, seed, unused
varying vec3 vWorld; varying vec3 vNormal; varying vec3 vColor; varying vec4 vInfo; varying vec3 vLocal; varying vec3 vScale;
void main() {
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vColor = instanceColor;
  vInfo = aInfo;
  vLocal = position;
  vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const BOX_FRAG = /* glsl */ `
uniform float uFloorLight[40];
uniform vec3 uRoomWarm; uniform vec3 uRoomCool;
varying vec3 vWorld; varying vec3 vNormal; varying vec3 vColor; varying vec4 vInfo; varying vec3 vLocal; varying vec3 vScale;

float floorLight(float f) { return uFloorLight[int(clamp(f, 0.0, 39.0))]; }

void main() {
  vec3 n = normalize(vNormal);
  float kind = vInfo.x;
  vec3 col;
  if (kind < 0.5) {
    col = vColor * duskLight(n);
  } else if (kind < 1.5) {
    // A building: rows of windows on its walls, some of them lit. Far away the grid melts into its average.
    col = vColor * duskLight(n);
    if (abs(n.y) < 0.5) {
      float along = abs(n.x) > 0.5 ? vLocal.z * vScale.z : vLocal.x * vScale.x;
      vec2 cell = vec2(along / 3.1, (vLocal.y + 0.5) * vScale.y / 3.3);
      vec2 id = floor(cell), f = fract(cell);
      float px = fwidth(cell.x) + fwidth(cell.y);
      float pane = smoothstep(0.16, 0.16 + px, f.x) * smoothstep(0.84, 0.84 - px, f.x) * smoothstep(0.22, 0.22 + px, f.y) * smoothstep(0.8, 0.8 - px, f.y);
      float r = hash21(id + vInfo.z * 17.0 + floor(n.xz * 1.5 + 0.5) * 3.0);
      float lit = step(1.0 - vInfo.y, r);
      vec3 lamp = mix(uRoomWarm, uRoomCool, step(0.86, hash21(id.yx + vInfo.z))) * (0.55 + 0.6 * hash21(id * 1.7 + 3.0));
      float near = clamp(0.6 / max(px, 1e-4), 0.0, 1.0);
      col = mix(col, col * 0.55 + lamp * lit * 0.95, pane * mix(0.42, 1.0, near));
    }
  } else if (kind < 2.5) {
    // A slab of the tower: floor finish on top, a lit ceiling underneath, a bronze edge at the facade.
    float f = vInfo.y;
    if (n.y > 0.5) {
      float tile = 0.94 + 0.06 * step(0.5, fract(vWorld.x / 1.2)) * step(0.5, fract(vWorld.z / 1.2));
      col = vColor * tile * (duskLight(n) * 0.35 + mix(uRoomWarm, vec3(1.0, 0.94, 0.86), 0.55) * floorLight(f) * 0.42);
    } else if (n.y < -0.5) {
      float strip = smoothstep(0.42, 0.5, abs(fract(vWorld.z / 2.7) - 0.5)) * step(0.12, fract(vWorld.x / 7.5));
      float l = floorLight(f - 1.0);
      col = vec3(0.5, 0.47, 0.44) * (duskLight(n) * 0.5 + uRoomWarm * l * 0.42) + uRoomWarm * strip * l * 1.25;
    } else {
      col = vColor * duskLight(n) * 1.15;
    }
  } else if (kind < 3.5) {
    // Inside the tower: lit by the lamps of its floor, and by the idea when it passes.
    float l = floorLight(vInfo.y);
    col = vColor * (duskLight(n) * 0.3 + uRoomWarm * l * (0.5 + 0.5 * max(n.y, 0.0) + 0.15 * max(n.x, 0.0)));
  } else {
    col = vColor * vInfo.y;
  }
  col += vColor * sparkLight(vWorld, n) * (kind > 1.5 && kind < 3.5 ? 1.0 : 0.25);
  gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
  ${FRAG_END}
}`;

const unitBox = () => new BoxGeometry(1, 1, 1);
const M = new Matrix4(), Q = new Quaternion(), UP = new Vector3(0, 1, 0), P = new Vector3(), S = new Vector3(), C = new Color();

export function boxMaterial(shared: Shared, floorLight?: IUniform<number[]>) {
  return new ShaderMaterial({
    uniforms: { ...shared, uFloorLight: floorLight ?? { value: new Array(40).fill(0.4) }, uRoomWarm: { value: new Color(PALETTE.roomWarm) }, uRoomCool: { value: new Color(PALETTE.roomCool) } },
    vertexShader: `${COMMON_GLSL}\n${BOX_VERT}`, fragmentShader: `${COMMON_GLSL}\n${BOX_FRAG}`,
  });
}

/** Build one InstancedMesh from a list of boxes. `at` is the box's centre. */
export function boxes(list: readonly Box[], material: ShaderMaterial) {
  const mesh = new InstancedMesh(unitBox(), material, list.length);
  const info = new Float32Array(list.length * 4);
  list.forEach((b, i) => {
    Q.setFromAxisAngle(UP, b.rotY ?? 0);
    M.compose(P.set(b.at[0], b.at[1], b.at[2]), Q, S.set(b.size[0], b.size[1], b.size[2]));
    mesh.setMatrixAt(i, M);
    mesh.setColorAt(i, C.set(b.color));
    info.set([b.kind ?? 0, b.a ?? 0, b.seed ?? i * 0.618, 0], i * 4);
  });
  mesh.geometry.setAttribute("aInfo", new InstancedBufferAttribute(info, 4));
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false; // a batch spans the scene: one cheap draw call beats a wrong cull
  return mesh;
}

/** A box given by its footprint centre, its base height and its size: how one thinks about buildings. */
export const block = (x: number, z: number, w: number, d: number, h: number, color: string, extra: Partial<Box> = {}, y0 = 0): Box =>
  ({ at: [x, y0 + h / 2, z], size: [w, h, d], color, ...extra });

/* ----------------------------------------------------------------------------------------------------------------
   Lights you can see: lamps, headlights, beacons, the idea's halo. Camera-facing quads, added to the picture.
   A glow may pulse (period seconds, 0 = steady) and may only shine toward one side (dir, for headlights). */
export type Glow = { at: readonly [number, number, number]; size: number; color: string; power?: number; period?: number; phase?: number };

const GLOW_VERT = /* glsl */ `
attribute vec3 aAt; attribute vec4 aLook;  // size, power, period, phase
attribute vec3 aTint;
varying vec2 vUv; varying vec3 vTint; varying float vPower;
void main() {
  vUv = position.xy * 2.0;
  vTint = aTint;
  float pulse = aLook.z > 0.0 ? pow(0.5 + 0.5 * sin(6.2832 * (uTime / aLook.z + aLook.w)), 3.0) : 1.0;
  vPower = aLook.y * pulse;
  vec4 view = viewMatrix * modelMatrix * vec4(aAt, 1.0);
  // Never smaller than a pixel and a half: a far lamp stays a point of light instead of flickering away.
  float minSize = -view.z * 0.0016;
  view.xy += position.xy * max(aLook.x, minSize);
  gl_Position = projectionMatrix * view;
}`;
const GLOW_FRAG = /* glsl */ `
varying vec2 vUv; varying vec3 vTint; varying float vPower;
void main() {
  float d = length(vUv);
  float core = exp(-d * d * 18.0);
  float halo = pow(max(1.0 - d, 0.0), 2.6) * 0.42;
  vec3 col = vTint * (core * 1.6 + halo) * vPower * (1.0 - uDay);
  gl_FragColor = vec4(col, 1.0);
  ${FRAG_END}
}`;

export type GlowMesh = InstancedMesh<BufferGeometry, ShaderMaterial> & { setAt: (i: number, x: number, y: number, z: number) => void; setPower: (i: number, power: number) => void; commit: () => void };

export function glows(list: readonly Glow[], shared: Shared, dynamic = false): GlowMesh {
  const geo = new PlaneGeometry(1, 1);
  const material = new ShaderMaterial({
    uniforms: { ...shared }, vertexShader: `${COMMON_GLSL}\n${GLOW_VERT}`, fragmentShader: `${COMMON_GLSL}\n${GLOW_FRAG}`,
    blending: AdditiveBlending, depthWrite: false, transparent: true,
  });
  const mesh = new InstancedMesh(geo, material, list.length) as unknown as GlowMesh;
  const at = new Float32Array(list.length * 3), look = new Float32Array(list.length * 4), tint = new Float32Array(list.length * 3);
  list.forEach((g, i) => {
    at.set(g.at, i * 3);
    look.set([g.size, g.power ?? 1, g.period ?? 0, g.phase ?? 0], i * 4);
    C.set(g.color); tint.set([C.r, C.g, C.b], i * 3);
  });
  const aAt = new InstancedBufferAttribute(at, 3), aLook = new InstancedBufferAttribute(look, 4);
  if (dynamic) { aAt.setUsage(DynamicDrawUsage); aLook.setUsage(DynamicDrawUsage); }
  geo.setAttribute("aAt", aAt); geo.setAttribute("aLook", aLook); geo.setAttribute("aTint", new InstancedBufferAttribute(tint, 3));
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  mesh.setAt = (i, x, y, z) => { at[i * 3] = x; at[i * 3 + 1] = y; at[i * 3 + 2] = z; };
  mesh.setPower = (i, power) => { look[i * 4 + 1] = power; };
  mesh.commit = () => { aAt.needsUpdate = true; aLook.needsUpdate = true; };
  return mesh;
}

/* ----------------------------------------------------------------------------------------------------------------
   Leaves: tree crowns and terrace planting. Rounded blobs that lean with a slow wind, each a little differently. */
export type Leaf = { at: readonly [number, number, number]; size: readonly [number, number, number]; color: string; sway?: number; seed?: number };

const LEAF_VERT = /* glsl */ `
attribute vec2 aWind;   // sway in metres at the crown's top, seed
varying vec3 vWorld; varying vec3 vNormal; varying vec3 vColor;
void main() {
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
  float lift = position.y + 0.5;
  float t = uTime * 0.55 + aWind.y * 6.2832;
  // Two slow waves that never line up, plus a gust that crosses the scene from the west.
  float gust = 0.6 + 0.4 * sin(uTime * 0.21 + world.x * 0.012 + world.z * 0.007);
  vec2 lean = vec2(sin(t) + 0.45 * sin(t * 2.3 + 1.7), 0.6 * cos(t * 0.8 + 0.6)) * aWind.x * gust;
  world.xz += lean * lift * lift;
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vColor = instanceColor;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;
const LEAF_FRAG = /* glsl */ `
varying vec3 vWorld; varying vec3 vNormal; varying vec3 vColor;
void main() {
  vec3 n = normalize(vNormal);
  float mottle = 0.82 + 0.36 * noise21(vWorld.xz * 1.9 + vWorld.y * 1.3);
  vec3 col = vColor * mottle * duskLight(n) + vColor * sparkLight(vWorld, n) * 0.5;
  gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
  ${FRAG_END}
}`;

export function leaves(list: readonly Leaf[], geometry: BufferGeometry, shared: Shared) {
  const material = new ShaderMaterial({ uniforms: { ...shared }, vertexShader: `${COMMON_GLSL}\n${LEAF_VERT}`, fragmentShader: `${COMMON_GLSL}\n${LEAF_FRAG}` });
  const mesh = new InstancedMesh(geometry, material, list.length);
  const wind = new Float32Array(list.length * 2);
  list.forEach((l, i) => {
    M.compose(P.set(l.at[0], l.at[1], l.at[2]), Q.identity(), S.set(l.size[0], l.size[1], l.size[2]));
    mesh.setMatrixAt(i, M);
    mesh.setColorAt(i, C.set(l.color));
    wind.set([l.sway ?? 0.25, l.seed ?? (i * 0.754877) % 1], i * 2);
  });
  mesh.geometry.setAttribute("aWind", new InstancedBufferAttribute(wind, 2));
  mesh.frustumCulled = false;
  return mesh;
}

/* ----------------------------------------------------------------------------------------------------------------
   Small helpers. */
/** A repeatable random number source: the same scene on every visit and in every screenshot. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function disposeObject(root: Object3D) {
  root.traverse((o) => {
    const mesh = o as { geometry?: BufferGeometry; material?: ShaderMaterial | ShaderMaterial[] };
    mesh.geometry?.dispose();
    const m = mesh.material;
    if (Array.isArray(m)) m.forEach((x) => x.dispose()); else m?.dispose();
  });
}

