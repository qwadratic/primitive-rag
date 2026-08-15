# Reasoning log — ingestion strategy

## v3 — embedding spike (before building)

Checked this machine: no OpenAI/Voyage/Cohere key in `psst` (local or global vault —
only `TG_API_HASH`/`TG_API_ID`, unrelated), no `tesseract` binary installed, Node v24
and `npm` available. Data is Russian-language, mixed with some English (Nick Warren
messages). PGLite ships pgvector as a bundled extension, so the vector *store* side is
fixed by the brief; what's open is which model produces the vectors.

**Options considered:**

| Option | Quality on Russian | Cost/setup | Network dependency | Notes |
|---|---|---|---|---|
| OpenAI `text-embedding-3-small` | good, not multilingual-specialist | ~$0.02/1M tok, needs `OPENAI_API_KEY` | yes, per call | simplest SDK, well-trodden path |
| Voyage AI (`voyage-multilingual-2`) | strong multilingual | needs `VOYAGE_API_KEY`, free tier exists | yes | Anthropic's recommended embedding partner; no key present here |
| Cohere `embed-multilingual-v3.0` | strong, Russian well-covered | needs `COHERE_API_KEY` | yes | good multilingual benchmarks |
| Local via `transformers.js` (`Xenova/bge-m3` or multilingual-e5) | strong (BGE-M3 covers 100+ languages incl. Russian well) | free, one-time model download (~1-2GB), no key | **no** — fully offline after download | slower per-doc, but dataset is small (96 files); avoids any external dependency during a time-boxed hackathon |

**My read:** dataset is small enough (96 files, mostly short) that raw embedding speed
barely matters, and this is a 4-hour hackathon where network/API-key friction is a real
risk to burn time on. A local multilingual model (BGE-M3 via `transformers.js`) removes
that risk entirely and needs no secret to provision. If an API key is available and you'd
rather not wait on a model download, Voyage multilingual is the better-quality fallback
of the API options for Russian text. I'd default to **local BGE-M3**, but this is your
call — flagging it rather than deciding silently, per your instruction.

**Other decisions I'm surfacing rather than assuming:**
1. **Screenshots → text**: no `tesseract` installed. Two paths: (a) install tesseract via
   `brew install tesseract tesseract-lang` and OCR locally (free, offline, and sample
   screenshots have clean rendered UI text — OCR should work well) — needs your OK to
   `brew install`; or (b) vision-caption each of the 18 images via an LLM call (higher
   quality on messier images, costs API calls, needs a key). Given the samples show clean
   synthetic UI text, I'd lean OCR (a) — cheaper, offline, sufficient for this data.
2. **Passwords note** (`notes/пароли где.md`): plan is to exclude it from the index
   entirely (not embed, not store content) rather than redact-and-keep — confirm that's
   right, or if you want it in with the sensitive lines stripped instead.
3. **`brew install tesseract`** is a real (if minor) system change — want me to proceed if
   you pick the OCR path, or would you rather I ask each time this comes up?

## v1 — recon (no full reads yet)

Owner: Марина Ковалёва, дизайн-студия «Слои», Тбилиси. Export Feb–Jul 2026.
96 files, 37M total. Breakdown: 49 `.md`, 18 `.png`, 13 `.pdf`, 10 `.txt`, 4 `.json`, 1 `.ics`, 1 `.csv`.

### notes/ (49 .md, 172K)
Freeform diary/work notes, mostly dated filenames (`YYYY-MM-DD ...md`) but some undated
(`заметка.md`, `Untitled 7.md`, `мысли.md`) — filename date is a hint, not ground truth;
real dates likely live in the text or must be inferred from context/mtime.
Some are clearly abandoned/duplicate drafts (`... (копия).md`, `Untitled N.md`,
`заметка.md` vs `заметка 2.md`) — expect near-duplicate content, don't dedupe by filename alone.
Content mixes: work log entries, people notes ("кто есть кто" — profiles of contractors
Артём/Даша etc.), ideas, todos-in-prose, one has "пароли где" / "пароли не хранить тут"
(passwords — sensitive, must NOT embed/store raw, flag-and-skip or redact).
**Ingest as:** one chunk-source per file, split by paragraph/heading if long; extract
date from filename when present, else leave null and let content-date extraction try.

