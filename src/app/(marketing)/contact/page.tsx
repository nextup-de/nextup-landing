// CONTACT / book a pilot (Paper: 05 · Contact). The ask and the three pilot phases on the left, the form on the right.
import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/ContactForm";
import { LEGAL, PILOT_PHASES } from "@/config/site";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Book a pilot",
  description: "Tell us which decision keeps waiting. We scope a paid pilot around it and build NextUp into a ready solution with you.",
};

const LABELS = ["Scope", "Build with you", "Run"];

export default function ContactPage() {
  return (
    <section className={styles.wrap}>
      <div className={styles.intro}>
        <p className="nh-eyebrow">Book a pilot</p>
        <h1>Tell us the decision that keeps waiting.</h1>
        <p className={styles.lead}>We scope a paid pilot around it and build NextUp into a ready solution with you.</p>
        <ol className={styles.track} aria-label="The three phases of a pilot">
          {PILOT_PHASES.map(([phase], i) => <li key={phase} data-phase={i}><i aria-hidden="true" />{LABELS[i]}</li>)}
        </ol>
      </div>

      <div className={styles.card}>
        <h2 className="nh-sr">Request a pilot</h2>
        <ContactForm to={LEGAL.email} />
      </div>
    </section>
  );
}
