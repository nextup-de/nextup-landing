"use server";
// The /contact form's submit. This site has no database: a real request is forwarded to the app
// (POST <PILOT_INTAKE_URL>, bearer PILOT_INTAKE_TOKEN), which saves it as a PilotRequest row that
// shows up in its /admin. With no app configured the form falls back to the visitor's own mail
// program, which is what it did before there was a backend.
//
// "Real" means two things: the same checks the client ran (src/features/pilot/request.ts) pass
// again here, because the client is not trusted; and the honeypot field is empty, because a
// form-filling bot fills every field it can see. A bot's submit gets a friendly "sent" back and
// is not forwarded - telling it what went wrong would only teach it.
import { LEGAL } from "@/config/site";
import {
  pilotMailto,
  readPilotRequest,
  validatePilotRequest,
  type PilotErrors,
  type PilotRequest,
} from "@/features/pilot/request";
import { clientKey, throttlePilotRequest } from "@/server/throttle";

export type PilotState =
  | { status: "idle" }
  | { status: "invalid"; errors: PilotErrors; values: PilotRequest }
  | { status: "sent"; email: string }
  | { status: "mailto"; href: string }
  | { status: "failed"; values: PilotRequest };

// The honeypot. Visually hidden on the form, named to look worth filling.
const HONEYPOT = "website";

export async function requestPilot(_prev: PilotState, form: FormData): Promise<PilotState> {
  const values = readPilotRequest(form);
  const errors = validatePilotRequest(values);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors, values };

  if (String(form.get(HONEYPOT) ?? "").trim() !== "") {
    console.info("[pilot] dropped a request that filled the honeypot");
    return { status: "sent", email: values.email };
  }

  const url = process.env.PILOT_INTAKE_URL;
  const token = process.env.PILOT_INTAKE_TOKEN;
  if (!url || !token) return { status: "mailto", href: pilotMailto(LEGAL.email, values) };

  // A public form that writes rows: a handful per address per hour, so a script cannot fill the
  // app's table. "failed" keeps what they typed and offers the mail address - a real person is not stuck.
  const visitor = await clientKey();
  if (throttlePilotRequest(visitor)) return { status: "failed", values };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
        // The app throttles per visitor too; without this it would only ever see this server.
        "x-visitor-address": visitor,
      },
      body: JSON.stringify(values),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`intake answered ${res.status}`);
    console.info(`[pilot] forwarded a request from ${values.email} (${values.company})`);
    return { status: "sent", email: values.email };
  } catch (err) {
    console.error("[pilot] could not forward a request", err);
    return { status: "failed", values };
  }
}
