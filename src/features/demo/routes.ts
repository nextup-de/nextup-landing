// The demo company's routing map, for the landing's hero box and its pinned scene. A copy of ROUTES in the app's demo
// seed (selluxhenner/nextup, apps/app/src/features/demo/seed.ts) - keep the two in step. Fictional people, no customer data.
export type Route = { id: string; type: string; keys: string[]; owner: { name: string; role: string; dept: string }; deputy: string; buddy: string; wait: string };

export const ROUTES: Route[] = [
  { id: 'r1', type: 'Spend under €5k (parts, tools, consumables)', keys: ['spend', 'buy', 'order', 'purchase', 'sensor', 'part', 'budget', '€', 'invoice', 'supplier'],
    owner: { name: 'T. Vogel', role: 'Team lead, 4-series', dept: 'PRD' }, deputy: 'M. Roth', buddy: 'C. Ilg · Ops & Admin', wait: '3 d' },
  { id: 'r2', type: 'Test-rig or machine time', keys: ['rig', 'test', 'machine', 'booking', 'slot', 'validation', 'endurance'],
    owner: { name: 'M. Roth', role: 'Engineering lead', dept: 'ENG' }, deputy: 'H. Sander', buddy: 'M. Roth · Engineering', wait: '4 d' },
  { id: 'r3', type: 'Quality data, measurements, tolerances', keys: ['quality', 'tolerance', 'measurement', 'mes', 'rework', 'scrap', 'drift', 'defect'],
    owner: { name: 'H. Sander', role: 'Quality lead', dept: 'QUA' }, deputy: 'T. Vogel', buddy: 'H. Sander · Quality', wait: '2 d' },
  { id: 'r4', type: 'System access, logins, IT equipment', keys: ['access', 'login', 'laptop', 'account', 'password', 'it ', 'software', 'system', 'vpn'],
    owner: { name: 'M. Roth', role: 'Engineering lead', dept: 'ENG' }, deputy: 'H. Sander', buddy: 'L. Brandt · HR / IT', wait: '4 d' },
  { id: 'r5', type: 'Product change reaching the field', keys: ['customer', 'firmware', 'change note', 'release', 'field', 'shipped', 'sales'],
    owner: { name: 'H. Sander', role: 'Quality lead', dept: 'QUA' }, deputy: 'M. Roth', buddy: 'N. Kaya · Sales', wait: '2 d' },
  { id: 'r6', type: 'Shift plan, staffing, overtime', keys: ['shift', 'overtime', 'staff', 'holiday', 'roster', 'capacity', 'hours', 'people'],
    owner: { name: 'T. Vogel', role: 'Team lead, 4-series', dept: 'PRD' }, deputy: 'H. Sander', buddy: 'D. Ferraro · Field Service', wait: '1 d' },
  { id: 'r7', type: 'Fixture, tooling or line layout', keys: ['fixture', 'tooling', 'layout', 'line', 'housing', 'jig', 'setup', 'changeover'],
    owner: { name: 'T. Vogel', role: 'Team lead, 4-series', dept: 'PRD' }, deputy: 'M. Roth', buddy: 'M. Roth · Engineering', wait: '2 d' },
  { id: 'r8', type: 'Paperwork done twice (forms, job sheets)', keys: ['paper', 'form', 'twice', 'double', 'sheet', 'excel', 'report', 'manual'],
    owner: { name: 'H. Sander', role: 'Quality lead', dept: 'QUA' }, deputy: 'T. Vogel', buddy: 'D. Ferraro · Field Service', wait: '3 d' }
];
