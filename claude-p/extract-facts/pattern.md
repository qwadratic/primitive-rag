# Pattern: extract-facts

Turns one raw source file into a compact, citable "card": what it says, who/when/how much
it's about, in a form small enough that a later query step can hold the whole index in
context at once instead of doing vector retrieval.

## input path
`%source_path%` — path to exactly one file under `dataset/` (note/message/task/transcript/
calendar/doc/screenshot — any type; for images, read them directly, Claude Code's Read
tool is multimodal).

## instruction
Read the file at `%source_path%` in full (for images, look at it directly). This is one
file from a messy personal+business data export belonging to Марина Ковалёва, a Tbilisi
design-studio owner — notes, chats, invoices, contracts, call transcripts, a calendar,
and screenshots, Feb–Jul 2026. Extract everything a future search/QA step over this file
would need, without inventing anything not actually present.

Special case — **credentials**: if the file's content is or looks like login/password
pairs, API keys, or similar secrets, do NOT extract or repeat any of it. Output only:
`type: sensitive — excluded from index` and stop there.

Special case — **empty/no content**: if there's nothing extractable (e.g. a blank
screenshot), say so plainly in the summary line instead of guessing or padding.

## output format
Free-form, human-legible text — not a strict machine schema, just this shape:

```
source: <the exact path given>
type: <note|message|task|transcript|calendar|doc|screenshot|other>
date: <ISO date(s) if known, else "unknown">
people: <comma-separated names mentioned, else "-">
project: <client/project names mentioned, e.g. Тропа, Пергамент, else "-">
amounts: <money/hours figures with what each refers to, else "-">
summary: <2-4 plain sentences capturing what this file actually says>
quotes:
> <short verbatim quote worth citing later>
> <up to ~5 of these, each on its own line>
```

Write ONLY the card in this shape, nothing else (no preamble, no "here is the card").
