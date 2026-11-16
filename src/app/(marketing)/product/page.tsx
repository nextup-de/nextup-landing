// PRODUCT. The software itself, one interchange away from the landing's story. Deliberately calm: a calm rail with
// no train, one moving skyline strip, and real product UI with the fictional demo company.
//   try       the head (one box, one owner, one clock) and the raise box, routing what a visitor types
//   ideas     every idea and whose desk it is on, in one app window; the stages above it as a line
//   steps     the five steps as tabs, each with its screen (ProductStory)
//   rules     the five rules the product keeps, five stops on one line (RulesBento)
//   security  where the data lives: one place, every company on its own line, and the sheet as a stop list
//   pilot     the pilot's three phases and what it builds (PilotDiagram)
// The close and the footer follow (SiteFooter: "Book a pilot for your plant", CloseAsk only).
import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCT_STATIONS } from "@/components/berlin/line";
import { LineRail } from "@/components/berlin/LineRail";
import { SkylineStrip } from "@/components/berlin/SkylineStrip";
import { IdeasBoard } from "@/components/marketing/IdeasBoard";
import { PilotDiagram } from "@/components/marketing/PilotDiagram";
import { ProductStory } from "@/components/marketing/ProductStory";
import { RouteDemo } from "@/components/marketing/RouteDemo";
import { RulesBento } from "@/components/marketing/RulesBento";
import { Arrow, Button } from "@/components/ui/Button";
import { HOSTING_PLACE, LEGAL, SITE } from "@/config/site";
import { IDEAS, MAP, RAISE_EXAMPLES } from "@/features/demo/showcase";
import { cn } from "@/lib/utils/cn";
import { DataStops, Separation } from "./DataPlace";
import { PhaseLine } from "./PhaseLine";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Product",
  description: "The NextUp software: one box to raise a problem, an owner and a date for every decision, and one list of what is waiting on whom. Shown with a fictional demo company.",
};

const P = SITE.promiseDays;

// How many of the demo company's ideas stand at each stage: the line above the ideas window. The names are
// IdeasBoard's STAGES; they are written out here because a server page cannot read a value from a client module.
const STAGES = ["Raise", "AI check", "Decide", "Build", "Measure"] as const;
const AT_STAGE = STAGES.map((_, n) => IDEAS.filter((i) => i.stage === n).length);

// The spec sheet under "Where your data lives". Wording from FAQ and the rules only; no certifications are named.
// The hosting row shows only once LEGAL names a hosting provider (HOSTING_PLACE follows LEGAL.hosting).
const SHEET: Array<[string, string]> = [
  ...(LEGAL.hosting ? [["Hosting", `On servers in ${HOSTING_PLACE}. The privacy policy names the provider.`] as [string, string]] : []),
  ["Separation", "Each company runs its own NextUp at its own address. Your data is never visible to another company."],
  ["Your systems", "Nothing to connect to start. Single sign-on and other connections are agreed in the pilot scope."],
  ["AI", "It suggests and asks. Every answer comes from a person, with their name on it."],
  ["Works council", "Part of the pilot scope from the first conversation: what is visible, and to whom."],
  ["This website", "No cookies, no tracking, fonts served from this site."],
];

