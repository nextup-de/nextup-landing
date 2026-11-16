// Everything that moves on its own clock: S-Bahn trains and an ICE through the rail cut, the U1 coming over its
// viaduct into the terminus and leaving again, the M10 tram and the cars on Warschauer Strasse, the jibs of the
// cranes turning. One batch of boxes and one batch of lights, rewritten every frame. Each vehicle's position is a
// pure function of time, so a still frame (reduced motion) is simply one moment of the same city.
import { Group, Matrix4, Quaternion, Vector3 } from "three";
import { RAIL, STREET, VIADUCT, railY } from "@/features/tower/world";
import { PALETTE, boxMaterial, boxes, disposeObject, glows, seeded, type Box, type Glow, type Layer, type Shared, type Tier } from "./common";

// A part of one car, in the car's own terms: along its length, up from the rail, across.
type Part = { len: number; up: number; h: number; w: number; color: string; kind?: number; a?: number; at?: number };
type Vehicle = {
  axis: "x" | "z"; across: number; y: number; dir: 1 | -1;
  cars: number; carLen: number; parts: readonly Part[];
  head: (t: number) => number | null;  // where the front is along the axis, or null when out of sight
  rail?: boolean;                      // follows the corridor's rails up out of the cut
  min: number; max: number;            // the stretch it may be seen on
  front: string; back: string; lightUp: number; lightPower: number;
  first: number; glow: number;
};

const HIDE = -900;

/** Comes in, stops, waits, leaves the way it came: the U1 at its terminus. Returns the head's position. */
function terminus(t: number, period: number, phase: number, far: number, stop: number) {
  const u = (((t / period + phase) % 1) + 1) % 1 * period;
  const inT = period * 0.3, wait = period * 0.25, outT = period * 0.3;
  if (u < inT) { const k = u / inT; return far + (stop - far) * (1 - (1 - k) * (1 - k) * (1 - k)); }
  if (u < inT + wait) return stop;
  if (u < inT + wait + outT) { const k = (u - inT - wait) / outT; return stop + (far - stop) * k * k * k; }
  return null;
}

/** Runs through at speed and is gone; the next one comes after a pause. */
function through(t: number, speed: number, from: number, to: number, gap: number, phase: number) {
  const run = Math.abs(to - from) / speed;
  const u = ((((t + phase) % (run + gap)) + run + gap) % (run + gap));
  return u > run ? null : from + (to - from) * (u / run);
}

