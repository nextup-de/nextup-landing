// The tower: a dark gridded podium, glass blocks, terrace bands two floors high stepping between them, a stepped
// roof. Every stretch of facade is one instance of one quad; mullions, spandrels, lit rooms and the people
// passing behind the glass are drawn by the shader. The east face can be opened: inside a rounded rectangle the
// glass thins out to its grid, and the floors behind it show.
import {
  Color, Group, IcosahedronGeometry, InstancedBufferAttribute, InstancedMesh, Matrix4, PlaneGeometry, Quaternion, ShaderMaterial, Vector3, Vector4,
  type IUniform,
} from "three";
import {
  BASE_TOP, CORE, FACES, FLOOR_H, HALF_X, HALF_Z, HEIGHT, PARAPET, RECESS, RUNS, cellAt, floorY, levelOf, stretches, topFloor, type Face,
} from "@/features/tower/building";
import { COMMON_GLSL, FRAG_END, PALETTE, boxMaterial, boxes, disposeObject, glows, leaves, seeded, type Box, type Glow, type Layer, type Leaf, type Shared, type Tier } from "./common";

const VERT = /* glsl */ `
attribute vec4 aPane;  // bays across, kind, first floor, floors tall
attribute vec2 aMeta;  // face (0 = east), seed
varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal; varying vec4 vPane; varying vec2 vMeta;
void main() {
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vUv = vec2(uv.x * aPane.x, uv.y * aPane.w);
  vPane = aPane; vMeta = aMeta;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

// kind: 0 glass · 1 the podium's deep-set windows · 2 the glass at the back of a terrace · 3 a glass balustrade
const FRAG = /* glsl */ `
uniform vec4 uCut;        // the opening on the east face: z from, z to, y from, y to
uniform float uCutOpen;   // 0 closed .. 1 open
uniform float uHardAlpha; // 1 when the canvas has no multisampling: no soft edges, a plain cut
uniform float uFloorLight[40];
uniform vec3 uRoomWarm; uniform vec3 uRoomCool; uniform vec3 uMetal; uniform vec3 uPodium; uniform vec3 uCutEdge;
varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal; varying vec4 vPane; varying vec2 vMeta;

