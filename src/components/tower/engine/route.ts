// The idea and its ways through the building. Three lines - the route NextUp proposes, today's wander, the
// deputy's detour - each a thin tube that is drawn up to a point and carries a bright head with a fading trail.
// The idea itself is a small luminous pill with a gold rim (the product's raise box, in miniature) and a halo.
import {
  AdditiveBlending, CapsuleGeometry, Color, Curve, Group, Mesh, PlaneGeometry, Quaternion, ShaderMaterial, TubeGeometry, Vector3, type IUniform,
} from "three";
import type { Paths, SceneState, Tone } from "@/features/tower/story";
import { pointAt, type Path } from "@/features/tower/timeline";
import { COMMON_GLSL, FRAG_END, PALETTE, type Layer, type Shared } from "./common";

const RADIUS = 0.12;

const LINE_VERT = /* glsl */ `
varying float vU; varying float vSide;
void main() {
  // A tube's normal points away from its centre line: widen it with distance so the line never thins below a pixel or two.
  vec3 centre = position - normal * ${RADIUS.toFixed(3)};
  vec4 world = modelMatrix * vec4(centre, 1.0);
  float dist = length(world.xyz - cameraPosition);
  world.xyz += normalize(mat3(modelMatrix) * normal) * max(${RADIUS.toFixed(3)}, dist * 0.0011);
  vU = uv.x;
  vSide = dot(normalize(mat3(modelMatrix) * normal), normalize(cameraPosition - world.xyz));
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const LINE_FRAG = /* glsl */ `
uniform float uShown; uniform float uHead; uniform float uGlow; uniform float uLength; uniform float uBack;
uniform vec3 uTint; uniform vec3 uHot;
varying float vU; varying float vSide;
void main() {
  if (vU > uShown || uGlow < 0.004) discard;
  // The line itself: quiet, with a slow pulse running the way the idea will go.
  float flow = 0.72 + 0.28 * sin((vU * uLength) * 1.1 - uTime * 2.2 * (uBack > 0.5 ? -1.0 : 1.0));
  float tip = smoothstep(0.0, 0.012, uShown - vU); // the drawing end is soft
  vec3 col = uTint * 0.55 * flow * tip;
  // The head and its trail: bright where the idea is, fading behind it.
  if (uHead >= 0.0) {
    float behind = (uBack > 0.5 ? vU - uHead : uHead - vU) * uLength; // metres behind the head
    float trail = behind >= 0.0 ? exp(-behind * 0.16) : exp(behind * 2.4);
    col += mix(uTint, uHot, trail * trail) * trail * 2.4;
  }
  col *= uGlow * (0.55 + 0.45 * max(vSide, 0.0)) * (1.0 - uDay);
  gl_FragColor = vec4(col, 1.0);
  ${FRAG_END}
}`;

const PILL_VERT = /* glsl */ `
varying vec3 vNormal; varying vec3 vView;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;
const PILL_FRAG = /* glsl */ `
uniform float uOn;
varying vec3 vNormal; varying vec3 vView;
void main() {
  float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 1.6);
  vec3 col = mix(vec3(1.0, 0.97, 0.9), uSparkColor, 0.25 + 0.75 * rim) * (1.5 + 1.6 * rim) * uOn * (1.0 - uDay);
  gl_FragColor = vec4(col, 1.0);
  ${FRAG_END}
}`;

const HALO_VERT = /* glsl */ `
uniform float uSize;
varying vec2 vUv;
void main() {
  vUv = position.xy * 2.0;
  vec4 view = viewMatrix * vec4(uSparkPos, 1.0);
  view.xy += position.xy * max(uSize, -view.z * 0.02);
  gl_Position = projectionMatrix * view;
}`;
const HALO_FRAG = /* glsl */ `
varying vec2 vUv;
void main() {
  float d = length(vUv);
  float core = exp(-d * d * 42.0);
  float halo = pow(max(1.0 - d, 0.0), 3.0) * 0.36;
  // A thin horizontal flare, the way a lens answers a point of light.
  float flare = exp(-abs(vUv.y) * 34.0) * pow(max(1.0 - abs(vUv.x), 0.0), 2.2) * 0.22;
  vec3 col = (uSparkColor * (halo + flare) + mix(uSparkColor, vec3(1.0), 0.6) * core * 1.4) * uSparkPower * (1.0 - uDay);
  gl_FragColor = vec4(col, 1.0);
  ${FRAG_END}
}`;

class Along extends Curve<Vector3> {
  constructor(private path: Path) { super(); }
  getPoint(t: number, target = new Vector3()) {
    const p = pointAt(this.path, t);
    return target.set(p[0], p[1], p[2]);
  }
}

