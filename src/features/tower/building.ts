// The tower as numbers. A stylised office tower inspired by Berlin's EDGE East Side Tower: a dark gridded base,
// then glass blocks parted by terrace bands two floors high that climb one floor per run across each face, so
// that opposite corners sit at the same height and the roof steps with them. It is not a model of that building:
// the plan, the floor count, the colours and the direction of the stairs are this scene's own.
// World: metres. +X east, +Y up, +Z south; the tower stands on the origin. No React, no DOM, no three.js here.

export const FLOORS = 36;
export const FLOOR_H = 3.9;        // floor to floor
export const MODULE = 1.35;        // one facade bay, mullion to mullion
export const RUNS = 4;             // a face is four runs wide; a terrace band climbs one floor per run
export const BASE_TOP = 5;         // the base's last floor at a low corner
export const BANDS = 3;            // terrace bands in the glass
export const BAND_FIRST = 11;      // the lowest band's first floor at a low corner
export const BAND_EVERY = 7;       // floors from one band to the next: five of glass, two of terrace
export const BAND_TALL = 2;        // a terrace is two floors high
export const RECESS = 3.4;         // how far a terrace is set back behind the glass line
export const PARAPET = 1.6;

export type FaceId = "E" | "N" | "W" | "S";
// A face runs from its `from` corner to its `to` corner, counter-clockwise seen from above, and looks along `normal`.
export type Face = { id: FaceId; mods: number; from: readonly [number, number]; to: readonly [number, number]; normal: readonly [number, number]; climbs: 1 | -1 };

const MODS_EW = 7;  // bays per run on the east and west faces
const MODS_NS = 10; // bays per run on the north and south faces
export const HALF_X = (RUNS * MODS_NS * MODULE) / 2; // 27: the south and north faces are 54 m long
export const HALF_Z = (RUNS * MODS_EW * MODULE) / 2; // 18.9: the east and west faces are 37.8 m long
export const HEIGHT = FLOORS * FLOOR_H;              // 140.4 to the top slab, 142 with the parapet

// The south-east and north-west corners are the high ones, the other two the low ones.
export const FACES: readonly Face[] = [
  { id: "E", mods: MODS_EW, from: [HALF_X, HALF_Z], to: [HALF_X, -HALF_Z], normal: [1, 0], climbs: -1 },
  { id: "N", mods: MODS_NS, from: [HALF_X, -HALF_Z], to: [-HALF_X, -HALF_Z], normal: [0, -1], climbs: 1 },
  { id: "W", mods: MODS_EW, from: [-HALF_X, -HALF_Z], to: [-HALF_X, HALF_Z], normal: [-1, 0], climbs: -1 },
  { id: "S", mods: MODS_NS, from: [-HALF_X, HALF_Z], to: [HALF_X, HALF_Z], normal: [0, 1], climbs: 1 },
];

/** The level (0..RUNS-1) of a run on a face: how many floors its terraces and its roof sit above a low corner's. */
export function levelOf(face: Face, run: number) {
  return face.climbs === 1 ? run : RUNS - 1 - run;
}

/** The first of the two floors (1 = ground) a terrace band occupies at a given level. */
export const bandFloor = (band: number, level: number) => BAND_FIRST + BAND_EVERY * band + level;
/** The last floor under the roof at a given level. */
export const topFloor = (level: number) => FLOORS - (RUNS - 1) + level;

export type Cell = "base" | "glass" | "terrace" | "none";

/** What the facade is at this floor (1 = ground) on a run of this level. */
export function cellAt(floor: number, level: number): Cell {
  if (floor < 1 || floor > topFloor(level)) return "none";
  if (floor <= BASE_TOP + level) return "base";
  for (let b = 0; b < BANDS; b++) {
    const first = bandFloor(b, level);
    if (floor >= first && floor < first + BAND_TALL) return "terrace";
  }
  return "glass";
}

export type Stretch = { cell: Cell; from: number; floors: number };

/** A run from the ground to its roof, as stretches of the same kind of facade. */
export function stretches(level: number): Stretch[] {
  const out: Stretch[] = [];
  for (let f = 1; f <= topFloor(level); f++) {
    const cell = cellAt(f, level), last = out[out.length - 1];
    if (last && last.cell === cell) last.floors++;
    else out.push({ cell, from: f, floors: 1 });
  }
  return out;
}

/** Floors that are glass on every run of every face: the ones a cutaway can open cleanly. */
export const OPEN_FLOORS = Array.from({ length: FLOORS }, (_, i) => i + 1)
  .filter((f) => Array.from({ length: RUNS }, (_, level) => cellAt(f, level)).every((c) => c === "glass"));

/** The height of a floor's slab top (the level people stand on). */
export const floorY = (floor: number) => (floor - 1) * FLOOR_H;

// The core: lifts and stairs, a closed box up the middle. The route climbs its east wall.
export const CORE = { halfX: 9, halfZ: 7 } as const;
// Where people work on the side the story opens: between the core and the east facade.
export const OFFICE = { xFrom: CORE.halfX + 0.8, xTo: HALF_X - 1.1, zFrom: -HALF_Z + 1.4, zTo: HALF_Z - 1.4 } as const;
