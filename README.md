<h1 align="center">🧩 Primitive RAG</h1>
<p align="center"><b>A CLI that reads a messy 6-month export of someone's life — notes, chats, invoices, calendar, call transcripts, screenshots — and actually answers questions about it, with receipts.</b></p>

<p align="center">
  <img src="demo.gif" alt="Primitive RAG CLI demo: dataset overview, then two live queries answered with sources" width="720">
</p>

<p align="center">
  Built in one sitting at <a href="https://hackathon-live.aimindset.org">AI Mindset S26</a> · participant code <code>PPZM</code>
</p>

---

## The problem

Give someone's real data export to an LLM and ask it a question, and you'll usually get
one of two failures: it answers from a single lucky file and misses the rest, or it dumps
every loosely-related snippet and calls that an answer. Neither is useful when the real
answer needs three sources cross-referenced — an invoice, a time-tracking note, and a
Slack-style DM thread that all disagree slightly with each other.

**Primitive RAG** is a small CLI built to do the actual work: read everything once, turn
it into structured per-file "cards," then answer questions by reasoning across the whole
card index — and always show which files the answer is actually standing on. "Primitive"
because there's no vector DB, no embeddings, no framework — just `claude -p` calls and
plain files, and it still out-performs what those usually buy you at this corpus size.

## How it works

No embeddings, no vector DB. At this corpus size (~90 files), the whole index fits in one
LLM context window, so retrieval-by-similarity solves a scale problem this dataset doesn't
have. Instead:

```
dataset/*  ──ingest──>  index/*.md          (one claude -p call per file, parallel)
                              │
question ────────────────────┴──answer──>   ОТВЕТ + ОСНОВАНИЕ + SOURCES
                         (one claude -p call, full context, no chunking)
```

