// The landing's few line icons: a 20px grid, 1.6 stroke, round caps. Drawn here so nothing is loaded from elsewhere.
const PATHS = {
  people: "M7 9.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5ZM2 16c.6-2.6 2.6-4 5-4s4.4 1.4 5 4M13 5l5 5M18 5l-5 5",
  eyeOff: "M3.5 10S6 5.5 10 5.5c1.2 0 2.3.4 3.2 1M16.5 10S14 14.5 10 14.5c-1.2 0-2.3-.4-3.2-1M8.4 8.4a2.25 2.25 0 0 0 3.2 3.2M3.5 3.5l13 13",
  doc: "M5 2.75h6.5L15 6.25v10.5a.5.5 0 0 1-.5.5h-9.5a.5.5 0 0 1-.5-.5V3.25a.5.5 0 0 1 .5-.5ZM11.5 2.75v3.5H15M7.5 10h5M7.5 13h3.5",
  plug: "M7 2.75v3.5M13 2.75v3.5M5 6.25h10v3a5 5 0 0 1-10 0v-3ZM10 14.25v3",
  shield: "M10 2.75 16 5v4.5c0 3.8-2.6 6.6-6 7.75-3.4-1.15-6-3.95-6-7.75V5l6-2.25ZM7.5 10l1.75 1.75L12.75 8",
  export: "M10 12.5V3M6.5 6.5 10 3l3.5 3.5M3.5 11v4.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V11",
} as const;
export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
