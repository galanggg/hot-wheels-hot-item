import type { Car, CarGroup, HotType } from "../types";
import { HOT_ORDER } from "./hot";

// Strongest = earliest in HOT_ORDER (STH > TH > NM). Lower index wins.
function strongestHot(cars: Car[]): { hot: HotType | null; variant: string | null } {
  let best: Car | null = null;
  let bestRank = Infinity;
  for (const c of cars) {
    if (!c.hot) continue;
    const rank = HOT_ORDER.indexOf(c.hot);
    if (rank < bestRank) {
      bestRank = rank;
      best = c;
    }
  }
  return best ? { hot: best.hot, variant: best.variant } : { hot: null, variant: null };
}

/**
 * Collapse variant rows into one group per collector number, matching the wiki's
 * "#1-250" numbering. Unnumbered "Confirmed" castings key on their toy # so each
 * stays its own group. Group order and variant order follow the source order.
 */
export function groupCars(cars: Car[]): CarGroup[] {
  const map = new Map<string, Car[]>();
  const order: string[] = [];
  for (const c of cars) {
    const key = c.col ? `c:${c.col}` : `t:${c.toyNum ?? c.name}`;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(c);
  }

  return order.map((key) => {
    const variants = map.get(key)!;
    // Primary = the base row (no variant marker) if present, else the first row.
    const primary = variants.find((v) => !v.variant) ?? variants[0];
    const { hot, variant: hotVariant } = strongestHot(variants);
    return {
      key,
      col: primary.col,
      name: primary.name,
      series: primary.series,
      seriesColor: primary.seriesColor,
      seriesTextColor: primary.seriesTextColor,
      seriesNum: primary.seriesNum,
      img: primary.img,
      hot,
      hotVariant,
      variants,
    };
  });
}
