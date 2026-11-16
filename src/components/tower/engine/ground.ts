// The ground of Friedrichshain at blue hour: one plane, drawn by a shader. Streets on the city's grid with pools of
// sodium light under their lamps, Warschauer Strasse wider than the rest with its tram rails, the stone plaza
// around the tower, the Spree as dark water that mirrors the sky and shivers, and a hole where the rail corridor
// cuts through (the cut's own floor, with its tracks, lies seven metres down).
import { Group, Mesh, PlaneGeometry, ShaderMaterial, Color, Vector4 } from "three";
import { CLIMB, RAIL, RIVER, STREET, railY } from "@/features/tower/world";
import { COMMON_GLSL, FRAG_END, PALETTE, type Layer, type Shared } from "./common";
import { GRID } from "./city";

const VERT = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const GROUND_FRAG = /* glsl */ `
uniform vec4 uRiver;   // from xz, to xz
uniform float uRiverHalf;
uniform vec4 uCut;     // x from, x to, z from, z to
uniform vec4 uGrid;    // x of the first street line, z of the first, pitch x, pitch z
uniform vec2 uMain;    // Warschauer Strasse: centre x, half width
uniform vec3 uSodium; uniform vec3 uAsphalt;
varying vec3 vWorld;

float segment(vec2 p, vec2 a, vec2 b, out float t) {
  vec2 ab = b - a;
  t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
  return length(p - a - ab * t);
}

// Lamps stand along both kerbs every 32 m; each throws an oval pool on the street.
float pools(float across, float along, float half_) {
  float d = (fract(along / 32.0) - 0.5) * 32.0;
  float k = abs(across) - (half_ - 2.6);
  return exp(-(k * k * 1.6 + d * d) / 110.0);
}

void main() {
  vec2 p = vWorld.xz;
  if (p.x > uCut.x && p.x < uCut.y && p.y > uCut.z && p.y < uCut.w) discard;
  vec3 n = vec3(0.0, 1.0, 0.0);
  float px = max(fwidth(p.x), fwidth(p.y));
  float near = 1.0 - smoothstep(1.5, 9.0, px); // detail fades out where a pixel covers metres

  // Streets on the grid; Warschauer Strasse is the wide one.
  vec2 cell = (p - uGrid.xy) / uGrid.zw;
  vec2 toLine = (fract(cell + 0.5) - 0.5) * uGrid.zw;     // metres to the nearest street centre line
  bool main_ = abs(p.x - uMain.x) < uMain.y + 6.0;
  float halfX = main_ ? uMain.y : 9.0, halfZ = 9.0;
  float acrossX = main_ ? p.x - uMain.x : toLine.x;
  float onX = 1.0 - smoothstep(halfX - 0.4, halfX + 0.4, abs(acrossX));
  float onZ = 1.0 - smoothstep(halfZ - 0.4, halfZ + 0.4, abs(toLine.y));
  float street = max(onX, onZ);
  float walk = max(onX * smoothstep(halfX - 4.5, halfX - 4.0, abs(acrossX)), onZ * smoothstep(halfZ - 3.5, halfZ - 3.0, abs(toLine.y)));

  vec3 base = mix(vec3(0.07, 0.08, 0.11), uAsphalt, street);
  base = mix(base, vec3(0.2, 0.21, 0.24), walk * 0.8);
  // The plaza round the tower: pale stone in big slabs.
  float plaza = step(abs(p.x), 46.0) * step(abs(p.y), 38.0);
  float slab = 0.92 + 0.08 * step(0.5, fract(p.x / 4.0)) * step(0.5, fract(p.y / 4.0));
  base = mix(base, vec3(0.3, 0.3, 0.32) * slab, plaza);
  vec3 col = base * duskLight(n);

  // Tram rails on Warschauer Strasse catch the light.
  float rail = 0.0;
  for (int i = 0; i < 4; i++) {
    float x = uMain.x + (i < 2 ? -2.6 : 2.6) + (mod(float(i), 2.0) < 0.5 ? -0.72 : 0.72);
    rail = max(rail, 1.0 - smoothstep(0.05, 0.05 + px, abs(p.x - x)));
  }
  col += vec3(0.5, 0.48, 0.45) * rail * 0.18 * near * step(abs(p.x - uMain.x), 6.0);
  // A dashed centre line on the cross streets.
  float dash = (1.0 - smoothstep(0.1, 0.1 + px, abs(toLine.y))) * step(0.5, fract(p.x / 6.0)) * onZ * (1.0 - onX);
  col += vec3(0.6) * dash * 0.06 * near;

  // Sodium light: pools along the kerbs, a warm wash where the pools melt together far away.
  float light = max(pools(acrossX, p.y, halfX) * onX, pools(toLine.y, p.x, halfZ) * onZ);
  light = mix(street * 0.22, light, near);
  col += uSodium * light * 0.55 * (1.0 - uDay);
  col += uSodium * plaza * 0.05;

  // The Spree.
  float t;
  float d = segment(p, uRiver.xy, uRiver.zw, t);
  float half_ = uRiverHalf * (1.0 + 0.08 * sin(t * 9.0));
  if (d < half_ + 3.0) {
    if (d > half_) {
      col = vec3(0.24, 0.22, 0.21) * duskLight(n) + uSodium * 0.06; // the embankment's stone edge
    } else {
      // Water: slow ripples bend the mirror; the sky, a dark depth, and streaks of the lamps on the far bank.
      vec2 flow = p * 0.06 + vec2(uTime * 0.05, uTime * 0.02);
      vec2 rip = vec2(noise21(flow) - 0.5, noise21(flow * 1.7 + 5.0) - 0.5) * 0.18;
      vec3 wn = normalize(vec3(rip.x, 1.0, rip.y));
      vec3 view = normalize(vWorld - cameraPosition);
      vec3 r = reflect(view, wn);
      float fres = 0.04 + 0.96 * pow(1.0 - max(dot(-view, wn), 0.0), 5.0);
      vec3 sky = skyColor(normalize(vec3(r.x, abs(r.y), r.z)));
      vec3 deep = vec3(0.02, 0.03, 0.05);
      col = mix(deep, sky, 0.35 + 0.6 * fres);
      float bank = smoothstep(half_ * 0.45, half_, d);
      float streak = smoothstep(0.55, 0.9, noise21(vec2(p.x * 0.5, p.y * 0.02) + uTime * 0.3));
      col += uSodium * streak * bank * 0.35 * (1.0 - uDay);
    }
  }
  gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
  ${FRAG_END}
}`;

