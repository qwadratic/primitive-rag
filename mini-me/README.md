# mini-me

A PGLite database whose corpus is **the participant's own hackathon session** — the same
4h22m window the rest of this repo documents, seen from the other side. The hackathon built
a tool to answer questions about a fictional person's messy data export; this answers
questions about the real person who built it.

It also closes a loop. The original day-one plan was PGLite + pgvector, discarded mid-build
in favour of `claude -p` (see [`docs/plan.md`](../docs/plan.md)). PGLite is back — and the
same conclusion re-derives itself on new data: **no pgvector**. There's still no embedding
key on this machine, and at 18 documents Postgres full-text search plus a few structured
columns answer everything vectors would have.

```bash
npm install
node build.mjs                  # parse ../session/main-session-transcript.jsonl -> ./data
node query.mjs stats            # working-pattern statistics
node query.mjs timeline         # every human directive, in order
node query.mjs search submit    # full-text search across the session
node query.mjs ask "..."        # synthesize an answer via claude -p (model pinned)
```

`data/` and `node_modules/` are generated — not committed. `build.mjs` rebuilds in seconds.

## What the corpus actually is

The transcript's `user` records mix three very different things: what the human typed,
harness-generated notifications, and injected context. Only the first is "me", and the
distinction is not cosmetic — the first build classified a **923,023-character injected
skill document** as a human message. It was 99.6% of the corpus by volume. Every
"how did they work" answer would have been measuring the harness instead of the person.

After filtering, the real corpus:

| | |
|---|---|
| session span | 262 min (4.4 h) |
| human directives | **18** |
| total typed | **4,131 chars** |
| avg / min / max | 230 / 14 / 2,506 chars |
| tool calls issued | 215 |
| ratio | **11.9 tool calls per human message** |
| median gap between messages | 5 min |

The shape is front-loaded: two messages at +01:36 and +02:16 (3,050 chars) are **74% of
everything typed all day**. The remaining 16 messages average 68 characters — "submit ASAP
so we get our eval", "no, force submit", "check feedback". Specification up front, terse
steering thereafter.

## Caveat

The source snapshot was taken at 13:54 local, so it covers the hackathon itself and not the
repo/documentation work that followed. That boundary is load-bearing for a different reason:
the snapshot predates this session reading the group-call recording, so it contains none of
the private family conversation redacted from
[`../session/cowork-transcript.md`](../session/cowork-transcript.md). **Do not regenerate it
from the live session log** — a fresh copy would reintroduce that content.
