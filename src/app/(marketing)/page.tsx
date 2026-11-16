// LANDING. One continuous Berlin ride on the line N, from Warschauer Strasse to "Your plant". Today a request
// nobody owns rides a ring with no last stop; NextUp turns the ring into a line with a terminus: one owner, one
// clock, one board everyone can read. The software itself is one interchange away, on /product.
//   story      the 3D tower at blue hour: the whole film in one minute (components/tower, unchanged)
//   ring       the problem, felt: the request circles a loop line while the days climb (berlin/RingRide)
//   why        the problem, explained: the four reasons it heard, struck through, and the three missing things
//   owner      the turn, 1 of 3: the routing map as a night network (berlin/RoutingNetwork)
//   clock      the turn, 2 of 3: five working days, the deputy rule (berlin/ClockBeat)
//   seen       the turn, 3 of 3: the ideas list as a departure board (berlin/SeenBeat)
//   questions  the four people a plant must convince (marketing/Objections)
//   product    the interchange to the software (marketing/ProductTeaser)
//   pilot      a paid pilot in three phases, on a Berlin building site; the phases are its stations (berlin/PilotSite)
// The close ("Next stop: your plant.") and the footer follow as the last screen (SiteFooter). Skylines stand only
// between acts. Every number of the story comes from features/tower/story; the people are fictional.
import { BigLines } from "@/components/berlin/BigLines";
import { ClockBeat } from "@/components/berlin/ClockBeat";
import { LANDING_STATIONS } from "@/components/berlin/line";
import { LineRail } from "@/components/berlin/LineRail";
import { PilotSite } from "@/components/berlin/PilotSite";
import { RingRide } from "@/components/berlin/RingRide";
import { OwnerBeat } from "@/components/berlin/RoutingNetwork";
import { SeenBeat } from "@/components/berlin/SeenBeat";
import { SkylineStrip } from "@/components/berlin/SkylineStrip";
import { Objections } from "@/components/marketing/Objections";
import { ProductTeaser } from "@/components/marketing/ProductTeaser";
import { TowerExperience } from "@/components/tower/TowerExperience";
import { Arrow, Button } from "@/components/ui/Button";
import { PILOT_PHASES, SITE } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import styles from "./page.module.css";

const P = SITE.promiseDays;

// What the request heard on the ring, in the order of HOPS (features/tower/story): they mirror HOPS[].reason
// for the four waiting hops. Change one, change the other.
const REASONS = ["Not responsible.", "Wrong department.", "Is it important?", "No time."] as const;

// The cause under the reasons: three missing things, each with the beat that fixes it.
const MISSING = [
  { id: "owner", title: "No owner.", body: "Anyone could pass it on, so everyone did.", fix: "One owner" },
  { id: "clock", title: "No date.", body: "Nothing said when an answer was due, so it was never late.", fix: "One clock" },
  { id: "seen", title: "No view.", body: "Nobody could see where it was, so nobody asked.", fix: "Everyone sees" },
] as const;

export default function LandingPage() {
  return (
    <>
      <LineRail stations={LANDING_STATIONS} />
      <TowerExperience
        promiseDays={P}
        lead={`Raise a problem or an idea in one box. NextUp names who owns it, gives them ${P} working days to answer and shows everyone what is waiting on whom.`}
      />

      {/* The rewind: the train crosses the bridge backwards, and the story starts again at day 0. The strip rises
          over the scene's last screen (rise), so the city arrives while the scene fades into the alt ground. */}
      <SkylineStrip stretch="bridge" ground="alt" reverse rise caption="Rewind. Day 0." />
      {/* The tower's skip link and its last chapter button go to #try (components/tower is read-only). */}
      <span id="try" className={styles.anchor} aria-hidden="true" />
      <RingRide />

      <SkylineStrip stretch="alex" />
      <section className={cn("section", styles.why)} id="why" aria-labelledby="why-h">
        <div className="wrap">
          <h2 id="why-h" className={cn("nh-mono", styles.kicker)}><i aria-hidden="true">?</i>Why it waits</h2>
          <BigLines lines={REASONS} strike className={styles.reasons} />
          <p className={styles.nobody}>Nobody was lazy. <b>Nobody owned it.</b></p>
          <ol className={styles.missing}>
            {MISSING.map((m, i) => (
              <li key={m.id}>
                <span className={cn("nh-mono", styles.missNo)} aria-hidden="true">Missing · {i + 1}</span>
                <h3>{m.title}</h3>
                <p>{m.body}</p>
                <a className={cn("nh-link", styles.fix)} href={`#${m.id}`}><span aria-hidden="true">→ </span>{m.fix}</a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <OwnerBeat />
      <ClockBeat />
      <SeenBeat />

      <SkylineStrip stretch="government" />
      <Objections />

      <SkylineStrip stretch="museum" ground="alt" />
      <ProductTeaser />

      {/* No strip before the pilot: its building site is the picture. */}
      <section className={cn("section", styles.pilot)} id="pilot" data-ground="alt" aria-labelledby="pilot-h">
        <div className="wrap">
          <div className={styles.pilotHead}>
            <div className={styles.pilotTitle}>
              <p className={cn("nh-mono", styles.pilotKicker)}><i aria-hidden="true" />Paid pilot · three phases</p>
              <h2 id="pilot-h">Built with you, floor by floor.</h2>
            </div>
            <div className={styles.pilotCopy}>
              <p>A paid pilot in three phases, on your org chart, your routing map and your rules. Scope and price are agreed before any work starts.</p>
              <p className={styles.isNew}><b>NextUp is new.</b> The first plants that pilot it shape what it becomes.</p>
              <div className={styles.actions}>
                <Button href="/contact" size="lg">Book a pilot<Arrow /></Button>
                <Button href="/pricing" variant="ghost" size="lg">How pricing works<Arrow /></Button>
              </div>
            </div>
          </div>
          <PilotSite phases={PILOT_PHASES} className={styles.site} />
        </div>
      </section>
    </>
  );
}
