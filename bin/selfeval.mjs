#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const tsv = await fs.readFile("/tmp/questions_all.tsv", "utf8");
const rows = tsv.trim().split("\n").map((l) => l.split("\t"));

async function runOne(id, q) {
  return new Promise((resolve) => {
    const child = spawn("node", ["bin/cli.mjs", "query", q], { cwd: ROOT });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", async () => {
      await fs.writeFile(path.join(ROOT, "selfeval", `${id}.txt`), out, "utf8");
      console.log("done", id);
      resolve();
    });
  });
}

const CONCURRENCY = 4;
let next = 0;
async function worker() {
  while (next < rows.length) {
    const [id, q] = rows[next++];
    await runOne(id, q);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log("all done");