export default function ProductPage() {
  return (
    <>
      <LineRail stations={PRODUCT_STATIONS} train={false} tone="calm" />

      {/* The head: what the product is, in three stops, and the raise box beside it. */}
      <section className={cn("section hero", styles.hero)} id="try" aria-labelledby="try-h">
        <div className="wrap"><div className={styles.heroGrid}>
          <div className={styles.heroText}>
            <Link className={cn("nh-link", styles.back)} href="/#ring">New here? Why decisions wait <span aria-hidden="true">→</span></Link>
            <div className={styles.titles}>
              <p className="nh-eyebrow">Product</p>
              <h1 id="try-h" className={styles.h1}>
                <span>One box.</span> <span>One owner.</span> <span>One clock.</span>
              </h1>
            </div>
            <p className={styles.lead}>
              Raise a problem or an idea in one line. NextUp names who owns it, gives them {P} working days to answer and shows everyone what is waiting on whom.
            </p>
            <p className={styles.try}>
              Type something that is stuck at work. The box reads it against the demo company&rsquo;s routing map and names the owner, the date and the deputy. Nothing you type leaves your browser.
            </p>
            <div className={styles.actions}>
              <Button href="#steps" variant="tint" size="lg">See the five steps<Arrow /></Button>
            </div>
            <p className={cn("nh-mono", styles.small)}>Every screen on this page is NextUp&rsquo;s own interface with a fictional demo company.</p>
          </div>
          <RouteDemo routes={MAP} promiseDays={P} examples={RAISE_EXAMPLES} />
        </div></div>
      </section>

      <SkylineStrip stretch="alex" />
      <section className="section" id="ideas" aria-labelledby="ideas-h">
        <div className="wrap">
          <div className={cn("section-head", styles.headSplit)}>
            <h2 id="ideas-h">Every idea, and whose desk it is on</h2>
            <p>One list for the whole plant. Open an idea to see its stage, its owner and its clock, and decide it where it lands.</p>
          </div>
          <div className={styles.platform}>
            <ol className={styles.stages} aria-label="The demo company's ideas by stage">
              {STAGES.map((s, n) => (
                <li key={s} data-on={AT_STAGE[n] > 0 ? "" : undefined}>
                  <i aria-hidden="true" />
                  <span>{s}</span>
                  <b>{AT_STAGE[n]}<span className="nh-sr"> {AT_STAGE[n] === 1 ? "idea" : "ideas"}</span></b>
                </li>
              ))}
            </ol>
            <IdeasBoard ideas={IDEAS} promiseDays={P} />
          </div>
        </div>
      </section>

      {/* ProductStory carries its own h2 ("From the first word to the measured result"). */}
      <section className={cn("section", styles.fill)} id="steps" data-ground="alt" aria-label="The product in five steps">
        <div className="wrap">
          <ProductStory />
        </div>
      </section>

      {/* On a phone the five stacked rules take two screens (--hm). */}
      <section className={cn("section", styles.fill)} id="rules" aria-labelledby="rules-h" style={{ "--hm": 2 } as React.CSSProperties}>
        <div className="wrap">
          <div className="section-head">
            <h2 id="rules-h">Five rules the product keeps</h2>
          </div>
          <RulesBento promiseDays={P} />
        </div>
      </section>

      <section className={cn("section", styles.fill, styles.security)} id="security" data-ground="alt" aria-labelledby="security-h">
        <div className="wrap"><div className={styles.split}>
          <div className={styles.secHead}>
            <div className="section-head">
              <h2 id="security-h">Where your data lives</h2>
            </div>
            <Separation place={HOSTING_PLACE} />
          </div>
          <div className={styles.sheetCol}>
            <DataStops rows={SHEET} />
            <Link className={cn("nh-link", styles.policy)} href="/privacy">Read the privacy policy <span aria-hidden="true">→</span></Link>
          </div>
        </div></div>
      </section>

      <section className="section" id="pilot" aria-labelledby="pilot-h">
        <div className="wrap"><div className={styles.pilot}>
          <div className={styles.pilotText}>
            <div className="section-head">
              <h2 id="pilot-h">Built on your plant, in a pilot</h2>
              <p>Everything above runs on your org chart, your routing map and your rules. We build it with your people in three phases, and agree the scope and the price before any work starts.</p>
            </div>
            <PhaseLine />
            <div className={styles.actions}>
              <Button href="/contact" size="lg">Book a pilot<Arrow /></Button>
              <Button href="/pricing" variant="ghost" size="lg">How pricing works</Button>
            </div>
            <Link className={cn("nh-link", styles.back)} href="/#ring">Why decisions wait <span aria-hidden="true">→</span></Link>
          </div>
          <PilotDiagram />
        </div></div>
      </section>
    </>
  );
}
