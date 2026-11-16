"use client";
// The footer. On the home page and on /product it opens with the close, the end of the Berlin line. On '/' that
// is the terminus: a departure board, the main action and the raise box for the visitor's own decision (the
// board shows what they type), then the whole skyline with the train pulling in. On /product it is calm: the
// heading and the raise box alone. Then the links, each column drawn as a short line with its stops. Every
// other page gets the links alone.
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DepartureBoard } from "@/components/berlin/DepartureBoard";
import { SkylineStrip } from "@/components/berlin/SkylineStrip";
import { CloseAsk } from "@/components/marketing/CloseAsk";
import { FOOTER_COLUMNS, HOSTING_PLACE, SITE } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import styles from "./SiteFooter.module.css";

/** The pages that end in the close (section id "close", the last station of their line). */
const CLOSING = ["/", "/product"];

export function SiteFooter() {
  const path = usePathname() ?? "";
  const closing = CLOSING.includes(path);
  const home = path === "/";
  const [said, setSaid] = useState("");
  const P = SITE.promiseDays;
  return (
    <footer id={closing ? "close" : undefined} className={cn("footer", closing && "closing", styles.footer, closing && !home && styles.calm)}
      aria-labelledby={closing ? "close-h" : undefined}>
      {closing && (
        <div className="wrap">
          <div className={cn("closing__cta", styles.close)}>
            <div className={cn(styles.closeTop, !home && styles.solo)}>
              <div className="section-head">
                <p className={styles.kicker}><i aria-hidden="true" />{home ? "Terminus" : "Next stop"}</p>
                <h2 id="close-h">{home ? "Next stop: your plant." : "Book a pilot for your plant"}</h2>
                <p>
                  {home
                    ? "Name the decision that keeps waiting. We scope a paid pilot around it, and the scope and price are agreed before any work starts."
                    : "Name the decision that keeps waiting. Scope and price are agreed before any work starts."}
                </p>
              </div>
              {home && (
                <DepartureBoard className={styles.board} cells={20}
                  label={`End of the line. Next: your plant. Every decision answered within ${P} working days.`}
                  rows={[
                    { label: "Next", text: "Your plant", tone: "gold" },
                    { label: "Answer in", text: `${P} working days` },
                    { label: "Decision", text: said.trim() || "The one that waits" },
                  ]} />
              )}
            </div>
            <CloseAsk onType={home ? setSaid : undefined} />
          </div>
        </div>
      )}
      {home && <SkylineStrip stretch="terminus" at="close" />}
      <div className={cn("wrap", closing && styles.linksWrap)}>
        <div className={styles.links}>
          <div className={styles.cols}>
            <div className={styles.brand}>
              <Link href="/" aria-label={`${SITE.name} home`}>
                <Image src="/brand/nextup-logo-blue.png" alt={SITE.name} width={494} height={212} />
              </Link>
              <p>Idea management for manufacturing plants. Hosted in {HOSTING_PLACE}.</p>
            </div>
            {FOOTER_COLUMNS.map(([title, links]) => (
              <nav key={title} className={styles.col} aria-label={title}>
                <h4><i aria-hidden="true" />{title}</h4>
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
