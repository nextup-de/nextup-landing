"use client";
// The product tour: one live screen per role, in a window drawn like the app. The tabs and the app's own nav
// both switch screens, and every screen keeps its state while another is shown.
import Image from "next/image";
import { useState } from "react";
import { INBOX } from "@/features/demo/tour";
import { Avatar } from "../Avatar";
import { FeedMock } from "./FeedMock";
import { InboxMock } from "./InboxMock";
import { OverviewMock } from "./OverviewMock";
import { TimelineMock } from "./TimelineMock";
import styles from "./ProductTour.module.css";

export type StopKey = "mine" | "inbox" | "feed" | "overview";
export type TourStop = { key: StopKey; who: string; title: string; body: string; why: string };

const NAV: readonly (readonly [StopKey, string])[] = [["mine", "Ideas"], ["inbox", "Inbox"], ["feed", "Feed"], ["overview", "Overview"]];
const PERSONA: Record<StopKey, string> = { mine: "J. Schmidt", inbox: "T. Vogel", feed: "J. Schmidt", overview: "B. Hartmann" };

export function ProductTour({ stops }: { stops: TourStop[] }) {
  const [on, setOn] = useState<StopKey>("inbox");
  const [count, setCount] = useState(INBOX.length); // the inbox's own count, shown on its nav item
  const stop = stops.find((s) => s.key === on) ?? stops[0];

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = (stops.findIndex((s) => s.key === on) + step + stops.length) % stops.length;
    setOn(stops[i].key);
    e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")[i]?.focus();
  }

  return (
    <div className={styles.tour}>
      <div className={styles.side}>
        <div className={styles.tabs} role="tablist" aria-label="The product, by role" aria-orientation="vertical" onKeyDown={onKeyDown}>
          {stops.map((s, i) => (
            <button
              key={s.key} type="button" role="tab" id={`tour-tab-${s.key}`} aria-controls="tour-panel"
              aria-selected={s.key === on} tabIndex={s.key === on ? 0 : -1} className={styles.tab} onClick={() => setOn(s.key)}
            >
              <span className={styles.who}>{i + 1} · {s.who}</span>
              <span className={styles.title}>{s.title}</span>
              <span className={styles.body}>{s.body}</span>
            </button>
          ))}
        </div>
        <div className={styles.detail} key={stop.key}>
          <p className={styles.lede}>{stop.body}</p>
          <p className={styles.why}><span className="nh-eyebrow">Why it is this small</span>{stop.why}</p>
        </div>
      </div>

      <div className={styles.window}>
        <div className={styles.bar}>
          <Image className={styles.logo} src="/brand/nextup-logo-blue.png" alt="" width={506} height={224} />
          <div className={styles.nav} aria-hidden="true">
            {NAV.map(([k, label]) => (
              <button key={k} type="button" tabIndex={-1} data-on={k === on ? "true" : undefined} onClick={() => setOn(k)}>
                {label}{k === "inbox" && count > 0 && <i>{count}</i>}
              </button>
            ))}
          </div>
          <Avatar name={PERSONA[on]} size={28} className={styles.me} />
        </div>
        <div className={styles.screen} role="tabpanel" id="tour-panel" aria-labelledby={`tour-tab-${on}`}>
          <div hidden={on !== "mine"} className={styles.pane}><TimelineMock /></div>
          <div hidden={on !== "inbox"} className={styles.pane}><InboxMock onCount={setCount} /></div>
          <div hidden={on !== "feed"} className={styles.pane}><FeedMock /></div>
          <div hidden={on !== "overview"} className={styles.pane}><OverviewMock /></div>
        </div>
      </div>
    </div>
  );
}
