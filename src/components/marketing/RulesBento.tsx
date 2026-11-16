"use client";
// The five rules the product keeps, as five stops on one line. Each rule hangs under its stop as a card with a
// small night-board picture of the rule at work, drawn in the Berlin line's language (teal line, station rings,
// the idea's gold light):
//   1  AI suggests. People decide.  the coach asks, the idea rides on to its owner, the owner answers
//   2  A clock on every decision     the idea rides the working days from "raised" to the day it is due
//   3  Roles, not names              the idea goes to the role's station; when the owner is away, the deputy takes it
//   4  Hosted in the EU              one place; every company on its own line, to its own terminus
//   5  One field to start            one line typed into the box, one row of the routing table answers
// One beat clock (BEAT ms) steps every picture through its frames by writing CSS variables on it; the CSS moves
// only transform and opacity. It runs only while the block is on screen; the disc pauses it.
// Reduced motion or no script: every picture stands in its finished frame, which is the CSS default.
// The pictures are decorative (aria-hidden); each rule's words are its h3 and its sentence.
import { useEffect, useId, useRef, useState } from "react";
import { HOSTING_PLACE } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import { useReducedMotion } from "@/components/berlin/motion";
import styles from "./RulesBento.module.css";

const BEAT = 720;
type Frame = Record<string, number>;

// Each picture's frames, one per beat. Keys become CSS variables (--key) on the picture.
const AI: Frame[] = [
  { q: 0, t: 0, a: 0, p: 0, v: 0 },
  { q: 1, t: 0, a: 0, p: 0, v: 1 },
  { q: 1, t: 1, a: 0, p: 0, v: 1 },
  { q: 1, t: 1, a: 0, p: 0, v: 1 },
  { q: 1, t: 2, a: 0, p: 0, v: 1 },
  { q: 1, t: 2, a: 1, p: 1, v: 1 },
  { q: 1, t: 2, a: 1, p: 0, v: 1 },
  { q: 1, t: 2, a: 1, p: 0, v: 1 },
  { q: 0, t: 2, a: 0, p: 0, v: 0 },
];
function clockFrames(n: number): Frame[] {
  const f: Frame[] = [{ d: 0, v: 0, due: 0 }, { d: 0, v: 1, due: 0 }];
  for (let i = 1; i <= n; i++) f.push({ d: i, v: 1, due: i === n ? 1 : 0 });
  f.push({ d: n, v: 1, due: 1 }, { d: n, v: 0, due: 0 });
  return f;
}
const ROLE: Frame[] = [
  { t: 0, v: 0, o: 0, dp: 0, away: 0 },
  { t: 0, v: 1, o: 0, dp: 0, away: 0 },
  { t: 1, v: 1, o: 0, dp: 0, away: 0 },
  { t: 1, v: 1, o: 1, dp: 0, away: 0 },
  { t: 1, v: 1, o: 1, dp: 0, away: 0 },
  { t: 1, v: 0, o: 0, dp: 0, away: 0 },
  { t: 0, v: 0, o: 0, dp: 0, away: 1 },
  { t: 0, v: 1, o: 0, dp: 0, away: 1 },
  { t: 1, v: 1, o: 0, dp: 0, away: 1 },
  { t: 1, v: 1, o: 0, dp: 1, away: 1 },
  { t: 1, v: 1, o: 0, dp: 1, away: 1 },
  { t: 1, v: 0, o: 0, dp: 0, away: 0 },
];
// a, b, c: where each company's light is on its own line (0 start, 1 terminus); va, vb, vc: whether it shows.
const PLACE: Frame[] = [
  { a: 0, b: 0, c: 0, va: 1, vb: 0, vc: 0 },
  { a: 1, b: 0, c: 0, va: 1, vb: 1, vc: 0 },
  { a: 1, b: 1, c: 0, va: 1, vb: 1, vc: 1 },
  { a: 1, b: 1, c: 1, va: 1, vb: 1, vc: 1 },
  { a: 1, b: 1, c: 1, va: 1, vb: 1, vc: 1 },
  { a: 1, b: 1, c: 1, va: 1, vb: 1, vc: 1 },
  { a: 1, b: 1, c: 1, va: 0, vb: 0, vc: 0 },
  { a: 0, b: 0, c: 0, va: 0, vb: 0, vc: 0 },
];
const FIELD: Frame[] = [
  { ty: 0, s: 0, t: 0, r: 0, v: 0 },
  { ty: 0.5, s: 0, t: 0, r: 0, v: 0 },
  { ty: 1, s: 0, t: 0, r: 0, v: 0 },
  { ty: 1, s: 1, t: 0, r: 0, v: 0 },
  { ty: 1, s: 0, t: 0, r: 0, v: 1 },
  { ty: 1, s: 0, t: 1, r: 0, v: 1 },
  { ty: 1, s: 0, t: 1, r: 1, v: 1 },
  { ty: 1, s: 0, t: 1, r: 1, v: 1 },
  { ty: 1, s: 0, t: 1, r: 1, v: 1 },
  { ty: 0, s: 0, t: 1, r: 0, v: 0 },
];

