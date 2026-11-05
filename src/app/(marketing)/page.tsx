// LANDING (Paper: "Landing · redesign", artboard 01 · Home). The question, answered live: the hero is one box that
// routes whatever a visitor types on the demo company's map. Then one request both ways (the pinned scene), one
// sentence, the product in five chapters (the pinned window), the ideas list, five principles, the pilot, one ask.
// Every picture is product UI built from the app's own elements - no screenshots to retake.
import { CloseAsk } from "@/components/marketing/CloseAsk";
import { ProductStory } from "@/components/marketing/ProductStory";
import { RouteDemo } from "@/components/marketing/RouteDemo";
import { WaitScene } from "@/components/marketing/WaitScene";
import { ArrowUp, Avatar, Dept, Pill, Spark, type Status, type Tone } from "@/components/product/elements";
import { PILOT_PHASES, SITE } from "@/config/site";
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

// The five stages under the statement: two done, one in progress, two open.
const STAGES: Array<[string, "done" | "doing" | "open"]> = [["Raise", "done"], ["AI check", "done"], ["Decide", "doing"], ["Build", "open"], ["Measure", "open"]];

// The ideas list, as the app shows it: what, since when, which stage, on whose desk, status.
type Idea = { what: string; dept: string; deptTone: Tone; since: string; late?: boolean; stage: string; who: string; role: string; tone: Tone; status: Status; label: string };
const IDEAS: Idea[] = [
  { what: "Seam-sealing robot drips after every nozzle change", dept: "Body & Assembly", deptTone: "amber", since: "6 d", late: true, stage: "Team lead", who: "M. Hoffmann", role: "Team lead, final assembly", tone: "violet", status: "move", label: "Your move" },
  { what: "Reusable crates for door modules", dept: "Logistics", deptTone: "blue", since: "3 d", stage: "Decision", who: "N. Demir", role: "Head of Inbound Logistics", tone: "blue", status: "clock", label: "3 d left" },
  { what: "Torque records on the line tablet", dept: "Quality", deptTone: "pink", since: "1 d", stage: "AI check", who: "K. Yilmaz", role: "Head of Plant Quality", tone: "teal", status: "info", label: "Needs info" },
  { what: "Standby for welding robots during breaks", dept: "Maintenance", deptTone: "teal", since: "9 d", stage: "Project", who: "A. Schulz", role: "Lead, body shop maintenance", tone: "amber", status: "ok", label: "Running" },
  { what: "Paint booth filter change by sensor", dept: "Paint shop", deptTone: "green", since: "2 d", stage: "Team lead", who: "T. Vogel", role: "Team lead, paint shop", tone: "green", status: "clock", label: "4 d left" },
  { what: "Shift handover checklist on one page", dept: "Engineering", deptTone: "violet", since: "Today", stage: "AI check", who: "J. Schmidt", role: "Process engineer", tone: "pink", status: "new", label: "New" },
];

