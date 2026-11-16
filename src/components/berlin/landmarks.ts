// Berlin's landmarks as line art, drawn by hand in local units: x = 0 is the middle of the foot, y = 0 the
// ground, up is negative. Each one has a silhouette (`sil`, filled with the ground's colour so what stands in
// front hides what stands behind) and its lines (`lines`, stroked and drawn in one after another). `gold` lines
// carry the scene's gold: a lit window, the Victoria on her column. Proportions follow the buildings:
//   Fernsehturm   thin tapering shaft, the sphere's middle at ~0.58 of the height, the antenna the top third
//   Brandenburger six columns, the wider middle passage, the attic and the quadriga on top, the low side wings
//   Reichstag     four corner towers, the portico of six columns, the glass dome with its rings
//   Berliner Dom  the big ribbed dome on its drum with the lantern, four corner towers with their small domes
//   Oberbaum      the bridge in its own module (bridge()): brick arches, the U-Bahn arcade, two towers
export type Mark = { sil?: string; lines: string[]; gold?: string[] };

const r = (n: number) => Math.round(n * 10) / 10;

/** A round-headed arch opening, x from a to b, its feet at `foot`, the springing at `spring`. */
export function arch(a: number, b: number, foot: number, spring: number): string {
  const rx = r((b - a) / 2);
  return `M${r(a)} ${r(foot)}V${r(spring)}A${rx} ${rx} 0 0 1 ${r(b)} ${r(spring)}V${r(foot)}`;
}

const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-6; v += step) out.push(r(v));
  return out;
};

export const FERNSEHTURM: Mark = {
  sil: "M-6 0L-2.4-106A9 9 0 1 1 2.4-106L6 0ZM-2-124L-1.5-138H1.5L2-124Z",
  lines: [
    "M-30 0V-6L-24-10L-18-6L-12-10L-6-6M6-6L12-10L18-6L24-10L30-6V0",
    "M-6 0L-2.4-106M6 0L2.4-106",
    "M-9-115A9 9 0 1 0 9-115A9 9 0 1 0-9-115M-8.8-117H8.8M-8.8-113H8.8",
    "M-2-124L-1.5-138H1.5L2-124M-3-127H3",
    "M0-138V-200M-1.4-152H1.4M-1.2-166H1.2M-1-180H1",
  ],
};

export const TOR: Mark = {
  sil: "M-50 0V-14H-40V-26H-28V-32H-9V-35H9V-32H28V-26H40V-14H50V0Z",
  lines: [
    "M-52 0H52M-40-3H40",
    ...[-31, -19.5, -8, 8, 19.5, 31].map((x) => `M${x - 1.6}-3V-21M${x + 1.6}-3V-21`),
    "M-40-21H40V-26H-40ZM-40-23.5H40",
    "M-28-26V-32H28V-26M-20-27.5H20V-30.5H-20ZM-9-32V-35H9V-32",
    "M-50 0V-14H-40M40-14H50V0M-47-2V-12M-43-2V-12M43-2V-12M47-2V-12",
    "M-8-35L-7.5-38.5L-6-40.5L-5.2-38L-4-40.5L-3-38L-1.8-40.5L-1-38L0-41L1-35M2-35V-40.5L3.5-42.5M3.5-38.5L6-44M6-44V-48.5M4.5-46.5H7.5",
  ],
};

export const REICHSTAG: Mark = {
  sil: "M-65 0V-40H-50V-30H-20L-20-32C-20-60 20-60 20-32V-30H50V-40H65V0Z",
  lines: [
    "M-67 0H67",
    "M-65 0V-40H-50V0M50 0V-40H65V0M-66-40H-49M49-40H66M-60-10V-30M-55-10V-30M55-10V-30M60-10V-30",
    "M-50-30H50M-50-26H50M-50-8H50",
    [-44, -38, -32, -26, 26, 32, 38, 44].map((x) => `M${x}-12V-22`).join(""),
    [-15, -9, -3, 3, 9, 15].map((x) => `M${x}-8V-27`).join("") + "M-19-27L0-35L19-27ZM-22-8H22M-24-4H24",
    "M-22-30V-32H22V-30M-20-32C-20-60 20-60 20-32",
    "M-10-32C-10-56 10-56 10-32M0-32V-53M-19-38H19M-16.5-44H16.5M-11-49H11M-5-53.5H5",
  ],
};

