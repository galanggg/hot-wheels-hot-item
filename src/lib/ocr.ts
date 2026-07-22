import { createWorker, PSM, type Worker } from "tesseract.js";

/**
 * On-device OCR for the toy code (casting code) printed on a Hot Wheels blister.
 * 2026 mainline codes are all shaped AAA99 — three letters, two digits (e.g.
 * "JJM02"). We recognise the framed region, then coerce common OCR letter/digit
 * confusions per position before validating against that shape.
 *
 * The tesseract worker (WASM core + English traineddata) is heavy, so it is
 * created lazily on first scan and kept as a singleton for the session.
 */

const TOY_CODE_RE = /^[A-Z]{3}[0-9]{2}$/;

let workerPromise: Promise<Worker> | null = null;

/** Lazily create (once) the shared OCR worker. */
export function initOcr(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker("eng");
      await worker.setParameters({
        // Codes are uppercase alphanumerics; the slash lets a stray "9/250"
        // collector read survive without derailing the letter/digit split.
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/",
        // Codes sit as scattered small tokens on the card, not a text block.
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      });
      return worker;
    })();
  }
  return workerPromise;
}

/** Free the worker + its WASM memory (call when the scanner closes). */
export async function terminateOcr(): Promise<void> {
  if (!workerPromise) return;
  const p = workerPromise;
  workerPromise = null;
  try {
    (await p).terminate();
  } catch {
    /* already gone */
  }
}

/**
 * Crop a region out of a video/canvas source, upscale it, and binarise
 * (grayscale + global mean threshold). Small on-card text OCRs far better
 * black-on-white and enlarged than as a raw phone-camera frame.
 */
export function preprocess(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  scale = 2
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = g;
    sum += g;
  }
  // Threshold a touch below the mean so glossy highlights don't wash text out.
  const threshold = (sum / (d.length / 4)) * 0.9;
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] < threshold ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Position-aware fixes: letters can be misread as digits and vice-versa.
const TO_LETTER: Record<string, string> = {
  "0": "O", "1": "I", "2": "Z", "4": "A", "5": "S", "6": "G", "8": "B",
};
const TO_DIGIT: Record<string, string> = {
  O: "0", Q: "0", D: "0", I: "1", L: "1", Z: "2", A: "4", S: "5", G: "6", B: "8",
};

/**
 * Coerce a 5-char token to the AAA99 shape. Returns the code plus how many
 * characters had to be swapped (fewer = more confident read), or null if the
 * token can't be forced into shape. Ordinary words ("WHEELS") can coerce into
 * a valid-shaped code, but they need more fixes than a clean on-card read, so
 * confidence lets the real code outrank such phantoms.
 */
function coerce(token: string): { code: string; fixes: number } | null {
  if (token.length !== 5) return null;
  const chars = token.split("");
  let fixes = 0;
  const letters = chars.slice(0, 3).map((c) => {
    if (/[A-Z]/.test(c)) return c;
    fixes++;
    return TO_LETTER[c] ?? c;
  });
  const digits = chars.slice(3, 5).map((c) => {
    if (/[0-9]/.test(c)) return c;
    fixes++;
    return TO_DIGIT[c] ?? c;
  });
  const code = letters.join("") + digits.join("");
  return TOY_CODE_RE.test(code) ? { code, fixes } : null;
}

/**
 * Pull every plausible AAA99 toy code out of raw OCR text, most-confident
 * first. Splits on non-alphanumerics, then slides a 5-char window over each
 * token so a code touching neighbouring ink ("©JJM02") is still recovered.
 */
export function extractToyCodes(raw: string): string[] {
  const best = new Map<string, number>(); // code -> fewest fixes seen
  const tokens = raw.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    for (let i = 0; i + 5 <= token.length; i++) {
      const hit = coerce(token.slice(i, i + 5));
      if (!hit) continue;
      const prev = best.get(hit.code);
      if (prev === undefined || hit.fixes < prev) best.set(hit.code, hit.fixes);
    }
  }
  return [...best.entries()].sort((a, b) => a[1] - b[1]).map(([code]) => code);
}

export interface ScanResult {
  raw: string;
  codes: string[];
}

/** Run OCR on a prepared canvas and return raw text + detected toy codes. */
export async function scanCanvas(canvas: HTMLCanvasElement): Promise<ScanResult> {
  const worker = await initOcr();
  const { data } = await worker.recognize(canvas);
  return { raw: data.text, codes: extractToyCodes(data.text) };
}
