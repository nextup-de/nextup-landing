export const SITE = {
  name: "NextUp",
  tagline: "Who owns this decision?",
  description: "Every idea, from the first word to the measured result. One box to raise it, an owner and a date, a project, a measured result.",
  promiseDays: 5, // the "answer within 5 days" promise used by the wait ledger (same as the demo seed)
} as const;

// The pilot, shown on /, /pricing and /contact: [phase, title, what happens]. A paid build project in three
// phases. No durations here until they are agreed with the first pilot partners.
export const PILOT_PHASES = [
  ["Scope", "Agree the scope", "Which decisions wait today, where we start, and the price. Agreed before any work begins."],
  ["Build", "Built with your people", "We build NextUp on your org chart, your routing and your rules, with your departments in the loop."],
  ["Run", "Live in your plant", "Real ideas, real owners, real clocks. The result is measured."],
] as const;

// The questions people ask before a pilot, on / and /pricing: [question, answer]. Every answer is a claim the
// pilot has to keep - change them here only.
export const FAQ = [
  ["What counts as a seat?", "One seat is one person who uses NextUp. Who needs a seat in your company is agreed in the pilot scope."],
  ["What exactly is a pilot?", "A paid build project in three phases. We agree the scope and the price, build NextUp with your people on your org chart and routing, and run it in your plant with real ideas. How long it takes depends on the scope."],
  ["Do you need access to our systems?", "Not to start. Ideas are raised in one field. What gets connected later, such as single sign-on, is part of the pilot scope."],
  ["We have a works council. Is this a problem?", "Talk to us early. The works council should be part of the pilot scope from the first conversation."],
  ["Where is our data stored?", "On servers in the EU. The privacy policy names the hosting provider. Your data is keyed to your company and never visible to another company."],
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
