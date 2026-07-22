import { useState } from "react";
import type { CarGroup } from "../types";
import { HOT_META } from "../lib/hot";
import { proxied } from "../lib/img";

export default function CarCard({ group, index }: { group: CarGroup; index: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hot = group.hot ? HOT_META[group.hot] : null;
  const src = proxied(group.img);
  const showImg = src && !imgFailed;
  const colorCount = group.variants.length;
  // Variant thumbnails (skip the primary, keep ones that actually have an image).
  const others = group.variants.filter((v) => v.img && v.img !== group.img).slice(0, 4);

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

      {/* colors badge — multi-variant slots only */}
      {colorCount > 1 && (
        <span className="absolute left-1.5 top-1.5 z-10 border border-line bg-asphalt-3/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-chrome">
          {colorCount} colors
        </span>
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
            alt={group.name}
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

      {/* variant thumbnail strip */}
      {others.length > 0 && (
        <div className="flex gap-1 border-t border-line bg-asphalt-3 p-1">
          {others.map((v, i) => (
            <div
              key={`${v.toyNum ?? v.variant ?? i}`}
              className="relative aspect-square w-8 shrink-0 overflow-hidden border"
              style={{ borderColor: v.hot ? HOT_META[v.hot].color : "var(--color-line)" }}
              title={v.variant ?? v.name}
            >
              <img
                src={proxied(v.img)!}
                alt={v.variant ?? v.name}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </div>
      )}

      {/* data rows */}
      <div className="flex flex-1 flex-col gap-1 border-t border-line p-2">
        <div className="flex items-center justify-between gap-1 text-[11px] text-muted">
          <span className="flex items-baseline gap-1.5">
            <span className="text-flame">#{group.col ?? "—"}</span>
            {group.toyNum && (
              <span className="tracking-wide text-muted" title="Toy number">
                {group.toyNum}
              </span>
            )}
          </span>
          {group.seriesNum && <span>{group.seriesNum}</span>}
        </div>
        <h3 className="text-[13px] font-bold leading-tight text-chrome">{group.name}</h3>
        {hot && group.hotVariant && (
          <span className="text-[10px] uppercase tracking-wide" style={{ color: hot.color }}>
            {hot.short} · {group.hotVariant}
          </span>
        )}
        {group.series && (
          <span
            className="mt-auto inline-block w-fit px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{
              backgroundColor: group.seriesColor ?? "var(--color-asphalt-3)",
              color: group.seriesTextColor ?? "var(--color-ink)",
            }}
          >
            {group.series}
          </span>
        )}
      </div>
    </div>
  );
}
