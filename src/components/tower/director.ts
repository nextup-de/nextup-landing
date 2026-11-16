// The director: the one owner of time for the tower scene. It turns the page's scroll position into the story's
// progress (smoothed, so the camera glides while the scrollbar stays native), asks the story for the state at
// that progress, hands it to the renderer, and pins the page's labels to their points in the scene. It also
// plays the journey by itself on request, runs the overdue scenario on a clock, and stops everything while the
// scene is off screen. Per-frame values go straight to the DOM; React only hears about the few facts in View.
import { EXAMPLES, SCREENS, anchorsFor, pathsFor, sameView, stateAt, viewAt, CHAPTERS, type Anchor, type Layout, type Paths, type View } from "@/features/tower/story";
import { clamp01, damp } from "@/features/tower/timeline";
import type { Tier } from "./engine/common";
import type { Engine, EngineInfo } from "./engine";

export type DirectorOptions = {
  root: HTMLElement;      // the tall scroll track
  stage: HTMLElement;     // the sticky screen inside it
  engine: Engine;
  labels: () => Iterable<HTMLElement>; // elements with data-anchor="<id>"
  still: boolean;         // reduced motion: no scrubbing, chapters cut
  onView: (view: View) => void;
  onFirstFrame: () => void;
};

export type Director = {
  setExample: (index: number) => void;
  setOverdue: (on: boolean) => void;
  goTo: (chapter: number) => void;
  play: () => void;
  stop: () => void;
  playing: () => boolean;
  refresh: () => void;
  stats: () => EngineInfo & { fps: number; p: number };
  dispose: () => void;
};

const TALL = "(max-width: 760px), (max-aspect-ratio: 4/5)";
const SCRUB = 6.5;        // how quickly the picture catches up with the scrollbar (per second)
const OVERDUE_S = 6.5;    // the overdue scenario plays this long
const PLAY_SCREENS_PER_S = 0.21;

export function tierOf(): Tier {
  return window.matchMedia("(max-width: 760px), (pointer: coarse)").matches ? "low" : "high";
}