/** The idea's gold light: a soft glow and the lamp. */
function Token({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle className={styles.glow} cx={x} cy={y} r={9} />
      <circle className={styles.lamp} cx={x} cy={y} r={4.5} />
    </>
  );
}

function AiArt() {
  return (
    <svg viewBox="0 0 200 150" className={styles.svg} focusable="false">
      <path className={styles.dash} d="M20 88H100" />
      <path className={styles.ln} d="M100 88H180" />
      <circle className={styles.st} cx={100} cy={88} r={5} />
      {/* The coach */}
      <circle className={styles.coach} cx={20} cy={88} r={11} />
      <path className={styles.spark} d="M20 81.5c.7 3.6 2.9 5.8 6.5 6.5-3.6.7-5.8 2.9-6.5 6.5-.7-3.6-2.9-5.8-6.5-6.5 3.6-.7 5.8-2.9 6.5-6.5z" />
      <text className={styles.lab} x={20} y={114} textAnchor="middle">COACH</text>
      {/* The idea rides under the owner's face, so it arrives on their desk. */}
      <g className={styles.ride}><Token x={20} y={88} /></g>
      {/* The owner */}
      <circle className={styles.pulse} cx={180} cy={88} r={13} />
      <circle className={styles.face} cx={180} cy={88} r={12} />
      <text className={styles.ini} x={180} y={91.5} textAnchor="middle">ND</text>
      <text className={styles.lab} x={180} y={66} textAnchor="middle">OWNER</text>
      {/* The question, and the answer */}
      <g className={styles.ask}>
        <rect className={styles.chip} x={8} y={18} width={150} height={26} rx={8} />
        <path className={styles.chipSpark} d="M20 25c.5 2.6 2 4.1 4.6 4.6-2.6.5-4.1 2-4.6 4.6-.5-2.6-2-4.1-4.6-4.6 2.6-.5 4.1-2 4.6-4.6z" />
        <text className={styles.chipText} x={30} y={34.5}>What does one crate cost?</text>
      </g>
      <g className={styles.say}>
        <rect className={styles.chipBrand} x={66} y={110} width={126} height={26} rx={8} />
        <text className={styles.chipTextOn} x={129} y={126.5} textAnchor="middle">Yes, start it · N. Demir</text>
      </g>
    </svg>
  );
}

function ClockArt({ days }: { days: number }) {
  const x0 = 16, x1 = 184, y = 98;
  const step = (x1 - x0) / days;
  const stops = Array.from({ length: days + 1 }, (_, j) => x0 + j * step);
  return (
    <svg viewBox="0 0 200 150" className={styles.svg} focusable="false"
      style={{ "--step": `${step}px` } as React.CSSProperties}>
      <text className={styles.big} x={12} y={60}>{days}</text>
      <text className={styles.lab} x={days > 9 ? 70 : 46} y={44}>WORKING</text>
      <text className={styles.lab} x={days > 9 ? 70 : 46} y={56}>DAYS</text>
      <path className={styles.ahead} d={`M${x0} ${y}H${x1}`} />
      <path className={styles.done} d={`M${x0} ${y}H${x1}`} />
      {stops.map((x, j) => (
        <g key={j}>
          {j === days
            ? <rect className={styles.st} x={x - 3} y={y - 8} width={6} height={16} rx={3} />
            : <circle className={styles.st} cx={x} cy={y} r={4.5} />}
          {j < days && <circle className={styles.lit} cx={x} cy={y} r={4.5} style={{ "--j": j } as React.CSSProperties} />}
          {j > 0 && j < days && <text className={styles.num} x={x} y={y + 22} textAnchor="middle">{j}</text>}
        </g>
      ))}
      <text className={styles.lab} x={x0} y={y + 22} textAnchor="middle">0</text>
      <g className={styles.due}>
        <rect className={styles.flag} x={x1 - 34} y={y - 34} width={40} height={18} rx={5} />
        <text className={styles.flagText} x={x1 - 14} y={y - 21.5} textAnchor="middle">DUE</text>
      </g>
      <g className={styles.ride}><Token x={x0} y={y} /></g>
    </svg>
  );
}

