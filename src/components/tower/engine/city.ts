// Friedrichshain around the tower, and the city beyond it. Near the tower the blocks are Berlin's own: closed
// rings of five-storey houses round a courtyard, every house a little different, a Plattenbau slab here and
// there, new glass along the Spree. Further out each block is one box, and the boxes sink into the haze. Between
// them: Warschauer Strasse and its bridge over the rail cut, the U-Bahn viaduct in Hochbahn green ending in its
// station, the S-Bahn platform down in the cut, overhead-line portals, trees, street lamps, a carpet of lights.
import { IcosahedronGeometry, Group } from "three";
import { BRIDGE, CLIMB, RAIL, RIVER, STREET, VIADUCT, railY, type XZ } from "@/features/tower/world";
import { PALETTE, block, boxMaterial, boxes, disposeObject, glows, leaves, seeded, type Box, type Glow, type Layer, type Leaf, type Shared, type Tier } from "./common";

// The street grid the ground draws and the blocks fill: street centre lines at x0 + i * pitchX and z0 + j * pitchZ.
export const GRID = { x0: STREET.x, z0: 47.5, pitchX: 110, pitchZ: 95, street: 18 } as const;

const NEAR = 720;   // blocks closer than this to the tower are built house by house
const FAR = 3600;   // the city ends in the haze here
const HERO_EYE: XZ = [224, 266];

const ALTBAU = ["#7d7468", "#8a7b6b", "#6f6a66", "#857367", "#6c7078", "#91857a", "#7a6a60", "#8b8178", "#706258"];
const PLATTE = ["#8c8d8f", "#9a958c", "#86898e"];
const GLASS = ["#3d4a5c", "#4a5566", "#38465a"];
const ROOF = "#2b2f3a";

function toRiver(x: number, z: number) {
  const [ax, az] = RIVER.from, [bx, bz] = RIVER.to;
  const abx = bx - ax, abz = bz - az;
  const t = Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz)));
  return Math.hypot(x - ax - abx * t, z - az - abz * t);
}

/** Is this rectangle (centre, half sizes) free for a building? */
function free(x: number, z: number, hx: number, hz: number) {
  const x0 = x - hx, x1 = x + hx, z0 = z - hz, z1 = z + hz;
  const hits = (ax0: number, ax1: number, az0: number, az1: number) => x0 < ax1 && x1 > ax0 && z0 < az1 && z1 > az0;
  if (hits(STREET.walkWest - 2, VIADUCT.x + VIADUCT.width / 2 + 3, STREET.from - 400, STREET.to + 400)) return false; // street and viaduct
  if (hits(RAIL.xFrom - 50, RAIL.xTo + 50, RAIL.zFrom - 6, RAIL.zTo + 6)) return false;                                // the cut
  if (hits(-48, 40, -40, 40)) return false;                                                                         // the tower's plaza
  if (toRiver(x, z) < RIVER.width / 2 + Math.max(hx, hz) + 10) return false;
  if (Math.hypot(x - HERO_EYE[0], z - HERO_EYE[1]) < 70 + Math.max(hx, hz)) return false;                          // keep the camera's foreground open
  return true;
}

