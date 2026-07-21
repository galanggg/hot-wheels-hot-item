import { useState } from "react";
import type { Car } from "../types";
import { HOT_META } from "../lib/hot";
import { proxied } from "../lib/img";

export default function CarCard({ car, index }: { car: Car; index: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hot = car.hot ? HOT_META[car.hot] : null;
  const src = proxied(car.img);
  const showImg = src && !imgFailed;

  return (
    <div
      className="card-in group relative flex flex-col border bg-asphalt-2"
      style={
        {
          animationDelay: `${Math.min(index, 12) * 20}ms`,
          borderColor: hot ? "var(--hot)" : "var(--color-line)",
          ...(hot ? { ["--hot" as string]: hot.color } : {}),
        } as React.CSSProperties
      }
    >
      {/* Locked-target HUD ticks — hot cars only */}
      {hot && (
        <>
          <span className="tick tick-tl" aria-hidden="true" />
          <span className="tick tick-tr" aria-hidden="true" />
          <span className="tick tick-bl" aria-hidden="true" />
          <span className="tick tick-br" aria-hidden="true" />
          <span
            className="absolute right-1.5 top-1.5 z-10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: hot.color, color: "var(--color-asphalt)" }}
          >
            {hot.short}
          </span>
        </>
      )}

      {/* image well */}
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden bg-asphalt-3 ${
          hot ? "scan-well" : ""
        }`}
      >
        {showImg ? (
          <img
            src={src!}
            alt={car.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.05]"
          />
        ) : (
          <span className="px-2 text-center text-[11px] uppercase tracking-wide text-muted">
            no signal
          </span>
        )}
      </div>

      {/* data rows */}
      <div className="flex flex-1 flex-col gap-1 border-t border-line p-2">
        <div className="flex items-center justify-between gap-1 text-[11px] text-muted">
          <span className="text-flame">#{car.col ?? "—"}</span>
          {car.seriesNum && <span>{car.seriesNum}</span>}
        </div>
        <h3 className="text-[13px] font-bold leading-tight text-chrome">
          {car.name}
          {car.variant && (
            <span className="ml-1 font-normal text-muted">({car.variant})</span>
          )}
        </h3>
        {car.series && (
          <span
            className="mt-auto inline-block w-fit px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{
              backgroundColor: car.seriesColor ?? "var(--color-asphalt-3)",
              color: car.seriesTextColor ?? "var(--color-ink)",
            }}
          >
            {car.series}
          </span>
        )}
      </div>
    </div>
  );
}
