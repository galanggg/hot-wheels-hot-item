import { useState } from "react";
import type { Car } from "../types";
import { HOT_META } from "../lib/hot";
import { proxied } from "../lib/img";

export default function CarCard({ car }: { car: Car }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hot = car.hot ? HOT_META[car.hot] : null;
  const src = proxied(car.img);
  const showImg = src && !imgFailed;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl bg-neutral-900 ${
        hot ? hot.ring : "ring-1 ring-white/10"
      }`}
    >
      {hot && (
        <span
          className={`absolute right-2 top-2 z-10 rounded-full px-2 py-0.5 text-xs font-extrabold shadow ${hot.badge}`}
        >
          {car.hot === "NM" ? "NEW" : `🔥 ${hot.short}`}
        </span>
      )}

      <div className="flex aspect-square items-center justify-center bg-neutral-800">
        {showImg ? (
          <img
            src={src!}
            alt={car.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="px-2 text-center text-xs text-neutral-500">No photo yet</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <div className="flex items-start justify-between gap-1 text-xs text-neutral-400">
          <span className="font-mono">#{car.col ?? "—"}</span>
          {car.seriesNum && <span>{car.seriesNum}</span>}
        </div>
        <h3 className="text-sm font-semibold leading-tight">
          {car.name}
          {car.variant && (
            <span className="ml-1 text-xs font-normal text-neutral-400">({car.variant})</span>
          )}
        </h3>
        {car.series && (
          <span
            className="mt-auto inline-block w-fit rounded px-1.5 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: car.seriesColor ?? "#333",
              color: car.seriesTextColor ?? "white",
            }}
          >
            {car.series}
          </span>
        )}
      </div>
    </div>
  );
}
