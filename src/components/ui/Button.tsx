import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "tint" | "ghost" | "white" | "onbrand" | "accent";
type Common = { variant?: Variant; size?: "sm" | "md" | "lg"; block?: boolean; className?: string; children: React.ReactNode };
type AsLink = Common & { href: string };
type AsButton = Common & { href?: undefined; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean };

function classes({ variant = "primary", size = "md", block, className }: Common) {
  return cn("btn nh-btn", `nh-btn-${variant}`, size !== "md" && `nh-btn-${size}`, block && "nh-btn-block", className);
}

// The drawn arrow on a main action (globals.css .nh-arrow): the stem draws out and the head moves on hover.
export function Arrow() {
  return <svg className="nh-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h8" /><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>;
}

export function Button(props: AsLink | AsButton) {
  if (props.href !== undefined) {
    const { href, children } = props;
    return <Link href={href} className={classes(props)}>{children}</Link>;
  }
  const { type = "button", onClick, disabled, children } = props;
  return <button type={type} onClick={onClick} disabled={disabled} className={classes(props)}>{children}</button>;
}
