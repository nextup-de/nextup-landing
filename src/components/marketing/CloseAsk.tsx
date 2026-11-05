"use client";
// The closing ask: the raise box again, now for the visitor's own decision. What they type is carried to
// /contact in this tab's session storage (never in the address) and stands in the form when it opens.
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Arrow } from "@/components/ui/Button";
import styles from "./CloseAsk.module.css";

export const CARRIED_DECISION = "nextup.decision";

export function CloseAsk() {
  const id = useId();
  const router = useRouter();
  const [text, setText] = useState("");

  return (
    <form className={styles.box} onSubmit={(e) => {
      e.preventDefault();
      try { if (text.trim()) window.sessionStorage.setItem(CARRIED_DECISION, text.trim().slice(0, 160)); } catch { /* private mode: the form opens empty */ }
      router.push("/contact");
    }}>
      <label className="nh-sr" htmlFor={id}>The decision that keeps waiting</label>
      <input id={id} name="decision" autoComplete="off" className={styles.input} type="text" maxLength={160} value={text} placeholder="The decision that always takes weeks…"
        onChange={(e) => setText(e.target.value)} />
      <button type="submit" className="btn nh-btn nh-btn-primary nh-btn-lg">Book a pilot<Arrow /></button>
    </form>
  );
}
