import Fuse from "fuse.js";
import type { CarGroup, HotType } from "../types";

export function buildIndex(groups: CarGroup[]): Fuse<CarGroup> {
  return new Fuse(groups, {
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

const colNum = (g: CarGroup) => {
  const n = parseInt(g.col ?? "", 10);
  return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
};

const byCol = (a: CarGroup, b: CarGroup) => colNum(a) - colNum(b) || a.name.localeCompare(b.name);

const stripZeros = (s: string) => s.replace(/^0+/, "") || "0";

/**
 * Exact/prefix match on the printed codes, so typing a code jumps straight to it:
 *  - toy # (e.g. "JJM00", the code on the package): case-insensitive prefix
 *  - collector # (e.g. "009" / "9"): numeric-prefix on the 3-digit code
 * Codes need exact matching, not fuzzy — a mistyped code should miss, not match a
 * random car. Matches against any variant's toy # so all colors of a slot surface.
 */
function codeMatches(groups: CarGroup[], q: string): CarGroup[] {
  const upper = q.toUpperCase();
  // Collector # is purely numeric; only match it when the query is all digits,
  // so an alphanumeric toy code ("JJM00") never leaks its digits into col matching.
  const isNumeric = /^\d+$/.test(q);
  return groups.filter((g) => {
    if (g.variants.some((v) => v.toyNum && v.toyNum.toUpperCase().startsWith(upper))) return true;
    if (!isNumeric || !g.col) return false;
    return g.col.startsWith(q) || stripZeros(g.col) === stripZeros(q);
  });
}

/**
 * Filter by query (empty = all) then by active hot types (empty = all).
 * Code hits (toy #, collector #) rank first, then fuzzy name/series matches.
 * Unfiltered results sort by collector #.
 */
export function filterCars(
  groups: CarGroup[],
  index: Fuse<CarGroup>,
  query: string,
  activeHot: Set<HotType>
): CarGroup[] {
  const q = query.trim();
  let results: CarGroup[];
  if (!q) {
    results = [...groups].sort(byCol);
  } else {
    const codeHits = codeMatches(groups, q);
    const seen = new Set(codeHits);
    const fuzzy = index.search(q).map((r) => r.item);
    results = [...codeHits, ...fuzzy.filter((g) => !seen.has(g))];
  }
  if (activeHot.size > 0) {
    results = results.filter((g) => g.hot && activeHot.has(g.hot));
  }
  return results;
}