- **`claude -p`** (Claude Code's headless mode) is the only reasoning primitive — no
  custom model glue, no framework. Every prompt is a plain markdown file a human can read,
  under [`claude-p/`](claude-p/): [`extract-facts`](claude-p/extract-facts/pattern.md)
  turns one raw file into a compact card (dates, people, project, amounts, summary,
  quotes); [`answer-question`](claude-p/answer-question/pattern.md) turns a question + the
  full card index into a cited answer.
- **Multimodal for free.** Screenshots go through the identical extraction pattern —
  Claude Code's `Read` tool reads images directly, so no separate OCR step was needed.
- **Metadata isn't bolted on.** Dates/people/project/amounts are extracted as structured
  fields at ingest time, not inferred later from embeddings.

Full design rationale (including the embeddings-vs-local-model spike that led to dropping
vector search entirely): [`docs/plan.md`](docs/plan.md).

## Quick start

```bash
node bin/cli.mjs ingest              # extract cards for dataset/ into index/ (idempotent)
node bin/cli.mjs query "<question>"  # answer, citing sources
```

Point it at a different export without touching any code:

```bash
DATASET_DIR=dataset-round-2 INDEX_DIR=index-round-2 node bin/cli.mjs ingest
DATASET_DIR=dataset-round-2 INDEX_DIR=index-round-2 node bin/cli.mjs query "..."
```

Requires only the `claude` CLI on `PATH`. No API keys, no database, no build step.

## Does it actually work?

Self-evaluated against 20 questions before submitting anywhere (5 answerable directly
from a hand-sampled subset, 15 harder ones designed to require info *outside* that
subset) — see [`docs/questions.md`](docs/questions.md) and raw outputs in
[`selfeval/`](selfeval/).

Then graded live against a second, unseen dataset by the hackathon organizers — real
questions, real scoring, real gaps found:

| Round | Questions | What happened |
|---|---|---|
| 2 | 5, against a second unseen export | Graded against a reference answer per-source (`match.hit/need`), no numeric score exposed; average source-recall ~60%. Full transcript + grader feedback: [`qa/`](qa/) |
| 3 | 1, back on the original export, after the round-2 fix | **Scored 2/2** (top tier) on the organizer's own rubric — closed and confirmed final | [`qa/`](qa/) |

The round-2 feedback surfaced a real, fixable gap: the tool used facts from the calendar
card but didn't always cite the calendar file itself as a source. That got fixed in
[`claude-p/answer-question/pattern.md`](claude-p/answer-question/pattern.md) — a
self-audit step ("for every fact in your answer, is its source in your SOURCES list?")
and an explicit instruction to always check the calendar card. Verified by re-running
the same 5 questions afterward (also in `qa/`).

The full chronology — every decision, every pivot, every self-correction — is in
[`RUNBOOK.md`](RUNBOOK.md).

## Session details

Full raw transcript and the numbers behind it: [`session/`](session/) (transcript +
[`session/token-usage.json`](session/token-usage.json)).

- **Rounds participated in:** 2 (5 questions, unseen second dataset) and 3 (1 question,
  original dataset, after the round-2 fix) — round 1 was already closed when this session
  joined; retroactively simulated on a separate branch, see below.
- **Assistant turns:** 417 in the main orchestrating conversation, plus 962 more spread
  across 223 separate `claude -p` subprocess calls the CLI itself spawned (87+92 file
  ingests, ~20 self-eval queries, the graded rounds, and reruns) — 1,379 total.
- **Tokens:** ~834K output tokens (main session) + ~527K (subprocess calls) generated;
  ~127M tokens served from prompt cache across everything (re-sending the full card index
  on every `query` call is exactly what prompt caching is for). Full breakdown in
  [`session/token-usage.json`](session/token-usage.json).
- **Estimated cost: ~$192**, using published list pricing and Anthropic's standard cache
  multipliers (not a billed figure — the raw logs don't include one). The estimate breaks
  down as ~$25 for the main session (Sonnet 5) and **~$167 for the 223 `claude -p`
  subprocess calls** — because those default to **Opus 5**, not this session's Sonnet 5.
  That mismatch was never intentional; it's the single most impactful thing a rebuild
  would fix (`claude -p --model claude-sonnet-5 ...` on every ingest/query call would cut
  the dominant cost line by roughly 5×, since Opus is priced well above Sonnet).
- **Most impactful prompt:** *"lets use 'claude -p' as a primitive... wire it to DAG"* —
  the message that discarded the original PGLite/pgvector plan mid-build and replaced it
  with the architecture this whole repo is built on. Everything downstream (the
  `claude-p/` pattern library, the zero-dependency CLI, the ability to reindex a second
  dataset with an env var instead of a rewrite) traces back to that one redirect.
- **Round-1 retrospective:** the organizer later shared round 1's reference answers after
  the fact (we joined at round 2). A separate agent replayed round 1's 5 questions on the
  `round1-simulation` branch, using the tool exactly as it existed *before* the round-2
  feedback fixes — a fair before/after comparison, not hindsight-tuned.

## Repo layout

```
claude-p/          prompt patterns (the actual "model" of this tool — plain markdown)
bin/cli.mjs         the CLI: ingest + query
dataset/            round-1 data export (Марина Ковалёва, студия «Слои»)
dataset-round-2/    round-2 data export (Ирина Соболева, студия «Грани»)
index/, index-round-2/   extracted cards per dataset
docs/               reasoning log, question sets, design plan
samples/            hand-picked excerpts from early data exploration
selfeval/           pre-submission self-eval answers (20 questions)
qa/                 questions + answers (rounds 2, 3) + qa/feedback.json (grader feedback + rubric)
session/            raw session transcript + token/cost breakdown
demo.mp4, demo.gif, demo.cast   the recording above (asciinema → agg → ffmpeg)
RUNBOOK.md          how the whole event went, chronologically
```

## Stack

`claude -p` (Claude Code headless) · Node.js (zero dependencies — just `child_process` +
`fs`) · `asciinema` + `agg` + `ffmpeg` for the demo. That's the whole stack.
