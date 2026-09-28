export const SITE = {
  name: "NextUp",
  tagline: "Who owns this decision?",
  description: "Who owns what, and what is waiting on whom. One field to raise it, one inbox with a clock, one wait ledger.",
  promiseDays: 5, // the "answer within 5 days" promise used by the wait ledger (same as the demo seed)
} as const;

// The product lives elsewhere: this repo is only the public site. "Log in" sends people to the
// app's "find your company" page. NEXT_PUBLIC_ because the link is rendered into the page.
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const LOGIN_URL = `${APP_URL}/login`;

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
  // Hosting provider + location, named in the privacy policy once the site is deployed (e.g. "Vercel Inc., EU region").
  // Leave null while it only runs locally.
  hosting: {
    provider: "Vercel Inc., USA",
    location: "Frankfurt am Main (EU) für serverseitige Funktionen; statische Seiten werden über das weltweite Vercel-Netzwerk ausgeliefert",
    privacyUrl: "https://vercel.com/legal/privacy-policy",
    // Vercel is a US company, so a transfer to a third country can happen. Rendered after the provider paragraph.
    transfer: "Vercel ist unter dem EU-US Data Privacy Framework zertifiziert (Angemessenheitsbeschluss, Art. 45 DSGVO); ergänzend gelten die EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).",
  } as null | { provider: string; location: string; privacyUrl: string; transfer?: string },
  updated: "2026-09-28", // last change to /privacy, ISO date
} as const;
