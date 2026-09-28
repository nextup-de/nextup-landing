export const SITE = {
  name: "NextUp",
  tagline: "Who owns this decision?",
  description: "Who owns what, and what is waiting on whom. One field to raise it, one inbox with a clock, one wait ledger.",
  promiseDays: 5, // the "answer within 5 days" promise used by the wait ledger (same as the demo seed)
} as const;

// The product lives elsewhere: each company runs its own NextUp at its own address. "Log in"
// opens this site's /login, which asks for the company and sends people there
// (src/server/actions/login.ts). COMPANY_URL is read on the server; {slug} is the company.
export const COMPANY_URL = process.env.COMPANY_URL ?? "https://{slug}.sellux.ch";
export const LOGIN_URL = "/login";

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
