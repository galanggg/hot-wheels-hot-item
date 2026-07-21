interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500">
        🔍
      </span>
      <input
        type="search"
        inputMode="search"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search name, series, or code (JJM00, 009)…"
        className="w-full rounded-xl bg-neutral-800 py-3.5 pl-11 pr-10 text-base outline-none ring-1 ring-white/10 placeholder:text-neutral-500 focus:ring-2 focus:ring-red-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-neutral-400 hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}
