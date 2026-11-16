"use client";
// "NextUp routes every idea", drawn as a night transit network. Ideas start where people work (shift teams,
// assembly lines, offices), ride their line as gold lights into the NextUp interchange, where the board names the
// role that owns them, and ride out on that role's line to its station. The station lights, and its 5-day clock
// ticks down a day at a time until the owner answers. A new idea leaves every 2.2 s; four ride the loop, one to
// each owner, so the picture always shows several at once.
// Two drawings of one network (network.ts): left to right when there is room, top to bottom on a phone. The
// frame's container width picks one; the loop writes to both, so a resize never restarts it.
// Motion: transform, opacity and stroke-dashoffset only, written straight to the elements from one rAF loop that
// runs only while the frame is on screen and not paused. Reduced motion or no JS: the markup is the complete
// picture - every line drawn, every owner lit at a different day of its clock.
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/components/berlin/motion";
import { cn } from "@/lib/utils/cn";
import { ARRIVE, CYCLE, IDEAS, LAYOUTS, OWNERS, SOURCES, STILL, T, ease, pointAt, type Layout } from "./pilot-diagram/network";
import styles from "./PilotDiagram.module.css";

const DAYS = 5;
const COLORS = ["#5cc6cf", "#73b4ff", "#7fd49b", "#c6a8ff"];
const STILL_BOARD: [string, string] = ["EVERY IDEA", "→ ONE OWNER, 5 DAYS"];
const TICKS = Array.from({ length: DAYS }, (_, k) => (k / DAYS) * Math.PI * 2 - Math.PI / 2);

