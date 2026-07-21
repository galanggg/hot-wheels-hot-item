interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="group flex items-center border border-line bg-asphalt-3 transition-colors focus-within:border-flame">
      <span
        aria-hidden="true"
        className="select-none pl-3 pr-1 text-sm font-bold text-muted transition-colors group-focus-within:text-flame"
      >
        /
      </span>
      <input
        type="search"
        inputMode="search"
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="model, series, or toy code (JJM00, 009)"
        aria-label="Search cars"
        className="w-full bg-transparent py-2.5 pr-2 text-base text-ink outline-none placeholder:text-muted/70"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="mr-1 flex h-8 shrink-0 items-center px-2 text-[11px] font-bold uppercase tracking-wide text-muted transition-colors hover:text-flame"
        >
          esc ✕
        </button>
      )}
    </div>
  );
}
