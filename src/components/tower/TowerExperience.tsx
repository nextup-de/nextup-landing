"use client";
// The home page's opening: a Berlin office tower at blue hour, and one idea followed through it. A tall scroll
// track with one sticky screen; the scroll position is the story's clock (features/tower/story), the scene is
// drawn with three.js (./engine, loaded after first paint), and everything a visitor reads is real HTML laid over
// it: the headline, one caption per chapter, labels pinned to floors, the chapter rail, the example chooser.
//
// Three ways it shows, by what the browser can do:
//   live     WebGL 2 and motion allowed: the scrubbed cinematic.
//   still    reduced motion or a very short screen: the same scene one screen tall, chapters cut by the rail.
//   poster   no WebGL, or before the scene is ready: a still picture, and the story as plain steps under it.
// The company, the people and the days are fictional; the routing is the product's own matcher on the demo map.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Avatar, Clock, Pill } from "@/components/product/elements";
import { ANSWERED_DAY, CHAPTERS, EXAMPLES, FLOOR, HOPS, SCREENS, TODAY_DAYS, TODAY_WORK, type View } from "@/features/tower/story";
import { cn } from "@/lib/utils/cn";
import type { Director } from "./director";
import styles from "./TowerExperience.module.css";

const STILL = "(prefers-reduced-motion: reduce), (max-height: 560px)"; // the page system unpins its scenes on the same terms (globals.css)
const FIRST: View = { chapter: 0, day: 0, hop: 0, mode: "calm", owner: false, answered: false, floors: false, late: 0 };

function onStill(cb: () => void) {
  const m = window.matchMedia(STILL);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

function canWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch { return false; }
}

type Props = { promiseDays: number; lead: string };

