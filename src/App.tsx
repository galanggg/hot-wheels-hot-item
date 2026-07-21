import { useEffect, useMemo, useState } from "react";
import type { Car, Catalog, HotType } from "./types";
import catalog from "./data/cars.json";
import { buildIndex, filterCars } from "./lib/search";
import { HOT_ORDER } from "./lib/hot";
import SearchBar from "./components/SearchBar";
import FilterChips from "./components/FilterChips";
import CarGrid from "./components/CarGrid";

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
  const debouncedQuery = useDebounced(query);

  const cars = data.cars as Car[];
  const index = useMemo(() => buildIndex(cars), [cars]);

  const counts = useMemo(() => {
    const c: Record<HotType, number> = { STH: 0, TH: 0, NM: 0 };
    for (const car of cars) if (car.hot) c[car.hot]++;
    return c;
  }, [cars]);

  const results = useMemo(
    () => filterCars(cars, index, debouncedQuery, active),
    [cars, index, debouncedQuery, active]
  );

  const toggle = (t: HotType) =>
    setActive((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  return (
    <div className="mx-auto max-w-6xl px-3 pb-10">
      <header className="sticky top-0 z-20 -mx-3 bg-[#0f0f12]/95 px-3 pb-3 pt-4 backdrop-blur">
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="text-lg font-black tracking-tight">
            🔥 Hot Wheels <span className="text-red-500">{data.year}</span>
          </h1>
          <span className="text-xs text-neutral-500">
            {results.length} / {cars.length}
          </span>
        </div>
        <SearchBar value={query} onChange={setQuery} />
        <div className="mt-3">
          <FilterChips
            active={active}
            counts={counts}
            onToggle={toggle}
            onClear={() => setActive(new Set())}
          />
        </div>
      </header>

      <main className="mt-4">
        <CarGrid cars={results} />
      </main>

      <footer className="mt-10 text-center text-xs text-neutral-600">
        Data from hotwheels.fandom.com · updated {data.updatedAt.slice(0, 10)} ·{" "}
        {HOT_ORDER.length} hot categories
      </footer>
    </div>
  );
}