// The floor of the rail cut: ballast, sleepers, rails that glint, the shadow of the walls.
const CUT_FRAG = /* glsl */ `
uniform float uTracks[7];
uniform vec2 uWalls;   // z of the north and south wall
varying vec3 vWorld;
void main() {
  vec2 p = vWorld.xz;
  vec3 n = vec3(0.0, 1.0, 0.0);
  float px = max(fwidth(p.x), fwidth(p.y));
  vec3 col = vec3(0.13, 0.12, 0.12) * (0.85 + 0.3 * noise21(p * 0.7));
  float bed = 0.0, rails = 0.0;
  for (int i = 0; i < 7; i++) {
    float d = abs(p.y - uTracks[i]);
    bed = max(bed, 1.0 - smoothstep(1.6, 2.0, d));
    float r = 1.0 - smoothstep(0.04, 0.04 + px, abs(d - 0.72));
    rails = max(rails, r);
  }
  float sleeper = step(0.62, fract(p.x / 0.62 * 0.5 + 0.5)) * bed;
  col = mix(col, vec3(0.17, 0.15, 0.14), bed * 0.6);
  col *= 1.0 - 0.25 * sleeper * (1.0 - smoothstep(1.0, 4.0, px));
  col *= duskLight(n);
  col += vec3(0.75, 0.72, 0.68) * rails * 0.3 * (1.0 - smoothstep(0.3, 3.0, px));
  // The walls keep the light from the edges.
  float edge = min(abs(p.y - uWalls.x), abs(p.y - uWalls.y));
  col *= 0.55 + 0.45 * smoothstep(0.0, 9.0, edge);
  gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
  ${FRAG_END}
}`;

export function createGround(shared: Shared): Layer {
  const group = new Group();

  const ground = new PlaneGeometry(9000, 9000);
  ground.rotateX(-Math.PI / 2);
  ground.translate(-1200, 0, -900);
  const groundMat = new ShaderMaterial({
    uniforms: {
      ...shared,
      uRiver: { value: new Vector4(RIVER.from[0], RIVER.from[1], RIVER.to[0], RIVER.to[1]) },
      uRiverHalf: { value: RIVER.width / 2 },
      // The ground stops a hair inside the walls so the wall tops meet it cleanly; the bridge deck covers its part.
      uCut: { value: new Vector4(CLIMB.cutEnd, RAIL.xTo, RAIL.zFrom, RAIL.zTo) },
      uGrid: { value: new Vector4(GRID.x0, GRID.z0, GRID.pitchX, GRID.pitchZ) },
      uMain: { value: [STREET.x, (STREET.walkEast - STREET.walkWest) / 2] },
      uSodium: { value: new Color(PALETTE.sodium) },
      uAsphalt: { value: new Color(PALETTE.asphalt) },
    },
    vertexShader: `${COMMON_GLSL}\n${VERT}`, fragmentShader: `${COMMON_GLSL}\n${GROUND_FRAG}`,
  });
  const groundMesh = new Mesh(ground, groundMat);
  groundMesh.frustumCulled = false;
  groundMesh.renderOrder = -5;
  group.add(groundMesh);

  // The cut's floor: flat under the bridge, rising westward with the rails until it meets the street level.
  const cutW = RAIL.xTo - CLIMB.cutEnd, cutD = RAIL.zTo - RAIL.zFrom;
  const floor = new PlaneGeometry(cutW, cutD, 48, 1);
  floor.rotateX(-Math.PI / 2);
  floor.translate((CLIMB.cutEnd + RAIL.xTo) / 2, 0, (RAIL.zFrom + RAIL.zTo) / 2);
  const pos = floor.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, Math.min(railY(pos.getX(i)), -0.3));
  floor.computeVertexNormals();
  const cutMat = new ShaderMaterial({
    uniforms: { ...shared, uTracks: { value: [...RAIL.tracks] }, uWalls: { value: [RAIL.zFrom, RAIL.zTo] } },
    vertexShader: `${COMMON_GLSL}\n${VERT}`, fragmentShader: `${COMMON_GLSL}\n${CUT_FRAG}`,
  });
  const floorMesh = new Mesh(floor, cutMat);
  floorMesh.frustumCulled = false;
  group.add(floorMesh);

  return {
    object: group,
    dispose: () => { ground.dispose(); groundMat.dispose(); floor.dispose(); cutMat.dispose(); },
  };
}
