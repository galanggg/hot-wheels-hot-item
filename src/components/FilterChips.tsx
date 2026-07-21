import type { HotType } from "../types";
import { HOT_META, HOT_ORDER } from "../lib/hot";

interface Props {
  active: Set<HotType>;
  counts: Record<HotType, number>;
  onToggle: (t: HotType) => void;
  onClear: () => void;
}

export default function FilterChips({ active, counts, onToggle, onClear }: Props) {
  const chip = "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition";
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={onClear}
        className={`${chip} ${
          active.size === 0 ? "bg-white text-black" : "bg-neutral-800 text-neutral-300"
        }`}
      >
        All
      </button>
      {HOT_ORDER.map((t) => {
        const on = active.has(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => onToggle(t)}
            className={`${chip} ${on ? HOT_META[t].badge : "bg-neutral-800 text-neutral-300"}`}
          >
            {t === "NM" ? "New" : t} <span className="opacity-70">{counts[t]}</span>
          </button>
        );
      })}
    </div>
  );
}
