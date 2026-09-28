// LOG IN, step 1: which company? Each company has its own NextUp address; this page sends people
// to that company's login (src/server/actions/login.ts). While typing, matching companies admin lists
// (src/server/directory.ts) are suggested - no list up front. Accounts live there, not here.
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
        <FindCompanyForm companies={companies} />
        <p className={styles.foot}>
          Not using NextUp yet? <Link href="/contact">Book a pilot</Link>.
        </p>
      </div>
    </section>
  );
}