export default function LandingPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroIn}>
          <div className={styles.heroText}>
            <h1>{SITE.tagline}</h1>
            <p className={styles.lead}>
              Raise a problem or an idea in one box. NextUp names who owns it and when they owe an answer.
            </p>
          </div>
          <RouteDemo routes={MAP} promiseDays={P} examples={EXAMPLES} />
        </div>
      </section>

      <WaitScene
        request={`${REQUEST}.`} from="Night shift, 4-series" decision={SPEND.type} promiseDays={P}
        owner={SPEND.owner.name} ownerRole={SPEND.owner.role} deputy={SPEND.deputy} deputyRole={roleOf(SPEND.deputy)}
      />

      <section className={styles.statement}>
        <h2>Every idea, from the first word <span>to the measured result.</span></h2>
        <ol className={styles.rail}>
          {STAGES.map(([name, state]) => <li key={name} data-state={state}>{name}</li>)}
        </ol>
      </section>

      <ProductStory />

      <section className={styles.desk} id="ideas">
        <div className={styles.head}>
          <div>
            <p className="nh-eyebrow">Ideas</p>
            <h2 className={styles.title}>Everyone sees what is waiting on whom.</h2>
          </div>
          <p className={styles.aside}>One list for the whole plant. Every idea shows its department, its stage and the desk it is on.</p>
        </div>
        <div className={styles.table} role="table" aria-label="Open ideas in the demo company">
          <div className={styles.thead} role="row">
            <span role="columnheader">What</span><span role="columnheader">Open since</span><span role="columnheader">Stage</span>
            <span role="columnheader">On whose desk</span><span role="columnheader">Status</span>
          </div>
          {IDEAS.map((i) => (
            <div key={i.what} className={styles.row} role="row">
              <span role="cell" className={styles.what}><strong>{i.what}</strong><Dept tone={i.deptTone}>{i.dept}</Dept></span>
              <span role="cell" className={styles.since} data-late={i.late}>{i.since}</span>
              <span role="cell" className={styles.stage}>{i.stage}</span>
              <span role="cell" className={styles.who}>
                <Avatar name={i.who} tone={i.tone} />
                <span><strong>{i.who}</strong><small>{i.role}</small></span>
              </span>
              <span role="cell" className={styles.status}><Pill status={i.status}>{i.label}</Pill></span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.principles}>
        <div>
          <p className="nh-eyebrow">Principles</p>
          <h2 className={styles.title}>Five rules the product keeps.</h2>
        </div>
        <div className={styles.bento}>
          <article className={styles.tileAi}>
            <div>
              <h3>AI suggests.<br />People decide.</h3>
              <p>The coach asks what is missing and reads the idea. The answer always comes from the person who owns it.</p>
            </div>
            <div className={styles.talk} aria-hidden="true">
              <span className={styles.asks}><Spark />What does one crate cost, and who returns them?</span>
              <span className={styles.says}><i>ND</i>Yes, start it · decided by N. Demir</span>
            </div>
          </article>
          <article className={styles.tile} data-tone="blue">
            <p className={styles.five} aria-hidden="true"><b>{P}</b><span>working<br />days</span></p>
            <div><h3>A clock on every decision</h3><p>Every idea shows the day its answer is due.</p></div>
          </article>
          <article className={styles.tile} data-tone="amber">
            <div className={styles.role} aria-hidden="true">
              <span className={styles.roleChip}>Head of Inbound Logistics</span>
              <span className={styles.pair}><Avatar name="N. Demir" tone="blue" size={44} /><Avatar name="T. Vogel" tone="green" size={44} /><small>owner · deputy</small></span>
            </div>
            <div><h3>Roles, not names</h3><p>Routing follows the role, through holidays and job changes.</p></div>
          </article>
          <article className={styles.tile} data-tone="green">
            <p className={styles.place} aria-hidden="true"><i />Nuremberg · Germany</p>
            <div><h3>Hosted in the EU</h3><p>One stack per company. No cookies and no tracking on this site.</p></div>
          </article>
          <article className={styles.tile} data-tone="grey">
            <p className={styles.mini} aria-hidden="true"><span>Raise it in one line</span><i><ArrowUp size={14} /></i></p>
            <div><h3>One field to start</h3><p>A pilot needs one field and one routing table.</p></div>
          </article>
        </div>
      </section>

      <section className={styles.pilot} id="pilot">
        <div className={styles.head}>
          <div>
            <p className="nh-eyebrow">The pilot</p>
            <h2 className={styles.title}>A pilot we build<br />with you.</h2>
          </div>
          <p className={styles.aside}>
            Your company invests in the pilot. We build NextUp into a solution that is ready for your plant. Scope and
            price are agreed before it starts.
          </p>
        </div>
        <ol className={styles.track}>
          {PILOT_PHASES.map(([phase, title, body], i) => (
            <li key={phase} data-phase={i}>
              <i aria-hidden="true" />
              <span>Phase {i + 1} · {phase}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.close}>
        <div className={styles.band}>
          <h2>Which decision keeps waiting?</h2>
          <CloseAsk />
          <p>Tell us. We scope a pilot around it.</p>
        </div>
      </section>
    </>
  );
}