### tasks/ (todo.txt, .md, .csv)
Three different task representations for probably overlapping backlog:
- `todo.txt`: flat checkbox list, no dates.
- `задачи на неделю.md`: dated context ("писала в понедельник, дальше забила") + checkboxes,
  some with urgency markers (`!!!`).
- `backlog.csv`: structured with id/task/priority/created/modified/status — but **same id
  appears multiple times with different priority/modified date** (id=1 has 3 rows) = history
  of edits, not unique rows. Must treat as an event log per id, not a dedup table.
**Ingest as:** csv → one row per record with all columns as metadata; md/txt → line-level or
block-level chunks, checkbox state as metadata (done/open) where parseable.

### messages/ (4 chats × 2 formats each: .json + _export.txt)
`{chat, owner, messages:[{date,time,from,text}]}` — `klienty`, `lichnoe`, `podryadchiki`,
`buhgalter`. The `.json` and `_export.txt` are **the same conversation in two formats**
(verified: klienty has 14 messages in both) — redundant, ingest JSON only (structured,
has explicit date/time/from fields) and skip the txt twin to avoid duplicate chunks/answers.
**Ingest as:** one chunk per message or small time-windowed group per chat; `from`/`date`/`chat`
become metadata (person, date, source-chat=client/personal/contractor/accountant — strong
topical signal for free).

### transcripts/ (3 .txt)
Call transcripts, timestamped turns (`[00:02] Лиза: ...`), header line names participants
+ duration. Filename encodes date + rough topic ("созвон Лиза", "голосовое расшифровка").
**Ingest as:** chunk by speaker turn or small turn-groups (~5 turns), keep participants +
filename-date as metadata.

### calendar/marina.ics (1 file)
Standard iCalendar VEVENTs: UID, DTSTART/DTEND (tz-aware), SUMMARY, STATUS (some CANCELLED —
must keep status as metadata, a cancelled meeting is a fact worth knowing, not noise).
**Ingest as:** one chunk per VEVENT, structured metadata (start/end/status/summary), parse
person/project names out of SUMMARY heuristically.

### docs/ (13 .pdf)
1-page PDFs, filenames encode type + client: `schet-*` (invoice), `dogovor-*` (contract),
`akt-*` (act/completion doc), `brief-*`, plus 2 unnamed (`Документ без имени`) and a
`предложение шаблон` (proposal template) — filename taxonomy alone gives doc-type + client
before even extracting text. Need PDF text extraction (likely simple, 1-page, probably
text-layer not scanned — will verify on sample).
**Ingest as:** one chunk per doc (short), doc-type + client parsed from filename as metadata,
full extracted text as content.

