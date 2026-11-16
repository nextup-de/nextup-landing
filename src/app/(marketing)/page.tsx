// LANDING. The page opens with one scene and goes on as a stack of screens (the Taste Skill's layout).
//   story      a Berlin office tower at blue hour; scrolling follows one request through it, today and with NextUp
//   try        the raise box routes what a visitor types, live: the story's last frame, in the product
//   ideas      every idea and whose desk it is on, in one app window; a row opens, an idea can be decided
//   product    the five steps as tabs, each with its screen
//   rules      the five rules the product keeps
//   pilot      the three phases, and what the pilot builds as a diagram
//   questions  the questions before a pilot, every answer open
// The close and the footer follow as the last screen (SiteFooter). Every picture of the product is product UI
// built from the app's own elements with the demo company's names - no screenshots to retake.
import { IdeasBoard, type BoardIdea } from "@/components/marketing/IdeasBoard";
import { PilotDiagram } from "@/components/marketing/PilotDiagram";
import { ProductStory } from "@/components/marketing/ProductStory";
import { RouteDemo } from "@/components/marketing/RouteDemo";
import { TowerExperience } from "@/components/tower/TowerExperience";
import { ArrowUp, Avatar, Spark } from "@/components/product/elements";
import { Arrow, Button } from "@/components/ui/Button";
import { FAQ, PILOT_PHASES, SITE } from "@/config/site";
import { ROUTES } from "@/features/demo/routes";
import { cn } from "@/lib/utils/cn";
import styles from "./page.module.css";

const P = SITE.promiseDays;

// The demo company's routing map as plain rows for the raise box. The tower's story follows its first row.
const MAP = ROUTES.map((r) => ({ id: r.id, type: r.type, keys: r.keys, owner: r.owner.name, role: r.owner.role, deputy: r.deputy }));

// What the raise box types by itself, one after another. Each one hits a different row of the map; the tower's
// story sends the same three through the building (features/tower/story).
const REQUEST = "Night shift has no one who can sign a €300 parts order";
const EXAMPLES = [
  REQUEST,
  "Two apprentices have had no system login for four weeks",
  "Tolerance drift on station 7 - who owns the gauge calibration?",
];

// The ideas list, as the app shows it: what, since when, which stage, on whose desk, status - and what the
// open idea shows: who raised it, the deputy, the AI's read.
const IDEAS: BoardIdea[] = [
  { id: "I-31", what: "Seam-sealing robot drips after every nozzle change", dept: "Body & Assembly", deptTone: "amber", since: "6 d", late: true, stage: 2,
    who: "M. Hoffmann", role: "Team lead, final assembly", tone: "violet", status: "late", label: "1 d late", by: "D. Ferraro", deputy: "A. Schulz",
    read: "Drips after each nozzle change mean rework on the next body. A purge step after the change may stop it; maintenance would own the step." },
  { id: "I-29", what: "Reusable crates for door modules", dept: "Logistics", deptTone: "blue", since: "3 d", stage: 2, left: 3,
    who: "N. Demir", role: "Head of Inbound Logistics", tone: "blue", status: "clock", label: "3 d left", by: "M. Hoffmann", deputy: "T. Vogel",
    read: "Replaces about 40 cardboard boxes per shift. Needs 120 crates and one return lane at gate 3." },
  { id: "I-33", what: "Torque records on the line tablet", dept: "Quality", deptTone: "pink", since: "1 d", stage: 1,
    who: "K. Yilmaz", role: "Head of Plant Quality", tone: "teal", status: "info", label: "Needs info", by: "J. Schmidt", deputy: "H. Sander",
    read: "The coach asks which app the line tablet runs today and who signs the torque record at the end of a shift." },
  { id: "I-24", what: "Standby for welding robots during breaks", dept: "Maintenance", deptTone: "teal", since: "9 d", stage: 3,
    who: "A. Schulz", role: "Lead, body shop maintenance", tone: "amber", status: "ok", label: "Running", by: "T. Vogel", deputy: "M. Roth",
    read: "Robots stay powered through every break. Standby needs one change in each cell's controller and a test on one line first." },
  { id: "I-32", what: "Paint booth filter change by sensor", dept: "Paint shop", deptTone: "green", since: "2 d", stage: 2, left: 4,
    who: "T. Vogel", role: "Team lead, paint shop", tone: "green", status: "clock", label: "4 d left", by: "A. Schulz", deputy: "M. Roth",
    read: "Filters are changed by the calendar today. A pressure sensor would call for the change when a filter is full." },
  { id: "I-34", what: "Shift handover checklist on one page", dept: "Engineering", deptTone: "violet", since: "Today", stage: 1,
    who: "J. Schmidt", role: "Process engineer", tone: "pink", status: "new", label: "New", by: "C. Ilg", deputy: "M. Roth",
    read: "Three handover sheets are in use. The coach asks which fields the next shift actually reads." },
  { id: "I-27", what: "System logins for apprentices on day one", dept: "HR & IT", deptTone: "blue", since: "21 d", stage: 4,
    who: "L. Brandt", role: "HR / IT", tone: "violet", status: "ok", label: "Measured", by: "M. Roth", deputy: "M. Roth",
    read: "Apprentices waited weeks for a login. Accounts are now made when the contract is signed." },
  { id: "I-30", what: "Night shift cannot sign a €300 parts order", dept: "Production", deptTone: "green", since: "5 d", stage: 3,
    who: "T. Vogel", role: "Team lead, 4-series", tone: "green", status: "ok", label: "Answered in 2 d", by: "Night shift", deputy: "M. Roth",
    read: "Spend under €5k belongs to the team lead. A standing limit for the night shift would settle it for good." },
];

