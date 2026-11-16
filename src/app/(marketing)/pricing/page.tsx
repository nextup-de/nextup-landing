// PRICING. Priced per seat; no prices are set yet. A paid pilot first, then seats. Nothing on this page states a
// number until the first pilots have closed. Drawn in the Berlin line's language, on the drifting ground:
// - the head, then the fare line (FareLine: the pilot's three phases, then the change to per-seat pricing);
// - the pilot as the page's one dark board, the seats beside it, several companies as parallel lines;
// - the questions before a pilot (id "questions", the landing's objections link here) as an accordion (FaqList).
import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, Button } from "@/components/ui/Button";
import { FaqList } from "@/components/marketing/FaqList";
import { SeatQuote } from "@/components/marketing/SeatQuote";
import { Avatar, Pill, type Tone } from "@/components/product/elements";
import { FAQ, HOSTING_PLACE } from "@/config/site";
import { FareLine } from "./FareLine";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description: "NextUp is priced per seat. Start as a pilot partner; per-seat prices follow after the first pilots.",
};

const SEATS: Array<[string, Tone]> = [["N. Demir", "blue"], ["T. Vogel", "green"], ["A. Schulz", "amber"], ["M. Hoffmann", "violet"], ["K. Yilmaz", "teal"], ["J. Schmidt", "pink"]];

export default function PricingPage() {
  return (
    <div className={styles.page}>
      <section className={styles.top} aria-labelledby="pricing-h">
        <div className="wrap">
          <header className={styles.head}>
            <div>
              <p className={styles.eyebrow}><i aria-hidden="true">N</i>Pricing</p>
              <h1 id="pricing-h">Priced per seat.</h1>
            </div>
            <p className={styles.lead}>
              Start as a pilot partner: your company invests, and we build NextUp into a ready solution with you. Per-seat prices follow.
            </p>
          </header>

          <FareLine />

          <div className={styles.plans} aria-label="Plans" role="group">
            <article className={styles.pilot}>
              <p className={styles.boardHead}>
                <span><i aria-hidden="true" />Start here · Pilot partner</span>
                <span aria-hidden="true">Phase 1–3</span>
              </p>
              <div className={styles.top2}>
                <h2 className={styles.price}>Paid pilot</h2>
                <p className={styles.per}>Scope and price by agreement</p>
              </div>
              <p className={styles.planLead}>Your company invests in the pilot. Together we build NextUp into a solution that is ready for your plant.</p>
              <ul className={styles.stops}>
                <li>Scope and price agreed before we start</li>
                <li>Built with your departments and your routing</li>
                <li>Per-seat pricing once it runs</li>
              </ul>
              <Button href="/contact" variant="white" size="lg" block>Book a pilot<Arrow /></Button>
            </article>

            <article className={styles.seat}>
              <div className={styles.seatTop}>
                <div className={styles.top2}>
                  <p className={styles.kicker}>After the pilot · Company</p>
                  <h2 className={styles.price}>Per seat</h2>
                  <p className={styles.per}>Per month · price on request</p>
                </div>
                <Pill status="clock">Prices in progress</Pill>
              </div>
              <div className={styles.seats}>
                <span className={styles.faces} aria-hidden="true">
                  {SEATS.map(([name, tone]) => <Avatar key={name} name={name} tone={tone} size={38} />)}
                </span>
                <p>One seat for each person who uses NextUp. Add and remove seats as teams change.</p>
              </div>
              <ul className={styles.ticks}>
                <li>Ideas, Inbox, Projects and Dashboard</li>
                <li>Hosted in {HOSTING_PLACE}</li>
                <li>Every department, one list</li>
                <li>E-mail support</li>
              </ul>
              <SeatQuote />
            </article>

            <article className={styles.group}>
              <svg className={styles.lines} viewBox="0 0 96 48" aria-hidden="true">
                <g><path d="M4 10H92" /><circle cx="24" cy="10" r="4" /><circle cx="60" cy="10" r="4" /></g>
                <g><path d="M4 24H92" /><circle cx="40" cy="24" r="4" /><circle cx="76" cy="24" r="4" /></g>
                <g><path d="M4 38H92" /><circle cx="18" cy="38" r="4" /><circle cx="54" cy="38" r="4" /></g>
              </svg>
              <p><strong>Several companies or sites</strong><span>Each with its own data and routing table. Single sign-on.</span></p>
              <Button href="/contact" variant="ghost">Contact us</Button>
            </article>
          </div>
          <p className={styles.fine}>No prices are set yet. Per-seat prices follow after the first pilots.</p>
        </div>
      </section>

      <section id="questions" className={styles.faq} aria-labelledby="questions-h">
        <div className={`wrap ${styles.faqIn}`}>
          <div className={styles.faqHead}>
            <p className={styles.eyebrow}><i aria-hidden="true">?</i>Pilot questions</p>
            <h2 id="questions-h">Questions before a pilot</h2>
            <p>What a seat is, what a pilot is, and what it needs from your plant. Anything else, ask us.</p>
            <Link className={styles.ask} href="/contact">Ask a question<Arrow /></Link>
          </div>
          <FaqList items={FAQ} />
        </div>
      </section>
    </div>
  );
}
