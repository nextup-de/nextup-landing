// Brake for the one door this site has: the public /contact form.
//
// In-process memory, per serverless instance on Vercel - weaker than one shared counter, still far
// better than nothing. The app checks the forwarded request again on its side.
//
// Not a "use server" module: a helper the action calls, not an action itself.
import { headers } from "next/headers";
import { clientAddress, hit, sweep, waitText, type Rule, type Window } from "@/features/security/rate-limit";

/** The public /contact form: a real prospect sends one or two. Same limit as the app used. */
const PILOT_REQUEST: Rule = { limit: 5, windowMs: 60 * 60_000 };

const globalForThrottle = globalThis as unknown as { __landingThrottle?: Map<string, Window> };
const store = (globalForThrottle.__landingThrottle ??= new Map());

export async function clientKey(): Promise<string> {
  const h = await headers();
  return clientAddress(h.get("x-forwarded-for"), h.get("x-real-ip"));
}

/** Null when the attempt may go ahead, otherwise the sentence to show. */
export function throttlePilotRequest(key: string): string | null {
  const now = Date.now();
  if (store.size > 10_000) sweep(store, now);
  const v = hit(store, key, PILOT_REQUEST, now);
  if (v.ok) return null;
  console.warn(`[throttle] pilotRequest blocked for ${key}`);
  return `Too many attempts. Wait ${waitText(v.retryAfterSeconds)} and try again.`;
}