type LineKey = "route" | "wander" | "detour";
type LineMesh = { mesh: Mesh<TubeGeometry, ShaderMaterial>; u: { uShown: IUniform<number>; uHead: IUniform<number>; uGlow: IUniform<number>; uLength: IUniform<number>; uBack: IUniform<number>; uTint: IUniform<Color>; uHot: IUniform<Color> } };

const TONES: Record<Tone, Color> = {
  idea: new Color(PALETTE.gold), answer: new Color(PALETTE.answer), late: new Color(PALETTE.late), stale: new Color("#b9a98f"),
};
const HOT = new Color(PALETTE.goldHot);
const Y = new Vector3(0, 1, 0);

export type RouteLayer = Layer & { setPaths: (paths: Paths) => void; apply: (state: SceneState) => void };

export function createRoute(shared: Shared): RouteLayer {
  const group = new Group();
  const lines = {} as Record<LineKey, LineMesh>;

  const line = (key: LineKey): LineMesh => {
    const u = { uShown: { value: 0 }, uHead: { value: -1 }, uGlow: { value: 0 }, uLength: { value: 1 }, uBack: { value: 0 }, uTint: { value: TONES.idea.clone() }, uHot: { value: HOT.clone() } };
    const material = new ShaderMaterial({
      uniforms: { ...shared, ...u }, vertexShader: `${COMMON_GLSL}\n${LINE_VERT}`, fragmentShader: `${COMMON_GLSL}\n${LINE_FRAG}`,
      blending: AdditiveBlending, depthWrite: false, transparent: true,
    });
    const mesh = new Mesh(new TubeGeometry(new Along({ points: [[0, 0, 0], [0, 1, 0]], lengths: [0, 1], total: 1 }), 2, RADIUS, 6), material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 8;
    group.add(mesh);
    lines[key] = { mesh, u };
    return lines[key];
  };
  line("wander"); line("route"); line("detour");

  const pillOn: IUniform<number> = { value: 0 };
  const pill = new Mesh(
    new CapsuleGeometry(0.2, 0.56, 6, 14),
    new ShaderMaterial({ uniforms: { ...shared, uOn: pillOn }, vertexShader: `${COMMON_GLSL}\n${PILL_VERT}`, fragmentShader: `${COMMON_GLSL}\n${PILL_FRAG}` }),
  );
  pill.frustumCulled = false;
  group.add(pill);

  const haloSize: IUniform<number> = { value: 4 };
  const halo = new Mesh(
    new PlaneGeometry(1, 1),
    new ShaderMaterial({
      uniforms: { ...shared, uSize: haloSize }, vertexShader: `${COMMON_GLSL}\n${HALO_VERT}`, fragmentShader: `${COMMON_GLSL}\n${HALO_FRAG}`,
      blending: AdditiveBlending, depthWrite: false, transparent: true,
    }),
  );
  halo.frustumCulled = false;
  halo.renderOrder = 12;
  group.add(halo);

  const q = new Quaternion(), dir = new Vector3(), sparkColor = shared.uSparkColor.value as Color, sparkPos = shared.uSparkPos.value as Vector3;

  return {
    object: group,
    setPaths(paths) {
      (Object.keys(lines) as LineKey[]).forEach((key) => {
        const path = paths[key], l = lines[key];
        l.mesh.geometry.dispose();
        l.mesh.geometry = new TubeGeometry(new Along(path), Math.max(24, Math.round(path.total * 1.6)), RADIUS, 6, false);
        l.u.uLength.value = path.total;
      });
    },
    apply(state) {
      (Object.keys(lines) as LineKey[]).forEach((key) => {
        const s = state[key], u = lines[key].u;
        u.uShown.value = s.shown; u.uHead.value = s.head; u.uGlow.value = s.glow;
        u.uBack.value = s.back ? 1 : 0;
        u.uTint.value.copy(key === "wander" ? TONES.stale : s.back ? TONES.answer : TONES.idea);
        u.uHot.value.copy(s.back ? TONES.answer : HOT);
        lines[key].mesh.visible = s.shown > 0.0005 && s.glow > 0.004;
      });
      const sp = state.spark;
      sparkPos.set(sp.at[0], sp.at[1], sp.at[2]);
      sparkColor.copy(TONES[sp.tone]);
      shared.uSparkPower.value = sp.power;
      pill.position.copy(sparkPos);
      pill.quaternion.copy(q.setFromUnitVectors(Y, dir.set(sp.dir[0], sp.dir[1], sp.dir[2]).normalize()));
      pill.scale.setScalar(0.8 + 0.5 * sp.size);
      pillOn.value = Math.min(1, sp.power * 1.4);
      pill.visible = halo.visible = sp.power > 0.01;
      haloSize.value = 3.2 + 3.4 * sp.size;
    },
    dispose() {
      group.traverse((o) => {
        const mesh = o as Mesh<TubeGeometry, ShaderMaterial>;
        mesh.geometry?.dispose(); mesh.material?.dispose();
      });
    },
  };
}