function Net({ L }: { L: Layout }) {
  const tall = L.key === "tall";
  return (
    <svg className={cn(styles.net, tall ? styles.tall : styles.wide)} data-layout={L.key} viewBox={`0 ${L.top} ${L.w} ${L.h}`} aria-hidden="true">
      {/* Inbound lines: pale, one per source. */}
      {L.ins.map((r, i) => (
        <g key={`i${i}`}>
          <path className={styles.lineIn} d={r.d} />
          <path className={styles.flow} d={r.d} />
          <path className={styles.comet} data-comet={`in-${i}`} d={r.d} pathLength={1} />
        </g>
      ))}
      {/* Outbound lines: one colour per owner, R1 to R4. */}
      {L.outs.map((r, j) => (
        <g key={`o${j}`} style={{ "--c": COLORS[j] } as React.CSSProperties}>
          <path className={styles.lineOut} d={r.d} />
          <path className={styles.flow} d={r.d} />
          <path className={styles.comet} data-comet={`out-${j}`} d={r.d} pathLength={1} />
        </g>
      ))}

      {/* The moving ideas: one gold light per line. Hidden until the loop places them. */}
      {[...L.ins.map((_, i) => `in-${i}`), ...L.outs.map((_, j) => `out-${j}`)].map((k) => (
        <g key={k} className={styles.disc} data-disc={k}>
          <circle r="12" className={styles.discGlow} />
          <circle r="5.5" className={styles.discCore} />
          <circle r="2" className={styles.discEye} />
        </g>
      ))}

      {/* Sources. */}
      {L.sources.map((s, i) => (
        <g key={`s${i}`}>
          <g transform={`translate(${s.at[0]} ${s.at[1]})`}>
            <circle r="18" className={styles.srcHalo} data-src={i} />
            <circle r="9" className={styles.srcRing} />
            <circle r="3" className={styles.srcDot} />
          </g>
          <text className={styles.srcName} x={s.label.x} y={s.label.y} textAnchor={s.label.anchor}>{SOURCES[i].name}</text>
          {!tall && <text className={styles.note} x={s.label.x} y={s.label.y + 14} textAnchor={s.label.anchor}>{SOURCES[i].note}</text>}
        </g>
      ))}

      {/* The interchange. */}
      <g>
        <rect className={styles.hubPulse} data-hub-pulse="" x={L.hub.x} y={L.hub.y} width={L.hub.w} height={L.hub.h} rx={Math.min(L.hub.w, L.hub.h) / 2} />
        <rect className={styles.hub} x={L.hub.x} y={L.hub.y} width={L.hub.w} height={L.hub.h} rx={Math.min(L.hub.w, L.hub.h) / 2} />
        {L.ports.map(([x, y], k) => <circle key={k} className={styles.port} cx={x} cy={y} r="3.2" />)}
        <text className={styles.hubName} x={L.hub.cx} y={L.hub.cy + (tall ? 1 : -4)} textAnchor="middle">NextUp</text>
        <text className={styles.hubNote} x={L.hub.cx} y={L.hub.cy + (tall ? 16 : 14)} textAnchor="middle">READS THE MAP</text>
      </g>

      {/* The board under the hub: which idea, to which role. */}
      <g>
        <rect className={styles.board} x={L.board.x} y={L.board.y} width={L.board.w} height={L.board.h} rx="8" />
        <circle className={styles.boardLamp} data-lamp="" cx={L.board.x + 14} cy={L.board.y + 17} r="3" />
        <g className={styles.boardText} data-board="">
          <text className={styles.board1} x={L.board.x + 26} y={L.board.y + 21} data-b1="">{STILL_BOARD[0]}</text>
          <text className={styles.board2} x={L.board.x + 26} y={L.board.y + 37} data-b2="">{STILL_BOARD[1]}</text>
        </g>
      </g>

      {/* Owners: a station with its clock, the role, the owner and the deputy, the clock's state. */}
      {L.owners.map((o, j) => {
        const still = STILL[j];
        return (
          <g key={`w${j}`} className={styles.owner} data-own={j} data-state={still.state} style={{ "--c": COLORS[j] } as React.CSSProperties}>
            <g transform={`translate(${o.at[0]} ${o.at[1]})`}>
              <circle r="22" className={styles.ownHalo} data-halo="" />
              <circle r="14" className={styles.clockTrack} />
              {TICKS.map((a, k) => (
                <line key={k} className={styles.tick} x1={Math.cos(a) * 17.5} y1={Math.sin(a) * 17.5} x2={Math.cos(a) * 20} y2={Math.sin(a) * 20} />
              ))}
              <circle r="14" className={styles.clock} data-clock="" pathLength={1} style={{ strokeDashoffset: 1 - still.left / DAYS }} />
              <circle r="7" className={styles.station} />
              <circle r="3.4" className={styles.arrived} data-arrived="" />
            </g>
            <text x={o.label.x} y={o.label.y - 9} textAnchor={o.label.anchor}>
              <tspan className={styles.bullet}>{OWNERS[j].line}</tspan>
              <tspan className={styles.role} dx="6">{OWNERS[j].role}</tspan>
            </text>
            <text className={styles.people} x={o.label.x} y={o.label.y + 7} textAnchor={o.label.anchor}>
              {OWNERS[j].owner} · deputy {OWNERS[j].deputy}
            </text>
            <text className={styles.status} x={o.label.x} y={o.label.y + 23} textAnchor={o.label.anchor} data-status="">{still.status}</text>
          </g>
        );
      })}
    </svg>
  );
}

type Els = {
  L: Layout;
  discs: Map<string, SVGGElement>;
  comets: Map<string, SVGPathElement>;
  srcHalos: SVGCircleElement[];
  hubPulse: SVGRectElement | null;
  lamp: SVGCircleElement | null;
  board: SVGGElement | null;
  b1: SVGTextElement | null;
  b2: SVGTextElement | null;
  owners: Array<{ g: SVGGElement; clock: SVGCircleElement | null; status: SVGTextElement | null; halo: SVGCircleElement | null; arrived: SVGCircleElement | null }>;
};

