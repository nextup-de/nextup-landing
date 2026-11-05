// PRICING (Paper: 04 · Pricing). Priced per seat; no prices are set yet. A paid pilot first, then seats.
// Nothing on this page states a number until the first pilots have closed.
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { SeatQuote } from "@/components/marketing/SeatQuote";
import { Avatar, Pill, type Tone } from "@/components/product/elements";
import { FAQ } from "@/config/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description: "NextUp is priced per seat. Start as a pilot partner; per-seat prices follow after the first pilots.",
};

const SEATS: Array<[string, Tone]> = [["N. Demir", "blue"], ["T. Vogel", "green"], ["A. Schulz", "amber"], ["M. Hoffmann", "violet"], ["K. Yilmaz", "teal"], ["J. Schmidt", "pink"]];

export default function PricingPage() {
  return (
    <div className={styles.page}>
      <section className={styles.head}>
        <div>
          <p className="nh-eyebrow">Pricing</p>
          <h1>Priced per seat.</h1>
        </div>
        <p className={styles.lead}>
          Start as a pilot partner: your company invests, and we build NextUp into a ready solution with you. Per-seat prices follow.
        </p>
      </section>

      <section className={styles.plans} aria-label="Plans">
        <div className={styles.row}>
          <article className={styles.pilot}>
            <div className={styles.top}>
              <p className={styles.kicker}>Start here · Pilot partner</p>
              <h2 className={styles.price}>Paid pilot</h2>
              <p className={styles.per}>scope and price by agreement</p>
            </div>
            <p className={styles.planLead}>Your company invests in the pilot. Together we build NextUp into a solution that is ready for your plant.</p>
            <ul className={styles.items}>
              <li>Scope and price agreed before we start</li>
              <li>Built with your departments and your routing</li>
              <li>Per-seat pricing once it runs</li>
            </ul>
            <Button href="/contact" variant="white" block>Book a pilot</Button>
          </article>

          <article className={styles.seat}>
            <div className={styles.seatTop}>
              <div className={styles.top}>
                <p className={styles.kicker}>After the pilot · Company</p>
                <h2 className={styles.price}>Per seat</h2>
                <p className={styles.per}>per month · price on request</p>
              </div>
              <Pill status="clock">Prices in progress</Pill>
            </div>
            <div className={styles.seats}>
              <span className={styles.faces} aria-hidden="true">
                {SEATS.map(([name, tone]) => <Avatar key={name} name={name} tone={tone} size={38} />)}
              </span>
              <p>One seat for each person who uses NextUp. Add and remove seats as teams change.</p>
            </div>
            <ul className={`${styles.items} ${styles.two}`}>
              <li>Ideas, Inbox, Projects and Dashboard</li>
              <li>Hosting in the EU</li>
              <li>Every department, one list</li>
              <li>E-mail support</li>
            </ul>
            <SeatQuote />
          </article>
        </div>

        <article className={styles.group}>
          <p><strong>Several companies or sites</strong><span>Each with its own data and routing table. Single sign-on.</span></p>
          <Button href="/contact" variant="ghost">Contact us</Button>
        </article>
      </section>
      <p className={`${styles.fine} nh-mono`}>No prices are set yet. Per-seat prices follow after the first pilots.</p>

      <section className={styles.faq}>
        <h2>Questions before a pilot</h2>
        <div>
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}<i aria-hidden="true" /></summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
