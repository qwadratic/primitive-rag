#!/usr/bin/env node
// Слои-CLI — turns the messy dataset/ export into answers, using `claude -p` as the
// extraction+reasoning primitive (see ./claude-p/<pattern>/pattern.md) instead of an
// embeddings/vector pipeline. See docs/plan.md for why.

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const ROOT = process.cwd();
// Configurable so the same tool can be pointed at a second archive (e.g. a round-2
// eval dataset) without touching any logic — just DATASET_DIR/INDEX_DIR env vars.
const DATASET = path.resolve(ROOT, process.env.DATASET_DIR || "dataset");
const INDEX = path.resolve(ROOT, process.env.INDEX_DIR || "index");

const SKIP_EXACT = new Set([
]);

function isRedundantExportTwin(rel) {
  // messages/<chat>.json and messages/<chat>_export.txt are the same conversation twice.
  return /^messages\/.*_export\.txt$/.test(rel);
}

async function listDatasetFiles() {
  const entries = await fs.readdir(DATASET, { recursive: true, withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const abs = path.join(e.parentPath ?? e.path, e.name);
    const rel = path.relative(DATASET, abs).split(path.sep).join("/");
    if (SKIP_EXACT.has(rel)) continue;
    if (isRedundantExportTwin(rel)) continue;
    files.push(rel);
  }
  return files.sort();
}

function runClaudeP(prompt, { cwd = ROOT } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "claude",
      ["-p", prompt, "--allowedTools", "Read", "--output-format", "text"],
      { cwd, stdio: ["ignore", "pipe", "pipe"] }
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`claude -p exited ${code}: ${err.slice(0, 500)}`));
      else resolve(out.trim());
    });
  });
}

async function pLimit(concurrency, items, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runOne() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runOne));
  return results;
}

function fillPattern(template, vars) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`%${k}%`, v);
  }
  return out;
}

async function loadPattern(name) {
  return fs.readFile(path.join(ROOT, "claude-p", name, "pattern.md"), "utf8");
}

// --- ingest ---------------------------------------------------------------

async function ingest({ limit, concurrency = 10, force = false } = {}) {
  const pattern = await loadPattern("extract-facts");
  let files = await listDatasetFiles();
  if (limit) files = files.slice(0, limit);

  const todo = [];
  for (const rel of files) {
    const outPath = path.join(INDEX, rel + ".md");
    if (!force) {
      try {
        await fs.access(outPath);
        continue; // already ingested
      } catch {}
    }
    todo.push({ rel, outPath });
  }

  console.log(`ingest: ${todo.length} file(s) to process (of ${files.length} total, concurrency=${concurrency})`);
  let done = 0;
  await pLimit(concurrency, todo, async ({ rel, outPath }) => {
    const datasetRel = path.relative(ROOT, DATASET).split(path.sep).join("/");
    const instruction = fillPattern(pattern, { source_path: `${datasetRel}/${rel}` });
    // The pattern.md itself contains the full spec (input/instruction/output format);
    // send it verbatim as the prompt — claude -p reads the file itself via the Read tool.
    try {
      const card = await runClaudeP(instruction);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, card + "\n", "utf8");
      done++;
      console.log(`  [${done}/${todo.length}] ok  ${rel}`);
    } catch (e) {
      console.error(`  [${done}/${todo.length}] FAIL ${rel}: ${e.message}`);
    }
  });
  console.log(`ingest done: ${done}/${todo.length} written to ${path.relative(ROOT, INDEX)}/`);
}

// --- query ------------------------------------------------------------

async function loadAllCards() {
  let paths = [];
  try {
    const entries = await fs.readdir(INDEX, { recursive: true, withFileTypes: true });
    paths = entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => path.join(e.parentPath ?? e.path, e.name));
  } catch {
    return "";
  }
  paths.sort();
  const parts = await Promise.all(paths.map((p) => fs.readFile(p, "utf8")));
  return parts.join("\n---\n");
}

function parseAnswer(raw) {
  const answerLine = raw.match(/ОТВЕТ:.*(?:\n(?!ОСНОВАНИЕ:|SOURCES:).*)*/)?.[0]?.trim() ?? "";
  const basisLine = raw.match(/ОСНОВАНИЕ:.*(?:\n(?!SOURCES:).*)*/)?.[0]?.trim() ?? "";
  const sourcesLine = raw.match(/SOURCES:\s*(.*)/)?.[1]?.trim() ?? "";
  const sources = sourcesLine
    ? sourcesLine.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const answer = [answerLine, basisLine].filter(Boolean).join("\n");
  return { answer: answer || raw.trim(), sources, raw };
}

async function query(question) {
  const cardsBlob = await loadAllCards();
  if (!cardsBlob) {
    throw new Error("index/ is empty — run `ingest` first");
  }
  const tmp = path.join(os.tmpdir(), `slои-candidates-${Date.now()}.txt`);
  await fs.writeFile(tmp, cardsBlob, "utf8");
  try {
    const pattern = await loadPattern("answer-question");
    const relTmp = path.relative(ROOT, tmp);
    const prompt = fillPattern(pattern, {
      question,
      candidates_path: relTmp,
    });
    const raw = await runClaudeP(prompt);
    return parseAnswer(raw);
  } finally {
    await fs.unlink(tmp).catch(() => {});
  }
}

// --- CLI entry --------------------------------------------------------

async function main() {
  const [, , cmd, ...rest] = process.argv;
  if (cmd === "ingest") {
    const limitFlag = rest.indexOf("--limit");
    const limit = limitFlag >= 0 ? Number(rest[limitFlag + 1]) : undefined;
    const force = rest.includes("--force");
    await ingest({ limit, force });
  } else if (cmd === "query") {
    const question = rest.join(" ");
    if (!question) throw new Error('usage: cli.mjs query "<question>"');
    const result = await query(question);
    console.log(result.answer);
    console.log("SOURCES:", result.sources.join(", "));
  } else {
    console.log(`usage:
  cli.mjs ingest [--limit N] [--force]   extract cards for dataset/ files into index/
  cli.mjs query "<question>"             answer a question from the full index`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exitCode = 1;
});
