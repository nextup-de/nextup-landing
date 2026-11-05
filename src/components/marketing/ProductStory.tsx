"use client";
// The product in five chapters (Paper: Home · 05 Product story and "Product story · five states").
// On a wide screen the section pins: the chapters stand on the left, one app window on the right, and the
// scroll position picks the chapter. The windows cross-fade. On a phone, on a short screen and with reduced
// motion nothing pins: the five chapters stack, each with its window.
// Every window is real product UI built from the app's elements, with the demo company's own names.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Avatar, Clock, Dept, Pill, Progress, Spark } from "@/components/product/elements";
import styles from "./ProductStory.module.css";

const TABS = ["Ideas", "Inbox", "Feed", "Projects", "Dashboard"] as const;
type Tab = (typeof TABS)[number];

const CHAPTERS: Array<{ key: string; step: string; title: string; body: string; tab: Tab }> = [
  { key: "raise", step: "Raise", title: "One box for every idea.", tab: "Ideas",
    body: "A problem or an idea, in one line. No form and no category tree." },
  { key: "check", step: "AI check", title: "A first read in seconds.", tab: "Ideas",
    body: "The coach asks what is missing and reads the idea for fit, impact, feasibility and clarity. It suggests. It does not decide." },
  { key: "decide", step: "Decide", title: "An owner and a date.", tab: "Inbox",
    body: "The idea lands on one desk with a clock. The owner answers yes, no with a reason, or hands it over. Five working days, in plain sight." },
  { key: "build", step: "Build", title: "A yes becomes a project.", tab: "Projects",
    body: "Steps, a lead and a due date. Everyone sees what is done, what is in progress and what is blocked." },
  { key: "measure", step: "Measure", title: "The result, measured.", tab: "Dashboard",
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
      <div className={`${styles.body} ${styles.center}`}>
        <p className={styles.hello}>Raise it, M. Hoffmann</p>
        <div className={styles.composer}>
          <p>Reusable crates for door modules instead of cardboard</p>
          <div>
            <span className={styles.chips}><span className={styles.attach}>Attach</span><Dept tone="blue">Logistics</Dept></span>
            <span className={styles.send}><ArrowUp size={16} /></span>
          </div>
        </div>
      </div>
    );
  }
  if (which === "check") {
    return (
      <div className={styles.body}>
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
      <div className={styles.body}>
        <div className={styles.head}><h3>Inbox</h3><Pill status="move">3 waiting on you</Pill></div>
        <div className={`${styles.card} ${styles.decision}`}>
          <div className={styles.cardTop}>
            <div>
              <Dept tone="blue">Logistics</Dept>
              <h4>Reusable crates for door modules</h4>
              <p className={styles.by}><Avatar name="M. Hoffmann" tone="violet" size={26} />M. Hoffmann · Team lead, final assembly</p>
            </div>
            <Pill status="clock"><Clock />3 d left</Pill>
          </div>
          <div className={styles.read}>
            <div>
              <strong>AI read · a suggestion, not a decision</strong>
              <p>Replaces about 40 cardboard boxes per shift. Needs 120 crates and one return lane at gate 3.</p>
            </div>
            <Bars />
          </div>
          <div className={styles.answers}>
            <span data-kind="yes">Yes, start it</span><span data-kind="no">No, with a reason</span><span data-kind="pass">Hand over</span>
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
      <div className={styles.body}>
        <div className={styles.head}><h3>Projects</h3><Pill status="move">Your move</Pill></div>
        <div className={`${styles.card} ${styles.project}`}>
          <span className={styles.code}>P-4</span>
          <h4>Returnable trays for door modules</h4>
          <p className={styles.by}><Avatar name="T. Vogel" tone="green" size={26} />Lead T. Vogel · 2 people</p>
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
    <div className={styles.body}>
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
    <div className={styles.window}>
      <div className={styles.appBar}>
        <Image src="/brand/nextup-logo-white.png" alt="" width={494} height={212} />
        <span className={styles.appNav}>{TABS.map((t) => <span key={t} data-on={t === tab}>{t}</span>)}</span>
        <span className={styles.me}>ND</span>
      </div>
      <Screen which={which} />
    </div>
  );
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function ProductStory() {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);

  // The scroll position picks the chapter while the section is pinned (same pattern as WaitScene).
  useEffect(() => {
    const el = root.current, st = pin.current;
    if (!el || !st) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      if (getComputedStyle(st).position !== "sticky") return; // stacked: every chapter shows
      const r = el.getBoundingClientRect();
      const span = r.height - st.offsetHeight;
      const top = parseFloat(getComputedStyle(st).top) || 0;
      const p = span > 0 ? clamp((top - r.top) / span) : 0;
      setAt(Math.min(CHAPTERS.length - 1, Math.floor(p * CHAPTERS.length)));
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(measure); };
    queue();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);

  function go(i: number) {
    const el = root.current, st = pin.current;
    if (!el || !st || getComputedStyle(st).position !== "sticky") return;
    const r = el.getBoundingClientRect();
    const top = parseFloat(getComputedStyle(st).top) || 0;
    const p = (i + 0.5) / CHAPTERS.length;
    window.scrollTo({ top: window.scrollY + r.top - top + p * (r.height - st.offsetHeight), behavior: "smooth" });
  }

  return (
    <section className={styles.story} ref={root} id="product" aria-label="The product in five chapters">
      <div className={styles.pin} ref={pin}>
        {CHAPTERS.map((c, i) => (
          <article key={c.key} className={styles.chapter} data-on={i === at}>
            <div className={styles.text} style={{ gridRow: i + 1 }}>
              <button type="button" className={styles.jump} onClick={() => go(i)} aria-current={i === at ? "step" : undefined}>
                {i + 1} · {c.title.replace(/\.$/, "")}
              </button>
              <div className={styles.open}>
                <p className={styles.step}>{i + 1} · {c.step}</p>
                <h2>{c.title}</h2>
                <p className={styles.lede}>{c.body}</p>
              </div>
            </div>
            <div className={styles.screen} aria-hidden="true"><Window which={c.key} tab={c.tab} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
