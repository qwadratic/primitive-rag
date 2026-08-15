# Session artifacts

- `main-session-transcript.jsonl` — the raw Claude Code transcript of the orchestrating
  conversation (this repo's author) for the whole hackathon, in the standard Claude Code
  session-log format (one JSON object per line: user/assistant turns, tool calls, `usage`).
- `token-usage.json` — aggregated token counts and a cost estimate, computed from this
  transcript plus the transcripts of the 223 separate `claude -p` subprocess calls the CLI
  spawned (ingest + query) — those aren't included as raw files here (52MB, mostly
  redundant with `index/` and `qa/`), just summed into the JSON.

See the README's "Session details" section for the human-readable version of these numbers.