### screenshots/ (18 .png, 36M — dominates dataset size)
Two filename families: `Снимок экрана ...` (screen captures, dated) and `IMG_/photo_...`
(phone photos). Content unknown without opening — could be UI screenshots, receipts,
whiteboard photos, anything. This is the highest-risk/highest-effort source: needs
vision captioning or OCR to become searchable text at all. Given time budget, plan to
sample a handful first (task #2) before committing to OCR vs. vision-caption vs. skip-with-flag.

### прочее/ (misc, 6 files)
Catch-all: stray links, an old price list (`старый прайс 2024` — explicitly "old", useful
for "how did pricing change" type questions), experiments notes, duplicate-ish untitled files.
**Ingest as:** same as notes/, but tag source folder distinctly so "old/deprecated" signal
(e.g. filename says "старый") can be surfaced as metadata, not silently merged with current data.

## v2 — sampled data, facts/people/events observed

Sampled: 4 PDFs beyond the first pass (schet-tropa-02/03, akt-tropa-01, schet-pergament-01,
dogovor-pergament, налоги памятка), all 4 message chats in full (small — 14-30 msgs each),
2 time-tracking notes, 1 summary note, calendar SUMMARY/STATUS for all 65 events, and 5
screenshots (2 "Снимок экрана", 3 "photo_/IMG_").

### Key entities
- **Owner:** Марина Ковалёва, ИП, design studio «Слои», Tbilisi.
- **Clients:** Лиза (Елизавета) Тимофеева — project «Тропа» (mobile app design, hourly,
  rate 35/h, contract №04-2026); Ольга Бек — project «Пергамент» (landing page + motion,
  fixed price 2200, contract №06-2026).
- **Contractors:** Артём Гурский (frontend/layouts, unreliable — hospitalized mid-May,
  went dark, chronically late but delivers), Даша Петренко (illustrations, reliable,
  process-insistent — demands written brief first), Nick Warren (motion, English-speaking,
  billed hourly at 60/h, delivered early).
- **Accountant:** Гурам Дзидзигури — chasing quarterly documents (акты/счета), increasingly
  frustrated (June 27 → Jul 10 → Jul 28 "уже месяц").
- **Friend/confidant:** Катя Сомова — personal chat, Marina vents about overwork/underpay
  and an unfinished studio website (procrastinated 3+ times, tied to imposter-feelings
  about her portfolio).

### Key cross-source thread found (validates the "needs 2-3 sources" premise)
Time tracking note (`notes/учёт времени.md`) logs Тропа hours by date, totals ~64h logged
but says "в счёт пошло 61 час" (invoiced 61). Cross-checking the three Тропа invoices
(schet-tropa-01: 27h, -02: 20h, -03: 14h) sums to exactly **61h** — confirms the note's
claim and shows the invoiced amount undercounts actual logged work. This is a genuine
three-plus-document reconciliation (time note + 3 PDFs), exactly the shape of question
the eval round will likely ask.

### Calendar reveals a pattern text sources only hint at
Ольга/Пергамент calls: 3 of 4 were CANCELLED/rescheduled before one CONFIRMED — corroborates
"Пергамент (с опозданием)" from the half-year summary note, and the accountant/invoice dates
for Пергамент (contract 20.04, invoice 21.05) sit right after the reschedule chaos.
"Сайт студии" calendar entries are cancelled 3x with one TENTATIVE — matches lichnoe.json
chat where Marina admits postponing the studio site "third time" — a fact appearing in
calendar + personal chat + notes, told three different ways (schedule friction, procrastination
admission, todo list item still open) — nobody source states "she has postponed her own
studio site 3 times", it must be assembled.

### Screenshots: **cannot be classified or skipped by filename** (revises v1 assumption)
Sampled 5: two "Снимок экрана" both show real app UI text (Заметки: "работаю без остановки
а денег столько же" — a phone-note duplicate/precursor of the lichnoe.json message; Задачи:
todo checkboxes matching todo.txt) and one showing an **empty** Фигма panel (a screenshot
that legitimately has no extractable content). Of 3 "IMG_/photo_" sampled, one was pure
abstract art (no text, no info — decorative/placeholder), two were real UI captures
("Переписка" headers) — one of which shows a line ("Сделаю, тоже не буду выставлять")
that does **not** appear verbatim in podryadchiki.json — i.e. screenshots can carry
information not present anywhere else in structured form.
**Revised decision:** filename pattern (Снимок vs IMG_/photo_) does NOT predict content type.
Every screenshot must go through the same vision/OCR pipeline; expect ~15-30% to be
empty/non-informational (that's fine, ingest as empty-content record, don't skip the file
entirely so the CLI's ingest stats stay honest).

### PDFs confirm clean text layer
`pdftotext -layout` extracts cleanly and completely from all sampled PDFs (invoices,
contracts, acts, tax memo) — no OCR needed for docs/, straightforward text extraction.

## Cross-cutting decisions (v1)

- **Redundant twins:** messages/*.json vs *_export.txt are duplicates → ingest JSON only.
- **Sensitive content:** password-related notes must be excluded from embedding/storage,
  not just from answers — a RAG index that contains a plaintext password chunk is a real
  risk regardless of whether it's ever surfaced.
- **"История правок" not "текущее состояние":** backlog.csv and possibly notes represent
  edit history, not a snapshot — the ingestion + metadata model needs a notion of
  as-of-time / status-at-time, not just "one fact per row".
- **Metadata worth extracting at ingest time** (cheap, structured, don't rely on embeddings
  alone): date, source file/folder, chat/person names, client/project name (Тропа, Пергамент,
  studio itself, contractor names), doc-type (invoice/contract/act/brief), event-status
  (cancelled/done/open). This becomes filterable columns alongside the vector column —
  hybrid retrieval (metadata filter + vector search) rather than pure semantic search.
- **Screenshots are the size/risk outlier** — need a v2 sample before deciding OCR vs.
  vision captioning vs. skip.
