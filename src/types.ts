export type HotType = "TH" | "STH" | "NM";

export interface Car {
  toyNum: string | null;
  col: string | null;
  name: string;
  variant: string | null;
  series: string | null;
  seriesColor: string | null;
  seriesTextColor: string | null;
  seriesNum: string | null;
  hot: HotType | null;
  img: string | null;
}

export interface Catalog {
  year: number;
  updatedAt: string;
  cars: Car[];
}

/**
 * One collector-number slot on the wiki (#1-250). A casting listed with several
 * color variations collapses into a single group so our count matches the wiki.
 */
export interface CarGroup {
  key: string;
  col: string | null;
  toyNum: string | null; // primary variant toy/casting code (printed on blister card)
  name: string;
  series: string | null;
  seriesColor: string | null;
  seriesTextColor: string | null;
  seriesNum: string | null;
  img: string | null; // primary variant image
  hot: HotType | null; // strongest hot flag across variants
  hotVariant: string | null; // label of the hot variant (e.g. "2nd Color")
  variants: Car[]; // every variant row, primary first
}
