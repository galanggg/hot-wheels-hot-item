import type { HotType } from "../types";

export interface HotMeta {
  label: string;
  short: string;
  badge: string; // tailwind classes for the badge pill
  ring: string; // tailwind ring color for the card
}

export const HOT_META: Record<HotType, HotMeta> = {
  STH: {
    label: "Super Treasure Hunt",
    short: "STH",
    badge: "bg-amber-400 text-black",
    ring: "ring-2 ring-amber-400",
  },
  TH: {
    label: "Treasure Hunt",
    short: "TH",
    badge: "bg-emerald-500 text-black",
    ring: "ring-2 ring-emerald-500",
  },
  NM: {
    label: "New Model",
    short: "NEW",
    badge: "bg-sky-500 text-black",
    ring: "ring-1 ring-sky-500/60",
  },
};

export const HOT_ORDER: HotType[] = ["STH", "TH", "NM"];
