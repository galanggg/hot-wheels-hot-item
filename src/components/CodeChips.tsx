import { useMemo } from "react";
import type { CarGroup } from "../types";

interface Props {
  groups: CarGroup[];
  query: string;
  onPick: (prefix: string) => void;
}

// Prefixes with fewer slots than this are one-off noise (JNG/JMB/JPJ) — hide them
// so the row stays a fast reminder of the real toy-code families, not a long tail.
const MIN_SLOTS = 5;

/**
 * Quick-tap toy-code prefixes (JJJ, JJH, …). One tap drops the prefix into the
 * search box so a code family surfaces without typing. Counts are how many of the
 * ~250 collector slots carry that prefix as their primary (card-printed) code.
 */
export default function CodeChips({ groups, query, onPick }: Props) {
  const prefixes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of groups) {
      const p = g.toyNum?.slice(0, 3).toUpperCase();
      if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, n]) => n >= MIN_SLOTS)
      .sort((a, b) => b[1] - a[1]);
  }, [groups]);

  if (prefixes.length === 0) return null;

  const current = query.trim().toUpperCase();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      <span
        aria-hidden="true"
        className="shrink-0 select-none pl-0.5 pr-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted"
      >
        code
      </span>
      {prefixes.map(([prefix, n]) => {
        const on = current === prefix;
        return (
          <button
            key={prefix}
            type="button"
            onClick={() => onPick(on ? "" : prefix)}
            aria-pressed={on}
            aria-label={`Search toy code ${prefix} — ${n} slots`}
            className={`shrink-0 whitespace-nowrap border px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide outline-none transition-colors focus-visible:ring-2 focus-visible:ring-flame ${
              on
                ? "border-flame bg-flame text-asphalt"
                : "border-line bg-asphalt-2 text-ink hover:border-line-2 hover:text-chrome"
            }`}
          >
            [{prefix}{" "}
            <span className={on ? "opacity-70" : "text-muted"}>
              {String(n).padStart(2, "0")}
            </span>
            ]
          </button>
        );
      })}
    </div>
  );
}
