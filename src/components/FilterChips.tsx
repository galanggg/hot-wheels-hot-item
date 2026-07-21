import type { HotType } from "../types";
import { HOT_META, HOT_ORDER } from "../lib/hot";

interface Props {
  active: Set<HotType>;
  counts: Record<HotType, number>;
  onToggle: (t: HotType) => void;
  onClear: () => void;
}

const base =
  "shrink-0 whitespace-nowrap border px-2.5 py-1 text-[13px] font-bold uppercase tracking-wide transition-colors";

export default function FilterChips({ active, counts, onToggle, onClear }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={onClear}
        aria-pressed={active.size === 0}
        className={`${base} ${
          active.size === 0
            ? "border-flame bg-flame text-asphalt"
            : "border-line bg-asphalt-2 text-muted hover:border-line-2 hover:text-ink"
        }`}
      >
        [ all ]
      </button>
      {HOT_ORDER.map((t) => {
        const on = active.has(t);
        const color = HOT_META[t].color;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onToggle(t)}
            aria-pressed={on}
            style={
              on
                ? { backgroundColor: color, borderColor: color, color: "var(--color-asphalt)" }
                : { borderColor: "var(--color-line)", color }
            }
            className={`${base} ${on ? "" : "bg-asphalt-2 hover:brightness-125"}`}
          >
            [{t === "NM" ? "new" : t.toLowerCase()}{" "}
            <span className={on ? "opacity-70" : "text-muted"}>
              {String(counts[t]).padStart(2, "0")}
            </span>
            ]
          </button>
        );
      })}
    </div>
  );
}