function RoleArt() {
  return (
    <svg viewBox="0 0 200 150" className={styles.svg} focusable="false">
      <path className={styles.ln} d="M8 62H126" />
      <path className={styles.ahead} d="M126 62C126 86 96 84 96 102M126 62C126 86 156 84 156 102" />
      <path className={cn(styles.lnLit, styles.toOwner)} d="M126 62C126 86 96 84 96 102" />
      <path className={cn(styles.lnLit, styles.toDeputy)} d="M126 62C126 86 156 84 156 102" />
      <rect className={styles.sign} x={56} y={16} width={140} height={24} rx={6} />
      <text className={styles.signText} x={126} y={31.5} textAnchor="middle">Head of Inbound Logistics</text>
      <path className={styles.post} d="M126 40V55" />
      <circle className={styles.stBig} cx={126} cy={62} r={6.5} />
      <g className={styles.owner}>
        <circle className={styles.ring} cx={96} cy={116} r={16} />
        <circle className={styles.face} cx={96} cy={116} r={12} />
        <text className={styles.ini} x={96} y={119.5} textAnchor="middle">ND</text>
      </g>
      <text className={cn(styles.lab, styles.onDuty)} x={96} y={145} textAnchor="middle">OWNER</text>
      <text className={cn(styles.lab, styles.away)} x={96} y={145} textAnchor="middle">AWAY</text>
      <g className={styles.deputy}>
        <circle className={styles.ring} cx={156} cy={116} r={16} />
        <circle className={styles.face} cx={156} cy={116} r={12} />
        <text className={styles.ini} x={156} y={119.5} textAnchor="middle">TV</text>
      </g>
      <text className={styles.lab} x={156} y={145} textAnchor="middle">DEPUTY</text>
      <g className={styles.ride}><Token x={8} y={62} /></g>
    </svg>
  );
}

function PlaceArt({ place }: { place: string }) {
  const lines = [["A", 96], ["B", 114], ["C", 132]] as const;
  return (
    <svg viewBox="0 0 200 150" className={styles.svg} focusable="false">
      <circle className={styles.wave} cx={100} cy={44} r={5} />
      <circle className={cn(styles.wave, styles.wave2)} cx={100} cy={44} r={5} />
      <path className={styles.pin} d="M100 44c-6-7.5-9.5-12.3-9.5-17a9.5 9.5 0 1 1 19 0c0 4.7-3.5 9.5-9.5 17z" />
      <circle className={styles.pinDot} cx={100} cy={27} r={3.4} />
      <text className={styles.lab} x={100} y={64} textAnchor="middle">{place.toUpperCase()}</text>
      {lines.map(([k, y], i) => (
        <g key={k}>
          <rect className={styles.coBullet} x={8} y={y - 7} width={14} height={14} rx={4} />
          <text className={styles.coBulletText} x={15} y={y + 3.2} textAnchor="middle">{k}</text>
          <path className={styles.ln} d={`M30 ${y}H180`} />
          <rect className={styles.st} x={180} y={y - 6} width={5} height={12} rx={2.5} />
          <g className={cn(styles.ride, styles[`co${i}`])}><Token x={30} y={y} /></g>
        </g>
      ))}
    </svg>
  );
}

function FieldArt({ uid }: { uid: string }) {
  const rows: Array<[string, string]> = [["SPEND < €5K", "Team lead"], ["TEST-RIG TIME", "Engineering lead"], ["TOLERANCES", "Quality lead"]];
  return (
    <svg viewBox="0 0 200 150" className={styles.svg} focusable="false">
      <defs>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0" stopColor="#f0c23a" /><stop offset="0.5" stopColor="#fff3d0" /><stop offset="1" stopColor="#e6a919" />
        </linearGradient>
        <clipPath id={`${uid}-type`}><rect x={20} y={18} width={136} height={24} /></clipPath>
      </defs>
      <rect className={styles.box} x={8} y={14} width={184} height={32} rx={16} stroke={`url(#${uid}-gold)`} />
      <g clipPath={`url(#${uid}-type)`}>
        <text className={styles.boxText} x={22} y={34}>€2,400 leak detector</text>
        <rect className={styles.cover} x={20} y={18} width={136} height={24} />
      </g>
      <circle className={styles.send} cx={174} cy={30} r={10} />
      <path className={styles.sendArrow} d="M174 35v-10M170 29l4-4 4 4" />
      <path className={styles.ahead} d="M22 46V82" />
      {rows.map(([type, owner], i) => (
        <g key={type}>
          <rect className={styles.row} x={10} y={74 + i * 22} width={180} height={18} rx={5} />
          {i === 0 && <rect className={styles.hit} x={10} y={74} width={180} height={18} rx={5} />}
          <circle className={styles.st} cx={22} cy={83 + i * 22} r={3.2} />
          <text className={styles.rowType} x={32} y={86.2 + i * 22}>{type}</text>
          <text className={styles.rowOwner} x={184} y={86.4 + i * 22} textAnchor="end">{owner}</text>
        </g>
      ))}
      <g className={styles.ride}><Token x={22} y={46} /></g>
    </svg>
  );
}

