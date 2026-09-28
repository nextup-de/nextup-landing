// LOG IN, step 1: which company? Each company has its own NextUp address; this page sends people
// to that company's login. The companies admin lists (src/server/directory.ts) are one click away;
// anyone else types the name (src/server/actions/login.ts). Accounts live there, not here.
import type { Metadata } from "next";
import Link from "next/link";
import { FindCompanyForm } from "@/components/marketing/FindCompanyForm";
import { COMPANY_URL } from "@/config/site";
import { companyUrl } from "@/features/login/company";
import { listedCompanies } from "@/server/directory";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Log in",
  description: "Find your company's NextUp and log in there.",
};

// The list changes when admin shows or hides a company - read it per minute, not at build time.
export const revalidate = 60;

export default async function LoginPage() {
  const companies = (await listedCompanies()).map((c) => {
    const base = companyUrl(c.slug, COMPANY_URL);
    return { slug: c.slug, name: c.name, host: new URL(base).host, href: `${base}/login` };
  });

  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.head}>
          <p className="nh-eyebrow">Log in</p>
          <h1>Find your company</h1>
          <p>Every company has its own NextUp address. We take you to your company&apos;s login.</p>
        </div>
        {companies.length > 0 && (
          <nav aria-labelledby="pick-company" className={styles.pick}>
            <h2 id="pick-company" className={styles.pickLabel}>Pick your company</h2>
            <ul className={styles.list}>
              {companies.map((c) => (
                <li key={c.slug}>
                  <a href={c.href} className={styles.company}>
                    <span className={styles.companyName}>{c.name}</span>
                    <span className={styles.companyHost}>{c.host}</span>
                    <span className={styles.arrow} aria-hidden>→</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className={styles.or}><span>or type its name</span></p>
          </nav>
        )}
        <FindCompanyForm focus={companies.length === 0} />
        <p className={styles.foot}>
          Not using NextUp yet? <Link href="/contact">Book a pilot</Link>.
        </p>
      </div>
    </section>
  );
}
