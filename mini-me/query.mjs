// mini-me query interface.
//
//   node query.mjs stats            working-pattern statistics
//   node query.mjs timeline         every human directive, in order
//   node query.mjs search <term>    full-text search across the session
//   node query.mjs ask "<question>" synthesize an answer via `claude -p`
//
// `ask` reuses the hackathon tool's shape: no vector store, just hand the whole
// (small) corpus to the model and require it to cite the turns it used.

import { PGlite } from "@electric-sql/pglite";
import { spawn } from "node:child_process";
import path from "node:path";

const DATA = path.join(import.meta.dirname, "data");
const db = new PGlite(DATA);
const [cmd, ...rest] = process.argv.slice(2);

const q = async (sql, params) => (await db.query(sql, params)).rows;

if (cmd === "stats") {
  const [d] = await q(`SELECT count(*) n, sum(chars) c, round(avg(chars)) avg,
                              min(chars) lo, max(chars) hi
                       FROM turns WHERE kind='directive'`);
  const [t] = await q(`SELECT count(*) n FROM turns WHERE kind='tool_call'`);
  const [span] = await q(`SELECT max(minute_offset) m FROM turns`);
  const gaps = await q(`SELECT minute_offset AS min,
                               minute_offset - lag(minute_offset)
                                 OVER (ORDER BY minute_offset) AS gap
                        FROM turns WHERE kind='directive'`);
  const g = gaps.map((r) => r.gap).filter((x) => x != null).sort((a, b) => a - b);
  const med = g.length ? g[Math.floor(g.length / 2)] : 0;

  console.log(`session span        ${span.m} min (${(span.m / 60).toFixed(1)} h)`);
  console.log(`human directives    ${d.n}`);
  console.log(`  total typed       ${d.c} chars`);
  console.log(`  avg / min / max   ${d.avg} / ${d.lo} / ${d.hi} chars`);
  console.log(`tool calls issued   ${t.n}`);
  console.log(`ratio               ${(t.n / d.n).toFixed(1)} tool calls per human message`);
  console.log(`gap between msgs    median ${med} min, max ${Math.max(...g)} min`);
  console.log(`typing throughput   ${(d.c / span.m).toFixed(1)} chars/min of session`);
}

if (cmd === "timeline") {
  const rows = await q(`SELECT min, chars, text FROM directives`);
  for (const r of rows) {
    const h = String(Math.floor(r.min / 60)).padStart(2, "0");
    const m = String(r.min % 60).padStart(2, "0");
    const one = r.text.replace(/\s+/g, " ").trim();
    console.log(`+${h}:${m}  ${String(r.chars).padStart(4)}c  ${one.slice(0, 150)}`);
  }
}

if (cmd === "search") {
  const term = rest.join(" ");
  const rows = await q(
    `SELECT minute_offset AS min, role, kind, left(text, 220) AS snippet,
            ts_rank(fts, plainto_tsquery('simple', $1)) AS rank
     FROM turns
     WHERE fts @@ plainto_tsquery('simple', $1)
     ORDER BY rank DESC, minute_offset LIMIT 12`,
    [term],
  );
  if (!rows.length) console.log(`no matches for "${term}"`);
  for (const r of rows) {
    console.log(`\n+${r.min}min  [${r.role}/${r.kind}]`);
    console.log(`  ${r.snippet.replace(/\s+/g, " ").trim()}`);
  }
}

if (cmd === "ask") {
  const question = rest.join(" ");
  const rows = await q(`SELECT min, text FROM directives`);
  const corpus = rows
    .map((r) => `[+${r.min}min] ${r.text.replace(/\s+/g, " ").trim()}`)
    .join("\n\n");

  const prompt = `Below is the complete set of instructions one person gave an AI coding agent
during a 4-hour hackathon, in order, timestamped by minutes elapsed. This is everything
they typed — nothing is omitted.

${corpus}

Question: ${question}

Answer in 3-6 sentences, grounded only in the instructions above. Cite the [+Nmin] markers
you rely on. If the instructions don't support an answer, say so.`;

  // Model pinned deliberately. During the hackathon every `claude -p` call inherited
  // the CLI default (Opus 5) rather than the session's Sonnet, which was ~87% of the
  // event's total cost and went unnoticed until the logs were totalled afterwards.
  const model = process.env.MINI_ME_MODEL || "claude-sonnet-5";
  const child = spawn("claude", ["-p", prompt, "--model", model, "--output-format", "text"], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  await new Promise((res) => child.on("close", res));
}

if (!["stats", "timeline", "search", "ask"].includes(cmd)) {
  console.log("usage: node query.mjs [stats|timeline|search <term>|ask \"<question>\"]");
}

await db.close();