function collect(svg: SVGSVGElement, L: Layout): Els {
  const q = <E extends Element>(s: string) => svg.querySelector<E>(s);
  return {
    L,
    discs: new Map(Array.from(svg.querySelectorAll<SVGGElement>("[data-disc]")).map((e) => [e.dataset.disc!, e])),
    comets: new Map(Array.from(svg.querySelectorAll<SVGPathElement>("[data-comet]")).map((e) => [e.dataset.comet!, e])),
    srcHalos: Array.from(svg.querySelectorAll<SVGCircleElement>("[data-src]")),
    hubPulse: q("[data-hub-pulse]"),
    lamp: q("[data-lamp]"),
    board: q("[data-board]"),
    b1: q("[data-b1]"),
    b2: q("[data-b2]"),
    owners: Array.from(svg.querySelectorAll<SVGGElement>("[data-own]")).map((g) => ({
      g, clock: g.querySelector("[data-clock]"), status: g.querySelector("[data-status]"),
      halo: g.querySelector("[data-halo]"), arrived: g.querySelector("[data-arrived]"),
    })),
  };
}

const pulse = (el: Element | null, from: number, to: number, ms: number) =>
  el?.animate([{ transform: "scale(1)", opacity: from }, { transform: `scale(${to})`, opacity: 0 }], { duration: ms, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });

/** An owner's clock at `t` ms after the idea arrived: days left, and the state. */
function clockAt(t: number): { state: "idle" | "due" | "answered"; left: number; status: string } {
  if (t < 0) return { state: "idle", left: 0, status: "No idea waiting" };
  const passed = Math.floor(t / T.day);
  if (passed < 2) return { state: "due", left: DAYS - passed, status: passed === 0 ? "Due in 5 d" : `${DAYS - passed} d left` };
  if (t < 2 * T.day + T.hold) return { state: "answered", left: DAYS - 2, status: "Answered in 2 d" };
  return { state: "idle", left: 0, status: "No idea waiting" };
}

