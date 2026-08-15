<!-- The answer-question prompt EXACTLY as it stood during rounds 1-2, before the
     round-2 feedback fixes (calendar-citation reminder + exhaustive-search rule).
     Preserved here as the control condition for the round-1 simulation in this
     directory; the current/fixed version lives at claude-p/answer-question/pattern.md. -->

# Pattern: answer-question

Turns a question + the full card index into the exact answer shape the hackathon eval
expects: a direct answer first, then the sources it rests on.

## input path
`%candidates_path%` — path to a single text file containing ALL extracted cards
concatenated (small corpus, so no retrieval step needed — full context every time).

## instruction
You will be given a question about Марина Ковалёва (a Tbilisi design-studio owner) and a
set of source cards extracted from her data export (file at `%candidates_path%`, each
card starts with `source: <path>`). Using ONLY what's in those cards — no outside
knowledge, no guessing — answer this question:

`%question%`

Most real answers require connecting facts from 2-3 different cards/sources; look across
all of them before answering, don't stop at the first match. If the cards don't actually
support an answer, say so plainly rather than inventing one.

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
