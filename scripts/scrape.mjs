// Scrape the 2026 Hot Wheels list from the fandom wiki (MediaWiki API) into a
// static JSON catalog. Re-run with `npm run scrape` to refresh.
//
// The default fetch User-Agent gets HTTP 402 from fandom, so we send a browser UA.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const YEAR = 2026;
const PAGE = "List_of_2026_Hot_Wheels";
const API = "https://hotwheels.fandom.com/api.php";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";
const PLACEHOLDER = "Image Not Available.jpg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data", "cars.json");

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", ...params })}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`API ${res.status} for ${url}`);
  return res.json();
}

async function fetchWikitext() {
  const d = await api({ action: "parse", page: PAGE, prop: "wikitext" });
  return d.parse.wikitext["*"];
}

// Pull every "{| ... |}" wikitable block out of the page.
function extractTables(wt) {
  const tables = [];
  let i = 0;
  while ((i = wt.indexOf("{|", i)) !== -1) {
    const end = wt.indexOf("\n|}", i);
    if (end === -1) break;
    tables.push(wt.slice(i, end));
    i = end + 3;
  }
  return tables;
}

function firstMatch(re, s) {
  const m = s.match(re);
  return m ? m[1] : null;
}

// Strip HTML/wiki markup (font tags, bold, refs) to plain text.
function stripMarkup(s) {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/'''?/g, "")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .trim();
}

// [[Target|Display]] or [[Name]] -> display text (markup stripped)
function linkText(cell) {
  const m = cell.match(/\[\[([^\]]+)\]\]/);
  if (!m) return null;
  const inner = m[1];
  return stripMarkup(inner.includes("|") ? inner.split("|").pop() : inner);
}

function parseNameCell(cell) {
  const name = linkText(cell) ?? stripMarkup(cell.replace(/[\[\]]/g, ""));
  // Variant marker sits in the cell after the link, e.g. "[[...]] (2nd Color)".
  const v = cell.match(/\(([^)]*(?:Color|Version|Variant)[^)]*)\)/i);
  return { name, variant: v ? v[1].trim() : null };
}

function parseSeriesCell(cell) {
  const seriesColor = firstMatch(/bgcolor\s*=\s*"?([^"|\s]+)"?/, cell);
  const seriesTextColor = firstMatch(/<font\s+color\s*=\s*"?([^"\s>]+)"?/, cell) ?? "black";
  const series = linkText(cell);
  let hot = null;
  if (/\{\{STH/.test(cell)) hot = "STH";
  else if (/\{\{TH/.test(cell)) hot = "TH";
  else if (/\{\{(NM|WM)/.test(cell)) hot = "NM";
  return { series, seriesColor, seriesTextColor, hot };
}

function parseFileCell(cell) {
  const f = firstMatch(/\[\[File:([^\]|]+)/, cell);
  if (!f) return null;
  const file = f.trim();
  return file === PLACEHOLDER ? null : file;
}

function parseRows(table) {
  const cars = [];
  const rows = table.split(/\n\|-\s*\n/).slice(1); // drop header block
  for (const row of rows) {
    if (/^\s*!/.test(row)) continue; // header row
    // Cells start with "\n|" (or "|" at row start). Split, drop the leading empty.
    const cells = row
      .split(/\n\|/)
      .map((c) => c.replace(/^\|/, "").trim())
      .filter((_, idx) => idx > 0 || true);
    // Normalize: first element may be "" if row began with a newline.
    const c = cells[0] === "" ? cells.slice(1) : cells;
    if (c.length < 3) continue;
    const [toyNum, col, nameCell, seriesCell, seriesNum, fileCell] = c;
    const { name, variant } = parseNameCell(nameCell ?? "");
    if (!name) continue;
    const { series, seriesColor, seriesTextColor, hot } = parseSeriesCell(seriesCell ?? "");
    cars.push({
      toyNum: (toyNum ?? "").trim() || null,
      col: (col ?? "").trim() || null,
      name,
      variant,
      series,
      seriesColor,
      seriesTextColor,
      seriesNum: (seriesNum ?? "").trim() || null,
      hot,
      file: parseFileCell(fileCell ?? ""),
      img: null,
    });
  }
  return cars;
}

// Resolve File:*.jpg names to CDN thumbnail URLs, batched (50/query).
async function resolveImages(cars) {
  const files = [...new Set(cars.map((c) => c.file).filter(Boolean))];
  const map = new Map();
  for (let i = 0; i < files.length; i += 50) {
    const batch = files.slice(i, i + 50);
    const titles = batch.map((f) => `File:${f}`).join("|");
    const d = await api({
      action: "query",
      titles,
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: "200",
    });
    const pages = d.query?.pages ?? {};
    for (const p of Object.values(pages)) {
      const info = p.imageinfo?.[0];
      if (info && p.title) {
        map.set(p.title.replace(/^File:/, ""), info.thumburl ?? info.url);
      }
    }
    process.stdout.write(`  images ${Math.min(i + 50, files.length)}/${files.length}\r`);
  }
  console.log("");
  for (const c of cars) {
    if (c.file) c.img = map.get(c.file) ?? null;
    delete c.file;
  }
}

async function main() {
  console.log("Fetching wikitext...");
  const wt = await fetchWikitext();
  const tables = extractTables(wt);
  console.log(`Found ${tables.length} table(s).`);
  const cars = tables.flatMap(parseRows);
  console.log(`Parsed ${cars.length} rows. Resolving images...`);
  await resolveImages(cars);
  const hot = cars.filter((c) => c.hot);
  console.log(`Hot items: ${hot.length} (TH=${hot.filter((c) => c.hot === "TH").length}, STH=${hot.filter((c) => c.hot === "STH").length}, NM=${hot.filter((c) => c.hot === "NM").length})`);
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    JSON.stringify({ year: YEAR, updatedAt: new Date().toISOString(), cars }, null, 2)
  );
  console.log(`Wrote ${cars.length} cars -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
