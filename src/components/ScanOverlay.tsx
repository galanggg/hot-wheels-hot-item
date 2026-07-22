/* Hallmark · component: scan-overlay · genre: atmospheric · theme: Terminal-scanner
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass · pre-emit critique: P5 H4 E5 S4 R5 V4
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type Fuse from "fuse.js";
import type { CarGroup } from "../types";
import { filterCars } from "../lib/search";
import { preprocess, scanCanvas, terminateOcr } from "../lib/ocr";
import { useCamera } from "../lib/useCamera";
import CarCard from "./CarCard";

// Centered band of the native camera frame we OCR — the toy code is small and
// horizontal, so a wide, short crop keeps noise (and CPU) down.
const BOX_W = 0.82;
const BOX_H = 0.18;

const NO_HOT = new Set<never>();

type Phase = "idle" | "scanning" | "result" | "notfound";

interface Props {
  groups: CarGroup[];
  index: Fuse<CarGroup>;
  onClose: () => void;
  onPick: (query: string) => void;
}

export default function ScanOverlay({ groups, index, onClose, onPick }: Props) {
  const { videoRef, status, error, start, stop } = useCamera();
  const [phase, setPhase] = useState<Phase>("idle");
  const [matches, setMatches] = useState<CarGroup[]>([]);
  const [detected, setDetected] = useState<string | null>(null);
  const [rawPeek, setRawPeek] = useState("");
  const runningRef = useRef(false);

  // Arm the camera on open; hook + OCR worker are torn down on unmount.
  useEffect(() => {
    start();
    return () => {
      stop();
      terminateOcr();
    };
  }, [start, stop]);

  // Escape closes the scanner.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const scan = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || runningRef.current) return;
    runningRef.current = true;
    setPhase("scanning");
    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const cw = vw * BOX_W;
      const ch = vh * BOX_H;
      const canvas = preprocess(video, (vw - cw) / 2, (vh - ch) / 2, cw, ch, 2);
      const { raw, codes } = await scanCanvas(canvas);

      const seen = new Set<CarGroup>();
      const hits: CarGroup[] = [];
      for (const code of codes) {
        for (const g of filterCars(groups, index, code, NO_HOT)) {
          if (!seen.has(g)) {
            seen.add(g);
            hits.push(g);
          }
        }
      }

      if (hits.length > 0) {
        setMatches(hits);
        setDetected(codes[0] ?? null);
        setPhase("result");
      } else {
        setRawPeek(raw.replace(/\s+/g, " ").trim().slice(0, 60));
        setDetected(codes[0] ?? null);
        setPhase("notfound");
      }
    } catch {
      setRawPeek("");
      setDetected(null);
      setPhase("notfound");
    } finally {
      runningRef.current = false;
    }
  }, [videoRef, groups, index]);

  const rescan = useCallback(() => {
    setMatches([]);
    setDetected(null);
    setRawPeek("");
    setPhase("idle");
  }, []);

  const pick = useCallback(
    (g: CarGroup) => {
      onPick(g.toyNum ?? g.col ?? g.name);
      onClose();
    },
    [onPick, onClose]
  );

  const live = status === "live";
  const scanning = phase === "scanning";
  const canScan = live && !scanning;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-asphalt"
      role="dialog"
      aria-modal="true"
      aria-label="Live toy-code scanner"
    >
      {/* command bar */}
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 text-[11px] text-muted">
        <span className="flex items-center gap-2 truncate">
          <span className="text-flame">▸</span>
          <span className="truncate">
            hotwheels@aisle<span className="text-ink">:~$</span> scan --live
          </span>
          <span className="shrink-0 border border-flame px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-flame">
            Beta
          </span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-muted transition-colors hover:text-flame"
        >
          esc ✕
        </button>
      </header>

      {/* camera viewport */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="h-full w-full object-cover"
        />

        {/* error / starting overlays */}
        {status === "error" && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-flame">
              &gt; camera offline
            </p>
            <p className="max-w-xs text-[13px] leading-relaxed text-muted">{error.message}</p>
            <button
              type="button"
              onClick={start}
              className="border border-line-2 px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-chrome transition-colors hover:border-flame hover:text-flame"
            >
              ↺ retry
            </button>
          </div>
        )}
        {status === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center text-[12px] uppercase tracking-[0.16em] text-muted">
            arming camera<span className="cursor ml-1 align-baseline" aria-hidden="true" />
          </div>
        )}

        {/* reticle — only while the feed is live and not showing results */}
        {live && phase !== "result" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="relative"
              style={{ width: `${BOX_W * 100}%`, aspectRatio: `${BOX_W} / ${BOX_H}` }}
            >
              <span className="reticle-corner reticle-tl" />
              <span className="reticle-corner reticle-tr" />
              <span className="reticle-corner reticle-bl" />
              <span className="reticle-corner reticle-br" />
              <span className="reticle-sweep" />
            </div>
            <p className="mt-4 px-6 text-center text-[12px] leading-relaxed text-chrome">
              {scanning ? (
                <span className="uppercase tracking-[0.16em] text-flame">
                  reading<span className="cursor ml-1 align-baseline" aria-hidden="true" />
                </span>
              ) : (
                <>
                  Align the <span className="text-flame">toy code</span> (e.g. JJM02) in the frame
                </>
              )}
            </p>
          </div>
        )}

        {/* result / not-found panel slides over the feed */}
        {phase === "result" && (
          <div className="absolute inset-0 flex flex-col bg-asphalt/95 backdrop-blur">
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-muted">
              <span>
                <span className="text-flame">&gt;</span>{" "}
                <span className="text-chrome">{matches.length}</span>{" "}
                {matches.length === 1 ? "match" : "matches"}
                {detected && <span className="ml-2 text-muted">code {detected}</span>}
              </span>
            </div>
            <div className="grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto p-3 sm:grid-cols-3">
              {matches.map((g, i) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => pick(g)}
                  className="text-left"
                  aria-label={`Open ${g.name} in search`}
                >
                  <CarCard group={g} index={i} />
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "notfound" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-asphalt/95 px-6 text-center backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-flame">
              &gt; no lock
            </p>
            <p className="max-w-xs text-[13px] leading-relaxed text-muted">
              {detected
                ? `Read "${detected}" but no such code in this set.`
                : "Couldn't read a toy code. Hold steady, fill the frame, avoid glare."}
              {rawPeek && <span className="mt-2 block text-[11px] text-muted/70">saw: {rawPeek}</span>}
            </p>
          </div>
        )}
      </div>

      {/* action dock */}
      <div className="flex gap-2 border-t border-line px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {phase === "result" || phase === "notfound" ? (
          <button
            type="button"
            onClick={rescan}
            className="flex-1 border border-flame bg-flame/10 py-3 text-[13px] font-bold uppercase tracking-[0.16em] text-flame transition-colors hover:bg-flame/20"
          >
            ↺ scan again
          </button>
        ) : (
          <button
            type="button"
            onClick={scan}
            disabled={!canScan}
            className="flex-1 border border-flame bg-flame py-3 text-[13px] font-bold uppercase tracking-[0.16em] text-asphalt transition-colors enabled:active:translate-y-px disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-muted"
          >
            {scanning ? "reading…" : "▸ scan code"}
          </button>
        )}
      </div>
    </div>
  );
}
