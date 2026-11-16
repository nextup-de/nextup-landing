"use client";
// The turn, beat 3: everyone can see. The ideas list as a departure board for decisions: whose desk each open
// request is on and when its answer is due. The rows are DECISION_ROWS (features/demo/showcase), derived from the
// same IDEAS that /product's ideas list reads; people are shown by role.
// The board flaps in once when 40% in view (its own IntersectionObserver and timer); the late row's status turns to
// "-> deputy" 1.2 s after the flaps settle. Nothing blinks afterwards.
// The board is one picture for assistive technology; a visually hidden table carries the same rows.
// Reduced motion or no script: the final text. Wide: as many cells as the longest request
// (the spec's 26 cut every request). Below 760px: 18 cells and each row's short title (DECISION_ROWS[].short, whole
// words, never a half sentence), the owner under it.
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { DECISION_ROWS } from "@/features/demo/showcase";
import { DepartureBoard } from "./DepartureBoard";
import { Turn } from "./Turn";
import styles from "./SeenBeat.module.css";

const NARROW = "(max-width: 759px)";
function onNarrow(cb: () => void) {
  const m = window.matchMedia(NARROW);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

// Wide, a row holds the whole request. On a phone it shows the row's short title (cut at a word only if a short
// title were ever too long); the hidden table always has the whole text.
const WIDE_CELLS = Math.max(26, ...DECISION_ROWS.map((r) => r.request.length));
const NARROW_CELLS = 18;
function fit(text: string, cells: number) {
  if (text.length <= cells) return text;
  let out = "";
  for (const w of text.split(" ")) {
    const next = out ? `${out} ${w}` : w;
    if (next.length > cells) break;
    out = next;
  }
  return out || text.slice(0, cells);
}

export function SeenBeat() {
  const narrow = useSyncExternalStore(onNarrow, () => window.matchMedia(NARROW).matches, () => false);
  const cells = narrow ? NARROW_CELLS : WIDE_CELLS;
  const rows = DECISION_ROWS.map((r) => ({ label: r.owner, text: fit(narrow ? r.short : r.request, cells), status: r.status, then: r.then, tone: r.tone }));
  const waiting = DECISION_ROWS.filter((r) => r.tone !== "ok").length;

  return (
    <section className="section" id="seen" aria-labelledby="seen-h">
      <div className="wrap">
        <div className={styles.head}>
          <div className={styles.headTitle}>
            <Turn at={3} />
            <h2 id="seen-h" className={styles.title}>Everyone can see.</h2>
          </div>
          <p className={styles.copy}>
            Every open request shows whose desk it is on and when the answer is due. One board for the whole plant.
            Nobody has to chase. Anyone can look.
          </p>
        </div>

        <figure className={styles.fig}>
          <div className={styles.hang} aria-hidden="true"><i /><i /></div>
          <DepartureBoard
            className={styles.board}
            rows={rows}
            cells={cells}
            caption="Waiting on · Demo plant"
            platform={narrow ? "Today" : "Platform: Today"}
            label={`A departure board of decisions in the demo plant: ${waiting} requests waiting on their owners and one answered. The same rows follow as a table.`}
          />
          <div className={styles.floor} aria-hidden="true" />
          <div className="nh-sr"><table>
            <caption>Waiting on, demo plant, today</caption>
            <thead><tr><th scope="col">Owner</th><th scope="col">Request</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {DECISION_ROWS.map((r) => (
                <tr key={r.request}><td>{r.owner}</td><td>{r.request}</td><td>{(r.then ?? r.status).replace("→", "moves to the")}</td></tr>
              ))}
            </tbody>
          </table></div>
          <figcaption className={styles.foot}>
            <span>Fictional demo plant. Owners are shown by role.</span>
            <Link className={styles.link} href="/product#ideas">
              <span className="nh-link">This is the ideas list as a board. Open the real one</span>
              <svg className="nh-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h8" /><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>
            </Link>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
