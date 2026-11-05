"use client";
// "Tell us how many people. We answer with a price." A seat count and one button; the count is carried to
// /contact in this tab's session storage (never in the address) and stands in the form's message.
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SeatQuote.module.css";

export const CARRIED_SEATS = "nextup.seats";
const STEP = 50, MIN = 1, MAX = 100000;

export function SeatQuote() {
  const id = useId();
  const router = useRouter();
  const [seats, setSeats] = useState(250);
  const clamp = (n: number) => Math.min(MAX, Math.max(MIN, Math.round(n) || MIN));

  return (
    <form className={styles.quote} onSubmit={(e) => {
      e.preventDefault();
      try { window.sessionStorage.setItem(CARRIED_SEATS, String(seats)); } catch { /* private mode: the form opens empty */ }
      router.push("/contact");
    }}>
      <div className={styles.count}>
        <label className="nh-sr" htmlFor={id}>Number of seats</label>
        <input id={id} type="number" inputMode="numeric" min={MIN} max={MAX} value={seats} onChange={(e) => setSeats(clamp(Number(e.target.value)))} />
        <span aria-hidden="true">seats</span>
        <button type="button" aria-label={`${STEP} seats fewer`} onClick={() => setSeats((n) => clamp(n - STEP))}>−</button>
        <button type="button" aria-label={`${STEP} seats more`} onClick={() => setSeats((n) => clamp(n + STEP))}>+</button>
      </div>
      <button type="submit" className="nh-btn nh-btn-tint">Get a quote</button>
      <p>Tell us how many people. We answer with a price.</p>
    </form>
  );
}
