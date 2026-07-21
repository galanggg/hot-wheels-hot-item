import type { HotType } from "../types";

export interface HotMeta {
  label: string; // full collector name
  short: string; // badge text
  color: string; // css var token for --hot (spectraflame / foil / ring)
}

export const HOT_META: Record<HotType, HotMeta> = {
  STH: {
    label: "Super Treasure Hunt",
    short: "STH",
    color: "var(--color-sth)",
  },
  TH: {
    label: "Treasure Hunt",
    short: "TH",
    color: "var(--color-th)",
  },
  NM: {
    label: "New Model",
    short: "NEW",
    color: "var(--color-nm)",
  },
};

export const HOT_ORDER: HotType[] = ["STH", "TH", "NM"];
