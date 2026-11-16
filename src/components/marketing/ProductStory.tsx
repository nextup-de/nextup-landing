"use client";
// The product in five steps, from the first word to the measured result. The steps are five stations on one
// horizontal line, like the line band above a U-Bahn door: when another station is chosen a train rides there
// and is gone again once it arrives. Under the line, the chosen step: its title and sentence on the left, its screen on
// the right, small, in one app window on the lit frame. Clicks and arrow keys choose a step; nothing changes by
// itself or by scroll.
// Every screen is real product UI built from the app's elements, with the demo company's own names.
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUp, Avatar, Clock, Dept, Pill, Progress, Spark } from "@/components/product/elements";
import { cn } from "@/lib/utils/cn";
import styles from "./ProductStory.module.css";

const TABS = ["Ideas", "Inbox", "Feed", "Projects", "Dashboard"] as const;
type Tab = (typeof TABS)[number];

const CHAPTERS: Array<{ key: string; step: string; short: string; title: string; body: string; tab: Tab }> = [
  { key: "raise", step: "Raise an idea", short: "Raise", title: "One box for every idea.", tab: "Ideas",
    body: "A problem or an idea, in one line. No form and no category tree." },
  { key: "check", step: "Check it with AI", short: "Check", title: "A first read in seconds.", tab: "Ideas",
    body: "The coach asks what is missing and reads the idea for fit, impact, feasibility and clarity. It suggests. It does not decide." },
  { key: "decide", step: "Decide in five days", short: "Decide", title: "An owner and a date.", tab: "Inbox",
    body: "The idea lands on one desk with a clock. The owner answers yes, no with a reason, or hands it over." },
  { key: "build", step: "Build the project", short: "Build", title: "A yes becomes a project.", tab: "Projects",
    body: "Steps, a lead and a due date. Everyone sees what is done, what is in progress and what is blocked." },
  { key: "measure", step: "Measure the result", short: "Measure", title: "The result, measured.", tab: "Dashboard",
    body: "Fourteen days after launch the project reports what it changed." },
];

const BARS: Array<[string, number, string]> = [["Fit", 80, "fit"], ["Impact", 64, "impact"], ["Feasibility", 72, "feas"], ["Clarity", 90, "clarity"]];
function Bars() {
  return (
    <div className={styles.bars}>
      {BARS.map(([label, pct, kind]) => (
        <div key={label}><span>{label}</span><i><b data-kind={kind} style={{ width: `${pct}%` }} /></i></div>
      ))}
    </div>
  );
}

function Screen({ which }: { which: string }) {
  if (which === "raise") {
    return (
      <div className={`${styles.page} ${styles.center}`}>
        <p className={styles.hello}>Raise it, M. Hoffmann</p>
        <div className={styles.composer}>
          <p>Reusable crates for door modules instead of cardboard</p>
          <div>
            <span className={styles.chips}><span className={styles.attach}>Attach</span><Dept tone="blue">Logistics</Dept></span>
            <span className={styles.send}><ArrowUp size={13} /></span>
          </div>
        </div>
      </div>
    );
  }
  if (which === "check") {
    return (
      <div className={styles.page}>
        <div className={styles.head}><h3>Reusable crates for door modules</h3><Pill status="clock">AI check</Pill></div>
        <div className={`${styles.card} ${styles.coach}`}>
          <span className={styles.spark}><Spark /></span>
          <p>How many boxes does one shift use today, and who would return the crates?</p>
        </div>
        <div className={styles.card}><Bars /></div>
      </div>
    );
  }
  if (which === "decide") {
    return (
      <div className={styles.page}>
        <div className={styles.head}><h3>Inbox</h3><Pill status="move">3 waiting on you</Pill></div>
        <div className={`${styles.card} ${styles.decision}`}>
          <div className={styles.cardTop}>
            <div>
              <Dept tone="blue">Logistics</Dept>
              <h4>Reusable crates for door modules</h4>
              <p className={styles.by}><Avatar name="M. Hoffmann" tone="violet" size={21} />M. Hoffmann · Team lead, final assembly</p>
            </div>
            <Pill status="clock"><Clock />3 d left</Pill>
          </div>
          <div className={styles.answers}>
            <span data-kind="yes">Yes, start it</span><span data-kind="no">No, with a reason</span><span data-kind="pass">Hand over</span>
          </div>
          <div className={styles.read}>
            <div>
              <strong>AI read · a suggestion, not a decision</strong>
              <p>Replaces about 40 cardboard boxes per shift. Needs 120 crates and one return lane at gate 3.</p>
            </div>
            <Bars />
          </div>
        </div>
        <div className={styles.queued}>
          <span><Dept tone="pink">Quality</Dept><strong>Torque records on the line tablet</strong></span>
          <Pill status="info">Needs info</Pill>
        </div>
      </div>
    );
  }
  if (which === "build") {
    return (
      <div className={styles.page}>
        <div className={styles.head}><h3>Projects</h3><Pill status="move">Your move</Pill></div>
        <div className={`${styles.card} ${styles.project}`}>
          <span className={styles.code}>P-4</span>
          <h4>Returnable trays for door modules</h4>
          <p className={styles.by}><Avatar name="T. Vogel" tone="green" size={21} />Lead T. Vogel · 2 people</p>
          <Progress parts={[["done", 2], ["doing", 1], ["blocked", 1]]} />
          <div className={styles.projectFoot}><span>2 of 4 steps done · 1 blocked</span><Pill status="move">Your move: take the baseline</Pill></div>
        </div>
        <div className={styles.queued}>
          <span><span className={styles.code}>P-1</span><strong>Standby for welding robots during breaks</strong></span>
          <Pill status="ok">Running</Pill>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.page}>
      <div className={styles.head}><h3>Dashboard</h3><Pill status="new">This month</Pill></div>
      <div className={styles.numbers}>
        <div className={styles.card}>
          <span>First answer, median</span>
          <strong data-tone="teal">2 d</strong>
          <em>3 d faster than last month</em>
        </div>
        <div className={styles.card}>
          <span>P-4, 14 days after launch</span>
          <strong data-tone="blue">−38</strong>
          <span>cardboard boxes per shift</span>
        </div>
      </div>
    </div>
  );
}