export function TowerExperience({ promiseDays, lead }: Props) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const director = useRef<Director | null>(null);
  const [view, setView] = useState<View>(FIRST);
  const [shows, setShows] = useState<"poster" | "live" | "none">("poster"); // "none": no WebGL here, the poster stays
  const [pick, setPick] = useState(0);
  const [overdue, setOverdue] = useState(false);
  const [playing, setPlaying] = useState(false);
  const still = useSyncExternalStore(onStill, () => window.matchMedia(STILL).matches, () => false);

  useEffect(() => {
    const el = root.current, st = stage.current, cv = canvas.current, box = labels.current;
    if (!el || !st || !cv || !box) return;
    let dead = false, off = () => {};

    async function start() {
      if (dead || !el || !st || !cv || !box) return;
      if (!canWebGL()) { setShows("none"); return; }
      try {
        const [{ createEngine }, { createDirector, tierOf }, { EXTRAS }] = await Promise.all([import("./engine"), import("./director"), import("./engine/extras")]);
        if (dead) return;
        const engine = createEngine({ canvas: cv, tier: tierOf(), examples: EXAMPLES, still }, EXTRAS);
        const tags = Array.from(box.querySelectorAll<HTMLElement>("[data-anchor]"));
        const d = createDirector({
          root: el, stage: st, engine, still, labels: () => tags,
          onView: (v) => { setView(v); setPlaying(d.playing()); if (v.late === 0 && v.chapter !== 4) setOverdue(false); },
          onFirstFrame: () => setShows("live"),
        });
        director.current = d;
        const lost = (e: Event) => { e.preventDefault(); setShows("poster"); };
        const back = () => setShows("live");
        cv.addEventListener("webglcontextlost", lost);
        cv.addEventListener("webglcontextrestored", back);
        if (process.env.NODE_ENV !== "production") (window as unknown as { __tower?: Director }).__tower = d;
        off = () => {
          cv.removeEventListener("webglcontextlost", lost);
          cv.removeEventListener("webglcontextrestored", back);
          d.dispose(); engine.dispose(); director.current = null;
        };
      } catch {
        setShows("none");
      }
    }
    // After the first paint: the words and the poster come first, the scene a moment later.
    const timer = window.setTimeout(() => void start(), 160);
    return () => {
      dead = true;
      window.clearTimeout(timer);
      off();
    };
  }, [still]);

  const ex = EXAMPLES[pick] ?? EXAMPLES[0];
  const chapter = view.chapter;
  const plain = shows === "none"; // the story as plain steps
  const late = overdue && view.late > 0;

  function choose(i: number) {
    setPick(i); setOverdue(false);
    director.current?.setExample(i);
  }
  function toggleOverdue() {
    const on = !overdue;
    setOverdue(on);
    director.current?.setOverdue(on);
  }
  function togglePlay() {
    const d = director.current;
    if (!d) return;
    if (d.playing()) { d.stop(); setPlaying(false); } else { d.play(); setPlaying(true); }
  }

  // The last chapter is the page itself: its button goes to the section that follows the scene.
  function go(i: number) {
    if (i === CHAPTERS.length - 1) document.getElementById("try")?.scrollIntoView({ behavior: still ? "auto" : "smooth" });
    else director.current?.goTo(i);
  }

  const seen = (i: number) => view.mode === "today" && view.hop > i;

  return (
    <section ref={root} id="story" className={cn("section hero", styles.tower)} data-pin="" data-shows={shows} data-still={still} data-chapter={CHAPTERS[chapter].id}
      data-mode={view.mode} style={{ "--h": SCREENS } as React.CSSProperties} aria-labelledby="tower-h">
      <div ref={stage} className={styles.stage}>
        <div className={styles.poster} aria-hidden="true" />
        <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
        <div className={styles.scrim} aria-hidden="true" />

        {/* Labels pinned to the building. Decoration for the eye: the captions say the same in words. */}
        <div ref={labels} className={styles.labels} aria-hidden="true">
          <div className={styles.label} data-anchor="sender" data-on={view.floors || (chapter === 1 && view.mode === "calm")}>
            <span className={styles.chip}><Avatar name="Night shift" tone="teal" size={22} /><span><b>{ex.from}</b><small>Floor {FLOOR.sender}</small></span></span>
          </div>
          {(["shift", "purchasing", "finance", "sender", "head"] as const).map((id, i) => id === "sender" ? null : (
            <div key={id} className={styles.label} data-anchor={id} data-kind="hop" data-on={seen(i)} data-work={HOPS[i].work ? "true" : undefined}>
              <span className={styles.chip}><span><b>{HOPS[i].where}</b><small>{HOPS[i].reason} · {HOPS[i].days} d</small></span></span>
            </div>
          ))}
          <div className={styles.label} data-anchor="owner" data-kind="owner" data-on={view.mode === "next"} data-full={view.owner}>
            <span className={styles.chip}>
              <Avatar name={ex.owner.name} size={26} />
              <span><b>{view.owner ? ex.owner.name : ex.owner.dept}</b><small>{ex.owner.role}{view.owner ? " · owner" : ""}</small></span>
              {view.owner && !late && <Pill status={view.answered ? "ok" : "clock"}>{view.answered ? "Answered" : <><Clock />{promiseDays} working days</>}</Pill>}
              {view.owner && late && <Pill status="late">No answer by day {promiseDays}</Pill>}
            </span>
          </div>
          <div className={styles.label} data-anchor="deputy" data-kind="owner" data-on={view.late > 0} data-full={view.late === 2}>
            <span className={styles.chip}>
              <Avatar name={ex.deputy.name} size={26} />
              <span><b>{ex.deputy.name}</b><small>{ex.deputy.role} · deputy</small></span>
            </span>
          </div>
        </div>

        <div className={cn("wrap", styles.words)}>
          <div className={styles.caption} data-on={chapter === 0}>
            <p className={styles.kicker}>Idea management for manufacturing plants</p>
            <h1 id="tower-h">Who owns this decision?</h1>
            <p className={styles.lead}>{lead}</p>
            <p className={styles.hint} aria-hidden="true"><i />Scroll to follow one idea through a company</p>
          </div>

          <div className={styles.caption} data-on={chapter === 1}>
            <h2>It starts with one line.</h2>
            <p className={styles.quote}>&ldquo;{ex.text}.&rdquo;</p>
            <p>{ex.from} raises it in one box. No form and no category tree.</p>
          </div>

          <div className={styles.caption} data-on={chapter === 2}>
            <h2>Today, it wanders.</h2>
            <p>From desk to desk. Not responsible. Wrong department. No time.</p>
            <p className={styles.count}>
              <b>{plain ? TODAY_DAYS : view.mode === "today" ? view.day : 0}</b>
              <span>days without an answer<small data-on={plain || view.day >= TODAY_DAYS}>{TODAY_WORK} of them were work. The rest was waiting.</small></span>
            </p>
          </div>

          <div className={styles.caption} data-on={chapter === 3}>
            <h2>NextUp names the owner.</h2>
            <p>The routing map reads it as <em>{ex.type}</em>. That is {ex.owner.name}&rsquo;s decision: {ex.owner.role}.</p>
            <p data-on={plain || view.owner} className={styles.then}>On {ex.owner.name}&rsquo;s desk on day 0. Answer owed within {promiseDays} working days. {ex.deputy.name} is the deputy.</p>
          </div>

          <div className={styles.caption} data-on={chapter === 4}>
            {late ? (
              <>
                <h2>No answer by day {promiseDays}.</h2>
                <p>The request moves to the deputy, {ex.deputy.name}. {ex.owner.name} keeps it too: either of them can answer.</p>
              </>
            ) : (
              <>
                <h2>The answer comes back.</h2>
                <p>Day {ANSWERED_DAY}: yes, do it. {ex.owner.name} decides, the sender sees the answer, and everyone could see where it was.</p>
              </>
            )}
          </div>

          {/* What a visitor can do in this chapter. Only the current chapter's controls are in the page. */}
          {!plain && (
            <div className={styles.tools}>
              {(chapter === 3 || chapter === 4) && (
                <div className={styles.picks} role="group" aria-label="Send another request through the building">
                  {EXAMPLES.map((e, i) => (
                    <button key={e.id} type="button" aria-pressed={i === pick} onClick={() => choose(i)}>{e.short}</button>
                  ))}
                </div>
              )}
              {chapter === 4 && (
                <button type="button" className={styles.what} aria-pressed={overdue} onClick={toggleOverdue}>
                  {overdue ? "Back to the answer" : "What if nobody answers?"}
                </button>
              )}
            </div>
          )}
          <p className="nh-sr" role="status">
            {chapter >= 3 && chapter <= 4 ? `Proposed owner: ${ex.owner.name}, ${ex.owner.role}. Deputy: ${ex.deputy.name}.` : ""}
            {late ? ` No answer by day ${promiseDays}: moved to the deputy, ${ex.deputy.name}.` : ""}
          </p>
        </div>

        {!plain && (
          <nav className={styles.rail} aria-label="Chapters of the story">
            {!still && (
              <button type="button" className={styles.play} onClick={togglePlay} aria-pressed={playing}
                aria-label={playing ? "Pause the story" : chapter >= 4 ? "Replay the story" : "Play the story"}>
                {playing
                  ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" /></svg>
                  : chapter >= 4
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
                    : <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>}
              </button>
            )}
            <ol>
              {CHAPTERS.map((c, i) => (
                <li key={c.id}>
                  <button type="button" aria-current={i === chapter ? "step" : undefined} aria-label={c.label} title={c.label} onClick={() => go(i)}><i aria-hidden="true" /></button>
                </li>
              ))}
            </ol>
            <span className={styles.now} aria-hidden="true">{CHAPTERS[chapter].label}</span>
          </nav>
        )}

        <p className={styles.note} data-on={chapter > 0 && chapter < 5}>A fictional company and fictional people. Days are illustrative.</p>
        <a className={styles.skip} href="#try" data-on={chapter > 0 && chapter < 5}>Skip to the product</a>
      </div>
    </section>
  );
}
