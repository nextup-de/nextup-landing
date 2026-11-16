"use client";
// The footer. On the home page it is the last screen and the end of the Berlin line: the close (a departure board
// at the terminus, the main action, and the raise box for the visitor's own decision - the board shows what they
// type), the whole skyline with the train pulling in, then the links. Every other page gets the links alone.
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DepartureBoard } from "@/components/berlin/DepartureBoard";
import { SkylineStrip } from "@/components/berlin/SkylineStrip";
import { CloseAsk } from "@/components/marketing/CloseAsk";
import { LOGIN_URL, SITE } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import styles from "./SiteFooter.module.css";

const COLUMNS: Array<[string, Array<[string, string]>]> = [
  ["Product", [["Ideas", "/#ideas"], ["Product tour", "/#product"], ["Rules", "/#rules"]]],
  ["Pilot", [["How a pilot runs", "/#pilot"], ["Pricing", "/pricing"], ["Questions", "/#questions"]]],
  ["Company", [["Book a pilot", "/contact"], ["Log in", LOGIN_URL]]],
  ["Legal", [["Imprint", "/imprint"], ["Privacy", "/privacy"]]],
];

export function SiteFooter() {
  const home = usePathname() === "/";
  const [said, setSaid] = useState("");
  const P = SITE.promiseDays;
  return (
    <footer id={home ? "close" : undefined} className={cn("footer", home && "closing", styles.footer)} aria-labelledby={home ? "close-h" : undefined}>
      {home && (
        <div className="wrap">
          <div className={cn("closing__cta", styles.close)}>
            <div className={styles.closeTop}>
              <div className="section-head">
                <h2 id="close-h">Book a pilot for your plant</h2>
                <p>Name the decision that keeps waiting. Scope and price are agreed before any work starts.</p>
              </div>
              <DepartureBoard className={styles.board} cells={20}
                label={`End of the line. Next: your plant. Every decision answered within ${P} working days.`}
                rows={[
                  { label: "Next", text: "Your plant", tone: "gold" },
                  { label: "Answer in", text: `${P} working days` },
                  { label: "Decision", text: said.trim() || "The one that waits" },
                ]} />
            </div>
            <CloseAsk onType={setSaid} />
          </div>
        </div>
      )}
      {home && <SkylineStrip stretch="terminus" at="close" />}
      <div className={cn("wrap", home && styles.linksWrap)}>
        <div className={styles.links}>
          <div className={styles.cols}>
            <div className={styles.brand}>
              <Link href="/" aria-label={`${SITE.name} home`}>
                <Image src="/brand/nextup-logo-blue.png" alt={SITE.name} width={494} height={212} />
              </Link>
              <p>Idea management for manufacturing plants. Hosted in Nuremberg, Germany.</p>
            </div>
            {COLUMNS.map(([title, links]) => (
              <nav key={title} className={styles.col} aria-label={title}>
                <h4>{title}</h4>
                <ul>{links.map(([label, href]) => <li key={label}><Link className="nh-link" href={href}>{label}</Link></li>)}</ul>
              </nav>
            ))}
          </div>
          <p className={styles.legal}>
            <span>&copy; 2026 {SITE.name}</span>
            <span>No cookies. No tracking.</span>
            <span>Product screens show a demo company.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
