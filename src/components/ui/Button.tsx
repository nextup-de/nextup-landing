import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "ghost" | "accent" | "dark";
type Common = { variant?: Variant; size?: "sm" | "md" | "lg"; block?: boolean; className?: string; children: React.ReactNode };
type AsLink = Common & { href: string };
type AsButton = Common & { href?: undefined; type?: "button" | "submit"; onClick?: () => void; disabled?: boolean };

function classes({ variant = "primary", size = "md", block, className }: Common) {
  return cn("nh-btn", `nh-btn-${variant}`, size !== "md" && `nh-btn-${size}`, block && "nh-btn-block", className);
}

export function Button(props: AsLink | AsButton) {
  if (props.href !== undefined) {
    const { href, children } = props;
    return <Link href={href} className={classes(props)}>{children}</Link>;
  }
  const { type = "button", onClick, disabled, children } = props;
  return <button type={type} onClick={onClick} disabled={disabled} className={classes(props)}>{children}</button>;
}