function Window({ which, tab }: { which: string; tab: Tab }) {
  return (
    <div className={styles.window} data-ui={which}>
      <div className={styles.appBar}>
        <Image src="/brand/nextup-logo-white.png" alt="" width={494} height={212} />
        <span className={styles.appNav}>{TABS.map((t) => <span key={t} data-on={t === tab}>{t}</span>)}</span>
        <span className={styles.me}>ND</span>
      </div>
      <Screen which={which} />
    </div>
  );
}

/** headingHidden  keeps the h2 for the outline but hides it (a page that heads the section itself). */
export function ProductStory({ headingHidden = false }: { headingHidden?: boolean }) {
  const id = useId();
  const [at, setStep] = useState(0);
  // The train shows only while it rides between two stations (the 620ms of the line's transition); at rest the
  // chosen station's ring stands alone.
  const [moving, setMoving] = useState(false);
  const rideTimer = useRef(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const last = CHAPTERS.length - 1;
  const setAt = (i: number) => {
    if (i === at) return;
    setStep(i);
    setMoving(true);
    window.clearTimeout(rideTimer.current);
    rideTimer.current = window.setTimeout(() => setMoving(false), 680);
  };
  useEffect(() => () => window.clearTimeout(rideTimer.current), []);

  // Arrow keys move along the stations, as in any tab list; Home and End jump to either end.
  function onKey(e: React.KeyboardEvent, i: number) {
    const to = e.key === "ArrowDown" || e.key === "ArrowRight" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowUp" || e.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (to === null) return;
    e.preventDefault();
    setAt(to);
    tabs.current[to]?.focus();
  }

  const c = CHAPTERS[at];
  const next = at === last ? 0 : at + 1;
  return (
    <div className={styles.tour} data-moving={moving || undefined} style={{ "--i": at, "--n": last } as React.CSSProperties}>
      <div className={cn("section-head", styles.intro, headingHidden && "nh-sr")}>
        <h2 id={`${id}-h`}>From the first word to the measured result</h2>
      </div>

      <div className={styles.band}>
        <span className={styles.bullet} aria-hidden="true">N</span>
        <div className={styles.steps} role="tablist" aria-orientation="horizontal" aria-labelledby={`${id}-h`}>
          <span className={styles.track} aria-hidden="true"><span className={styles.done} /></span>
          <span className={styles.carrier} aria-hidden="true"><span className={styles.train} /></span>
          {CHAPTERS.map((ch, i) => (
            <button
              key={ch.key} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={`${id}-t${i}`}
              className={styles.stop} data-on={i === at} data-past={i < at}
              aria-selected={i === at} aria-controls={`${id}-p`} tabIndex={i === at ? 0 : -1}
              onClick={() => setAt(i)} onKeyDown={(e) => onKey(e, i)}
            >
              <span className={styles.num}>{i + 1}</span>
              <span className={styles.name}><span className={styles.full}>{ch.step}</span><span className={styles.short}>{ch.short}</span></span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.stage} role="tabpanel" id={`${id}-p`} aria-labelledby={`${id}-t${at}`}>
        <div className={styles.text} key={`t-${c.key}`}>
          <p className={styles.kicker}><span>{at + 1}</span>Step {at + 1} of {CHAPTERS.length} · {c.step}</p>
          <h3>{c.title}</h3>
          <p className={styles.body}>{c.body}</p>
          <button type="button" className={styles.next} onClick={() => setAt(next)}>
            <small>{at === last ? "Back to the start" : "Next stop"}</small>
            <span>{CHAPTERS[next].step}<i aria-hidden="true">{at === last ? "↺" : "→"}</i></span>
          </button>
        </div>
        <div className={cn("nh-lit", styles.frame)}>
          <div className={styles.screen} key={c.key} aria-hidden="true"><Window which={c.key} tab={c.tab} /></div>
        </div>
      </div>
    </div>
  );
}
