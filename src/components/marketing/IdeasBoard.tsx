"use client";
// The ideas list as the app shows it, in one window: every idea on the left with its department, the desk it is
// on and its status; the open one on the right with its stage, its owner and its history. Choosing a row opens
// it. An idea waiting for a decision can be decided here - yes, no with a reason, or handed to the deputy - and
// the list answers at once. The history is built from facts at render (the app's rule: store events, never
// sentences). Demo company, nothing leaves the browser.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Avatar, Clock, Dept, Pill, Spark, type Status, type Tone } from "@/components/product/elements";
import styles from "./IdeasBoard.module.css";

export const STAGES = ["Raise", "AI check", "Decide", "Build", "Measure"] as const;

export type BoardIdea = {
  id: string; what: string; dept: string; deptTone: Tone; since: string; late?: boolean;
  stage: number; // index into STAGES
  who: string; role: string; tone: Tone; status: Status; label: string;
  by: string; deputy: string; read: string; left?: number; // working days left on the clock, while it is open
};
type Choice = "yes" | "no" | "pass";

const AFTER: Record<Choice, { status: Status; label: string }> = {
  yes: { status: "ok", label: "Yes · project next" },
  no: { status: "new", label: "No · reason sent" },
  pass: { status: "clock", label: "With the deputy" },
};

export function IdeasBoard({ ideas, promiseDays }: { ideas: BoardIdea[]; promiseDays: number }) {
  const [open, setOpen] = useState(ideas[1]?.id ?? ideas[0]?.id);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const idea = ideas.find((i) => i.id === open) ?? ideas[0];
  const choice = choices[idea.id];
  const desk = choice === "pass" ? idea.deputy : idea.who;
  // The button pressed gives way to Undo (or Undo to the three answers): focus moves to what took its place.
  const actions = useRef<HTMLDivElement>(null);
  const decided = useRef(false);
  const decide = (c: Choice | null) => {
    decided.current = true;
    setChoices((all) => {
      const next = { ...all };
      if (c) next[idea.id] = c; else delete next[idea.id];
      return next;
    });
  };
  useEffect(() => {
    if (!decided.current) return;
    decided.current = false;
    actions.current?.querySelector("button")?.focus();
  }, [choice]);

  // The history: one line per fact, newest last.
  const history: Array<[string, string]> = [[`${idea.since === "Today" ? "Today" : `${idea.since} ago`}`, `Raised by ${idea.by}`]];
  if (idea.stage >= 1) history.push(["", `AI check: ${idea.stage === 1 ? "the coach is asking a question" : "read, suggestion attached"}`]);
  if (idea.stage >= 2) history.push(["", `On ${idea.who}'s desk. Answer owed within ${promiseDays} working days`]);
  if (idea.stage >= 3) history.push(["", `Yes. A project, lead ${idea.who}`]);
  if (idea.stage >= 4) history.push(["", "Result measured 14 days after launch"]);
  if (choice === "yes") history.push(["Now", `Yes, start it. Decided by ${idea.who}`]);
  if (choice === "no") history.push(["Now", `No, with a reason. ${idea.by} can read why`]);
  if (choice === "pass") history.push(["Now", `Handed over to ${idea.deputy}, the deputy. The clock keeps running`]);

  return (
    <div className={styles.window} data-ui="ideas">
      <div className={styles.bar} aria-hidden="true">
        <Image src="/brand/nextup-logo-white.png" alt="" width={494} height={212} />
        <span className={styles.tabs}>{["Ideas", "Inbox", "Feed", "Projects", "Dashboard"].map((t) => <span key={t} data-on={t === "Ideas"}>{t}</span>)}</span>
        <span className={styles.me}>ND</span>
      </div>

      <div className={styles.panes}>
        <div className={styles.list}>
          <p className={styles.listHead}><span>All ideas · {ideas.length} open</span><span>On whose desk</span></p>
          <ul>
            {ideas.map((i) => {
              const c = choices[i.id];
              const pill = c ? AFTER[c] : { status: i.status, label: i.label };
              return (
                <li key={i.id}>
                  <button type="button" className={styles.row} aria-current={i.id === idea.id ? "true" : undefined} onClick={() => setOpen(i.id)}>
                    <span className={styles.what}>
                      <strong>{i.what}</strong>
                      <span><Dept tone={i.deptTone}>{i.dept}</Dept><small data-late={i.late && !c ? "true" : undefined}>{i.since}</small></span>
                    </span>
                    <Avatar name={c === "pass" ? i.deputy : i.who} tone={c === "pass" ? undefined : i.tone} size={28} />
                    <Pill status={pill.status}>{pill.label}</Pill>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <article className={styles.open} aria-live="polite">
          <div className={styles.openHead}>
            <p className={styles.meta}><Dept tone={idea.deptTone}>{idea.dept}</Dept><span>{idea.id}</span><span>Open {idea.since === "Today" ? "since today" : `for ${idea.since}`}</span></p>
            <h3>{idea.what}</h3>
            <p className={styles.by}><Avatar name={idea.by} size={20} />Raised by {idea.by}</p>
          </div>

          <ol className={styles.rail} aria-label="Stage">
            {STAGES.map((s, n) => (
              <li key={s} data-state={n < idea.stage || (n === idea.stage && choice === "yes") ? "done" : n === idea.stage ? "now" : "open"}>{s}</li>
            ))}
          </ol>

          <div className={styles.cols}>
            <div className={styles.owner}>
              <span className={styles.label}>On whose desk</span>
              <span className={styles.person}>
                <Avatar name={desk} tone={choice === "pass" ? undefined : idea.tone} size={36} />
                <span><strong>{desk}</strong><small>{choice === "pass" ? "Deputy" : idea.role}</small></span>
              </span>
              {idea.stage === 2 && !choice
                ? <Pill status={idea.late ? "late" : "clock"}><Clock />{idea.late ? "Answer is late" : `${idea.left ?? promiseDays} d left of ${promiseDays}`}</Pill>
                : <Pill status={(choice ? AFTER[choice] : idea).status}>{(choice ? AFTER[choice] : idea).label}</Pill>}
            </div>
            <div className={styles.read}>
              <span className={styles.label}><Spark size={12} />AI read · a suggestion, not a decision</span>
              <p>{idea.read}</p>
            </div>
          </div>

          <ol className={styles.history}>
            {history.map(([when, what], n) => <li key={n} data-now={when === "Now" ? "true" : undefined}><span>{when}</span>{what}</li>)}
          </ol>

          {idea.stage === 2 && (
            <div className={styles.actions} ref={actions}>
              {choice
                ? <button type="button" className={styles.undo} onClick={() => decide(null)}>Undo the decision</button>
                : <>
                  <button type="button" data-kind="yes" onClick={() => decide("yes")}>Yes, start it</button>
                  <button type="button" data-kind="no" onClick={() => decide("no")}>No, with a reason</button>
                  <button type="button" data-kind="pass" onClick={() => decide("pass")}>Hand over</button>
                </>}
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
