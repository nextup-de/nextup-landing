"use client";
// The team leader's inbox, live: the demo company's open cases on T. Vogel's desk, the most urgent first. Answer
// one in one click and it leaves the desk; move a day forward and every clock runs - past day 5 the deputy sees
// it too. Everything stays in this browser.
import { useEffect, useRef, useState } from "react";
import { INBOX, INBOX_DEPUTY, INBOX_MEDIAN, INBOX_WITHIN, NO_REASONS, type InboxCase } from "@/features/demo/tour";
import { Avatar } from "../Avatar";
import styles from "./InboxMock.module.css";

const TOAST_MS = 3400;
const badge = (d: number) => (d > 0 ? `${d} d left` : d === 0 ? "due today" : `${-d} d late`);
const tone = (d: number) => (d >= 2 ? "calm" : d >= 0 ? "near" : "late");
const sender = (c: InboxCase) => (c.from.startsWith("Anonymous") ? "The sender" : c.from);
const short = (t: string) => (t.length > 38 ? t.slice(0, 36).trimEnd() + "…" : t);

export function InboxMock({ onCount }: { onCount?: (n: number) => void }) {
  const [cases, setCases] = useState(INBOX);
  const [sel, setSel] = useState<string | null>(INBOX[1].id);
  const [asked, setAsked] = useState<string[]>([]);
  const [within, setWithin] = useState(INBOX_WITHIN);
  const [day, setDay] = useState(0);
  const [choosing, setChoosing] = useState(false); // "No, and why" shows its reasons
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const sorted = [...cases].sort((a, b) => a.daysLeft - b.daysLeft);
  const open = cases.find((c) => c.id === sel) ?? null;
  const late = cases.filter((c) => c.daysLeft < 0).length;

  function say(text: string) {
    if (timer.current) clearTimeout(timer.current);
    setToast((t) => ({ id: (t?.id ?? 0) + 1, text })); // a new id restarts the toast's entrance
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }
  function answer(c: InboxCase, text: string) {
    const rest = cases.filter((x) => x.id !== c.id);
    setCases(rest);
    setWithin(([n, t]) => [n + (c.daysLeft >= 0 ? 1 : 0), t + 1] as const);
    setSel([...rest].sort((a, b) => a.daysLeft - b.daysLeft)[0]?.id ?? null);
    setChoosing(false);
    onCount?.(rest.length);
    say(text);
  }
  function nextDay() {
    const next = cases.map((c) => ({ ...c, daysLeft: c.daysLeft - 1 }));
    const crossed = next.find((c) => c.daysLeft === -1);
    setCases(next);
    setDay((d) => d + 1);
    say(crossed ? `Day 5 passed on “${short(crossed.title)}”. ${INBOX_DEPUTY} sees it too now.` : "A day later: every clock moved on by one.");
  }
  function reset() {
    setCases(INBOX); setSel(INBOX[1].id); setAsked([]); setWithin(INBOX_WITHIN); setDay(0); setChoosing(false); setToast(null);
    onCount?.(INBOX.length);
  }

  return (
    <div className={styles.mock}>
      <div className={styles.stats}>
        <div><strong>{cases.length}</strong><span>on your desk</span></div>
        <div data-late={late ? "true" : undefined}><strong>{late}</strong><span>past the 5-day promise</span></div>
        <div><strong>{INBOX_MEDIAN}</strong><span>median time to answer</span></div>
        <div><strong>{within[0]} / {within[1]}</strong><span>within the promise</span></div>
      </div>

      <div className={styles.body}>
        <div className={styles.list}>
          <div className={styles.listHead}>
            <span>{day ? `Today + ${day} ${day === 1 ? "day" : "days"}` : "Today"}</span>
            <button type="button" className={styles.tick} onClick={nextDay} disabled={!cases.length}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="7" r="5.5" /><path d="M7 4v3l2 1.5" /></svg>
              Move a day forward
            </button>
          </div>
          {sorted.length ? (
            <ul>
              {sorted.map((c) => (
                <li key={c.id}>
                  <button type="button" className={styles.row} aria-current={c.id === sel ? "true" : undefined} onClick={() => { setSel(c.id); setChoosing(false); }}>
                    <Avatar name={c.from} size={28} />
                    <span className={styles.rowText}>
                      <b>{c.title}</b>
                      <small>{c.from} · {c.dept}{asked.includes(c.id) ? " · question sent" : ""}</small>
                    </span>
                    <span className={styles.badge} data-tone={tone(c.daysLeft)}>{badge(c.daysLeft)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <b>Nothing is waiting on you.</b>
              <span>Every answer is a line in the ledger now.</span>
              <button type="button" className={styles.reset} onClick={reset}>Reset the demo</button>
            </div>
          )}
        </div>

        <div className={styles.detail}>
          {open ? (
            <div className={styles.case} key={open.id}>
              <span className={styles.eyebrow}>Selected case</span>
              <h4>{open.title}</h4>
              <p className={styles.from}>{open.from} · {open.dept}</p>
              <blockquote>{open.body}</blockquote>
              <dl className={styles.facts}>
                <div><dt>What it is worth</dt><dd>{open.upside}</dd></div>
                <div><dt>Owner</dt><dd>You · deputy {INBOX_DEPUTY}</dd></div>
              </dl>
              {open.daysLeft < 0 && <p className={styles.lateNote}>Past the promise: {INBOX_DEPUTY} sees it too.</p>}
              <span className={styles.eyebrow}>Your move</span>
              {choosing ? (
                <div className={styles.reasons}>
                  {NO_REASONS.map((r) => (
                    <button key={r} type="button" onClick={() => answer(open, `Answered: no - “${r}”. ${sender(open)} sees why.`)}>{r}</button>
                  ))}
                  <button type="button" className={styles.back} onClick={() => setChoosing(false)}>Back</button>
                </div>
              ) : (
                <div className={styles.moves}>
                  <button type="button" data-kind="blue" onClick={() => answer(open, `Answered: yes. ${sender(open)} sees it now.`)}>Yes, do it</button>
                  <button type="button" onClick={() => setChoosing(true)}>No, and why</button>
                  <button type="button" data-kind="blue" onClick={() => answer(open, `Passed to ${INBOX_DEPUTY}. It left your desk.`)}>Pass to {INBOX_DEPUTY}</button>
                  <button type="button" onClick={() => { setAsked((a) => (a.includes(open.id) ? a : [...a, open.id])); say(`Question sent to ${sender(open) === "The sender" ? "the sender" : open.from}.`); }}>Ask a question</button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.idle}>Pick a case on the left.</div>
          )}
        </div>
      </div>

      <div className={styles.toastSlot} aria-live="polite">
        {toast && <p className={styles.toast} key={toast.id}>{toast.text}</p>}
      </div>
    </div>
  );
}
