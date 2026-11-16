"use client";
// #questions on the landing: the four people a plant manager has to convince, each with the question they will
// ask and the plain answer. It replaces the landing's FAQ list; the full list stays on /pricing#questions.
// Every answer claims only what FAQ (src/config/site.ts) and the product's rules already claim: keep the two in
// agreement. The place comes from HOSTING_PLACE, which follows LEGAL.hosting.
// The four people are four stations on one line, each stretch of it in that person's colour, like the lines that
// meet at an interchange. Under each station hangs a platform sign: the role, the question in big type and a small
// line icon drawn from the Berlin marks (the Reichstag's dome for the works council, a slab block's grid for IT, a
// pin for the data, the coach's spark for the sceptic); the plain answer stands under the sign.
// Motion: as the line passes through the screen (motion.ts onFrame) it fills from the first station to the last,
// and each station lights as the fill reaches it: its ring fills, its sign rises in and its icon draws itself.
// Only transform, opacity and stroke-dashoffset move. Reduced motion or no script: every station lit, complete.
import Link from "next/link";
import { useEffect, useRef } from "react";
import { clamp01, onFrame } from "@/components/berlin/motion";
import { REICHSTAG, plattenbau, type Mark } from "@/components/berlin/landmarks";
import { useReducedMotion } from "@/components/berlin/motion";
import { HOSTING_PLACE } from "@/config/site";
import styles from "./Objections.module.css";

type Icon = "dome" | "grid" | "pin" | "spark";
type Objection = { who: string; ask: string; answer: string; icon: Icon; line: string };

// Keep in agreement with FAQ in src/config/site.ts.
export const OBJECTIONS: Objection[] = [
  {
    who: "Works council", ask: "Who sees what?", icon: "dome", line: "#00626e",
    answer: "Who owns a request and when it is due is visible: that is the point. What else is visible, and to whom, is agreed with your works council in the pilot scope. Bring them to the first conversation.",
  },
  {
    who: "IT", ask: "What do you need from us?", icon: "grid", line: "#0b70d1",
    answer: "Nothing to start. A pilot needs one field and one routing table. Single sign-on and other connections are agreed in the pilot scope.",
  },
  {
    who: "Data protection", ask: "Where does our data live?", icon: "pin", line: "#6b3fa0",
    answer: `On servers in ${HOSTING_PLACE}. Each company runs its own NextUp at its own address, and its data is never visible to another company. The privacy policy names the provider.`,
  },
  {
    who: "The sceptic", ask: "Does the AI decide?", icon: "spark", line: "#b07400",
    answer: "No. AI suggests, people decide. The coach asks what is missing and gives a first read. The answer comes from the person who owns the decision, with their name on it.",
  },
];

const BLOCK = plattenbau(48, 6, [[1, 4], [2, 1]]);
const PIN: Mark = { lines: ["M0 0C-3-8-16-20-16-32A16 16 0 1 1 16-32C16-20 3-8 0 0Z", "M-6-32A6 6 0 1 0 6-32A6 6 0 1 0-6-32"], gold: ["M-3.2-32A3.2 3.2 0 1 0 3.2-32A3.2 3.2 0 1 0-3.2-32Z"] };
const SPARK: Mark = { lines: ["M0-44L5-30.4L18.6-25.3L5-20.2L0-6.6L-5-20.2L-18.6-25.3L-5-30.4Z", "M17-46L18.6-41.6L23-40L18.6-38.4L17-34L15.4-38.4L11-40L15.4-41.6Z"] };
const ICONS: Record<Icon, { mark: Mark; box: string }> = {
  dome: { mark: REICHSTAG, box: "-70 -64 140 68" },
  grid: { mark: BLOCK, box: "-30 -54 60 58" },
  pin: { mark: PIN, box: "-22 -52 44 56" },
  spark: { mark: SPARK, box: "-24 -50 52 48" },
};

function LineIcon({ icon }: { icon: Icon }) {
  const { mark, box } = ICONS[icon];
  const sw = (1.6 * Number(box.split(" ")[3])) / 44; // a 1.6px line at the icon's 44px height
  return (
    <svg className={styles.icon} viewBox={box} aria-hidden="true" focusable="false" style={{ "--sw": sw.toFixed(2) } as React.CSSProperties}>
      {mark.sil && <path className={styles.sil} d={mark.sil} />}
      {mark.lines.map((d, k) => <path key={k} className={styles.ln} d={d} pathLength={1} style={{ "--k": k } as React.CSSProperties} />)}
      {mark.gold?.map((d, k) => <path key={`g${k}`} className={styles.gold} d={d} />)}
    </svg>
  );
}

export function Objections() {
  const line = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = line.current;
    if (!el || reduced) return;
    const stops = Array.from(el.querySelectorAll<HTMLLIElement>(":scope > li"));
    el.style.setProperty("--n", String(stops.length));
    el.dataset.armed = "";
    let lit = -1;
    let stop: (() => void) | null = null;
    const job = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the line's top is at 85% of the screen, 1 when its foot is at 75% (or its top at 20%, if taller).
      const span = Math.max(1, Math.min(r.height, vh * 0.65) + vh * 0.1);
      const p = clamp01((vh * 0.85 - r.top) / span);
      const n = Math.min(stops.length, Math.floor(p * stops.length + 0.35));
      return () => {
        el.style.setProperty("--fill", p.toFixed(3));
        if (n !== lit) {
          lit = n;
          stops.forEach((li, k) => { if (k < n) li.dataset.lit = ""; else delete li.dataset.lit; });
        }
      };
    };
    const near = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !stop) stop = onFrame(job);
      else if (!e.isIntersecting && stop) { stop(); stop = null; }
    }, { rootMargin: "20% 0px" });
    near.observe(el);
    return () => {
      near.disconnect(); stop?.();
      delete el.dataset.armed;
      el.style.removeProperty("--fill");
      el.style.removeProperty("--n");
      stops.forEach((li) => { delete li.dataset.lit; });
    };
  }, [reduced]);

  return (
    <section className="section" id="questions" aria-labelledby="questions-h" style={{ "--hm": 0 } as React.CSSProperties}>
      <div className="wrap">
        <div className={styles.head}>
          <p className={styles.kicker}><i aria-hidden="true" />Before you say yes</p>
          <h2 id="questions-h" className={styles.title}>Four people will ask before you say yes.</h2>
        </div>
        <ol ref={line} className={styles.line}>
          {OBJECTIONS.map((o, i) => (
            <li key={o.who} className={styles.stop} style={{ "--line": o.line, "--i": i } as React.CSSProperties}>
              <span className={styles.seg} aria-hidden="true" />
              <span className={styles.ring} aria-hidden="true" />
              <article className={styles.platform}>
                <header className={styles.sign}>
                  <div className={styles.signText}>
                    <p className={styles.who}><b aria-hidden="true">{i + 1}</b>{o.who}</p>
                    <h3 className={styles.ask}>{o.ask}</h3>
                  </div>
                  <LineIcon icon={o.icon} />
                </header>
                <p className={styles.answer}>{o.answer}</p>
              </article>
            </li>
          ))}
        </ol>
        <p className={styles.more}>
          <Link href="/pricing#questions" className={styles.link}>
            <span className="nh-link">Seats, pilots and the other questions</span>
            <svg className="nh-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h8" /><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>
          </Link>
        </p>
      </div>
    </section>
  );
}
