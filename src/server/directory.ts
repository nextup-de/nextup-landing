// Which companies /login offers to pick from, asked of the dev admin (src/features/login/directory.ts).
// Cached a minute; when admin is slow or down the picker is simply not there and typing the name
// still works - /login never waits on it for long.
import { COMPANY_DIRECTORY_URL } from "@/config/site";
import { readDirectory, type ListedCompany } from "@/features/login/directory";

export async function listedCompanies(): Promise<ListedCompany[]> {
  if (!COMPANY_DIRECTORY_URL) return [];
  try {
    const res = await fetch(COMPANY_DIRECTORY_URL, { next: { revalidate: 60 }, signal: AbortSignal.timeout(3_000) });
    if (!res.ok) throw new Error(`directory answered ${res.status}`);
    return readDirectory(await res.json());
  } catch (err) {
    console.warn("[login] no company list from admin:", err instanceof Error ? err.message : err);
    return [];
  }
}