/** promiseDays  the working days every decision gets (SITE.promiseDays) */
export function RulesBento({ promiseDays }: { promiseDays: number }) {
  const uid = useId().replace(/:/g, "");
  const root = useRef<HTMLDivElement>(null);
  const arts = useRef<Array<HTMLDivElement | null>>([]);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  // The line draws itself and the cards arrive once, the first time the block is seen.
  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    el.dataset.armed = "";
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.dataset.in = ""; io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => { io.disconnect(); delete el.dataset.armed; };
  }, [reduced]);

  // The beat: every picture steps through its frames while the block is on screen and not paused.
  useEffect(() => {
    const el = root.current;
    const lines = [AI, clockFrames(promiseDays), ROLE, PLACE, FIELD];
    if (!el || reduced) {
      // Back to the finished frames, the CSS defaults.
      arts.current.forEach((a, k) => { for (const key in lines[k][0]) a?.style.removeProperty(`--${key}`); });
      return;
    }
    let beat = 0;
    let timer = 0;
    const tick = () => {
      arts.current.forEach((a, k) => {
        if (!a) return;
        const frames = lines[k];
        const f = frames[beat % frames.length];
        for (const key in f) a.style.setProperty(`--${key}`, String(f[key]));
      });
      beat++;
    };
    const start = () => { if (!timer && !paused) { tick(); timer = window.setInterval(tick, BEAT); } };
    const stop = () => { if (timer) { clearInterval(timer); timer = 0; } };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); else stop(); }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    el.dataset.live = "";
    return () => { stop(); io.disconnect(); };
  }, [reduced, paused, promiseDays]);

  const rules: Array<{ title: string; body: string; art: React.ReactNode; cls: string; vars?: React.CSSProperties }> = [
    { title: "AI suggests. People decide.", body: "The coach asks and reads. The answer comes from the person who owns it.", art: <AiArt />, cls: styles.ai },
    { title: "A clock on every decision", body: "Every idea shows the day its answer is due.", art: <ClockArt days={promiseDays} />, cls: styles.clock, vars: { "--n": promiseDays } as React.CSSProperties },
    { title: "Roles, not names", body: "Routing follows the role, through holidays and job changes.", art: <RoleArt />, cls: styles.role },
    { title: "Hosted in the EU", body: "Each company runs its own NextUp at its own address.", art: <PlaceArt place={HOSTING_PLACE} />, cls: styles.place },
    { title: "One field to start", body: "A pilot needs one field and one routing table.", art: <FieldArt uid={uid} />, cls: styles.field },
  ];

  return (
    <div ref={root} className={styles.rules} data-paused={paused ? "" : undefined}>
      <ol className={styles.line}>
        {rules.map((r, i) => (
          <li key={r.title} className={styles.stop} style={{ "--i": i } as React.CSSProperties} data-last={i === rules.length - 1 ? "" : undefined}>
            <span className={styles.bullet} aria-hidden="true">{i + 1}</span>
            <article className={styles.card}>
              <div ref={(a) => { arts.current[i] = a; }} className={cn(styles.art, r.cls)} style={r.vars} aria-hidden="true">{r.art}</div>
              <div className={styles.copy}>
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </div>
            </article>
          </li>
        ))}
      </ol>
      {!reduced && (
        <button type="button" className={cn("nh-pause", styles.pause)} onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play the rule pictures" : "Pause the rule pictures"} aria-pressed={paused}>
          {paused
            ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>
            : <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" /></svg>}
        </button>
      )}
    </div>
  );
}
