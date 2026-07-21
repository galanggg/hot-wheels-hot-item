import Fuse from "fuse.js";
import type { Car, HotType } from "../types";

export function buildIndex(cars: Car[]): Fuse<Car> {
  return new Fuse(cars, {
    // Codes (toy #, collector #) are handled by exact matching in filterCars;
    // Fuse only does fuzzy name/series so a code query can't leak fuzzy noise.
    keys: [
      { name: "name", weight: 0.8 },
      { name: "series", weight: 0.2 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
}

const colNum = (c: Car) => {
  const n = parseInt(c.col ?? "", 10);
  return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
};

const byCol = (a: Car, b: Car) => colNum(a) - colNum(b) || a.name.localeCompare(b.name);

const stripZeros = (s: string) => s.replace(/^0+/, "") || "0";

/**
 * Exact/prefix match on the printed codes, so typing a code jumps straight to it:
 *  - toy # (e.g. "JJM00", the code on the package): case-insensitive prefix
 *  - collector # (e.g. "009" / "9"): numeric-prefix on the 3-digit code
 * Codes need exact matching, not fuzzy — a mistyped code should miss, not match a
 * random car. Kept separate from Fuse for that reason.
 */
function codeMatches(cars: Car[], q: string): Car[] {
  const upper = q.toUpperCase();
  // Collector # is purely numeric; only match it when the query is all digits,
  // so an alphanumeric toy code ("JJM00") never leaks its digits into col matching.
  const isNumeric = /^\d+$/.test(q);
  return cars.filter((c) => {
    if (c.toyNum && c.toyNum.toUpperCase().startsWith(upper)) return true;
    if (!isNumeric || !c.col) return false;
    return c.col.startsWith(q) || stripZeros(c.col) === stripZeros(q);
  });
}

/**
 * Filter by query (empty = all) then by active hot types (empty = all).
 * Code hits (toy #, collector #) rank first, then fuzzy name/series matches.
 * Unfiltered results sort by collector #.
 */
export function filterCars(
  cars: Car[],
  index: Fuse<Car>,
  query: string,
  activeHot: Set<HotType>
): Car[] {
  const q = query.trim();
  let results: Car[];
  if (!q) {
    results = [...cars].sort(byCol);
  } else {
    const codeHits = codeMatches(cars, q);
    const seen = new Set(codeHits);
    const fuzzy = index.search(q).map((r) => r.item);
    results = [...codeHits, ...fuzzy.filter((c) => !seen.has(c))];
  }
  if (activeHot.size > 0) {
    results = results.filter((c) => c.hot && activeHot.has(c.hot));
  }
  return results;
}
