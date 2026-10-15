// LANDING. The question, answered live: the hero is the app's own raise box, routing whatever a visitor types on
// the demo company's map. Then one request both ways (the pinned scene), the product as four live screens, what
// it never measures, the pilot, questions, one ask. Everything shown runs on the demo company's data, and says so.
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { RouteDemo } from "@/components/marketing/RouteDemo";
import { WaitScene } from "@/components/marketing/WaitScene";
import { ProductTour, type TourStop } from "@/components/marketing/tour/ProductTour";
import { FAQ, PILOT_WEEK, PRINCIPLES, SITE } from "@/config/site";
import { ROUTES } from "@/features/demo/routes";
import styles from "./page.module.css";

const P = SITE.promiseDays;

// The demo company's routing map as plain rows for the hero. The story in the pinned scene follows its first row.
const MAP = ROUTES.map((r) => ({ id: r.id, type: r.type, keys: r.keys, owner: r.owner.name, role: r.owner.role, deputy: r.deputy }));
const SPEND = ROUTES[0];
const roleOf = (name: string) => ROUTES.find((r) => r.owner.name === name)?.owner.role ?? "Deputy";

// What the hero's box types by itself, one after another. Each one hits a different row of the map.
const REQUEST = "Night shift has no one who can sign a €300 parts order";
const EXAMPLES = [
  REQUEST,
  "Two apprentices have had no system login for four weeks",
  "Tolerance drift on station 7 - who owns the gauge calibration?",
];

// The strip under the hero: what a buyer asks before anything else. Each line is said in full further down.
const FACTS: readonly (readonly [IconName, string])[] = [
  ["gift", "Free five-day pilot"],
  ["plug", "Nothing to integrate"],
  ["people", "No per-person metrics"],
  ["shield", "Hosted in the EU"],
  ["doc", "A description for the works council"],
];

// One live screen per role (components/marketing/tour). Keep every body to two sentences.
// `why` is the one design reason we give a customer in the room - why the screen is this small.
const STOPS: TourStop[] = [
  { key: "mine", who: "Team member", title: "Raise it, then watch it move.",
    body: "Problem or idea, one line. NextUp names the owner and the day an answer is due, and the person who raised it sees every step after that.",
    why: "If raising a problem takes longer than complaining about it, it stays in the corridor. And if nobody hears back, nobody raises the next one." },
  { key: "inbox", who: "Team leader", title: "Answer in one click.",
    body: `Open items, the most urgent first, each with the days left on its clock. Yes, no and why, pass it on, or ask a question. Miss the ${P}-day promise and the deputy sees it too.`,
    why: "A leader's job here is to answer, not to manage a tool. Four buttons and no free-text status: an answer takes seconds, and every answer is a fact the ledger can count." },
  { key: "feed", who: "Everyone", title: "See what is moving.",
    body: "One feed for the whole company: every idea with its status, from under review to shipped. Support is one click, and the score belongs to the case, never the person.",
    why: "Waiting only shrinks when the people waiting can see it - and a score on the case, not the person, keeps it safe to raise things anonymously." },
  { key: "overview", who: "Manager", title: "Report two numbers.",
    body: `Two numbers go upward: median time to the first answer, and the share answered within the ${P}-day promise. Under them, where the waiting goes.`,
    why: "Waiting that nobody counts cannot be shortened. The ledger files every waiting day under one of four reasons, so the fix is usually a row in the map, not another meeting." },
];

// Security and the works council: each card restates something the pricing page and FAQ already promise.
const TRUST: readonly (readonly [IconName, string, string])[] = [
  ["people", "Cases, not people", PRINCIPLES[1][1]],
  ["eyeOff", "Anonymous, if you switch it on", "Raising anonymously is one switch for the whole company. The score belongs to the case, so it stays safe to raise things."],
  ["doc", "A description for the works council", "What is and is not measured, in writing, before the pilot starts."],
  ["plug", "Nothing to integrate", PRINCIPLES[0][1]],
  ["shield", "Hosted in the EU", "On servers in the EU. Your data is keyed to your company and never visible to another tenant."],
  ["export", "Export and deletion", "Export every case, event and number at any time. Deletion on request."],
];

