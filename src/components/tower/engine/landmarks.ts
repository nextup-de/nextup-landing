// Mitte on the horizon, west-north-west down the line: the Fernsehturm with its steel sphere and the red lights
// of its antenna, and around it Alexanderplatz's slab hotel and towers, the Rotes Rathaus, the Berliner Dom's
// green dome. Composed for a long lens: brought closer than they stand, on their true bearings from the tower.
import { CylinderGeometry, Group, Mesh, ShaderMaterial, SphereGeometry, Color, type BufferGeometry } from "three";
import { FERNSEHTURM, fromTower } from "@/features/tower/world";
import { COMMON_GLSL, FRAG_END, PALETTE, block, boxMaterial, boxes, disposeObject, glows, type Box, type Glow, type Layer, type Shared } from "./common";

const VERT = /* glsl */ `
varying vec3 vWorld; varying vec3 vNormal; varying vec3 vLocal;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz; vLocal = position;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

// part 0: concrete shaft · 1: the steel sphere with its ring of windows · 2: the antenna in red and white · 3: a copper dome
const FRAG = /* glsl */ `
uniform float uPart; uniform vec3 uTint; uniform vec3 uRoomWarm;
varying vec3 vWorld; varying vec3 vNormal; varying vec3 vLocal;
void main() {
  vec3 n = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  vec3 col;
  if (uPart < 0.5) {
    // Concrete, a little lighter where the afterglow reaches it, darker at its foot in the city's haze.
    col = uTint * duskLight(n) * (0.85 + 0.15 * smoothstep(0.0, 200.0, vLocal.y + 100.0));
  } else if (uPart < 1.5) {
    // Steel facets: a lattice of panels, each catching the sky a little differently.
    float lat = asin(clamp(vLocal.y, -1.0, 1.0));
    float lon = atan(vLocal.x, vLocal.z);
    vec2 cell = vec2(lon * 9.0, lat * 9.0);
    float facet = hash21(floor(cell));
    vec3 fn = normalize(n + (vec3(facet, hash21(floor(cell) + 3.0), facet * 0.7) - 0.5) * 0.18);
    vec3 r = reflect(view, fn);
    vec3 sky = skyColor(normalize(vec3(r.x, abs(r.y) + 0.03, r.z)));
    float fres = 0.15 + 0.85 * pow(1.0 - max(dot(-view, fn), 0.0), 3.0);
    col = mix(uTint * duskLight(n) * 0.6, sky, 0.55 * fres + 0.2);
    float px = fwidth(cell.x) + fwidth(cell.y);
    float seam = 1.0 - smoothstep(0.0, 0.08 + px, min(min(fract(cell.x), 1.0 - fract(cell.x)), min(fract(cell.y), 1.0 - fract(cell.y))));
    col *= 1.0 - 0.25 * seam;
    // The ring of windows just below the equator: the restaurant turns, its lights with it.
    float ring = smoothstep(-0.3, -0.24, vLocal.y) * (1.0 - smoothstep(-0.08, -0.02, vLocal.y));
    float pane = step(0.25, fract(lon * 24.0 + uTime * 0.004));
    col = mix(col, uRoomWarm * (0.7 + 0.3 * hash11(floor(lon * 24.0))), ring * pane * 0.9);
  } else if (uPart < 2.5) {
    float band = step(0.5, fract(vLocal.y / 13.0));
    col = mix(vec3(0.85, 0.85, 0.85), vec3(0.75, 0.12, 0.1), band) * duskLight(n) * 0.8;
  } else {
    // Weathered copper.
    col = uTint * duskLight(n) * (0.8 + 0.2 * noise21(vLocal.xz * 6.0));
  }
  gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
  ${FRAG_END}
}`;

export function createLandmarks(shared: Shared): Layer {
  const group = new Group();
  const material = (part: number, tint: string) => new ShaderMaterial({
    uniforms: { ...shared, uPart: { value: part }, uTint: { value: new Color(tint) }, uRoomWarm: { value: new Color(PALETTE.roomWarm) } },
    vertexShader: `${COMMON_GLSL}\n${VERT}`, fragmentShader: `${COMMON_GLSL}\n${FRAG}`,
  });
  const add = (geo: BufferGeometry, mat: ShaderMaterial, x: number, y: number, z: number, scale = 1) => {
    const mesh = new Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };

  /* The Fernsehturm. Heights as built: shaft to 250 m, the sphere's centre at 213 m and 32 m across, the antenna to 368 m. */
  const [fx, fz] = FERNSEHTURM.at;
  const concrete = material(0, "#a7a49f");
  add(new CylinderGeometry(4.6, 16, 250, 28, 1), concrete, fx, 125, fz);
  add(new CylinderGeometry(21, 25, 18, 28, 1), concrete, fx, 9, fz);                     // the folded foot, mostly hidden
  add(new CylinderGeometry(6.4, 6.4, 7, 28, 1), concrete, fx, 232, fz);                  // the collar above the sphere
  add(new SphereGeometry(1, 48, 32), material(1, "#8d96a3"), fx, 213, fz, 16);
  add(new CylinderGeometry(1.2, 2.9, FERNSEHTURM.height - 236, 12, 1), material(2, "#ffffff"), fx, (FERNSEHTURM.height + 236) / 2, fz);

  const lights: Glow[] = [
    { at: [fx, FERNSEHTURM.height + 1, fz], size: 9, color: PALETTE.beacon, power: 1.4, period: 2.2 },
    { at: [fx, 330, fz], size: 7, color: PALETTE.beacon, power: 1.1, period: 2.2, phase: 0.5 },
    { at: [fx, 290, fz], size: 7, color: PALETTE.beacon, power: 1, period: 2.2 },
    { at: [fx, 246, fz], size: 7, color: PALETTE.beacon, power: 0.9 },
  ];
  // A faint halo of the city's light on the sphere's underside.
  lights.push({ at: [fx, 198, fz], size: 38, color: PALETTE.sodium, power: 0.12 });

  /* Alexanderplatz and Mitte around it. */
  const solids: Box[] = [];
  const near = (bearing: number, metres: number) => fromTower(bearing, metres);
  const [px, pz] = near(305.5, 1930);
  solids.push(block(px, pz, 40, 14, 125, "#7f8794", { kind: 1, a: 0.55, rotY: 0.5 })); // the slab hotel
  lights.push({ at: [px, 127, pz], size: 6, color: PALETTE.beacon, power: 1, period: 2.6, phase: 0.3 });
  for (const [b, m, w, h, c] of [[307.5, 1990, 26, 130, "#5a6678"], [304, 2010, 30, 96, "#6d7686"], [309, 2060, 24, 150, "#4f5d70"]] as const) {
    const [x, z] = near(b, m);
    solids.push(block(x, z, w, w, h, c, { kind: 1, a: 0.6 }));
    lights.push({ at: [x, h + 2, z], size: 5, color: PALETTE.beacon, power: 0.9, period: 2.4, phase: m / 1000 });
  }
  // The Rotes Rathaus: a long brick hall and its tower.
  const [rx, rz] = near(297, 2330);
  solids.push(block(rx, rz, 90, 70, 27, "#8a4b3c", { kind: 1, a: 0.45 }));
  solids.push(block(rx, rz, 15, 15, 74, "#8a4b3c", { kind: 1, a: 0.2 }));
  // The Berliner Dom: its body, a drum, the green dome and its lantern.
  const [dx, dz] = near(291, 2700);
  solids.push(block(dx, dz, 72, 90, 34, "#7d776d", { kind: 1, a: 0.15 }));
  solids.push(block(dx, dz, 32, 32, 22, "#7d776d", {}, 34));
  const copper = material(3, "#5f8e7c");
  const dome = new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  add(dome, copper, dx, 55, dz, 18);
  add(new CylinderGeometry(2.4, 3, 14, 12), copper, dx, 79, dz);
  for (const [ox, oz] of [[-30, -38], [30, -38], [-30, 38], [30, 38]]) add(dome, copper, dx + ox, 34, dz + oz, 6.5);

  group.add(boxes(solids, boxMaterial(shared)));
  group.add(glows(lights, shared));
  return { object: group, dispose: () => disposeObject(group) };
}