export function createMovers(shared: Shared, tier: Tier): Layer {
  const group = new Group();
  const rnd = seeded(41);
  const high = tier === "high";
  const list: Box[] = [];
  const lights: Glow[] = [];
  const vehicles: Vehicle[] = [];

  const add = (v: Omit<Vehicle, "first" | "glow">) => {
    const first = list.length;
    for (let c = 0; c < v.cars; c++) for (const part of v.parts) {
      const size: [number, number, number] = v.axis === "x" ? [part.len, part.h, part.w] : [part.w, part.h, part.len];
      list.push({ at: [0, HIDE, 0], size, color: part.color, kind: part.kind ?? 0, a: part.a ?? 0, seed: rnd() * 10 });
    }
    const glow = lights.length;
    lights.push({ at: [0, HIDE, 0], size: v.lightPower > 0.8 ? 2.6 : 1.8, color: v.front, power: v.lightPower });
    lights.push({ at: [0, HIDE, 0], size: 1.6, color: v.back, power: v.lightPower * 0.8 });
    vehicles.push({ ...v, first, glow });
  };

  // Train liveries, as parts of one car.
  const SBAHN: Part[] = [
    { len: 17.6, up: 1.3, h: 1.6, w: 3.0, color: "#8e1f22" },                          // the red lower body
    { len: 16.4, up: 2.55, h: 0.9, w: 3.04, color: "#ffd9a6", kind: 4, a: 0.95 },      // the lit windows
    { len: 17.6, up: 3.35, h: 0.7, w: 3.0, color: "#d99a1e" },                         // the ochre top
  ];
  const UBAHN: Part[] = [
    { len: 12.4, up: 1.2, h: 1.4, w: 2.3, color: "#e9b800" },
    { len: 11.2, up: 2.35, h: 0.85, w: 2.34, color: "#ffe2b8", kind: 4, a: 0.95 },
    { len: 12.4, up: 3.05, h: 0.55, w: 2.3, color: "#e9b800" },
  ];
  const ICE: Part[] = [
    { len: 24.6, up: 1.5, h: 2.0, w: 2.95, color: "#dfe2e7" },
    { len: 24.6, up: 1.05, h: 0.22, w: 2.98, color: "#c8102e" },
    { len: 23, up: 2.85, h: 0.75, w: 2.99, color: "#e8f0ff", kind: 4, a: 0.8 },
    { len: 24.6, up: 3.6, h: 0.75, w: 2.95, color: "#dfe2e7" },
  ];
  const TRAM: Part[] = [
    { len: 8.6, up: 0.9, h: 1.2, w: 2.4, color: "#efc300" },
    { len: 8.0, up: 2.05, h: 1.1, w: 2.44, color: "#ffe6bf", kind: 4, a: 0.9 },
    { len: 8.6, up: 2.95, h: 0.7, w: 2.4, color: "#f2efe6" },
  ];

  /* The rail cut. Westbound on the northern tracks, eastbound on the southern ones; the far ones are what the
     opening shot sees over the wall, so the first S-Bahn there comes in a second after the page opens. */
  const tracks = RAIL.tracks;
  const cut = { min: RAIL.xFrom + 6, max: RAIL.xTo - 6 };
  const sbahn = (track: number, dir: 1 | -1, cars: number, speed: number, gap: number, phase: number) => add({
    axis: "x", across: track, y: 0, rail: true, dir, cars, carLen: 18, parts: SBAHN, ...cut,
    head: (t) => through(t, speed, dir < 0 ? RAIL.xTo + 40 : RAIL.xFrom - 200, dir < 0 ? RAIL.xFrom - 200 : RAIL.xTo + 40, gap, phase),
    front: "#fff4dc", back: PALETTE.tail, lightUp: 1.6, lightPower: 1,
  });
  sbahn(tracks[0], -1, 8, 27, 14, 17);   // phase chosen so it comes out from behind the tower a second in
  sbahn(tracks[1], 1, 6, 25, 22, 10);
  if (high) sbahn(tracks[3], 1, 4, 22, 30, 40);
  sbahn(tracks[2], -1, 4, 24, 26, 3);
  add({
    axis: "x", across: tracks[high ? 5 : 4], y: 0, rail: true, dir: 1, cars: high ? 9 : 6, carLen: 25.2, parts: ICE, ...cut,
    head: (t) => through(t, 42, RAIL.xFrom - 260, RAIL.xTo + 60, 38, 20),
    front: "#ffffff", back: PALETTE.tail, lightUp: 1.7, lightPower: 1.2,
  });

  /* The U1 on its viaduct: two trains, one per track, coming in to the terminus and leaving again. */
  const deck = VIADUCT.y;
  for (const [side, phase] of [[-1, 0.12], [1, 0.62]] as const) add({
    axis: "z", across: VIADUCT.x + side * 1.9, y: deck, dir: -1, cars: 6, carLen: 12.8, parts: UBAHN,
    min: VIADUCT.zTo + 2, max: VIADUCT.zFrom + 400,
    head: (t) => terminus(t, 64, phase, VIADUCT.zFrom + 260, VIADUCT.zTo + 6),
    front: "#fff1d6", back: PALETTE.tail, lightUp: 1.4, lightPower: 0.9,
  });

  /* The M10 on Warschauer Strasse, and the cars. Southbound runs toward +z. */
  for (const tram of STREET.tram) add({
    axis: "z", across: tram.x, y: 0, dir: tram.dir as 1 | -1, cars: 5, carLen: 8.9, parts: TRAM, min: STREET.from, max: STREET.to,
    head: (t) => through(t, 9, tram.dir > 0 ? STREET.from - 50 : STREET.to + 50, tram.dir > 0 ? STREET.to + 50 : STREET.from - 50, 50, tram.dir > 0 ? 30 : 95),
    front: "#fff4dc", back: PALETTE.tail, lightUp: 1.2, lightPower: 0.9,
  });
  const CAR_COLORS = ["#2a2f38", "#5b6470", "#7a1f24", "#d7d9dd", "#1d2a44", "#33373d", "#9aa0a8", "#e3c04a"];
  const perLane = high ? 9 : 4;
  for (const lane of STREET.lanes) for (let k = 0; k < perLane; k++) {
    const color = CAR_COLORS[Math.floor(rnd() * CAR_COLORS.length)];
    const speed = 11 + rnd() * 4, phase = rnd() * 200;
    const dir = lane.dir as 1 | -1;
    add({
      axis: "z", across: lane.x, y: 0, dir, cars: 1, carLen: 4.6, min: STREET.from, max: STREET.to,
      parts: [{ len: 4.4, up: 0.75, h: 0.9, w: 1.8, color }, { len: 2.4, up: 1.45, h: 0.6, w: 1.6, color: "#1a1f2a" }],
      head: (t) => through(t, speed, dir > 0 ? STREET.from : STREET.to, dir > 0 ? STREET.to : STREET.from, 0, phase + (k * (STREET.to - STREET.from)) / perLane / speed),
      front: "#fff6e6", back: PALETTE.tail, lightUp: 0.7, lightPower: 0.75,
    });
  }

  /* Cranes: Berlin is never finished. A mast, a jib that turns slowly, a red light at each end. */
  const cranes = [[-210, 160, 62, 0.05], [-430, -260, 70, -0.04], [330, -300, 58, 0.035], [-760, 40, 66, 0.03]] as const;
  const craneFirst = list.length, craneGlow = lights.length;
  for (const [x, z, h] of cranes) {
    list.push({ at: [x, h / 2, z], size: [1.8, h, 1.8], color: "#c9a227" });           // the mast
    list.push({ at: [x, h + 1.2, z], size: [44, 1.4, 1.4], color: "#c9a227" });        // the jib (turned each frame)
    list.push({ at: [x, h + 1.2, z], size: [3.4, 2.4, 3.4], color: "#3b4252" });       // the counterweight and cab
    lights.push({ at: [x, h + 3, z], size: 3.2, color: PALETTE.beacon, power: 1, period: 1.8 });
    lights.push({ at: [x, h + 1.4, z], size: 2.6, color: PALETTE.beacon, power: 0.9, period: 1.8, phase: 0.5 });
  }

  const mesh = boxes(list, boxMaterial(shared));
  const lamps = glows(lights, shared, true);
  group.add(mesh, lamps);

  const M = new Matrix4(), Q = new Quaternion(), P = new Vector3(), S = new Vector3(), UP = new Vector3(0, 1, 0), NONE = new Quaternion();
  const sizes = list.map((b) => b.size);
  const place = (i: number, x: number, y: number, z: number, rotY = 0) => {
    Q.setFromAxisAngle(UP, rotY);
    M.compose(P.set(x, y, z), rotY ? Q : NONE, S.set(sizes[i][0], sizes[i][1], sizes[i][2]));
    mesh.setMatrixAt(i, M);
  };

  const update = (time: number) => {
    for (const v of vehicles) {
      const head = v.head(time);
      let i = v.first;
      const at = (along: number, up: number) => {
        const y = (v.rail ? railY(along) : v.y) + up;
        return (v.axis === "x" ? [along, y, v.across] : [v.across, y, along]) as [number, number, number];
      };
      for (let c = 0; c < v.cars; c++) {
        const centre = head === null ? NaN : head - v.dir * (c * v.carLen + v.carLen / 2);
        const seen = head !== null && centre > v.min && centre < v.max;
        for (const part of v.parts) {
          if (seen) { const [x, y, z] = at(centre + (part.at ?? 0), part.up); place(i, x, y, z); } else place(i, 0, HIDE, 0);
          i++;
        }
      }
      const frontAt = head === null ? NaN : head;
      const backAt = head === null ? NaN : head - v.dir * v.cars * v.carLen;
      for (const [k, along] of [[0, frontAt + v.dir * 0.2], [1, backAt - v.dir * 0.2]] as const) {
        const ok = head !== null && along > v.min && along < v.max;
        const [x, y, z] = ok ? at(along, v.lightUp) : [0, HIDE, 0];
        lamps.setAt(v.glow + k, x, y, z);
      }
    }
    cranes.forEach(([x, z, h, speed], c) => {
      const a = time * speed + c * 1.7;
      const reach = 14, tip = 36;
      place(craneFirst + c * 3 + 1, x + Math.cos(a) * reach, h + 1.2, z - Math.sin(a) * reach, a);
      lamps.setAt(craneGlow + c * 2 + 1, x + Math.cos(a) * tip, h + 1.6, z - Math.sin(a) * tip);
    });
    mesh.instanceMatrix.needsUpdate = true;
    lamps.commit();
  };
  update(30); // the still frame (reduced motion): an S-Bahn on the viaduct under the Fernsehturm

  return { object: group, update: (time) => update(time), dispose: () => disposeObject(group) };
}
