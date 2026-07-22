import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { Car, Catalog, HotType } from "./types";
import catalog from "./data/cars.json";
import { groupCars } from "./lib/group";
import { buildIndex, filterCars } from "./lib/search";
import SearchBar from "./components/SearchBar";
import FilterChips from "./components/FilterChips";
import CarGrid from "./components/CarGrid";

// Code-split the scanner: tesseract.js (WASM + worker) only loads on first open.
const ScanOverlay = lazy(() => import("./components/ScanOverlay"));

const data = catalog as Catalog;

function useDebounced<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Set<HotType>>(new Set());
  const [scanOpen, setScanOpen] = useState(false);
  const debouncedQuery = useDebounced(query);

  const cars = data.cars as Car[];
  const groups = useMemo(() => groupCars(cars), [cars]);
  const index = useMemo(() => buildIndex(groups), [groups]);

  const counts = useMemo(() => {
    const c: Record<HotType, number> = { STH: 0, TH: 0, NM: 0 };
    for (const g of groups) if (g.hot) c[g.hot]++;
    return c;
  }, [groups]);

  const results = useMemo(
    () => filterCars(groups, index, debouncedQuery, active),
    [groups, index, debouncedQuery, active]
  );

  const toggle = (t: HotType) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  const hotTotal = counts.STH + counts.TH + counts.NM;
  const filtered = debouncedQuery.trim().length > 0 || active.size > 0;

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-[calc(0.75rem+env(safe-area-inset-left))] pb-[calc(3rem+env(safe-area-inset-bottom))] pr-[calc(0.75rem+env(safe-area-inset-right))] sm:px-[calc(1rem+env(safe-area-inset-left))] sm:pr-[calc(1rem+env(safe-area-inset-right))]">
      {/* ── Command masthead: the field-terminal header ───────────── */}
      <header className="sticky top-0 z-20 -mx-3 bg-asphalt/95 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur sm:-mx-4 sm:px-4">
        <div className="border border-line bg-asphalt-2">
          {/* prompt line */}
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-1.5 text-[11px] text-muted">
            <span className="flex min-w-0 items-center gap-2 truncate">
              <span className="text-flame">▸</span>
              <span className="truncate">
                hotwheels@aisle<span className="text-ink">:~$</span> scan --year{" "}
                <span className="text-chrome">{data.year}</span>
              </span>
            </span>
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="flex shrink-0 items-center gap-1.5 border border-line-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-chrome transition-colors hover:border-flame hover:text-flame"
              aria-label="Open live toy-code scanner"
            >
              <span aria-hidden="true">▸</span> scan
              <span className="border border-flame px-1 text-[8px] leading-tight text-flame">
                beta
              </span>
            </button>
          </div>

          {/* wordmark + live count readout */}
          <div className="flex items-end justify-between gap-3 px-3 py-2.5">
            <h1 className="font-display text-2xl font-black uppercase leading-[0.85] tracking-tight text-chrome sm:text-3xl">
              Hot Wheels
              <span className="block text-flame">
                '{String(data.year).slice(2)} Scanner
              </span>
            </h1>
            <div className="shrink-0 text-right text-[11px] leading-tight text-muted">
              <div>
                <span className="text-lg font-bold text-chrome">
                  {String(groups.length).padStart(3, "0")}
                </span>{" "}
                carded
              </div>
              <div className="text-flame">
                {String(hotTotal).padStart(2, "0")} hot
                <span className="cursor ml-1 align-baseline" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Command bar ───────────────────────────────────────── */}
        <div className="mt-2">
          <SearchBar value={query} onChange={setQuery} />
        </div>

        {/* ── Filter flags ──────────────────────────────────────── */}
        <div className="mt-2 pb-2">
          <FilterChips
            active={active}
            counts={counts}
            onToggle={toggle}
            onClear={() => setActive(new Set())}
          />
        </div>
      </header>

      {/* ── Results readout ─────────────────────────────────────── */}
      <div className="mt-4 flex items-baseline gap-2 border-b border-line pb-2 text-[11px] uppercase tracking-[0.12em] text-muted">
        <span className="text-flame">&gt;</span>
        <span className="text-chrome">{results.length}</span>
        <span>{results.length === 1 ? "match" : "matches"}</span>
        {filtered && <span className="text-muted">/ {groups.length} total</span>}
      </div>

      <main className="mt-4">
        <CarGrid groups={results} />
      </main>

      {/* ── EOF colophon ────────────────────────────────────────── */}
      <footer className="mt-12 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
        <span className="text-flame">--</span> EOF <span className="text-flame">--</span>{" "}
        {groups.length} cars carded · source hotwheels.fandom.com · synced{" "}
        <span className="text-ink">{data.updatedAt.slice(0, 10)}</span>
      </footer>

      {scanOpen && (
        <Suspense fallback={null}>
          <ScanOverlay
            groups={groups}
            index={index}
            onClose={() => setScanOpen(false)}
            onPick={setQuery}
          />
        </Suspense>
      )}
    </div>
  );
}
