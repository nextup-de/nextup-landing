"use client";
// /login: one field, the company's NextUp name. The server action (src/server/actions/login.ts)
// checks that the company answers and redirects to its own login page. While typing, the
// companies admin lists (src/server/directory.ts) that match are suggested under the field -
// never before, so nobody gets a list to pick from up front. Picking one goes straight to its login.
import { useActionState, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { companyError, readCompany } from "@/features/login/company";
import { suggest } from "@/features/login/directory";
import { findCompany, type FindState } from "@/server/actions/login";
import styles from "./FindCompanyForm.module.css";

export type Suggestion = { slug: string; name: string; host: string; href: string };

export function FindCompanyForm({ companies = [] }: { companies?: Suggestion[] }) {
  const [state, submit, pending] = useActionState<FindState, FormData>(findCompany, { status: "idle" });
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // The server had the last word: show its message, keep what was typed.
  const [seen, setSeen] = useState<FindState>(state);
  if (state !== seen) {
    setSeen(state);
    if (state.status === "invalid") {
      setValue(state.value);
      setError(state.error);
    }
  }

  const matches = open ? suggest(companies, value) : [];
  const shown = matches.length > 0;

  function go(c: Suggestion) {
    setOpen(false);
    window.location.assign(c.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!shown) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      // -1 = back in the field, so Enter submits what was typed.
      setActive((i) => (i + step >= matches.length ? -1 : i + step < -1 ? matches.length - 1 : i + step));
    } else if (e.key === "Enter" && active >= 0 && active < matches.length) {
      e.preventDefault();
      go(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
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

  const activeId = shown && active >= 0 && active < matches.length ? `${listId}-${active}` : undefined;

  return (
    <form action={submit} onSubmit={onSubmit} noValidate className={styles.form}>
      <Field id="company" label="Your company's NextUp name" hint="The first part of your NextUp address: yourcompany.sellux.ch" error={error ?? undefined}>
        <div className={styles.combo}>
          <input ref={inputRef} className="nh-input" id="company" name="company" type="text" placeholder="yourcompany"
            autoComplete="off" autoCapitalize="none" spellCheck={false} autoFocus value={value}
            role="combobox" aria-autocomplete="list" aria-expanded={shown} aria-controls={listId} aria-activedescendant={activeId}
            onChange={(e) => { setValue(e.target.value); setOpen(true); setActive(-1); if (error) setError(null); }}
            onKeyDown={onKeyDown}
            onBlur={() => setOpen(false)}
            {...(error ? { "aria-invalid": true as const, "aria-describedby": "company-error" } : {})} />
          <ul id={listId} role="listbox" aria-label="Matching companies" className={styles.list} hidden={!shown}>
            {matches.map((c, i) => (
              <li key={c.slug} id={`${listId}-${i}`} role="option" aria-selected={i === active} className={styles.option}
                // mousedown, not click: it runs before the input's blur closes the list.
                onMouseDown={(e) => { e.preventDefault(); go(c); }}
                onMouseEnter={() => setActive(i)}>
                <span className={styles.name}>{c.name}</span>
                <span className={styles.host}>{c.host}</span>
              </li>
            ))}
          </ul>
        </div>
      </Field>
      <Button type="submit" variant="accent" block disabled={pending}>
        {pending ? "Looking…" : "Continue to your login"}
      </Button>
    </form>
  );
}