void main() {
  vec3 n = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  float kind = vPane.y;
  float storey = vPane.z + floor(vUv.y);
  vec2 uv = vec2(vUv.x, fract(vUv.y));
  float px = fwidth(vUv.x), py = fwidth(vUv.y);
  float seed = vMeta.y;

  // The sky in the glass. A ray that leaves downward meets the dark city, not the sky.
  vec3 r = reflect(view, n);
  vec3 refl = skyColor(normalize(vec3(r.x, abs(r.y) + 0.02, r.z)));
  refl = mix(refl, vec3(0.03, 0.04, 0.075), smoothstep(0.02, -0.22, r.y));
  float fres = 0.05 + 0.95 * pow(1.0 - max(dot(-view, n), 0.0), 5.0);

  // The room behind: rooms are three bays wide; most are lit at this hour, a few change their mind.
  // Occupancy is patchy by floor: some floors are still full, some have gone home.
  float bay = floor(uv.x);
  float wide = 2.0 + floor(hash21(vec2(storey, seed * 3.0)) * 3.0);
  float room = floor((bay + floor(seed * 7.0)) / wide);
  vec2 rid = vec2(room + seed * 31.0, storey);
  float busy = hash21(vec2(storey * 1.37, floor(seed * 4.0)));
  float chance = kind == 1.0 ? 0.8 : kind == 2.0 ? 0.9 : mix(0.16, 0.86, busy * busy * (3.0 - 2.0 * busy));
  float who = hash21(rid);
  float lit = step(1.0 - chance, who);
  float fickle = step(0.88, hash21(rid + 5.3));
  float period = 38.0 + 60.0 * hash21(rid + 1.7);
  float turn = smoothstep(0.2, 0.26, abs(fract(uTime / period + who) - 0.5));
  lit = mix(lit, turn, fickle);
  float lamp = clamp(uFloorLight[int(clamp(storey, 0.0, 39.0))], 0.0, 3.0);

  // A lit room: bright under the ceiling, darker where desks and people stand, each bay a little different.
  float ceiling = smoothstep(0.3, 0.98, uv.y);
  float desks = 1.0 - 0.5 * smoothstep(0.52, 0.3, uv.y);
  vec3 tone = mix(uRoomWarm, uRoomCool, step(0.9, hash21(rid * 1.3 + 2.0)) * 0.7);
  vec3 inside = tone * (0.22 + 0.78 * ceiling) * desks * (0.6 + 0.4 * hash21(vec2(bay, storey) + seed)) * 0.86;
  // Screens: a cool glint at desk height in some bays.
  float screen = step(0.62, hash21(vec2(bay * 1.7, storey) + seed + 4.0)) * smoothstep(0.1, 0.0, abs(uv.y - 0.36) - 0.035)
    * smoothstep(0.16, 0.0, abs(fract(uv.x) - 0.5) - 0.1);
  inside += uRoomCool * screen * 0.34;
  // Someone walks along the windows on a few floors: a soft shadow crossing the bays.
  float walker = step(0.72, hash21(vec2(storey, seed * 11.0)));
  float pace = (0.05 + 0.05 * hash21(vec2(storey, 3.0))) * (hash21(vec2(storey, 8.0)) > 0.5 ? 1.0 : -1.0);
  float at = fract(uTime * pace * 0.2 + hash21(vec2(storey, seed))) * (vPane.x + 4.0) - 2.0;
  float shadow = smoothstep(0.34, 0.1, abs(vUv.x - at)) * smoothstep(0.74, 0.6, uv.y) * walker;
  inside *= 1.0 - 0.7 * shadow;
  inside *= lit * (0.25 + lamp);

  vec3 col;
  float alpha = 1.0;
  float frame = 0.0; // how much of this pixel is structure rather than glass

  if (kind < 0.5 || kind == 2.0) {
    float mullion = 1.0 - smoothstep(0.04, 0.04 + px, min(fract(uv.x), 1.0 - fract(uv.x)));
    mullion *= clamp(0.09 / max(px, 1e-4), 0.0, 1.0);
    float spandrel = 1.0 - smoothstep(0.15, 0.15 + py, uv.y);
    float band = 1.0 - smoothstep(0.06, 0.06 + py, uv.y);
    float shade = kind == 2.0 ? 0.25 + 0.45 * smoothstep(1.0, 0.2, uv.y) : 1.0; // under the block above
    col = inside * (1.0 - fres) + refl * (0.34 + 0.66 * fres) * shade + vec3(0.006, 0.01, 0.022);
    vec3 panel = uMetal * 0.3 * duskLight(n) + refl * 0.32 * shade + tone * lit * lamp * 0.04;
    col = mix(col, panel, spandrel);
    vec3 metal = uMetal * (duskLight(n) * 1.2 + refl * 0.3) * (kind == 2.0 ? 0.55 : 1.0);
    frame = max(mullion, band);
    col = mix(col, metal, frame);
  } else if (kind < 1.5) {
    // The podium: wide windows set deep behind the grid, fine posts between their panes, a shadow under each beam.
    float post = 1.0 - smoothstep(0.022, 0.022 + px, min(fract(uv.x), 1.0 - fract(uv.x)));
    post *= clamp(0.06 / max(px, 1e-4), 0.0, 1.0);
    float sill = 1.0 - smoothstep(0.08, 0.08 + py, uv.y);
    float reveal = smoothstep(0.6, 1.0, uv.y);
    col = inside * 1.3 * (1.0 - 0.5 * reveal) * (1.0 - fres) + refl * (0.08 + 0.6 * fres) * (1.0 - 0.7 * reveal) + vec3(0.008, 0.01, 0.018);
    frame = max(post * 0.8, sill);
    col = mix(col, uPodium * duskLight(n), frame);
  } else {
    // A glass balustrade: mostly air, a line of light along its top edge.
    float top = smoothstep(0.84, 0.97, uv.y);
    col = refl * 0.9 + vec3(0.9, 0.95, 1.0) * top * 0.3;
    alpha = 0.22 + 0.6 * top + 0.3 * fres;
  }

  col += sparkLight(vWorld, n) * 0.45;

  // The opening. Inside it the glass is gone and the grid stays as a faint drawing; its edge is a clean line.
  if (vMeta.x < 0.5 && uCutOpen > 0.002) {
    vec2 centre = vec2(uCut.x + uCut.y, uCut.z + uCut.w) * 0.5;
    vec2 half_ = max(vec2(abs(uCut.y - uCut.x), abs(uCut.w - uCut.z)) * 0.5, vec2(0.01));
    half_.x *= uCutOpen; // it draws open sideways, like a curtain
    float round_ = min(1.2, min(half_.x, half_.y));
    vec2 d = abs(vec2(vWorld.z, vWorld.y) - centre) - half_ + round_;
    float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - round_;
    float aa = max(fwidth(sd), 1e-3);
    float open = 1.0 - smoothstep(-aa, aa, sd);
    float edge = 1.0 - smoothstep(0.0, 0.1 + aa, abs(sd));
    alpha = mix(alpha, frame * 0.24, open);
    col = mix(col, uCutEdge, edge * 0.85);
    alpha = max(alpha, edge * 0.95);
  }

  if (alpha < mix(0.02, 0.5, uHardAlpha)) discard;
  gl_FragColor = vec4(applyFog(col, vWorld), alpha);
  ${FRAG_END}
}`;

type Pane = { at: [number, number, number]; face: Face; faceIndex: number; width: number; height: number; bays: number; kind: number; floor: number; floors: number; seed: number };

export type TowerLayer = Layer & { cut: IUniform<Vector4>; cutOpen: IUniform<number>; floorLight: IUniform<number[]>; hardAlpha: IUniform<number> };

const PODIUM_INSET = 3; // the glass blocks overhang the podium on the two faces toward the street
const TRIM = "#cfc6b6";
const m = new Matrix4(), q = new Quaternion(), p = new Vector3(), s = new Vector3(), UP = new Vector3(0, 1, 0);

export function createTower(shared: Shared, tier: Tier): TowerLayer {
  const group = new Group();
  const rnd = seeded(11);
  const floorLight: IUniform<number[]> = { value: new Array(40).fill(0.55) };
  const cut: IUniform<Vector4> = { value: new Vector4(-4, 4, 30, 40) };
  const cutOpen: IUniform<number> = { value: 0 };
  const hardAlpha: IUniform<number> = { value: 0 };

  const panes: Pane[] = [];
  const solids: Box[] = [];
  const plants: Leaf[] = [];
  const lamps: Glow[] = [];

  FACES.forEach((face, faceIndex) => {
    const [fx, fz] = face.from, [tx, tz] = face.to;
    const len = Math.hypot(tx - fx, tz - fz), ax = (tx - fx) / len, az = (tz - fz) / len; // unit vector along the face
    const [nx, nz] = face.normal;
    const runLen = len / RUNS;
    const inset = face.id === "E" || face.id === "S" ? PODIUM_INSET : 0;
    // A box lying along this face: w along it, h up, d into the building.
    const size = (w: number, h: number, d: number): [number, number, number] => [Math.abs(ax) * w + Math.abs(nx) * d, h, Math.abs(az) * w + Math.abs(nz) * d];
    // A point on this face: u metres from its start, d metres behind the glass line.
    const on = (u: number, y: number, d = 0): [number, number, number] => [fx + ax * u - nx * d, y, fz + az * u - nz * d];
    const levelAt = (run: number) => (run < 0 || run >= RUNS ? levelOf(face, Math.max(0, Math.min(RUNS - 1, run))) : levelOf(face, run));

    for (let run = 0; run < RUNS; run++) {
      const level = levelOf(face, run);
      const u0 = run * runLen, mid = u0 + runLen / 2;
      const pane = (kind: number, floor: number, floors: number, d: number, height = floors * FLOOR_H, width = runLen, shift = 0) =>
        panes.push({ at: on(mid + shift, floorY(floor) + height / 2, d), face, faceIndex, width, height, bays: face.mods * (width / runLen), kind, floor, floors, seed: rnd() });

      for (const st of stretches(level)) {
        const y = floorY(st.from), h = st.floors * FLOOR_H;
        if (st.cell === "glass") {
          pane(0, st.from, st.floors, 0);
          solids.push({ at: on(mid, y + 0.07, -0.06), size: size(runLen, 0.14, 0.12), color: TRIM }); // the light line under each block
        } else if (st.cell === "base") {
          pane(1, st.from, st.floors, inset);
          // The grid stands proud of its windows: narrow piers, wide beams.
          const piers = 2;
          for (let i = 0; i <= piers; i++) {
            const edge = i === 0 || i === piers;
            solids.push({ at: on(u0 + (i / piers) * runLen, h / 2, inset - 0.2), size: size(edge ? 0.5 : 0.7, h, 0.55), color: PALETTE.bronzeDark });
          }
          for (let f = st.from; f < st.from + st.floors; f++) solids.push({ at: on(mid, floorY(f) + FLOOR_H - 0.45, inset - 0.14), size: size(runLen, 0.9, 0.42), color: "#4a3a33" });
          if (inset) {
            // The overhang: the floor of the first glass storey, seen from the street, and the storeys above it.
            for (let f = BASE_TOP + level + 1; f <= BASE_TOP + RUNS; f++) solids.push({ at: on(mid, floorY(f) - 0.22, inset / 2), size: size(runLen, 0.44, inset), color: "#57483f", kind: 2, a: f });
            lamps.push({ at: on(mid, h - 0.5, inset * 0.45), size: 6, color: PALETTE.roomWarm, power: 0.16 });
          }
        } else if (st.cell === "terrace") {
          // Glass set back, a deck, a soffit, a balustrade, planting. The band wraps the corners, so the back
          // wall stops short of them.
          const trimFrom = run === 0 ? RECESS : 0, trimTo = run === RUNS - 1 ? RECESS : 0;
          pane(2, st.from, st.floors, RECESS, h, runLen - trimFrom - trimTo, (trimFrom - trimTo) / 2);
          pane(3, st.from, 1, 0.03, 1.2);
          solids.push({ at: on(mid, y + h - 0.13, RECESS / 2), size: size(runLen, 0.14, RECESS), color: "#9a6e50", kind: 3, a: st.from + st.floors - 1 }); // soffit, warmed by the rooms
          solids.push({ at: on(mid, y + 0.06, RECESS / 2), size: size(runLen, 0.12, RECESS), color: "#6d7078" });                                      // deck
          solids.push({ at: on(mid, y + 1.22, 0.05), size: size(runLen, 0.05, 0.07), color: "#a9b6c6" });                                               // top rail
          solids.push({ at: on(mid, y + h - 0.07, -0.06), size: size(runLen, 0.14, 0.12), color: TRIM });
          // Where the neighbour is glass at this floor, the terrace ends in a wall.
          for (let f = st.from; f < st.from + st.floors; f++) {
            for (const [end, other] of [[0, run - 1], [1, run + 1]] as const) {
              if (other < 0 || other >= RUNS) continue; // a corner: open
              if (cellAt(f, levelAt(other)) === "terrace") continue;
              const u = u0 + end * runLen + (end ? -0.1 : 0.1);
              solids.push({ at: on(u, floorY(f) + FLOOR_H / 2, RECESS / 2), size: size(0.2, FLOOR_H, RECESS), color: "#3b3f4b" });
              solids.push({ at: on(u0 + end * runLen, floorY(f) + FLOOR_H / 2, -0.06), size: size(0.14, FLOOR_H, 0.12), color: TRIM });
            }
          }
          lamps.push({ at: on(mid, y + h - 0.6, RECESS * 0.55), size: 4.6, color: "#ffb062", power: 0.24 });
          const count = tier === "high" ? 5 : 3;
          for (let i = 0; i < count; i++) {
            const u = u0 + 1.4 + ((i + 0.15 + rnd() * 0.7) / count) * (runLen - 2.8);
            const tall = rnd() > 0.6;
            const w = tall ? 1.7 + rnd() * 0.9 : 1.4 + rnd() * 1.4, hh = tall ? 2.8 + rnd() * 1.6 : 0.9 + rnd() * 0.8;
            plants.push({
              at: on(u, y + 0.14 + hh / 2, 0.7 + rnd() * 1.2), size: [w, hh, w * (0.8 + rnd() * 0.3)],
              color: ["#2f5f49", "#39704e", "#2a5646", "#447652"][Math.floor(rnd() * 4)], sway: tall ? 0.2 : 0.07,
            });
          }
        }
      }
      // Roof edge: a glass parapet with a light cap.
      pane(3, topFloor(level) + 1, 1, 0.03, PARAPET);
      solids.push({ at: on(mid, floorY(topFloor(level) + 1) + 0.07, -0.06), size: size(runLen, 0.14, 0.12), color: TRIM });
      // The podium's side where the next run's glass starts lower.
      if (inset && run < RUNS - 1) {
        const a = BASE_TOP + Math.min(level, levelAt(run + 1)), b = BASE_TOP + Math.max(level, levelAt(run + 1));
        if (b > a) solids.push({ at: on(u0 + runLen, (floorY(a + 1) + floorY(b + 1)) / 2, inset / 2), size: size(0.24, (b - a) * FLOOR_H, inset), color: "#3b3f4b" });
      }
    }
  });

  // Slabs, the core floor by floor, and the stepped roof as cells.
  const TOP = topFloor(0);
  for (let f = 1; f <= TOP + 1; f++) {
    const podium = f <= BASE_TOP + RUNS; // these floors sit back behind the overhang on the east and south
    const cutX = podium ? PODIUM_INSET : 0, cutZ = podium ? PODIUM_INSET : 0;
    solids.push({ at: [-cutX / 2, floorY(f) - 0.22, -cutZ / 2], size: [HALF_X * 2 - 0.3 - cutX, 0.44, HALF_Z * 2 - 0.3 - cutZ], color: "#74706e", kind: 2, a: f });
    if (f <= TOP) {
      solids.push({ at: [0, floorY(f) + FLOOR_H / 2 - 0.22, 0], size: [CORE.halfX * 2, FLOOR_H - 0.44, CORE.halfZ * 2], color: "#93887b", kind: 3, a: f });
      for (const z of [-4.6, -1.6, 1.6, 4.6]) solids.push({ at: [CORE.halfX + 0.03, floorY(f) + 1.15, z], size: [0.06, 2.3, 1.5], color: "#55514f", kind: 3, a: f }); // lift doors
    }
  }
  const cellX = (HALF_X * 2) / RUNS, cellZ = (HALF_Z * 2) / RUNS;
  for (let i = 0; i < RUNS; i++) for (let j = 0; j < RUNS; j++) {
    // The roof is a saddle in steps: high at the south-east and north-west corners.
    const sx = ((i + 0.5) / RUNS) * 2 - 1, sz = ((j + 0.5) / RUNS) * 2 - 1;
    const level = Math.max(0, Math.min(RUNS - 1, Math.round((RUNS - 1) / 2 + ((RUNS - 1) / 2 / 0.5625) * sx * sz)));
    const x = sx * HALF_X, z = sz * HALF_Z, y0 = floorY(TOP + 1);
    if (level > 0) solids.push({ at: [x, y0 + (level * FLOOR_H) / 2, z], size: [cellX - 0.3, level * FLOOR_H, cellZ - 0.3], color: "#232b3d" });
    const top = y0 + level * FLOOR_H;
    const inner = i > 0 && i < RUNS - 1 && j > 0 && j < RUNS - 1;
    if (inner) solids.push({ at: [x + (rnd() - 0.5) * 3, top + 1.1, z + (rnd() - 0.5) * 2], size: [5 + rnd() * 3, 2.2, 3.4 + rnd() * 2], color: "#3b4252" });
    else if (rnd() > 0.3) plants.push({ at: [x + (rnd() - 0.5) * 4, top + 1.3, z + (rnd() - 0.5) * 3], size: [2.6 + rnd(), 2.4 + rnd(), 2.6 + rnd()], color: "#2f5f49", sway: 0.2 });
  }
  // A pergola on each high corner, and the obstruction lights every tall building carries.
  for (const sign of [1, -1]) {
    const cx = sign * (HALF_X - 5.2), cz = sign * (HALF_Z - 4.4);
    solids.push({ at: [cx, HEIGHT + 3, cz], size: [8, 0.14, 6.4], color: TRIM });
    for (const [dx, dz] of [[-3.8, -3], [3.8, -3], [-3.8, 3], [3.8, 3]] as const) solids.push({ at: [cx + dx, HEIGHT + 1.5, cz + dz], size: [0.14, 3, 0.14], color: TRIM });
    lamps.push({ at: [cx, HEIGHT + 2.4, cz], size: 4, color: PALETTE.roomWarm, power: 0.5 });
    lamps.push({ at: [sign * (HALF_X - 0.4), HEIGHT + PARAPET + 0.4, sign * (HALF_Z - 0.4)], size: 1.5, color: PALETTE.beacon, power: 1.1 });
  }

  // The facade: one quad, instanced once per stretch.
  const quad = new PlaneGeometry(1, 1);
  const material = new ShaderMaterial({
    uniforms: {
      ...shared, uCut: cut, uCutOpen: cutOpen, uFloorLight: floorLight, uHardAlpha: hardAlpha,
      uRoomWarm: { value: new Color(PALETTE.roomWarm) }, uRoomCool: { value: new Color(PALETTE.roomCool) },
      uMetal: { value: new Color("#b59a80") }, uPodium: { value: new Color("#4a3a33") }, uCutEdge: { value: new Color("#fff1cf") },
    },
    vertexShader: `${COMMON_GLSL}\n${VERT}`, fragmentShader: `${COMMON_GLSL}\n${FRAG}`,
    alphaToCoverage: true, // soft edges and the faint grid inside the opening, without sorting anything
  });
  const facade = new InstancedMesh(quad, material, panes.length);
  const aPane = new Float32Array(panes.length * 4), aMeta = new Float32Array(panes.length * 2);
  panes.forEach((pane, i) => {
    q.setFromAxisAngle(UP, Math.atan2(pane.face.normal[0], pane.face.normal[1]));
    m.compose(p.set(pane.at[0], pane.at[1], pane.at[2]), q, s.set(pane.width, pane.height, 1));
    facade.setMatrixAt(i, m);
    aPane.set([pane.bays, pane.kind, pane.floor, pane.floors], i * 4);
    aMeta.set([pane.faceIndex, pane.seed], i * 2);
  });
  quad.setAttribute("aPane", new InstancedBufferAttribute(aPane, 4));
  quad.setAttribute("aMeta", new InstancedBufferAttribute(aMeta, 2));
  facade.frustumCulled = false;

  group.add(boxes(solids, boxMaterial(shared, floorLight)));
  group.add(facade);
  group.add(leaves(plants, new IcosahedronGeometry(0.5, 1), shared));
  group.add(glows(lamps, shared));

  return { object: group, cut, cutOpen, floorLight, hardAlpha, dispose: () => disposeObject(group) };
}