export function createCity(shared: Shared, tier: Tier): Layer {
  const group = new Group();
  const rnd = seeded(29);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rnd() * list.length)];
  const solids: Box[] = [];
  const lamps: Glow[] = [];
  const crowns: Leaf[] = [];
  const high = tier === "high";

  /* Blocks. */
  const hxBlock = (GRID.pitchX - GRID.street) / 2, hzBlock = (GRID.pitchZ - GRID.street) / 2;
  const span = Math.ceil(FAR / GRID.pitchX);
  for (let i = -span; i <= span; i++) for (let j = -span; j <= span; j++) {
    const cx = GRID.x0 + GRID.pitchX * (i + 0.5), cz = GRID.z0 + GRID.pitchZ * (j + 0.5);
    const dist = Math.hypot(cx, cz);
    if (dist > FAR) continue;
    if (cx > 900 && cz > -200) continue; // behind every camera of the story
    // Blocks beside the street and the viaduct give way to them.
    let x0 = cx - hxBlock, x1 = cx + hxBlock;
    if (x0 < VIADUCT.x + 8 && x1 > STREET.walkWest - 2) { if (cx > STREET.x) x0 = VIADUCT.x + 9; else x1 = STREET.walkWest - 3; }
    const bx = (x0 + x1) / 2, hx = (x1 - x0) / 2;
    if (hx < 12) continue;
    if (!free(bx, cz, hx, hzBlock)) continue;

    if (dist < NEAR) {
      const kind = rnd();
      if (kind < 0.12) {
        // A Plattenbau slab, ten or eleven storeys, along the long side of its block.
        const h = 29 + Math.floor(rnd() * 3) * 3;
        solids.push(block(bx, cz + (rnd() - 0.5) * 20, hx * 1.7, 12, h, pick(PLATTE), { kind: 1, a: 0.5 + rnd() * 0.25 }));
        solids.push(block(bx, cz, hx * 1.7 - 2, 10, 2.4, ROOF, {}, h));
        continue;
      }
      if (kind < 0.2 && toRiver(cx, cz) < RIVER.width / 2 + 260) {
        // New glass by the river: a stepped office block.
        const h = 36 + rnd() * 40;
        solids.push(block(bx, cz, hx * 1.5, hzBlock * 1.4, h, pick(GLASS), { kind: 1, a: 0.62 + rnd() * 0.2 }));
        solids.push(block(bx + hx * 0.2, cz, hx * 0.8, hzBlock * 0.9, 10 + rnd() * 16, pick(GLASS), { kind: 1, a: 0.7 }, h));
        continue;
      }
      // A closed block of houses round a courtyard. Each side is cut into houses of their own width and height.
      const depth = 13;
      const sides: Array<[number, number, number, number, boolean]> = [
        [bx, cz - hzBlock + depth / 2, hx * 2, depth, true], [bx, cz + hzBlock - depth / 2, hx * 2, depth, true],
        [bx - hx + depth / 2, cz, depth, hzBlock * 2 - depth * 2, false], [bx + hx - depth / 2, cz, depth, hzBlock * 2 - depth * 2, false],
      ];
      for (const [sx, sz, w, d, alongX] of sides) {
        const len = alongX ? w : d;
        if (!high) {
          const h = 18 + rnd() * 5;
          solids.push(block(sx, sz, w, d, h, pick(ALTBAU), { kind: 1, a: 0.3 + rnd() * 0.25 }));
          continue;
        }
        let u = -len / 2;
        while (u < len / 2 - 4) {
          const step = Math.min(len / 2 - u, 13 + rnd() * 11);
          const mid = u + step / 2;
          const h = rnd() < 0.08 ? 12 + rnd() * 4 : 17.5 + rnd() * 5.5; // now and then a lower post-war infill
          const px = alongX ? sx + mid : sx, pz = alongX ? sz : sz + mid;
          const sw = alongX ? step - 0.25 : w, sd = alongX ? d : step - 0.25;
          solids.push(block(px, pz, sw, sd, h, pick(ALTBAU), { kind: 1, a: 0.28 + rnd() * 0.32 }));
          if (rnd() < 0.5) solids.push(block(px, pz, sw * 0.86, sd * 0.6, 2.2, ROOF, {}, h)); // a roof storey
          u += step;
        }
      }
      // A rear house in the courtyard, sometimes.
      if (high && rnd() < 0.4) solids.push(block(bx + (rnd() - 0.5) * hx, cz, 11, hzBlock * 0.9, 15 + rnd() * 4, pick(ALTBAU), { kind: 1, a: 0.35 }));
    } else {
      // The far city: one box per block, a few towers. Every other block on the phone.
      if (!high && (i + j) % 2 === 0) continue;
      if (rnd() < 0.12) continue; // a park, a square, a yard
      const tower = rnd() < 0.022;
      const h = tower ? 40 + rnd() * 38 : 14 + rnd() * 12;
      const w = tower ? 18 + rnd() * 16 : hx * (1.5 + rnd() * 0.45), d = tower ? 18 + rnd() * 16 : hzBlock * (1.5 + rnd() * 0.45);
      solids.push(block(bx + (rnd() - 0.5) * 10, cz + (rnd() - 0.5) * 10, w, d, h, tower ? pick([...PLATTE, ...GLASS]) : pick(ALTBAU), { kind: 1, a: 0.3 + rnd() * 0.3 }));
      if (tower) lamps.push({ at: [bx, h + 1.5, cz], size: 3, color: PALETTE.beacon, power: 0.9, period: 2.4, phase: rnd() });
      // The lights of its streets, seen from afar.
      const n = high ? 3 : 1;
      for (let k = 0; k < n; k++) {
        const onX = rnd() < 0.5;
        lamps.push({
          at: [onX ? cx - GRID.pitchX / 2 + (rnd() - 0.5) * 4 : cx + (rnd() - 0.5) * GRID.pitchX, 7, onX ? cz + (rnd() - 0.5) * GRID.pitchZ : cz - GRID.pitchZ / 2],
          size: 4, color: rnd() < 0.8 ? PALETTE.sodium : "#dfe8ff", power: 0.55,
        });
      }
    }
  }

  /* Warschauer Strasse: lamps on both kerbs and on the median, trees on the median and the pavements. */
  for (let z = STREET.from; z <= STREET.to; z += 32) {
    const onBridge = z > BRIDGE.zFrom && z < BRIDGE.zTo;
    for (const x of [STREET.kerbWest - 1, STREET.kerbEast + 1]) lamps.push({ at: [x, onBridge ? 7.5 : 8.5, z], size: 3.4, color: PALETTE.sodium, power: 1 });
    if (onBridge || (z > -48 && z < 40)) continue;
    for (const [x, sway] of [[STREET.median.x, 0.25], [STREET.walkWest + 1.6, 0.2], [STREET.walkEast - 1.6, 0.2]] as const) {
      const s = 5.5 + rnd() * 2.5;
      crowns.push({ at: [x + (rnd() - 0.5), 6 + s * 0.4, z + 16 + (rnd() - 0.5) * 4], size: [s, s * 0.9, s], color: pick(["#24483a", "#2c5442", "#1f3f34"]), sway });
    }
  }
  // Lamps on the near cross streets.
  for (let j = -6; j <= 7; j++) {
    const z = GRID.z0 + GRID.pitchZ * j;
    if (z > RAIL.zFrom - 10 && z < RAIL.zTo + 10) continue;
    for (let x = -520; x <= 520; x += 32) {
      if (Math.abs(x - STREET.x) < 24) continue;
      lamps.push({ at: [x, 7, z + (x % 64 === 0 ? -7.5 : 7.5)], size: 3, color: PALETTE.sodium, power: 0.85 });
    }
  }
  for (let i = -5; i <= 5; i++) {
    const x = GRID.x0 + GRID.pitchX * i;
    if (i === 0) continue;
    for (let z = -560; z <= 640; z += 32) {
      if (z > RAIL.zFrom - 6 && z < RAIL.zTo + 6) continue;
      lamps.push({ at: [x + (z % 64 === 0 ? -7.5 : 7.5), 7, z], size: 3, color: PALETTE.sodium, power: 0.85 });
    }
  }

  /* The bridge over the cut. */
  const bw = STREET.walkEast - STREET.walkWest, bmid = (STREET.walkEast + STREET.walkWest) / 2;
  solids.push(block(bmid, (BRIDGE.zFrom + BRIDGE.zTo) / 2, bw, BRIDGE.zTo - BRIDGE.zFrom, BRIDGE.deck, "#262a33", {}, -BRIDGE.deck));
  for (const x of [STREET.walkWest + 0.2, STREET.walkEast - 0.2]) solids.push(block(x, (BRIDGE.zFrom + BRIDGE.zTo) / 2, 0.3, BRIDGE.zTo - BRIDGE.zFrom, 1.2, "#3a4150"));
  for (const z of [BRIDGE.zFrom + 8, (BRIDGE.zFrom + BRIDGE.zTo) / 2, BRIDGE.zTo - 8]) solids.push(block(bmid, z, 6, 4, -RAIL.y - BRIDGE.deck, "#30343e", {}, RAIL.y)); // piers

  /* The rail cut: its walls, shorter as the rails climb; then the Stadtbahn viaduct: brick arches with lit bars
     and workshops in them, a deck for every track. Overhead-line portals stand over both, every 70 m. */
  for (let x = CLIMB.cutEnd; x < RAIL.xTo; x += 20) {
    const w = Math.min(20, RAIL.xTo - x), floorY = Math.min(railY(x + w / 2), -0.3);
    for (const z of [RAIL.zFrom - 0.6, RAIL.zTo + 0.6]) solids.push(block(x + w / 2, z, w, 1.2, 1 - floorY, "#3b3e46", {}, floorY));
  }
  const vz = (RAIL.zFrom + RAIL.zTo) / 2, vd = RAIL.zTo - RAIL.zFrom - 2;
  for (let x = RAIL.xFrom; x < CLIMB.cutEnd; x += 16) {
    const w = Math.min(16, CLIMB.cutEnd - x), top = railY(x + w / 2);
    if (top < 0.2) continue;
    const arches = top > 5;
    solids.push(block(x + w / 2, vz, w - (arches ? 1.2 : 0), vd - 4, top - 0.7, "#6a3d30", arches ? { kind: 1, a: 0.42, seed: x * 0.37 } : {}));
    solids.push(block(x + w / 2, vz, w, vd, 0.7, "#3a3536", {}, top - 0.7));
    if (arches) for (const z of [RAIL.zFrom + 1.5, RAIL.zTo - 1.5]) solids.push(block(x, z, 1.6, 2.4, top - 0.7, "#5a3328"));
  }
  for (let x = RAIL.xFrom + 40; x < RAIL.xTo; x += high ? 70 : 140) {
    if (x > STREET.walkWest - 10 && x < STREET.walkEast + 10) continue;
    const base = railY(x);
    for (const z of [RAIL.zFrom + 1.5, RAIL.zTo - 1.5]) solids.push(block(x, z, 0.5, 0.5, 7.4, "#4a505b", {}, base));
    solids.push(block(x, (RAIL.zFrom + RAIL.zTo) / 2, 0.45, RAIL.zTo - RAIL.zFrom - 2, 0.5, "#4a505b", {}, base + 7.2));
    if (base > 0) lamps.push({ at: [x, base + 7.6, RAIL.zTo - 1.5], size: 2.2, color: "#e6eeff", power: 0.5 });
  }
  const platZ = (RAIL.tracks[2] + RAIL.tracks[3]) / 2, platW = 3.6;
  solids.push(block(165, platZ, 170, platW, 1, "#4b4d52", {}, RAIL.y));
  solids.push(block(165, platZ, 150, platW + 1.4, 0.35, "#5b6270", {}, RAIL.y + 4.6));
  for (let x = 95; x <= 235; x += 14) {
    solids.push(block(x, platZ, 0.3, 0.3, 3.6, "#5b6270", {}, RAIL.y + 1));
    lamps.push({ at: [x + 7, RAIL.y + 4.3, platZ], size: 2.6, color: "#e6eeff", power: 0.9 });
  }

  /* The U-Bahn viaduct: steel deck on green steel posts, brick at the station, the station hall at its end. */
  const vx = VIADUCT.x, vw = VIADUCT.width;
  const vLen = VIADUCT.zFrom - VIADUCT.zTo, vMid = (VIADUCT.zFrom + VIADUCT.zTo) / 2;
  solids.push(block(vx, vMid, vw, vLen, 1, "#2f4a3e", {}, VIADUCT.y - 1));
  for (const side of [-1, 1]) solids.push(block(vx + side * (vw / 2 - 0.1), vMid, 0.2, vLen, 1.1, "#3f5f50", {}, VIADUCT.y));
  for (let z = VIADUCT.station.zTo + 8; z < VIADUCT.zFrom; z += 16) {
    for (const side of [-1, 1]) solids.push(block(vx + side * (vw / 2 - 0.8), z, 0.7, 0.7, VIADUCT.y - 1, "#2f4a3e"));
    solids.push(block(vx, z, vw - 1, 0.7, 0.7, "#2f4a3e", {}, VIADUCT.y - 1.7)); // the cross beam
  }
  // The station: brick piers below, a long glass roof above, its hall at the end toward the tower.
  const sLen = VIADUCT.station.zTo - VIADUCT.station.zFrom, sMid = (VIADUCT.station.zFrom + VIADUCT.station.zTo) / 2;
  solids.push(block(vx, sMid, vw + 4, sLen, VIADUCT.y - 1, "#5a3a30", { kind: 1, a: 0.5 }));
  solids.push(block(vx, sMid, vw + 5, sLen, 0.4, "#6b7a88", {}, VIADUCT.y + 4.6));
  solids.push(block(vx, VIADUCT.zTo - 4, vw + 6, 10, VIADUCT.y + 7, "#6a4637", { kind: 1, a: 0.6 }));
  for (let z = VIADUCT.station.zFrom + 6; z <= VIADUCT.station.zTo; z += 12) {
    lamps.push({ at: [vx, VIADUCT.y + 4.1, z], size: 3, color: "#f0f4ff", power: 0.9 });
    for (const side of [-1, 1]) solids.push(block(vx + side * (vw / 2 + 1.5), z, 0.35, 0.35, 4.6, "#6b7a88", {}, VIADUCT.y));
  }
  // The lamps under the viaduct light its underside.
  for (let z = VIADUCT.station.zTo + 16; z < VIADUCT.zFrom; z += 32) lamps.push({ at: [vx, VIADUCT.y - 1.6, z], size: 2.4, color: PALETTE.sodium, power: 0.7 });

  /* Trees in the courtyards and on the squares, a few, far enough to stay small. */
  if (high) for (let k = 0; k < 140; k++) {
    const x = -600 + rnd() * 1100, z = -700 + rnd() * 1400;
    if (!free(x, z, 3, 3)) continue;
    const s = 6 + rnd() * 4;
    crowns.push({ at: [x, s * 0.75, z], size: [s, s * 0.85, s], color: pick(["#1f3f34", "#24483a"]), sway: 0.15 });
  }

  group.add(boxes(solids, boxMaterial(shared)));
  group.add(leaves(crowns, new IcosahedronGeometry(0.5, 1), shared));
  group.add(glows(lamps, shared));
  return { object: group, dispose: () => disposeObject(group) };
}