export function PilotDiagram({ className }: { className?: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = frame.current;
    if (!root || reduced || paused) return;
    const svgs = Array.from(root.querySelectorAll<SVGSVGElement>("svg[data-layout]"));
    const all = svgs.map((s) => collect(s, LAYOUTS.find((l) => l.key === s.dataset.layout)!));
    let clock = Number(root.dataset.clock) || 0;
    let last = 0;
    let raf = 0;
    let visible = false;
    // Where each idea was on the last frame, so a pause and play does not replay the events already passed.
    const prev = IDEAS.map((_, k) => (clock < k * T.gap ? -1 : (clock - k * T.gap) % CYCLE));
    root.dataset.live = "";

    const write = (now: number) => {
      raf = 0;
      if (!visible) return;
      clock += last ? Math.min(64, now - last) : 0;
      last = now;
      root.dataset.clock = String(Math.round(clock));
      const active = new Map<string, number>();
      const owners = OWNERS.map(() => -1);

      IDEAS.forEach((idea, k) => {
        const start = k * T.gap;
        const tau = clock < start ? -1 : (clock - start) % CYCLE;
        const p = prev[k];
        prev[k] = tau;
        if (tau >= 0 && tau < T.in) active.set(`in-${idea.from}`, ease(tau / T.in));
        else if (tau >= T.in + T.hub && tau < ARRIVE) active.set(`out-${idea.to}`, ease((tau - T.in - T.hub) / T.out));
        if (tau >= ARRIVE) owners[idea.to] = tau - ARRIVE;
        const crossed = (x: number) => tau >= x && (p < x || p > tau);
        if (tau < 0) return;
        if (crossed(0)) for (const e of all) pulse(e.srcHalos[idea.from], 0.55, 1.9, 900);
        if (crossed(T.in)) {
          for (const e of all) {
            pulse(e.hubPulse, 0.9, 1.14, 760);
            pulse(e.lamp, 1, 2.6, 600);
            if (e.b1) e.b1.textContent = idea.title.toUpperCase();
            if (e.b2) e.b2.textContent = `→ ${OWNERS[idea.to].role.toUpperCase()}`;
            e.board?.animate([{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "ease-out" });
          }
        }
        if (crossed(ARRIVE)) for (const e of all) pulse(e.owners[idea.to]?.halo ?? null, 0.7, 1.8, 900);
      });

      for (const e of all) {
        for (const [key, disc] of e.discs) {
          const p = active.get(key);
          const comet = e.comets.get(key);
          if (p === undefined) {
            disc.style.opacity = "0";
            if (comet) comet.style.opacity = "0";
            continue;
          }
          const [dir, n] = key.split("-");
          const rt = (dir === "in" ? e.L.ins : e.L.outs)[Number(n)];
          const [x, y] = pointAt(rt, p);
          disc.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
          disc.style.opacity = "1";
          if (comet) {
            comet.style.opacity = "1";
            comet.style.strokeDashoffset = (0.22 - p).toFixed(4);
          }
        }
        OWNERS.forEach((_, j) => {
          const o = e.owners[j];
          if (!o) return;
          const c = clockAt(owners[j]);
          const sig = `${c.state}:${c.left}`;
          if (o.g.dataset.sig === sig) return;
          o.g.dataset.sig = sig;
          o.g.dataset.state = c.state;
          if (o.clock) o.clock.style.strokeDashoffset = String(1 - c.left / DAYS);
          if (o.status) o.status.textContent = c.status;
        });
      }
      raf = requestAnimationFrame(write);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) { last = 0; raf = requestAnimationFrame(write); }
    }, { threshold: 0.05 });
    io.observe(root);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced, paused]);

  // Back to the still picture when motion is turned off while the page is open.
  useEffect(() => {
    const root = frame.current;
    if (!root || !reduced || root.dataset.live === undefined) return;
    delete root.dataset.live;
    root.querySelectorAll<SVGElement>("[data-disc], [data-comet], [data-clock]").forEach((el) => { el.style.cssText = ""; });
    root.querySelectorAll<SVGGElement>("[data-own]").forEach((g, i) => {
      const j = i % OWNERS.length;
      g.dataset.state = STILL[j].state;
      delete g.dataset.sig;
      const clock = g.querySelector<SVGCircleElement>("[data-clock]");
      if (clock) clock.style.strokeDashoffset = String(1 - STILL[j].left / DAYS);
      const status = g.querySelector("[data-status]");
      if (status) status.textContent = STILL[j].status;
    });
    root.querySelectorAll("[data-b1]").forEach((t) => { t.textContent = STILL_BOARD[0]; });
    root.querySelectorAll("[data-b2]").forEach((t) => { t.textContent = STILL_BOARD[1]; });
  }, [reduced]);

  return (
    <div ref={frame} className={cn(styles.frame, className)} data-paused={paused || undefined} role="img"
      aria-label="Ideas from shift teams, assembly lines and offices ride into NextUp, which names the role that owns each one. Each idea rides on to that owner, who has a deputy and 5 working days to answer.">
      <div className={styles.top} aria-hidden="true">
        <span className={styles.lineBullet}>N</span>
        <span className={styles.title}>NextUp routes every idea</span>
      </div>
      <div className={styles.stage} aria-hidden="true">
        {LAYOUTS.map((L) => <Net key={L.key} L={L} />)}
      </div>
      <div className={styles.legend} aria-hidden="true">
        <span><i className={styles.keyIdea} />An idea</span>
        <span><i className={styles.keyClock} />Its 5-day clock</span>
        <span className={styles.fine}>Demo company · fictional people</span>
      </div>
      {!reduced && (
        <button type="button" className={cn("nh-pause", styles.pause)} onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play the diagram" : "Pause the diagram"} aria-pressed={paused}>
          {paused
            ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>
            : <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" /></svg>}
        </button>
      )}
    </div>
  );
}
