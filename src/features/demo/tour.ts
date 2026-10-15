// The product tour's demo data: what the landing's four live screens show. Taken from the app's demo seed
// (nextup-de/nextup, apps/app/src/features/demo/seed.ts and static-demo.ts) - the same fictional company as
// the routing map in ./routes.ts. Fictional people, no customer data. Figures are the demo company's, and the
// page says so; a pilot measures a real company's own.

// ── Team leader: the inbox (seed cases c1-c5, addressed to T. Vogel) ─────────────────────────────────────
export type InboxCase = {
  id: string; title: string; from: string; dept: string;
  daysLeft: number; // days until the promise runs out; below zero = that many days late
  body: string; upside: string;
};
export const INBOX: InboxCase[] = [
  { id: "c1", title: "Rework on the 4-series housing is back - new batch of castings", from: "Anonymous #2210", dept: "Production, Line 2", daysLeft: -2,
    body: "The castings from the new supplier need the same hand-finish we removed with the fixture redesign. Three people are doing it off-plan.", upside: "≈ 30 h / month rework" },
  { id: "c2", title: "Night shift has no one who can sign a €300 parts order", from: "S. Dahl", dept: "Production, 4-series", daysLeft: 1,
    body: "When a belt goes at 02:00 we wait for the day shift to approve a €300 replacement. Twice last month the line stood until 07:30.", upside: "line stops avoided" },
  { id: "c3", title: "Changeover sheet and MES ask for the same six numbers", from: "Anonymous #4471", dept: "Production, Line 3", daysLeft: 2,
    body: "Every changeover we write the same six values on paper and then type them into the MES. Twelve changeovers a shift.", upside: "≈ 20 min per changeover" },
  { id: "c4", title: "Tolerance drift on station 7 - who owns the gauge calibration?", from: "J. Klein", dept: "Production, 4-series", daysLeft: 4,
    body: "The gauge reads 0.02 off against Quality's reference. Quality says it is ours; we say it is theirs. Meanwhile parts get scrapped.", upside: "scrap on station 7" },
  { id: "c5", title: "Two apprentices still have no MES login after four weeks", from: "P. Mayer", dept: "Production, Line 1", daysLeft: 4,
    body: "Started 18 August. Tickets raised per system. They shadow others because they cannot book their own work.", upside: "2 people idle on paperwork" },
];
export const INBOX_OWNER = "T. Vogel";
export const INBOX_DEPUTY = "M. Roth";
// The inbox's own numbers (seed METRICS.lead): median time to answer and answers within the promise this quarter.
export const INBOX_MEDIAN = "2 d";
export const INBOX_WITHIN: readonly [number, number] = [10, 12];
// What "No, and why" offers as a reason in the demo.
export const NO_REASONS = ["Not this quarter", "Already planned", "Needs a budget owner"] as const;

// ── Everyone: the feed (static-demo ideas; covers from the app's public/feed/library) ────────────────────
export type FeedIdea = {
  id: string; title: string; dept: string; status: "Shipped" | "Piloting" | "Under review" | "Needs info";
  cover: string; stat: string; hook: string; support: number; comments: number;
};
export const FEED: FeedIdea[] = [
  { id: "f1", title: "Bundle new-hire access into one request", dept: "HR / IT", status: "Shipped",
    cover: "/feed/06-onboarding.webp", stat: "Ready", hook: "from day one", support: 14, comments: 3 },
  { id: "f2", title: "Stop double-entering job data on paper", dept: "Quality", status: "Piloting",
    cover: "/feed/08-less-paperwork.webp", stat: "Once", hook: "entered, not twice", support: 9, comments: 2 },
  { id: "f3", title: "Daylight lamps above the inspection table", dept: "Quality", status: "Under review",
    cover: "/feed/09-quality.webp", stat: "Right", hook: "first time, less scrap", support: 5, comments: 1 },
  { id: "f4", title: "Move the shift handover notes onto a board by the line", dept: "Production", status: "Needs info",
    cover: "/feed/01-shift-handover.webp", stat: "Clear", hook: "handover between shifts", support: 3, comments: 1 },
];

// ── Team member: what happened to what I sent (seed case c7 and its events) ─────────────────────────────
export const MINE = {
  title: "Bundle new-hire access into one request", from: "J. Schmidt", dept: "Production, Line 3",
  cover: "/feed/06-onboarding.webp",
  steps: [
    { day: 0, who: "J. Schmidt", what: "You raised it", text: "Eight sequential tickets after the start date. My first two weeks were reading PDFs because I had no login." },
    { day: 1, who: "L. Brandt", what: "On L. Brandt's desk · HR / IT", text: "Read the next day, with four days left on the clock." },
    { day: 3, who: "L. Brandt", what: "Answered: yes", text: "“We are doing this. One template at contract signature, HR raises it, IT pre-provisions. You are credited on the rollout note.”" },
    { day: 6, who: "L. Brandt", what: "Building", text: "21 days planned. Expected: 5 weeks of waiting per hire down to 11 days." },
    { day: 110, who: "L. Brandt", what: "Shipped", text: "5 weeks → 11 days, measured across 9 new hires." },
  ],
} as const;

// ── Manager: the overview (seed LEDGER, METRICS and STALL) ──────────────────────────────────────────────
export type Tile = { label: string; before: [number, string]; now: [number, string]; note: string };
export const TILES: Tile[] = [
  { label: "Median to the first answer", before: [9, "d"], now: [26, "h"], note: "reported upward" },
  { label: "Answered within 5 days", before: [31, "%"], now: [84, "%"], note: "reported upward" },
  { label: "Idea to decision", before: [12, "d"], now: [4, "d"], note: "median, last 30 days" },
  { label: "Waiting days saved", before: [0, "d"], now: [120, "d"], note: "across 8 ideas" },
];
// Where the waiting goes: waiting days per stall reason since launch. Nothing counted them before.
export const STALL: readonly (readonly [string, number])[] = [
  ["Wrong department", 23], ["Not responsible", 17], ["No time → returned", 12], ["Is it important", 8],
];