export const DOM: Mark = {
  sil: "M-55 0V-52H-41V-40H-22V-50H-24C-24-82 24-82 24-50H22V-40H41V-52H55V0Z",
  lines: [
    "M-57 0H57M-55 0V-32H55V0M-55-28H55",
    arch(-10, 10, 0, -14) + [-20, -14, 14, 20].map((x) => `M${x}-2V-26`).join("") + arch(-34, -26, -8, -18) + arch(26, 34, -8, -18),
    "M-55-32V-52H-41V-32M-55-52C-55-62-41-62-41-52M-48-59.5V-66M41-32V-52H55V-32M41-52C41-62 55-62 55-52M48-59.5V-66",
    "M-22-32V-50H22V-32M-24-50H24" + [-14, -5, 5, 14].map((x) => arch(x - 2.5, x + 2.5, -36, -44)).join(""),
    "M-24-50C-24-82 24-82 24-50M-12-50C-12-78 12-78 12-50M0-50V-74",
    "M-3.5-74V-84H3.5V-74M-4.5-84C-4.5-89 4.5-89 4.5-84M0-88V-96M-2-93H2",
  ],
};

export const SIEGESSAULE: Mark = {
  sil: "M-16 0V-12H-11V-26H-4.5L-3.6-82H-6V-85H-2.5V-88H2.5V-85H6V-82H3.6L4.5-26H11V-12H16V0Z",
  lines: [
    "M-18 0H18M-16 0V-12H16V0",
    "M-11-12V-26H11V-12M-12-26H12" + [-8, -4, 0, 4, 8].map((x) => `M${x}-13V-25`).join(""),
    "M-4.5-26L-3.6-82M4.5-26L3.6-82M-4.6-40H4.6M-4.6-42H4.6M-4.3-53H4.3M-4.3-55H4.3M-4-66H4M-4-68H4",
    "M-6-82H6V-85H-6ZM-2.5-85V-88H2.5V-85",
  ],
  gold: ["M0-88V-99M0-99.5A1.6 1.6 0 1 0 0.1-99.5M0-96L-5-102L-2-94M0-97L4-103"],
};

export const RATHAUS: Mark = {
  sil: "M-60 0V-30H-50V-34H-8V-78H8V-34H50V-30H60V0Z",
  lines: [
    "M-62 0H62M-60 0V-30H60V0M-60-27H60M-60-14H60",
    [-52, -43, -34, -25, 25, 34, 43, 52].map((x) => arch(x - 3, x + 3, 0, -7) + `M${x}-17V-24`).join(""),
    "M-60-30V-34H-50V-30M50-30V-34H60V-30",
    "M-8-30V-78H8V-30M-8-46H8M-8-62H8M-3.5-68A3.5 3.5 0 1 0 3.5-68A3.5 3.5 0 1 0-3.5-68" + arch(-3, 3, -50, -55),
    "M-9-78V-84M9-78V-84M-9-80H9M-4-80V-86H4V-80M0-86V-96",
  ],
};

/** A slab block of the WBS 70 kind: panel joints and floor lines; `lit` windows (column, floor) glow gold. */
export function plattenbau(w: number, floors: number, lit: Array<[number, number]> = []): Mark {
  const h = floors * 8;
  const cols = Math.round(w / 12);
  const cw = w / cols;
  const x0 = -w / 2;
  const floorsD = range(1, floors - 1, 1).map((f) => `M${r(x0)} ${-f * 8}H${r(-x0)}`).join("");
  const jointsD = range(1, cols - 1, 1).map((c) => `M${r(x0 + c * cw)} 0V${-h}`).join("");
  return {
    sil: `M${r(x0)} 0V${-h - 2}H${r(-x0)}V0Z`,
    lines: [`M${r(x0)} 0V${-h - 2}H${r(-x0)}V0`, floorsD, jointsD],
    gold: lit.length ? [lit.map(([c, f]) => `M${r(x0 + c * cw + 3)} ${-f * 8 - 2}h${r(cw - 6)}v-4h${r(-(cw - 6))}Z`).join("")] : undefined,
  };
}

