# Pattern: answer-question

Turns a question + the full card index into the exact answer shape the hackathon eval
expects: a direct answer first, then the sources it rests on.

## input path
`%candidates_path%` — path to a single text file containing ALL extracted cards
concatenated (small corpus, so no retrieval step needed — full context every time).

## instruction
You will be given a question about the owner of a messy personal+business data export
(a Tbilisi design-studio owner — name appears in the cards themselves, e.g. in
`type: doc` contracts or the readme card) and a set of source cards extracted from that
export (file at `%candidates_path%`, each card starts with `source: <path>`). Using ONLY
what's in those cards — no outside knowledge, no guessing — answer this question:

`%question%`

Most real answers require connecting facts from 2-3+ different cards/sources; look across
all of them before answering, don't stop at the first match. Two things past runs have
under-done — check both explicitly before finalizing:

1. **The calendar card is easy to skip because it's one file, not a topic-labeled note —
   deliberately check it for every question.** It often independently corroborates a
   timeline (cancelled/rescheduled events, exact dates) that chat/notes only imply, and
   sometimes the fact that a person cancelled/rescheduled something is *itself* part of
   the answer, not just supporting color.
2. **Self-check your SOURCES list against your ОТВЕТ text before finalizing**: for every
   concrete fact, date, or number in ОТВЕТ, ask "which card told me that?" — if that
   card isn't in SOURCES, add it. It's easy to draft the answer, forget which of several
   cards a given detail came from, and under-cite as a result. When two cards
   independently confirm the same fact (e.g. a chat message AND a calendar entry), cite
   both — that's corroboration, not padding; padding is citing a card that merely
   mentions a related name without actually supporting the answer.

**If the question asks for a total, a count, or "how much/how many" of something** (hours,
money, instances, promises, etc.): that's an exhaustive-search question, not a
best-match one. Scan every card that mentions the relevant project/person/topic — not
just the first 2-3 that come to mind — before totaling. Missing one instance silently
undercounts the answer, which is worse than a slightly longer source list.

If the cards don't actually support an answer, say so plainly rather than inventing one.

## output format
Free-form text, but MUST follow this exact shape (Russian):

```
ОТВЕТ: <direct answer, 1-2 sentences>
ОСНОВАНИЕ: [<source path>] <short quote> · [<source path>] <short quote> · ...
SOURCES: <comma-separated list of the source paths actually used, or empty>
```

Hard constraints:
- Total output under 1200 characters.
- Cite only sources that materially support the answer — not every card that merely
  mentions a related name.
- If nothing relevant was found: `ОТВЕТ: не найдено` and `SOURCES:` empty.
- No text before `ОТВЕТ:` or after the `SOURCES:` line.
