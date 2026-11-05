"use client";
// The hero's picture: the app's raise screen in a window on the lit frame, and the owner's side of it in a small
// card. The box runs the product's own matcher (features/routing `propose`) against the demo company's routing
// map, so what a visitor types is routed exactly as the app would route it: under the box stand the owner, the
// day the answer is owed and the deputy, and the card shows it landing on the owner's desk. Until the visitor
// touches the box it types the examples by itself, one after another; the disc pauses that. Nothing leaves the
// browser.
import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUp, Avatar, Clock, Dept, Pill, type Status, type Tone } from "@/components/product/elements";
import { propose } from "@/features/routing";
import { cn } from "@/lib/utils/cn";
import styles from "./RouteDemo.module.css";

export type DemoRoute = { id: string; type: string; keys: string[]; owner: string; role: string; deputy: string };
type Props = { routes: DemoRoute[]; promiseDays: number; examples: string[] };

const START_MS = 900;  // before the first example
const TYPE_MS = 34;    // per character typed
const ERASE_MS = 12;   // per character taken back
const HOLD_MS = 4200;  // how long a finished example and its answer stay
const REDUCED = "(prefers-reduced-motion: reduce)";

// Under the answer, the raise screen's own list runs on past the frame's edge.
const WAITING: Array<[string, Tone, string, Status, string]> = [
  ["Logistics", "blue", "Reusable crates for door modules", "clock", "3 d left"],
  ["Quality", "pink", "Torque records on the line tablet", "info", "Needs info"],
  ["Maintenance", "teal", "Standby for welding robots during breaks", "ok", "Running"],
];

// "Thu 8 Oct": today plus the promise, in the visitor's own timezone - so it is only known in the browser.
const dueFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
function dueDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dueFmt.format(d).replace(",", "");
}
const never = () => () => {};
function onReduced(cb: () => void) {
  const m = window.matchMedia(REDUCED);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

export function RouteDemo({ routes, promiseDays, examples }: Props) {
  const id = useId();
  const [typed, setTyped] = useState<string | null>(null); // null until the visitor touches the box
  const [demo, setDemo] = useState("");                    // what the box has typed by itself so far
  const [raised, setRaised] = useState(false);
  const [paused, setPaused] = useState(false);
  const due = useSyncExternalStore(never, () => dueDate(promiseDays), () => null);
  const reduced = useSyncExternalStore(onReduced, () => window.matchMedia(REDUCED).matches, () => false);
  const touched = typed !== null;

  // Type an example, let its answer stand, take it back, type the next - until the visitor takes over or pauses.
  // Where the typing is lives in a ref, so a pause and a play carry on from the same letter.
  const at = useRef({ which: 0, n: 0, erasing: false });
  useEffect(() => {
    if (touched || reduced || paused || !examples.length) return;
    const p = at.current;
    let timer = setTimeout(function tick() {
      const full = examples[p.which % examples.length];
      p.n += p.erasing ? -2 : 1;
      setDemo(full.slice(0, Math.max(0, p.n)));
      if (!p.erasing && p.n >= full.length) { p.erasing = true; timer = setTimeout(tick, HOLD_MS); return; }
      if (p.erasing && p.n <= 0) { p.erasing = false; p.n = 0; p.which = (p.which + 1) % examples.length; }
      timer = setTimeout(tick, p.erasing ? ERASE_MS : TYPE_MS);
    }, p.n ? TYPE_MS : START_MS);
    return () => clearTimeout(timer);
  }, [examples, touched, reduced, paused]);

  const text = typed ?? (reduced ? examples[0] ?? "" : demo);
  const proposal = propose(text, routes);
  const route = proposal?.route ?? null;
  const miss = touched && proposal !== null && !route; // only said to someone who typed it, not while the box types
  const dueText = route ? due ?? `Day ${promiseDays}` : "—";

  return (
    <div className={cn("hero__art nh-lit", styles.art)}>
      <div className={styles.window} data-ui="raise">
        <div className={styles.bar} aria-hidden="true">
          <Image src="/brand/nextup-logo-white.png" alt="" width={494} height={212} />
          <span className={styles.tabs}>{["Ideas", "Inbox", "Feed", "Projects"].map((t) => <span key={t} data-on={t === "Ideas"}>{t}</span>)}</span>
          <span className={styles.me}>NS</span>
        </div>
        <div className={styles.body}>
          <p className={styles.hello} aria-hidden="true">What is stuck, night shift?</p>
          <form className={styles.box} onSubmit={(e) => { e.preventDefault(); setTyped(text); if (route) setRaised(true); }}>
            <label className="nh-sr" htmlFor={id}>Try it: type a problem or an idea that is stuck</label>
            <textarea
              id={id} name="request" autoComplete="off" className={styles.input} rows={2} maxLength={160} value={text}
              placeholder="Type something that is stuck at work…"
              onChange={(e) => { setRaised(false); setTyped(e.target.value); }}
              onFocus={() => { if (!touched) setTyped(text); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
            />
            <button type="submit" className={styles.send} disabled={!route} aria-label="Raise it"><ArrowUp /></button>
          </form>

          <div className={styles.answer} data-on={route ? "true" : "false"}>
            <p className={styles.kind}>{miss ? "No row on the map matches yet" : route ? route.type : "The routing map reads it"}</p>
            <dl className={styles.facts}>
              <div>
                {route ? <Avatar name={route.owner} size={30} /> : <span className={styles.blank} />}
                <span><dt>Owner{route ? ` · ${route.role}` : ""}</dt><dd>{route?.owner ?? "—"}</dd></span>
              </div>
              <div>
                <span className={styles.clock}><Clock size={14} /></span>
                <span><dt>Answer owed by</dt><dd>{dueText}</dd></span>
              </div>
              <div>
                {route ? <Avatar name={route.deputy} size={30} /> : <span className={styles.blank} />}
                <span><dt>Deputy</dt><dd>{route?.deputy ?? "—"}</dd></span>
              </div>
            </dl>
          </div>

          <ul className={styles.waiting} aria-hidden="true">
            {WAITING.map(([dept, tone, what, status, label]) => (
              <li key={what}><Dept tone={tone}>{dept}</Dept><span>{what}</span><Pill status={status}>{label}</Pill></li>
            ))}
          </ul>
        </div>
      </div>

      {/* The owner's side: the same request, landing on their desk with its clock. */}
      <div className={styles.note} data-on={route ? "true" : "false"} aria-hidden="true">
        <div className={styles.noteHead}>
          {route ? <Avatar name={route.owner} size={28} /> : <span className={styles.blank} />}
          <span><strong>{raised ? "Raised" : "New"} on {route?.owner ?? "the owner"}&rsquo;s desk</strong><small>{route?.role ?? "Found by the map"}</small></span>
        </div>
        <p>{text || "…"}</p>
        <Pill status="clock"><Clock />Answer owed by {dueText}</Pill>
      </div>

      {!reduced && !touched && (
        <button type="button" className={cn("nh-pause", styles.pause)} onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play the typing demo" : "Pause the typing demo"} aria-pressed={paused}>
          {paused
            ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>
            : <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" /></svg>}
        </button>
      )}

      <p className="nh-sr" role="status">
        {touched && route ? `Proposed owner: ${route.owner}, ${route.role}. Answer owed by ${dueText}. Deputy: ${route.deputy}.${raised ? " Raised." : ""}`
          : miss ? "No row on this map matches yet. A person triages it, and the map gets a new row." : ""}
      </p>
    </div>
  );
}
