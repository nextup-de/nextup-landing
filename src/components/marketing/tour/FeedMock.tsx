"use client";
// Everyone's view: the feed of ideas with their covers, filtered by department. Support is one click, and the
// count is the visitor's own (this browser only).
import Image from "next/image";
import { useState } from "react";
import { FEED } from "@/features/demo/tour";
import { Avatar } from "../Avatar";
import styles from "./FeedMock.module.css";

const DEPTS = ["All", ...Array.from(new Set(FEED.map((f) => f.dept)))];
const STATUS_TONE: Record<string, string> = { Shipped: "ok", Piloting: "blue", "Under review": "amber", "Needs info": "amber" };

export function FeedMock() {
  const [dept, setDept] = useState("All");
  const [mine, setMine] = useState<string[]>([]); // ideas this visitor supported
  const shown = FEED.filter((f) => dept === "All" || f.dept === dept);

  return (
    <div className={styles.mock}>
      <div className={styles.chips} role="group" aria-label="Filter by department">
        {DEPTS.map((d) => (
          <button key={d} type="button" aria-pressed={d === dept} onClick={() => setDept(d)}>
            {d} <span>{d === "All" ? FEED.length : FEED.filter((f) => f.dept === d).length}</span>
          </button>
        ))}
      </div>
      <ul className={styles.grid}>
        {shown.map((f) => {
          const on = mine.includes(f.id);
          return (
            <li key={f.id} className={styles.card}>
              <div className={styles.cover}>
                <Image src={f.cover} alt="" fill sizes="(max-width: 760px) 90vw, 360px" />
                <span className={styles.author}><Avatar name="J. Schmidt" size={24} /> J. Schmidt · {f.dept}</span>
                <span className={styles.status} data-tone={STATUS_TONE[f.status]}>{f.status}</span>
                <span className={styles.stat}><b>{f.stat}</b>{f.hook}</span>
              </div>
              <div className={styles.foot}>
                <h4>{f.title}</h4>
                <div className={styles.actions}>
                  <button type="button" className={styles.support} aria-pressed={on} onClick={() => setMine((m) => (on ? m.filter((x) => x !== f.id) : [...m, f.id]))}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" /></svg>
                    Support <span key={on ? "on" : "off"}>{f.support + (on ? 1 : 0)}</span>
                  </button>
                  <span className={styles.comments} aria-label={`${f.comments} comments`}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2.5 3.5h9v6h-5l-3 2v-2h-1z" strokeLinejoin="round" /></svg>
                    {f.comments}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
