// "Log in" on the public site: which company's NextUp to send someone to. Pure - no network.
//
// Every company runs its own NextUp at its own address, <slug>.sellux.ch (nextup-de/nextup,
// docs/PLATFORM_PLAN.md: one stack per company). This site has no accounts and no company list,
// so /login turns what was typed into a slug here, and the server action
// (src/server/actions/login.ts) asks that address whether a company answers there.

// Same list and pattern as the app (apps/app/src/features/auth/request.ts) - keep them in step.
export const RESERVED_SLUGS = [
  "www", "admin", "api", "n8n", "mail", "app", "static", "assets", "_next",
  "automation", "ops", "status",
  "login", "signup", "pricing", "contact", "imprint", "privacy", "forgot-password", "invite",
] as const;

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])$/;

/**
 * What people type, as a slug. Accepts the bare name ("acme"), the address ("acme.sellux.ch",
 * "https://acme.sellux.ch/login") or a name with spaces ("Acme Maschinenbau" -> "acme-maschinenbau").
 */
export function readCompany(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, ""); // scheme
  s = s.split(/[/?#]/)[0]; // path
  if (s.includes(".")) s = s.split(".")[0]; // acme.sellux.ch -> acme
  return s.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/** Null when the slug may be looked up, otherwise the sentence to show under the field. */
export function companyError(slug: string): string | null {
  if (slug === "") return "Enter your company's NextUp name.";
  if (!SLUG.test(slug) || (RESERVED_SLUGS as readonly string[]).includes(slug)) {
    return "That isn't a company name. It's the first part of your NextUp address: yourcompany.sellux.ch";
  }
  return null;
}

/** The company's NextUp address. `pattern` holds {slug}: https://{slug}.sellux.ch */
export function companyUrl(slug: string, pattern: string): string {
  return pattern.replace("{slug}", slug).replace(/\/$/, "");
}
