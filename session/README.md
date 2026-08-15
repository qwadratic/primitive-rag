# Session artifacts

- `main-session-transcript.jsonl` — the raw Claude Code transcript of the orchestrating
  conversation (this repo's author) for the whole hackathon, in the standard Claude Code
  session-log format (one JSON object per line: user/assistant turns, tool calls, `usage`).
- `token-usage.json` — aggregated token counts and a cost estimate, computed from this
  transcript plus the transcripts of the 223 separate `claude -p` subprocess calls the CLI
  spawned (ingest + query) — those aren't included as raw files here (52MB, mostly
  redundant with `index/` and `qa/`), just summed into the JSON.

- `cowork-transcript.md` — the group cowork/Zoom call for the event, auto-transcribed
  (Russian, with Ukrainian passages), redacted and lightly formatted for readability.
  **Redacted, not rewritten:** speech that remains is verbatim; every cut is marked inline
  with `[— вырезано: … —]`. Removed were private/family conversation (participants had
  mics open at home, including children), an extended pet segment, an unrelated Mafia-game
  discussion, and a small number of passages naming individuals in ways that served no
  documentary purpose. Surnames are reduced to an initial throughout. Auto-transcription
  errors are expected and were left as-is rather than guessed at.
- `cowork-summary.md` — an English summary of that call: how the event was framed and run,
  what participants argued about, what they observed about the models, and how it ended.

See the root README's "Session details" section for the human-readable version of the
token/cost numbers.

Note on the personas: `Марина Ковалёва` and `Ирина Соболева` appearing in the transcript are
the *fictional* people in the hackathon datasets, not participants.
