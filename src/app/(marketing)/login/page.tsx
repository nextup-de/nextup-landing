// LOG IN, step 1: which company? Each company has its own NextUp address; this page sends people
// to that company's login (src/server/actions/login.ts). Accounts live there, not here.
import type { Metadata } from "next";
import Link from "next/link";
import { FindCompanyForm } from "@/components/marketing/FindCompanyForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Log in",
  description: "Find your company's NextUp and log in there.",
};

export default function LoginPage() {
  return (
    <section className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.head}>
          <p className="nh-eyebrow">Log in</p>
          <h1>Find your company</h1>
          <p>Every company has its own NextUp address. We take you to your company&apos;s login.</p>
        </div>
        <FindCompanyForm />
        <p className={styles.foot}>
          Not using NextUp yet? <Link href="/contact">Book a pilot</Link>.
        </p>
      </div>
    </section>
  );
}
