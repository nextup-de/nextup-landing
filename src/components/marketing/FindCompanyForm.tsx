"use client";
// /login: one field, the company's NextUp name. The server action (src/server/actions/login.ts)
// checks that the company answers and redirects to its own login page. `focus`: take the cursor
// on load - not when the page shows a company list above it.
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { companyError, readCompany } from "@/features/login/company";
import { findCompany, type FindState } from "@/server/actions/login";
import styles from "./FindCompanyForm.module.css";

export function FindCompanyForm({ focus = true }: { focus?: boolean }) {
  const [state, submit, pending] = useActionState<FindState, FormData>(findCompany, { status: "idle" });
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The server had the last word: show its message, keep what was typed.
  const [seen, setSeen] = useState<FindState>(state);
  if (state !== seen) {
    setSeen(state);
    if (state.status === "invalid") {
      setValue(state.value);
      setError(state.error);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const found = companyError(readCompany(value));
    setError(found);
    if (found) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }

  return (
    <form action={submit} onSubmit={onSubmit} noValidate className={styles.form}>
      <Field id="company" label="Your company's NextUp name" hint="The first part of your NextUp address: yourcompany.sellux.ch" error={error ?? undefined}>
        <input ref={inputRef} className="nh-input" id="company" name="company" type="text" placeholder="yourcompany"
          autoComplete="organization" autoCapitalize="none" spellCheck={false} autoFocus={focus} value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError(null); }}
          {...(error ? { "aria-invalid": true as const, "aria-describedby": "company-error" } : {})} />
      </Field>
      <Button type="submit" variant="accent" block disabled={pending}>
        {pending ? "Looking…" : "Continue to your login"}
      </Button>
    </form>
  );
}