/** A glass tower in two offset volumes, like the new towers at Warschauer Strasse. One window holds the idea. */
export const GLASS_TOWER: Mark = {
  sil: "M-34 0V-82H-28V-172H38V-82H34V0Z",
  lines: [
    "M-34 0V-82H34V0M-28-82V-172H38V-82",
    range(-74, -10, 8).map((y) => `M-34 ${y}H34`).join("") + range(-164, -90, 8).map((y) => `M-28 ${y}H38`).join(""),
    range(-22, 22, 11).map((x) => `M${x} 0V-82`).join("") + range(-17, 27, 11).map((x) => `M${x}-82V-172`).join(""),
    "M-30-172V-178H34V-172",
  ],
  gold: ["M-15-150h9v-6h-9Z"],
};

/** The Molecule Man in the Spree: three tall figures leaning together, holes through their bodies. */
export const MOLECULE_MAN: Mark = {
  sil: "M-26 14L-14-44L-15-56L-4-58L-5-67H5L4-58L15-56L14-44L26 14Z",
  lines: [
    "M-26 14L-14-44M-14 14L-6-38M-15-51A5 5 0 1 0-5-51A5 5 0 1 0-15-51",
    "M-5 14L-4-56M5 14L4-56M-5-62A5 5 0 1 0 5-62A5 5 0 1 0-5-62",
    "M26 14L14-44M14 14L6-38M5-51A5 5 0 1 0 15-51A5 5 0 1 0 5-51",
    "M-14-44H14",
    "M-18-12A3 3 0 1 0-12-12A3 3 0 1 0-18-12M-2.5-24A2.5 2.5 0 1 0 2.5-24A2.5 2.5 0 1 0-2.5-24M12-12A3 3 0 1 0 18-12A3 3 0 1 0 12-12",
  ],
};

/** Behrens' turbine hall: the battered corners with their bands, the great window, the broken gable, the long side. */
export const AEG: Mark = {
  sil: "M-36 0L-34-46L-28-56L-16-62H16L28-56L34-46L40-52H170L172-46V0Z",
  lines: [
    "M-38 0H174M-36 0L-34-46L-28-56L-16-62H16L28-56L34-46L36 0",
    "M-26 0V-46M26 0V-46" + range(-42, -6, 6).map((y) => `M${r(-36 + (-y / 46) * 2)} ${y}H-26M26 ${y}H${r(36 - (-y / 46) * 2)}`).join(""),
    "M-22-4V-44H22V-4ZM-11-4V-44M0-4V-44M11-4V-44M-22-18H22M-22-31H22",
    "M-34-46H34M-24-49L-14-55H14L24-49Z",
    "M34-46L40-52H170L172-46V0M36-46H172M36-42H172M36-8H172" + range(49, 169, 12).map((x) => `M${x} 0V-46`).join(""),
  ],
};

/** The Schöneberg gasometer: a cylinder of lattice, rings and diagonals, open to the sky. */
export const GASOMETER: Mark = {
  sil: "M-40 0V-78H40V0Z",
  lines: [
    "M-40 0V-78M40 0V-78M-40-78H40M-40-52H40M-40-26H40",
    range(-30, 30, 15).map((x) => `M${x} 0V-78`).join(""),
    [0, -26, -52].map((y) => range(-40, 25, 15).map((x) => `M${x} ${y}L${r(x + 15)} ${y - 26}`).join("")).join(""),
    "M-40-78L-36-84H36L40-78",
  ],
};

/** A tower crane: lattice mast `h` high, jib `jib` long to the right, its hook hanging at `hook` along the jib. */
export function crane(h: number, jib: number, hook = jib * 0.7, drop = h * 0.5): Mark {
  const zig = range(0, h - 6, 6).map((y, i) => `${i ? "L" : "M"}${i % 2 ? 3 : -3} ${-y}`).join("");
  return {
    lines: [
      `M-3 0V${-h}M3 0V${-h}${zig}`,
      `M-26 ${-h}H${jib}M3 ${-h + 4}H${jib - 4}L${jib} ${-h}M-26 ${-h}V${-h + 7}H-16V${-h}`,
      `M0 ${-h}V${-h - 16}L${r(jib * 0.62)} ${-h}M0 ${-h - 16}L-26 ${-h}M3 ${-h + 2}H10V${-h + 9}H3`,
      `M${hook} ${-h + 4}V${-h + 4 + drop}M${hook - 3} ${-h + 4 + drop}h6l-3 4Z`,
    ],
  };
}

