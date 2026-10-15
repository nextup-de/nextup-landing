"use client";
// The hero's raise box. It runs the product's own matcher (features/routing `propose`) against the demo
// company's routing map, so what a visitor types is routed exactly as the app would route it: the card under
// the box names the owner, the day the answer is owed and the deputy. Until the visitor touches the box it
// types the examples by itself, one after another. Nothing leaves the browser.
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { propose } from "@/features/routing";
import { Person } from "./Avatar";
import styles from "./RouteDemo.module.css";

export type DemoRoute = { id: string; type: string; keys: string[]; owner: string; role: string; deputy: string };
type Props = { routes: DemoRoute[]; promiseDays: number; examples: string[] };

const START_MS = 1100; // before the first example
const TYPE_MS = 34;    // per character typed
const ERASE_MS = 12;   // per character taken back
const HOLD_MS = 4200;  // how long a finished example and its answer stay
const REDUCED = "(prefers-reduced-motion: reduce)";

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
  const due = useSyncExternalStore(never, () => dueDate(promiseDays), () => null);
  const reduced = useSyncExternalStore(onReduced, () => window.matchMedia(REDUCED).matches, () => false);
  const touched = typed !== null;

  // Type an example, let its answer stand, take it back, type the next - until the visitor takes over.
  useEffect(() => {
    if (touched || reduced || !examples.length) return;
    let which = 0, n = 0, erasing = false;
    let timer = setTimeout(function tick() {
      const full = examples[which];
      n += erasing ? -2 : 1;
      setDemo(full.slice(0, Math.max(0, n)));
      if (!erasing && n >= full.length) { erasing = true; timer = setTimeout(tick, HOLD_MS); return; }
      if (erasing && n <= 0) { erasing = false; n = 0; which = (which + 1) % examples.length; }
      timer = setTimeout(tick, erasing ? ERASE_MS : TYPE_MS);
    }, START_MS);
    return () => clearTimeout(timer);
  }, [examples, touched, reduced]);

  const text = typed ?? (reduced ? examples[0] ?? "" : demo);
  const proposal = propose(text, routes);
  const route = proposal?.route ?? null;
  const miss = touched && proposal !== null && !route; // only said to someone who typed it, not while the box types
  const lower = text.toLowerCase();
  const hits = route ? route.keys.filter((k) => lower.includes(k.toLowerCase())).map((k) => k.trim()) : [];
  const state = raised && route ? "raised" : route ? "routed" : miss ? "miss" : "idle";

  return (
    <div className={styles.demo}>
      <form className={styles.box} onSubmit={(e) => { e.preventDefault(); setTyped(text); if (route) setRaised(true); }}>
        <span className={styles.spark} aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M7 .5 1.8 7h3.4L4.6 11.5 10.2 5H6.6z" /></svg>
        </span>
        <label className="nh-sr" htmlFor={id}>Try it: type a problem or an idea that is stuck</label>
        <textarea
          id={id} className={styles.input} rows={1} maxLength={160} value={text}
          placeholder="Share something that is stuck at work…"
          onChange={(e) => { setRaised(false); setTyped(e.target.value); }}
          onFocus={() => { if (!touched) setTyped(text); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
        />
        <button type="submit" className={styles.send} disabled={!route} aria-label="Raise it">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /></svg>
        </button>
      </form>

      <div className={styles.card} data-state={state}>
        <div className={styles.head}>
          <span className={styles.pulse} aria-hidden="true" />
          {state === "raised" && route ? <span>Raised · on {route.owner}&rsquo;s desk · the clock is running</span>
            : route ? <span>Routed on the demo map · <b>{route.type}</b></span>
            : miss ? <span>No row on this map matches yet. A person triages it, and the map gets a new row.</span>
            : <span>The demo company&rsquo;s routing map answers as you type.</span>}
          {route && state !== "raised" && (
            <span className={styles.hits} aria-label={`matched on ${hits.join(", ")}`}>{hits.map((h) => <i key={h}>{h}</i>)}</span>
          )}
        </div>
        <div className={styles.cells} key={route?.id ?? "none"}>
          <div className={styles.cell}>
            <span className={styles.label}>Owner</span>
            {route ? <Person name={route.owner} sub={route.role} /> : <span className={styles.skel} />}
          </div>
          <div className={styles.cell}>
            <span className={styles.label}>Answer owed by</span>
            {route ? (
              <span className={styles.due}><strong>{due ?? `Day ${promiseDays}`}</strong><span className={styles.badge}>{promiseDays} d left</span></span>
            ) : <span className={styles.skel} />}
          </div>
          <div className={styles.cell}>
            <span className={styles.label}>Deputy</span>
            {route ? <Person name={route.deputy} sub={`steps in after day ${promiseDays}`} /> : <span className={styles.skel} />}
          </div>
        </div>
      </div>
      <p className="nh-sr" role="status">
        {touched && route ? `Proposed owner: ${route.owner}, ${route.role}. Answer owed by ${due ?? `day ${promiseDays}`}. Deputy: ${route.deputy}.${raised ? " Raised." : ""}` : miss ? "No row on this map matches yet." : ""}
      </p>
    </div>
  );
}
