// What the marketing pages show of the demo company: the routing map as plain rows for the raise box, what the box
// types by itself, the ideas list and the decisions board. One place, so the landing and /product show the same
// fictional plant. Fictional people and requests, no customer data. The routing map itself is ROUTES (./routes).
import type { BoardIdea } from "@/components/marketing/IdeasBoard";
import { ROUTES } from "./routes";

/** The demo company's routing map as plain rows for the raise box. The tower's story follows its first row. */
export const MAP = ROUTES.map((r) => ({ id: r.id, type: r.type, keys: r.keys, owner: r.owner.name, role: r.owner.role, deputy: r.deputy }));

/** The night shift's request: the one the tower, the ring and the raise box all follow. */
export const REQUEST = "Night shift has no one who can sign a €300 parts order";

/** What the raise box types by itself, one after another. Each one hits a different row of the map; the tower's
 *  story sends the same three through the building (features/tower/story). */
export const RAISE_EXAMPLES: string[] = [
  REQUEST,
  "Two apprentices have had no system login for four weeks",
  "Tolerance drift on station 7 - who owns the gauge calibration?",
];

/** The ideas list, as the app shows it: what, since when, which stage, on whose desk, status - and what the open
 *  idea shows: who raised it, the deputy, the AI's read. */
export const IDEAS: BoardIdea[] = [
  { id: "I-31", what: "Seam-sealing robot drips after every nozzle change", dept: "Body & Assembly", deptTone: "amber", since: "6 d", late: true, stage: 2,
    who: "M. Hoffmann", role: "Team lead, final assembly", tone: "violet", status: "late", label: "1 d late", by: "D. Ferraro", deputy: "A. Schulz",
    read: "Drips after each nozzle change mean rework on the next body. A purge step after the change may stop it; maintenance would own the step." },
  { id: "I-29", what: "Reusable crates for door modules", dept: "Logistics", deptTone: "blue", since: "3 d", stage: 2, left: 3,
    who: "N. Demir", role: "Head of Inbound Logistics", tone: "blue", status: "clock", label: "3 d left", by: "M. Hoffmann", deputy: "T. Vogel",
    read: "Replaces about 40 cardboard boxes per shift. Needs 120 crates and one return lane at gate 3." },
  { id: "I-33", what: "Torque records on the line tablet", dept: "Quality", deptTone: "pink", since: "1 d", stage: 1,
    who: "K. Yilmaz", role: "Head of Plant Quality", tone: "teal", status: "info", label: "Needs info", by: "J. Schmidt", deputy: "H. Sander",
    read: "The coach asks which app the line tablet runs today and who signs the torque record at the end of a shift." },
  { id: "I-24", what: "Standby for welding robots during breaks", dept: "Maintenance", deptTone: "teal", since: "9 d", stage: 3,
    who: "A. Schulz", role: "Lead, body shop maintenance", tone: "amber", status: "ok", label: "Running", by: "T. Vogel", deputy: "M. Roth",
    read: "Robots stay powered through every break. Standby needs one change in each cell's controller and a test on one line first." },
  { id: "I-32", what: "Paint booth filter change by sensor", dept: "Paint shop", deptTone: "green", since: "2 d", stage: 2, left: 4,
    who: "T. Vogel", role: "Team lead, paint shop", tone: "green", status: "clock", label: "4 d left", by: "A. Schulz", deputy: "M. Roth",
    read: "Filters are changed by the calendar today. A pressure sensor would call for the change when a filter is full." },
  { id: "I-34", what: "Shift handover checklist on one page", dept: "Engineering", deptTone: "violet", since: "Today", stage: 1,
    who: "J. Schmidt", role: "Process engineer", tone: "pink", status: "new", label: "New", by: "C. Ilg", deputy: "M. Roth",
    read: "Three handover sheets are in use. The coach asks which fields the next shift actually reads." },
  { id: "I-27", what: "System logins for apprentices on day one", dept: "HR & IT", deptTone: "blue", since: "21 d", stage: 4,
    who: "L. Brandt", role: "HR / IT", tone: "violet", status: "ok", label: "Measured", by: "M. Roth", deputy: "M. Roth",
    read: "Apprentices waited weeks for a login. Accounts are now made when the contract is signed." },
  { id: "I-30", what: "Night shift cannot sign a €300 parts order", dept: "Production", deptTone: "green", since: "5 d", stage: 3,
    who: "T. Vogel", role: "Team lead, 4-series", tone: "green", status: "ok", label: "Answered in 2 d", by: "Night shift", deputy: "M. Roth",
    read: "Spend under €5k belongs to the team lead. A standing limit for the night shift would settle it for good." },
];

/** A row of the landing's decisions board: whose desk (a role, never a name), what waits there, and its clock.
 *  `short` is the request in at most 18 letters, whole words, for a phone's narrow board.
 *  `then` is what the status turns to after the flaps settle; `tone` colours the status. */
export type DecisionRow = { owner: string; request: string; short: string; status: string; tone?: "late" | "ok"; then?: string };

/** The decisions board on the landing, drawn from IDEAS I-31, I-29, I-33, I-32 and I-30 (owner = the role). Keep the
 *  two in step. */
export const DECISION_ROWS: DecisionRow[] = [
  { owner: "Team lead, final assembly", request: "Seam sealer drips after nozzle change", short: "Seam sealer drips", status: "1 d late", tone: "late", then: "1 d late → deputy" },
  { owner: "Head of Inbound Logistics", request: "Reusable crates for door modules", short: "Reusable crates", status: "3 d left" },
  { owner: "Head of Plant Quality", request: "Torque records on the line tablet", short: "Torque records", status: "Needs info" },
  { owner: "Team lead, paint shop", request: "Paint booth filter by sensor", short: "Paint booth filter", status: "4 d left" },
  { owner: "Team lead, 4-series", request: "Night shift €300 parts order", short: "€300 parts order", status: "Answered in 2 d", tone: "ok" },
];