export default function LandingPage() {
  return (
    <>
      <TowerExperience
        promiseDays={P}
        lead={`Raise a problem or an idea in one box. NextUp names who owns it, gives them ${P} working days to answer and shows everyone what is waiting on whom.`}
      />

      {/* The story lands in the product: the raise box, routing what a visitor types the way the app does. */}
      <section className="section" id="try" data-ground="alt" aria-labelledby="try-h">
        <div className="wrap"><div className={styles.heroGrid}>
          <div className={styles.heroText}>
            <div className="section-head">
              <h2 id="try-h">Now raise your own</h2>
              <p>Type something that is stuck at work. The box reads it against the demo company&rsquo;s routing map and names the owner, the date and the deputy. Nothing you type leaves your browser.</p>
            </div>
            <div className={styles.actions}>
              <Button href="#product" variant="tint" size="lg">See the five steps<Arrow /></Button>
            </div>
          </div>
          <RouteDemo routes={MAP} promiseDays={P} examples={EXAMPLES} />
        </div></div>
      </section>

      <section className="section" id="ideas" aria-labelledby="ideas-h">
        <div className="wrap">
          <div className={cn("section-head", styles.headSplit)}>
            <h2 id="ideas-h">Every idea, and whose desk it is on</h2>
            <p>One list for the whole plant. Open an idea to see its stage, its owner and its clock, and decide it where it lands.</p>
          </div>
          <IdeasBoard ideas={IDEAS} promiseDays={P} />
        </div>
      </section>

      <section className="section" id="product" data-ground="alt" aria-label="The product in five steps">
        <div className="wrap">
          <ProductStory />
        </div>
      </section>

      {/* On a phone the stacked tiles, phases and answers take two screens (--hm). */}
      <section className="section" id="rules" aria-labelledby="rules-h" style={{ "--hm": 2 } as React.CSSProperties}>
        <div className="wrap">
          <div className="section-head">
            <h2 id="rules-h">Five rules the product keeps</h2>
          </div>
          <div className={styles.bento}>
            <article className={cn(styles.tile, styles.wide)}>
              <div className={styles.talk} aria-hidden="true">
                <span className={styles.asks}><Spark />What does one crate cost, and who returns them?</span>
                <span className={styles.says}><Avatar name="N. Demir" tone="blue" size={28} />Yes, start it · decided by N. Demir</span>
              </div>
              <div><h3>AI suggests. People decide.</h3><p>The coach asks what is missing and reads the idea. The answer always comes from the person who owns it.</p></div>
            </article>
            <article className={styles.tile}>
              <p className={styles.five} aria-hidden="true"><b>{P}</b><span>working<br />days</span></p>
              <div><h3>A clock on every decision</h3><p>Every idea shows the day its answer is due.</p></div>
            </article>
            <article className={styles.tile}>
              <div className={styles.role} aria-hidden="true">
                <span className={styles.roleChip}>Head of Inbound Logistics</span>
                <span className={styles.pair}><Avatar name="N. Demir" tone="blue" size={32} /><Avatar name="T. Vogel" tone="green" size={32} /><small>owner · deputy</small></span>
              </div>
              <div><h3>Roles, not names</h3><p>Routing follows the role, through holidays and job changes.</p></div>
            </article>
            <article className={styles.tile}>
              <p className={styles.place} aria-hidden="true"><i />Nuremberg · Germany</p>
              <div><h3>Hosted in the EU</h3><p>One stack per company. No cookies and no tracking on this site.</p></div>
            </article>
            <article className={styles.tile}>
              <p className={styles.mini} aria-hidden="true"><span>Raise it in one line</span><i><ArrowUp size={12} /></i></p>
              <div><h3>One field to start</h3><p>A pilot needs one field and one routing table.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="pilot" data-ground="alt" aria-labelledby="pilot-h" style={{ "--hm": 2 } as React.CSSProperties}>
        <div className="wrap"><div className={styles.pilot}>
          <div className={styles.pilotText}>
            <div className="section-head">
              <h2 id="pilot-h">A pilot we build with you</h2>
              <p>Your company invests in the pilot. We build NextUp into a solution that is ready for your plant.</p>
            </div>
            <ol className={styles.phases}>
              {PILOT_PHASES.map(([phase, title, body], i) => (
                <li key={phase}>
                  <span className={styles.phase}>Phase {i + 1} · {phase}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>
          </div>
          <PilotDiagram />
        </div></div>
      </section>

      <section className="section" id="questions" aria-labelledby="questions-h" style={{ "--hm": 2 } as React.CSSProperties}>
        <div className="wrap"><div className={styles.faq}>
          <div className="section-head">
            <h2 id="questions-h">Questions before a pilot</h2>
            <p>Anything else, ask us when you book.</p>
          </div>
          <dl className={styles.answers}>
            {FAQ.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}
          </dl>
        </div></div>
      </section>
    </>
  );
}
