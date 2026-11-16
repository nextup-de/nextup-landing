// The Berlin line as data: its stations (the home page's sections, in order) and the pure arithmetic the rail
// and the departure board run on. No DOM here, so the tests can read it.

export type StationKind = "stop" | "interchange" | "terminus";
/** `dark`: the section is a dark picture (the 3D scene); the rail turns light over it and the narrow band hides. */
export type Station = { id: string; name: string; kind: StationKind; dark?: boolean };

/** The home page as it stands today: every section a station, the scene at the top at Warschauer Strasse. */
export const HOME_STATIONS: Station[] = [
  { id: "story", name: "Warschauer Str.", kind: "interchange", dark: true },
  { id: "try", name: "Raise", kind: "stop" },
  { id: "ideas", name: "Ideas", kind: "stop" },
  { id: "product", name: "Five steps", kind: "interchange" },
  { id: "rules", name: "Rules", kind: "stop" },
  { id: "pilot", name: "Pilot", kind: "stop" },
  { id: "questions", name: "Questions", kind: "stop" },
  { id: "close", name: "Your plant", kind: "terminus" },
];

/**
 * Where the train is: the index of the last station whose section top has passed the reading line, and how far
 * it is (0..1) toward the next one. `tops` are the sections' page offsets in order; `at` is the reading line's
 * page offset; `end` says the page cannot scroll further, which always puts the train at the terminus.
 */
export function ride(tops: number[], at: number, end = false): { index: number; along: number } {
  const last = tops.length - 1;
  if (last < 0) return { index: 0, along: 0 };
  if (end) return { index: last, along: 0 };
  let index = 0;
  for (let i = 0; i <= last; i++) if (tops[i] <= at) index = i;
  if (index === last) return { index, along: 0 };
  const span = tops[index + 1] - tops[index];
  const along = span > 0 ? Math.min(1, Math.max(0, (at - tops[index]) / span)) : 0;
  return { index, along };
}

/** The characters a split-flap cell turns through, in order. Anything else shows as a blank. */
export const FLAPS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,-·'?!€&/:";

/** A board line: upper case, unknown characters blank, cut or padded to `cells`; a long text shows its end. */
export function boardText(text: string, cells: number): string {
  const up = text.toUpperCase().replace(/\s+/g, " ");
  const clean = Array.from(up, (c) => (FLAPS.includes(c) ? c : " ")).join("").trimEnd();
  const shown = clean.length > cells ? "…" + clean.slice(clean.length - cells + 1) : clean;
  return shown.padEnd(cells, " ");
}

/** One turn of every flap that is not yet on its target. A flap more than `reach` steps away jumps closer first. */
export function flapStep(shown: string, target: string, reach = 8): string {
  let out = "";
  for (let i = 0; i < target.length; i++) {
    const want = target[i];
    const have = shown[i] ?? " ";
    if (have === want) { out += want; continue; }
    const to = FLAPS.indexOf(want);
    if (to < 0) { out += want; continue; }
    let from = FLAPS.indexOf(have);
    if (from < 0) from = 0;
    const dist = (to - from + FLAPS.length) % FLAPS.length;
    if (dist > reach) from = (to - reach + FLAPS.length) % FLAPS.length;
    out += FLAPS[(from + 1) % FLAPS.length];
  }
  return out;
}
