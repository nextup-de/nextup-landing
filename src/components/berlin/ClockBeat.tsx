"use client";
// The turn, beat 2: one clock. A split-flap counter for the working days left, and the same days as a timetable.
//   count     when the beat is half in view (once) the counter turns 5, 4, 3, one flap every 500 ms under the label
//             "WORKING DAYS LEFT"; when the answer comes, the same number goes green and its label turns to
//             "DAYS TO SPARE", with "Answered on day 2 of 5" under it: one unit, days left, from start to end
//             (Flaps, components/berlin/Flaps)
//   timetable a real <ol> of working days from the day the request is raised to the day it is due, the weekend a
//             hatched gap that is not counted. A gold disc rides from "Raised" to "Answered" in step with the flaps,
//             and the deputy branch at the due day is drawn as the rule: what happens on day 5 without an answer
// Numbers come from SITE.promiseDays and ANSWERED_DAY (features/tower/story); the ghost 19 behind the counter is
// TODAY_DAYS, struck through as in #why. Illustrative: one fictional idea.
// Reduced motion or no script: the final state (answered on day 2 with 3 days to spare, the disc on its stop, the
// branch drawn). Before the branch draws, its column stands faint, so the timetable card is balanced at rest.
// Below 760px the timetable runs down the left edge.
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/product/elements";
import { SITE } from "@/config/site";
import { ANSWERED_DAY, EXAMPLES, TODAY_DAYS } from "@/features/tower/story";
import { cn } from "@/lib/utils/cn";
import { Flaps } from "./Flaps";
import { useReducedMotion } from "./motion";
import { Turn } from "./Turn";
import styles from "./ClockBeat.module.css";

const P = SITE.promiseDays;
const A = ANSWERED_DAY;
const LEFT_LABEL = "WORKING DAYS LEFT";
const DONE_LABEL = "DAYS TO SPARE";
const LABEL_CELLS = Math.max(LEFT_LABEL.length, DONE_LABEL.length);
const DEPUTY = EXAMPLES[0]?.deputy.name ?? "M. Roth";

type Stop = { kind: "day"; day: string; n: number; note?: string; at: "raised" | "answered" | "due" | "day" } | { kind: "gap"; note: string };

/** The working days from a Wednesday to the due day, the weekend as one uncounted gap. */
function timetable(): Stop[] {
  const NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let d = 2; // Wednesday
  const out: Stop[] = [{ kind: "day", day: NAMES[d], n: 0, note: "Raised", at: "raised" }];
  for (let n = 1; n <= P; n++) {
    d += 1;
    if (d >= 5) { out.push({ kind: "gap", note: "not counted" }); d = 0; }
    const at = n === A ? "answered" : n === P ? "due" : "day";
    out.push({ kind: "day", day: NAMES[d], n, at, note: at === "answered" ? "Answered" : at === "due" ? "Due → deputy" : undefined });
  }
  return out;
}
const STOPS = timetable();
const INDEX_OF = (n: number) => STOPS.findIndex((s) => s.kind === "day" && s.n === n);

