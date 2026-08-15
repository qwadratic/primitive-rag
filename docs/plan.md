# Solution plan

## What this is
A CLI that answers questions about Марина Ковалёва's messy 6-month data export
(`dataset/`) by combining facts from multiple sources, with cited paths.

## Decisions the user (owner) made
- Direction: RAG-style Q&A tool (of the 3 proposed).
- Iteration order: recon → sample → draft two question sets (5 answerable-from-samples,
  15 self-eval) → embedding spike/pause → build.
- **Mid-build pivot**: instead of PGLite/pgvector + a chosen embedding model, use
  `claude -p` (Claude Code headless mode) itself as the extraction *and* reasoning
  primitive, with reusable prompt patterns stored under `claude-p/<pattern>/pattern.md`,
  wired into a small DAG (extract → answer). Priority: get a working tool submitted ASAP
  to receive real eval feedback rather than polishing an untested architecture.

## Decisions I made under that pivot
- **No vector DB, no embeddings at all.** The corpus is 96 files; once distilled to
  compact per-file "cards" (~a few hundred words each), the whole index fits comfortably
  in one LLM context window. Retrieval-by-embedding solves a scale problem this dataset
  doesn't have — skipping it removes an entire failure surface (chunking config,
  embedding model choice, similarity-threshold tuning) for zero real cost here.
- **Two-phase DAG, not one big agentic call per question:**
  1. `ingest` — one `claude -p --allowedTools Read` call per source file, using the
     `extract-facts` pattern, in parallel (concurrency 10). Output: `index/<same path>.md`,
     a compact card (source/type/date/people/project/amounts/summary/quotes). This also
     satisfies "metadata not purely from embeddings" — date/people/project/amounts are
     extracted as structured-ish fields at ingest time, not inferred later.
     Screenshots go through the identical pattern — Claude Code's Read tool is multimodal,
     so no separate OCR/vision-captioning step was needed (resolves the earlier open
     question about tesseract vs. vision API).
  2. `query "<question>"` — concatenates all cards, calls `claude -p` once with the
     `answer-question` pattern (full context, no retrieval-by-similarity step), which must
     answer in the exact hackathon format (`ОТВЕТ:` / `ОСНОВАНИЕ:` / `SOURCES:`), citing
     only files that materially support the answer.
- **Prompt patterns are plain markdown, not a schema-enforcing framework** — per
  instruction, `claude-p/<pattern>/pattern.md` describes input/instruction/output shape in
  prose a human can read directly; nothing validates it programmatically. The CLI treats
  `claude -p` output as text and regexes out the three required lines for the
  `sources`/`answer` split needed by `/api/answers`.
- **Excluded from the index:** `notes/пароли где.md`, `notes/пароли не хранить тут.md`
  (never read/embedded/stored — passwords should not enter a search index regardless of
  whether they'd ever surface in an answer); `messages/*_export.txt` (verified duplicate
  of the paired `.json` — same conversations, ingest JSON only to avoid double-citing the
  same fact from two files).

## Minimal detail to execute / re-run
```
node bin/cli.mjs ingest              # writes index/**/*.md (idempotent, skips existing)
node bin/cli.mjs ingest --force      # re-extract everything
node bin/cli.mjs query "<question>"  # prints ОТВЕТ/ОСНОВАНИЕ + a SOURCES line
```
Requires the `claude` CLI on PATH (already the case in this environment) and no other
secrets/services — that's the whole point of the pivot.

## What got dropped from the original spec (and why that's OK)
The earlier plan asked for `ingest (partial/full)`, `chunking config`, `embed`, `query`,
plus a metadata column — a PGLite+pgvector shape. `ingest`/`query` survive; `chunk`/`embed`
don't apply once there's no vector column, and structured metadata comes from the
extraction cards themselves instead of DB columns. Flagging this explicitly rather than
quietly renaming things to look like I did the original plan.
