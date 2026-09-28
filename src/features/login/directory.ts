// The company picker on /login: the list admin.sellux.ch hands out (GET /api/directory - the live
// companies someone turned "Show on sellux.ch/login" on for). Pure - the fetch is in
// src/server/directory.ts. Anything that isn't a well-formed company is dropped, not shown.
import { companyError } from "@/features/login/company";

export type ListedCompany = { slug: string; name: string };

export function readDirectory(body: unknown): ListedCompany[] {
  const list = (body as { companies?: unknown } | null)?.companies;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: ListedCompany[] = [];
  for (const item of list) {
    const { slug, name } = (item ?? {}) as Record<string, unknown>;
    if (typeof slug !== "string" || companyError(slug) !== null || seen.has(slug)) continue;
    const label = typeof name === "string" && name.trim() ? name.trim().slice(0, 80) : slug;
    seen.add(slug);
    out.push({ slug, name: label });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The companies to suggest under the field for what has been typed so far - nothing until two
 * characters, so the page never shows a list up front. Name or slug starting with it first, then
 * the ones that contain it.
 */
export function suggest<T extends ListedCompany>(list: T[], typed: string, max = 5): T[] {
  const q = typed.trim().toLowerCase();
  if (q.length < 2) return [];
  const slugQ = q.replace(/^[a-z]+:\/\//, "").split(/[./?#]/)[0];
  const starts = (c: T) => c.name.toLowerCase().startsWith(q) || (slugQ !== "" && c.slug.startsWith(slugQ));
  const contains = (c: T) => c.name.toLowerCase().includes(q) || (slugQ !== "" && c.slug.includes(slugQ));
  return [...list.filter(starts), ...list.filter((c) => !starts(c) && contains(c))].slice(0, max);
}
