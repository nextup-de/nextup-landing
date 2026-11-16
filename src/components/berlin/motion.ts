"use client";
// The Berlin line's one scroll clock. Every piece that moves with the page (the rail's train, the trains on the
// skylines, the building site) registers a job here instead of listening to scroll itself: one passive scroll
// and resize listener, one requestAnimationFrame per frame. A job reads what it needs (rects, scrollY) and
// returns a function that writes; all reads of a frame run before all writes, so no job forces a layout on
// another. Nothing here moves the page: no scroll-jacking, only reading where it is.
import { useSyncExternalStore } from "react";

type Write = () => void;
type Job = () => Write | void;

const jobs = new Set<Job>();
let frame = 0;

function run() {
  frame = 0;
  const writes: Write[] = [];
  for (const job of jobs) {
    const w = job();
    if (w) writes.push(w);
  }
  for (const w of writes) w();
}

function request() {
  if (!frame) frame = requestAnimationFrame(run);
}

/** Runs `job` on every scroll or resize frame (and once now). Returns the unsubscribe. */
export function onFrame(job: Job): () => void {
  jobs.add(job);
  if (jobs.size === 1) {
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
  }
  request();
  return () => {
    jobs.delete(job);
    if (!jobs.size) {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
    }
  };
}

/** Asks for one more frame, e.g. after the layout changed without a scroll. */
export const nudge = () => { if (typeof window !== "undefined") request(); };

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** True when the visitor asked for less motion. False on the server: the static markup is the complete picture. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);
}

/** 0 when the element's top meets the viewport's foot, 1 when its foot leaves the top. */
export function passage(r: DOMRect, vh: number): number {
  return clamp01((vh - r.top) / (vh + r.height));
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
