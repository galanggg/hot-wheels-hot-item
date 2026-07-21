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