export function createDirector({ root, stage, engine, labels, still, onView, onFirstFrame }: DirectorOptions): Director {
  const tall = window.matchMedia(TALL);
  let layout: Layout = tall.matches ? "tall" : "wide";
  let example = EXAMPLES[0];
  let paths: Paths = pathsFor(example);
  let anchors: Anchor[] = anchorsFor(example);
  engine.setPaths(paths);

  let top = 0, range = 1;             // the track's place on the page, measured outside the frame loop
  let p = 0, manual = 0;              // progress shown, and progress chosen by a button in still mode
  let overdue = 0, overdueTo = 0;
  let time = 12, last = 0, raf = 0, running = false, visible = true, first = true;
  let playing = false, playFrom = 0;
  let view: View | null = null;
  let fps = 60;
  const at = { x: 0, y: 0, behind: false };
  const widths = new Map<HTMLElement, number>();
  let stageW = 1, stageH = 1, stale = 2;

  function measure() {
    const r = root.getBoundingClientRect();
    top = r.top + window.scrollY;
    range = Math.max(1, root.offsetHeight - stage.offsetHeight);
    const cap = tierOf() === "low" ? 1.75 : 2, budget = tierOf() === "low" ? 2.4e6 : 4.4e6;
    const w = stage.clientWidth, h = stage.clientHeight;
    stageW = w; stageH = h; stale = 2;
    engine.resize(w, h, Math.min(cap, window.devicePixelRatio || 1, Math.sqrt(budget / Math.max(1, w * h))));
  }
  const target = () => (still ? manual : clamp01((window.scrollY - top) / range));

  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.016);
    last = now;
    fps = damp(fps, 1 / Math.max(dt, 1e-3), 2, dt);
    if (!still) time += dt;

    if (playing) {
      // Playing moves the real scrollbar, so scroll position and picture never disagree.
      playFrom += dt * PLAY_SCREENS_PER_S * (range / (SCREENS - 1));
      const end = top + CHAPTERS[CHAPTERS.length - 2].rest * range;
      window.scrollTo(0, Math.min(playFrom, end));
      if (playFrom >= end) playing = false;
    }

    const goal = target();
    p = still || first ? goal : Math.abs(goal - p) < 1e-4 ? goal : damp(p, goal, SCRUB, dt);
    // The overdue scenario belongs to the answer; scrolling away from it puts the story back on its rails.
    if (overdueTo && (p < CHAPTERS[4].from - 0.02 || p > CHAPTERS[4].to + 0.01)) overdueTo = 0;
    const step = dt / OVERDUE_S;
    overdue = still ? overdueTo : overdueTo > overdue ? Math.min(overdueTo, overdue + step) : Math.max(overdueTo, overdue - step * 3.5);

    const state = stateAt(p, { example, paths, layout, overdue });
    engine.frame(time, dt, state);

    for (const el of labels()) {
      const a = anchors.find((x) => x.id === el.dataset.anchor);
      if (!a) continue;
      engine.project(a.at, at);
      // A point just past the edge of the frame keeps its label at the edge, hanging inward, never cut off.
      at.x = Math.max(16, Math.min(at.x, stageW - 16));
      el.style.transform = `translate3d(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px, 0)`;
      // On a tall screen the words take the lower part: a label there would sit on them, so it waits.
      const behind = at.behind || (layout === "tall" && at.y > stageH * 0.52) ? "true" : "false";
      if (el.dataset.behind !== behind) el.dataset.behind = behind;
      // A chip that would run off the right edge hangs to the left of its point instead.
      const flip = at.x + 48 + (widths.get(el) ?? 220) > stageW ? "true" : "false";
      if (el.dataset.flip !== flip) el.dataset.flip = flip;
    }
    stage.style.setProperty("--p", p.toFixed(4));
    stage.style.setProperty("--day", state.day.toFixed(3));

    const next = viewAt(p, overdue);
    if (!view || !sameView(view, next)) { view = next; onView(next); stale = 2; }
    // Chips change their words with the view: read their widths once the page has drawn them, never per frame.
    if (stale > 0 && --stale === 0) for (const el of labels()) widths.set(el, (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 220);
    if (first) { first = false; onFirstFrame(); }
    if (running && visible) raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (!raf && running && visible) { last = 0; raf = requestAnimationFrame(frame); }
  }
  const onResize = () => { layout = tall.matches ? "tall" : "wide"; measure(); wake(); };
  const onVisibility = () => { visible = !document.hidden && inView; if (visible) wake(); };
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || still) return;
    engine.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };
  // Anything the visitor does with the page takes the wheel back from the autoplay.
  const onTakeover = () => { playing = false; };

  let inView = true;
  const seen = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; onVisibility(); }, { rootMargin: "10% 0px" });
  seen.observe(root);
  const sized = new ResizeObserver(onResize);
  sized.observe(stage); sized.observe(root);
  tall.addEventListener("change", onResize);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("wheel", onTakeover, { passive: true });
  window.addEventListener("touchstart", onTakeover, { passive: true });
  window.addEventListener("keydown", onTakeover);

  measure();
  running = true;
  wake();

  return {
    setExample(index) {
      example = EXAMPLES[index] ?? EXAMPLES[0];
      paths = pathsFor(example); anchors = anchorsFor(example);
      engine.setPaths(paths);
      overdueTo = 0; overdue = 0;
      wake();
    },
    setOverdue(on) { overdueTo = on ? 1 : 0; wake(); },
    goTo(chapter) {
      const c = CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, chapter))];
      playing = false;
      manual = c.rest;
      if (!still) window.scrollTo({ top: top + c.rest * range + (c.rest >= 1 ? 2 : 0), behavior: "smooth" });
      wake();
    },
    play() {
      if (still) return;
      // From the idea's first moment, unless the visitor is already further in.
      const from = top + CHAPTERS[1].from * range;
      const here = window.scrollY < from || window.scrollY > top + CHAPTERS[4].rest * range - 4 ? from : window.scrollY;
      window.scrollTo(0, here);
      playFrom = here; playing = true;
      wake();
    },
    stop() { playing = false; },
    playing: () => playing,
    refresh: onResize,
    stats: () => ({ ...engine.info(), fps, p }),
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      seen.disconnect(); sized.disconnect();
      tall.removeEventListener("change", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("wheel", onTakeover);
      window.removeEventListener("touchstart", onTakeover);
      window.removeEventListener("keydown", onTakeover);
    },
  };
}
