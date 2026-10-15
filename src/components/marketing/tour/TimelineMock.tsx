"use client";
// The team member's view: what happened to what I sent. One real case from the demo seed, its events in order -
// raised, read, answered, built, shipped - played one after another the first time the screen is in view.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MINE } from "@/features/demo/tour";
import { Avatar } from "../Avatar";
import styles from "./TimelineMock.module.css";

const STEP_MS = 650;

export function TimelineMock() {
  const root = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  const [run, setRun] = useState(0); // bumping it plays the steps again

  // Wait until the screen is actually on screen (the tab may open below the fold), then play the steps.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const play = (n: number) => {
      setShown(n);
      if (n < MINE.steps.length) timer = setTimeout(() => play(n + 1), STEP_MS);
    };
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setTimeout(() => setShown(MINE.steps.length), 0);
      else timer = setTimeout(() => play(1), 250);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); if (timer) clearTimeout(timer); };
  }, [run]);

  const done = shown >= MINE.steps.length;
  return (
    <div className={styles.mock} ref={root}>
      <div className={styles.case}>
        <div className={styles.thumb}><Image src={MINE.cover} alt="" fill sizes="160px" /></div>
        <div className={styles.caseText}>
          <span className={styles.eyebrow}>What happened to what you sent</span>
          <h4>{MINE.title}</h4>
          <span className={styles.meta}>
            <Avatar name={MINE.from} size={24} /> You · {MINE.dept}
            <span className={styles.status} data-done={done ? "true" : undefined}>{done ? "Shipped" : MINE.steps[Math.max(0, shown - 1)].what.split(" ·")[0]}</span>
          </span>
        </div>
      </div>
      <ol className={styles.steps}>
        {MINE.steps.map((s, i) => (
          <li key={s.day} data-on={i < shown ? "true" : undefined} data-last={i === MINE.steps.length - 1 ? "true" : undefined}>
            <span className={styles.day}>Day {s.day}</span>
            <span className={styles.node} aria-hidden="true" />
            <div className={styles.text}>
              <b>{s.what}</b>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className={styles.foot}>
        <span>Every step is an event. Nothing is edited, so nothing is lost.</span>
        <button type="button" onClick={() => { setShown(0); setRun((r) => r + 1); }} disabled={!done}>Play again</button>
      </div>
    </div>
  );
}
