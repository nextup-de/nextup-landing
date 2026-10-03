export const SITE = {
  name: "NextUp",
  tagline: "Who owns this decision?",
  description: "Who owns what, and what is waiting on whom. One field to raise it, one inbox with a clock, one wait ledger.",
  promiseDays: 5, // the "answer within 5 days" promise used by the wait ledger (same as the demo seed)
} as const;

// The pilot week, shown on / and /contact: [when, what happens].
export const PILOT_WEEK = [
  ["Day 1", "We fill in the routing table for your decision type with the department head. Twenty minutes."],
  ["Days 2-4", "Real requests go through one field. Owners answer from an inbox with a clock."],
  ["Day 5", "You get the wait ledger: median hours to first answer, share within the promise, where the waiting went."],
  ["After", "Thirty minutes of feedback from you. A one-page report you can forward from us."],
] as const;

// What holds in every plan, shown on / and /pricing: [claim, what it means].
export const PRINCIPLES = [
  ["Nothing to integrate", "No SSO, no mailbox access, no read access to your systems. A pilot needs one field and one routing table."],
  ["Cases, not people", "There is no per-person metric in the data model. The ledger measures how long cases wait, never how individuals perform."],
  ["Your data, in the EU", "Export every case, event and number at any time. Deletion on request. No cookies, no tracking, no third-party fonts on this site."],
] as const;

// The product lives elsewhere: each company runs its own NextUp at its own address. "Log in"
// opens this site's /login, which asks for the company and sends people there
// (src/server/actions/login.ts). COMPANY_URL is read on the server; {slug} is the company.
export const COMPANY_URL = process.env.COMPANY_URL ?? "https://{slug}.sellux.ch";
export const LOGIN_URL = "/login";
// The companies /login lists to pick from (src/server/directory.ts). Empty turns the list off.
export const COMPANY_DIRECTORY_URL = process.env.COMPANY_DIRECTORY_URL ?? "https://admin.sellux.ch/api/directory";

// Who runs this site. Rendered on /imprint, /privacy, /contact and in the footer - change it here only.
// Required by § 5 DDG (Impressum) and Art. 13 GDPR (controller). Keep it accurate before the site goes public.
export const LEGAL = {
  operator: "Kevin Schmid",
  role: "Student, CODE University of Applied Sciences",
  org: "CODE University of Applied Sciences", // postal address is c/o the university
  street: "Lohmühlenstraße 65",
  city: "12435 Berlin",
  country: "Germany",
  email: "kevin.schmid@code.berlin", // TODO Kevin: confirm - assumed from the CODE address pattern
  // Hosting provider + location, named in the privacy policy once the site is deployed (company, address, server location).
  // Leave null while it only runs locally.
  hosting: {
    provider: "Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Deutschland",
    location: "Nürnberg, Deutschland",
    privacyUrl: "https://www.hetzner.com/legal/privacy-policy",
  } as null | { provider: string; location: string; privacyUrl: string },
  updated: "2026-09-28", // last change to /privacy, ISO date
} as const;
