// mini-me — load the participant's own hackathon session into PGLite.
//
// Deliberate echo of the plan we discarded on day one: the original design was
// PGLite + pgvector over the *fictional* person's export. This is PGLite over the
// real one. No pgvector: there's still no embedding key on this machine, and at
// this corpus size Postgres FTS + structured columns answer everything vectors
// would have — the same conclusion the hackathon reached, re-derived on new data.

import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "session", "main-session-transcript.jsonl");
const DATA = path.join(import.meta.dirname, "data");

// Text out of a message body, ignoring tool plumbing.
function textOf(msg) {
  const c = msg?.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c
      .filter((b) => b && b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("\n");
  }
  return "";
}

function toolCallsOf(msg) {
  const c = msg?.content;
  if (!Array.isArray(c)) return [];
  return c.filter((b) => b && b.type === "tool_use").map((b) => b.name);
}

// The transcript's `user` records mix three very different things: what the human
// actually typed, harness-generated notifications, and tool results. Only the first
// is "me" — misclassifying here would make every downstream answer wrong.
function classifyUser(text) {
  const t = text.trim();
  if (!t) return null;
  if (t.startsWith("[Image:")) return null;
  if (t.includes("<task-notification>")) return "notification";
  if (t.includes("<local-command-")) return "slash-command";
  if (t.startsWith("<system-reminder>")) return null;
  // Harness-injected payloads also arrive on user-role records. Without these the
  // corpus is 99.6% machine text (one skill doc was 923KB vs ~250 chars for a real
  // message) and every "how did they work" answer would be measuring the harness.
  if (t.startsWith("Base directory for this skill:")) return "skill-injection";
  if (t.includes("Codebase and user instructions are shown below")) return "system-context";
  if (t.includes("hook additional context")) return "hook-injection";
  return "directive";
}

const raw = await fs.readFile(SRC, "utf8");
const records = raw
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));

const t0 = new Date(
  records.filter((r) => r.timestamp).reduce((a, r) => (r.timestamp < a ? r.timestamp : a), "9"),
);

const turns = [];
for (const r of records) {
  const ts = r.timestamp ? new Date(r.timestamp) : null;
  const min = ts ? Math.round((ts - t0) / 60000) : null;

  if (r.type === "user") {
    const text = textOf(r.message);
    const kind = classifyUser(text);
    if (!kind) continue;
    turns.push({ ts, min, role: kind === "directive" ? "human" : "system", kind, text, tool: null });
  }

  if (r.type === "assistant") {
    const text = textOf(r.message);
    const tools = toolCallsOf(r.message);
    if (text.trim()) {
      turns.push({ ts, min, role: "assistant", kind: "answer", text, tool: null });
    }
    for (const name of tools) {
      turns.push({ ts, min, role: "assistant", kind: "tool_call", text: "", tool: name });
    }
  }
}

await fs.rm(DATA, { recursive: true, force: true });
const db = new PGlite(DATA);

await db.exec(`
  CREATE TABLE turns (
    id            serial PRIMARY KEY,
    ts            timestamptz,
    minute_offset int,
    role          text,
    kind          text,
    tool          text,
    text          text,
    chars         int
  );
  CREATE INDEX turns_kind_idx ON turns (kind);
  CREATE INDEX turns_min_idx  ON turns (minute_offset);
`);

for (const t of turns) {
  await db.query(
    `INSERT INTO turns (ts, minute_offset, role, kind, tool, text, chars)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [t.ts, t.min, t.role, t.kind, t.tool, t.text, t.text.length],
  );
}

// 'simple' rather than 'english': the corpus is mixed Russian/English and stemming
// one language would quietly degrade recall on the other.
await db.exec(`
  ALTER TABLE turns ADD COLUMN fts tsvector
    GENERATED ALWAYS AS (to_tsvector('simple', coalesce(text,''))) STORED;
  CREATE INDEX turns_fts_idx ON turns USING GIN (fts);

  CREATE VIEW directives AS
    SELECT id, minute_offset AS min, chars, text
    FROM turns WHERE kind = 'directive' ORDER BY minute_offset;
`);

const stat = async (q) => (await db.query(q)).rows[0];
const all = await stat(`SELECT count(*) n FROM turns`);
const d = await stat(
  `SELECT count(*) n, sum(chars) c, round(avg(chars)) avg FROM turns WHERE kind='directive'`,
);
const span = await stat(`SELECT max(minute_offset) m FROM turns`);
const tools = await db.query(
  `SELECT tool, count(*) n FROM turns WHERE kind='tool_call' GROUP BY tool ORDER BY n DESC LIMIT 6`,
);

console.log(`mini-me built → ${path.relative(ROOT, DATA)}`);
console.log(`  turns:       ${all.n}`);
console.log(`  directives:  ${d.n} human messages, ${d.c} chars total, ${d.avg} avg`);
console.log(`  span:        ${span.m} minutes`);
console.log(`  top tools:   ${tools.rows.map((r) => `${r.tool}(${r.n})`).join(" ")}`);
await db.close();