export default function LandingPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroIn}>
          <Link href="/contact" className={styles.pill}>
            <span>Pilot</span> Five working days, free <Icon name="arrow" size={14} />
          </Link>
          <h1>{SITE.tagline}</h1>
          <p className={styles.lead}>
            Raise a problem or an idea in one box. NextUp names who owns it and when they owe an answer.
          </p>
          <RouteDemo routes={MAP} promiseDays={P} examples={EXAMPLES} />
        </div>
        <ul className={styles.facts} aria-label="In short">
          {FACTS.map(([icon, text]) => <li key={text}><Icon name={icon} size={18} />{text}</li>)}
        </ul>
      </section>

      <WaitScene
        request={`${REQUEST}.`} from="Night shift, 4-series" decision={SPEND.type} promiseDays={P}
        owner={SPEND.owner.name} ownerRole={SPEND.owner.role} deputy={SPEND.deputy} deputyRole={roleOf(SPEND.deputy)}
      />

      <section className={styles.band} id="product">
        <header className={`${styles.head} nh-reveal`}>
          <p className="nh-eyebrow">The product</p>
          <h2>One box. One inbox. One list. One ledger.</h2>
          <p className={styles.sub}>Four screens, one per role. This is a working demo on the demo company&rsquo;s data - click around; nothing leaves your browser.</p>
        </header>
        <ProductTour stops={STOPS} />
      </section>

      <section className={styles.band} id="trust">
        <header className={`${styles.head} nh-reveal`}>
          <p className="nh-eyebrow">Security and the works council</p>
          <h2>It measures cases. Never people.</h2>
          <p className={styles.sub}>What a works council and an IT department ask first, answered before the pilot starts.</p>
        </header>
        <ul className={styles.trust}>
          {TRUST.map(([icon, title, body]) => (
            <li key={title} className="nh-reveal">
              <span className={styles.trustIcon}><Icon name={icon} /></span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.band} id="pilot">
        <div className={styles.split}>
          <header className={`${styles.head} nh-reveal`}>
            <p className="nh-eyebrow">The pilot</p>
            <h2>Five working days. One department. One decision type.</h2>
          </header>
          <div className={`${styles.splitSide} nh-reveal`}>
            <p>Set up in an afternoon. The only thing to fill in is a map of decision types: fifteen rows, each with one owner and one deputy. A department head does it in twenty minutes.</p>
            <Button href="/contact" size="lg">Book a pilot</Button>
          </div>
        </div>
        <ol className={styles.week}>
          {PILOT_WEEK.map(([when, what, title]) => (
            <li key={when} className="nh-reveal">
              <span className={styles.when}>{when}</span>
              <h3>{title}</h3>
              <p>{what}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${styles.band} ${styles.faq}`} id="faq">
        <header className={`${styles.head} nh-reveal`}>
          <p className="nh-eyebrow">Questions we get</p>
          <h2>Before you ask.</h2>
          <p className={styles.sub}>More on <Link href="/pricing" className={styles.inline}>the pricing page</Link>, or write to us from <Link href="/contact" className={styles.inline}>Book a pilot</Link>.</p>
        </header>
        <div className={styles.faqList}>
          {FAQ.map(([q, a]) => (
            <details key={q} name="faq">
              <summary>
                {q}
                <span className={styles.plus} aria-hidden="true" />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={`${styles.close} nh-reveal`}>
        <p className="nh-eyebrow">Book a pilot</p>
        <h2>Which decision keeps waiting?</h2>
        <p>Tell us the one that always takes weeks. We time it with you for five working days. It is free; we ask for thirty minutes of feedback.</p>
        <div className={styles.cta}>
          <Button href="/contact" size="lg">Book a pilot</Button>
          <Button href="/pricing" variant="ghost" size="lg">See pricing</Button>
        </div>
      </section>
    </>
  );
}
