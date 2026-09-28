"use server";
// /login's submit: find the company's own NextUp and send the visitor to its login page.
//
// A company exists when <its address>/login answers 200. The check matters: *.sellux.ch is a
// wildcard, so an unknown name would otherwise land on a certificate error, and a stack whose
// company isn't set up yet (globex) answers 404. The only request goes to our own stacks.
import { redirect } from "next/navigation";
import { COMPANY_URL } from "@/config/site";
import { companyError, companyUrl, readCompany } from "@/features/login/company";
import { clientKey, throttleFindCompany } from "@/server/throttle";

export type FindState =
  | { status: "idle" }
  | { status: "invalid"; error: string; value: string };

export async function findCompany(_prev: FindState, form: FormData): Promise<FindState> {
  const value = String(form.get("company") ?? "").slice(0, 200);
  const slug = readCompany(value);
  const error = companyError(slug);
  if (error) return { status: "invalid", error, value };

  // Each try costs a request to a stack; a person needs a few, a script guessing names many.
  const wait = throttleFindCompany(await clientKey());
  if (wait) return { status: "invalid", error: wait, value };

  const base = companyUrl(slug, COMPANY_URL);
  if (!(await answers(`${base}/login`))) {
    return {
      status: "invalid",
      error: `We couldn't find a NextUp at ${new URL(base).host}. Check the address in your invite e-mail.`,
      value,
    };
  }
  // Outside the try: redirect() works by throwing.
  redirect(`${base}/login`);
}

async function answers(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(4_000) });
    return res.status === 200;
  } catch {
    return false;
  }
}