/** A tall works chimney with its bands. */
export const CHIMNEY: Mark = {
  sil: "M-7 0L-4-120H4L7 0Z",
  lines: ["M-7 0L-4-120H4L7 0M-4.6-112H4.6M-5.4-96H5.4M-4.5-122H4.5"],
};

/** A brick viaduct of the city railway from `a` to `b`: the deck at `deck`, arches `bay` wide down to the ground.
 *  The arches are as round as the height under the deck allows. */
export function viaduct(a: number, b: number, deck: number, ground: number, bay = 64): Mark {
  const xs = range(a, b - bay, bay);
  const rx = r((bay - 16) / 2);
  const ry = r(Math.min(rx, ground - deck - 14));
  const spring = r(deck + 8 + ry);
  const open = (x: number) => `M${r(x + 8)} ${ground}V${spring}A${rx} ${ry} 0 0 1 ${r(x + bay - 8)} ${spring}V${ground}`;
  return {
    sil: `M${a} ${deck - 4}H${b}V${deck + 6}H${a}Z` +
      xs.map((x) => `M${x} ${ground}V${deck + 6}H${r(x + bay)}V${ground}H${r(x + bay - 8)}V${spring}A${rx} ${ry} 0 0 0 ${r(x + 8)} ${spring}V${ground}Z`).join(""),
    lines: [`M${a} ${deck - 4}H${b}M${a} ${deck + 6}H${b}`, xs.map(open).join("")],
  };
}

/** The Oberbaumbrücke over the Spree from `a` to `b` (seven arches), the U-Bahn arcade on top, the two towers. */
export function oberbaum(a: number, b: number, ground: number, road: number, track: number): { sil: string; lines: string[] } {
  const bay = (b - a) / 7;
  const piers = range(a, b, bay);
  const mid = (a + b) / 2;
  const arc = range(a + 6, b - 24, 24).filter((x) => x + 18 < mid - 45 || x > mid + 45);
  const tower = (cx: number) =>
    `M${cx - 13} ${road}V${track - 50}H${cx + 13}V${road}` +
    `M${cx - 15} ${track - 50}V${track - 58}H${cx + 15}V${track - 50}` +
    range(cx - 12, cx + 9, 6).map((x) => `M${x} ${track - 58}v-3h3v3`).join("") +
    `M${cx - 8} ${track - 58}V${track - 72}H${cx + 8}V${track - 58}M${cx - 8} ${track - 72}L${cx} ${track - 96}L${cx + 8} ${track - 72}` +
    `M${cx - 3} ${road - 40}V${road - 50}L${cx} ${road - 55}L${cx + 3} ${road - 50}V${road - 40}`;
  return {
    sil: `M${a - 20} ${road}H${b + 20}V${ground - 30}H${a - 20}ZM${a} ${track - 2}H${b}V${road}H${a}Z` +
      `M${mid - 43} ${road}V${track - 58}H${mid - 17}V${road}ZM${mid + 17} ${road}V${track - 58}H${mid + 43}V${road}Z`,
    lines: [
      `M${a - 20} ${road}H${b + 20}M${a - 20} ${road + 5}H${b + 20}`,
      piers.slice(0, -1).map((x) => `M${r(x + 7)} ${ground}V${ground - 14}A${r(bay / 2 - 7)} ${r(Math.min(bay / 2 - 10, ground - road - 22))} 0 0 1 ${r(x + bay - 7)} ${ground - 14}V${ground}`).join(""),
      arc.map((x) => arch(x, x + 18, road, track + 14)).join(""),
      `M${a} ${track}H${b}M${a} ${track + 4}H${b}`,
      tower(mid - 30),
      tower(mid + 30),
    ],
  };
}