export function ClockBeat() {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  // The server's markup is the end of the story; the effect rewinds it when motion is allowed.
  const [left, setLeft] = useState(P - A);
  const [answered, setAnswered] = useState(true);
  const [done, setDone] = useState(true);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    // Arming: rewind to the start once motion is known to be allowed.
    setArmed(true);
    setLeft(P);
    setAnswered(false);
    setDone(false);
    const timers: number[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      let t = 700;
      for (let k = 1; k <= A; k++) { timers.push(window.setTimeout(() => setLeft(P - k), t)); t += 500; }
      timers.push(window.setTimeout(() => setAnswered(true), t));
      timers.push(window.setTimeout(() => setDone(true), t + 900));
    }, { threshold: 0.5 });
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach((x) => window.clearTimeout(x));
      setArmed(false); setLeft(P - A); setAnswered(true); setDone(true);
    };
  }, [reduced]);

  const ridden = P - left; // working days gone by: where the disc stands
  const discAt = INDEX_OF(ridden);

  return (
    <section className="section" id="clock" data-ground="alt" aria-labelledby="clock-h">
      <div className="wrap">
        <div className={styles.head}>
          <div className={styles.headTitle}>
            <Turn at={2} />
            <h2 id="clock-h" className={styles.title}>One clock.</h2>
          </div>
          <p className={styles.copy}>
            The moment a request lands, its owner has {P} working days to answer: yes, no with a reason, or hand it on.
            The date is on the request for everyone to see. No answer by day {P}, and it moves to the deputy.
          </p>
        </div>

        <div ref={root} className={styles.stage} data-armed={armed || undefined} data-done={done || undefined}>
          {/* The counter: one big flap on the board, its label beside it, the old 19 struck behind. */}
          <div className={styles.board}>
            <p className="nh-sr">{answered ? `Answered on working day ${A} of ${P}, with ${P - A} working days to spare.` : `${left} working days left.`}</p>
            <div className={styles.ghost} aria-hidden="true"><span>{TODAY_DAYS}</span></div>
            <div className={styles.count} aria-hidden="true">
              <Flaps text={String(left)} cells={1} size="xl" tone={answered ? "ok" : undefined} step={45} className={styles.big} />
            </div>
            <div className={styles.side} aria-hidden="true">
              <span className={styles.kicker}><i />Clock · Leak detector</span>
              <Flaps text={answered ? DONE_LABEL : LEFT_LABEL} cells={LABEL_CELLS} size="s" tone={answered ? "ok" : undefined} className={styles.label} />
              <span className={styles.answeredOn} data-on={answered || undefined}>Answered on day {A} of {P}</span>
              <span className={styles.was}>Was {TODAY_DAYS} days on the ring</span>
            </div>
          </div>

          {/* The timetable: working days, the weekend not counted, the deputy branch at the due day. */}
          <div className={styles.table}>
            <p className={styles.tableHead} aria-hidden="true"><span>Timetable · working days</span><span>Raised Wed · due Wed</span></p>
            <div className={styles.trackWrap}>
              <ol className={styles.track} style={{ "--n": STOPS.length } as React.CSSProperties}>
                {STOPS.map((s, i) => s.kind === "gap" ? (
                  <li key={`g${i}`} className={styles.gap}>
                    <b>Sat Sun</b><span>{s.note}</span>
                  </li>
                ) : (
                  <li key={s.n} className={styles.stop} data-at={s.at} data-past={s.n <= ridden || undefined} data-after={s.n > A || undefined} data-lit={(s.at === "answered" && answered) || undefined}>
                    <i aria-hidden="true" />
                    <b>{s.day}</b>
                    <span>{s.note ?? `Day ${s.n}`}</span>
                  </li>
                ))}
              </ol>
              <span className={styles.lane} aria-hidden="true" style={{ "--n": STOPS.length, "--at": Math.max(0, discAt) } as React.CSSProperties}>
                <i className={styles.disc} />
              </span>
            </div>
            <div className={styles.branch} aria-hidden="true">
              <svg className={styles.branchWide} viewBox="0 0 120 80" focusable="false">
                <path className={styles.spur} pathLength={1} d="M0 22H8C34 22 40 58 66 58H86" />
              </svg>
              <svg className={styles.branchTall} viewBox="0 0 80 64" focusable="false">
                <path className={styles.spur} pathLength={1} d="M22 0C22 26 54 30 54 56" />
              </svg>
              <span className={styles.deputy}><Avatar name={DEPUTY} size={30} /><span><b>Deputy</b><small>after day {P}</small></span></span>
            </div>
          </div>
        </div>

        <div className={cn(styles.under)}>
          <p>
            The answer goes back to the person who asked, with a name on it. In this story: {TODAY_DAYS} days on the ring,{" "}
            <strong>{A} days on the line.</strong>
          </p>
          <p className={styles.note}>One fictional idea. Weekends are not counted.</p>
        </div>
      </div>
    </section>
  );
}
