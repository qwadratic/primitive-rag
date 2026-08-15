# Cowork call — what actually happened

Summary of the AI Mindset S26 hackathon cowork call, 2026-08-15, from the cleaned recording in
[`cowork-transcript.md`](cowork-transcript.md) — one auto-transcribed capture of a
multi-participant Zoom room, no speaker labels, no timestamps. Ambiguities in the transcript
are flagged rather than guessed at.

## The framing: a clean folder, on purpose

The organizers — Саша В. and a co-host, with roughly 30–40 participants in one room — opened
with the premise: everyone shows up carrying scaffolding (skills, MCP servers, memory files,
personal configs), and the experiment was to strip it away and start from an empty folder with
only what you actually *understand* about how such a system should be built. The justification
was explicit. Boris from Anthropic had recently described labs discarding roughly 70% of the
previous model's scaffolding to build the next one, and advising that you throw away your own
skills every six months and rewrite them. The models get smarter; the harness built for the
old one is dead weight.

The rules: desktop Claude or Codex, one model (Sonnet, or the second model the transcript
renders as "Terra") at **medium** effort, one session, one window, no parallelism. Skills and
MCP get pulled in regardless, so the first prompt told the agent to avoid them and report its
environment honestly to the event site. Nearly every agent reported the desktop app as "Claude
Code CLI", so everyone carried a `warning` baseline — noted, not disqualifying. Nothing was
collected from participants' machines: the event ran on trust.

## How it ran

The task stayed locked until a set time. When it opened, each agent downloaded a synthetic
archive of one fictional person's six months of personal and business data — Марина Ковалёва,
design studio "Слои" — and proposed directions for a tool over it. Milestones (`started`,
`plan_ready`, `first_run`, `works`, `submitted`) were reported to an event page where each
participant tracked the rounds by personal code.

Three graded rounds followed, roughly an hour apart. **Round 1**: five questions on the first
dataset; submissions closed on the organizer's call, after which each agent could fetch a
written breakdown of its own answers. **Round 2**: five new questions plus a **second,
mirrored dataset** (Ирина Соболева, same studio template, different clients and numbers) —
several agents kept answering against round-1 data until told to fetch the new archive.
**Round 3**: one final question, back on the first dataset, answerable only by reading between
the lines. Scoring compared answers against a reference plus the set of sources each answer
should have cited: how many were linked, how many extras were pulled in, how close the
conclusion was. A blind peer vote closed the event.

## What people argued about

The liveliest thread was **what counts as "the tool."** If your solution just answers in the
session you're already sitting in, is that a tool? Can you call an external LLM API —
OpenRouter, Kimi, GLM — for the reasoning? The organizers' answer: an external frontier model
with the whole corpus in context is cheating, local models are fine. That left a follow-up
nobody resolved — "local" spans everything from an offline LLM to a bag of Python indexing
libraries, which are not equivalent conditions.

Other disagreements included whether you could point the agent at a known skill or package
rather than building from scratch, plus:

- **Delivery format** — Telegram bot, dashboard, CLI, or in-session Q&A. Declared free;
  several converged on a minimal question→answer CLI. The repo owner's
  `claude -p`-as-a-primitive approach was discussed on the call, with another participant
  arguing it would produce the best result precisely because it delegates the hard part.
- **Subagents** — at least one agent spawned one unprompted. Everyone agreed that shouldn't
  count; the countermeasure was to instruct against it, with the caveat that agents forget
  such instructions after enough context churn.
- **Effort and token economy** — people compared context usage and 5-hour-limit consumption
  live, and someone proposed making context-window percentage an event metric.
- **Memory, ontology and "successful words"** — a real disagreement near the end. One
  participant argued "memory" is a buzzword: markdown files, a graph, an ontology — the word
  doesn't determine the solution, and chasing it yields cargo-culted iterations that produce
  memory but not an answer. Others defended shared terminology as convention; a third position
  was to let the agents negotiate ontologies instead of the humans. Someone else pushed for
  naming the **atoms** every such solution is made of, since the room had just built the same
  thing in dozens of incompatible ways.

## Observations about the models and the harness

Agents declare themselves "ready to submit" long before they are, and several submitted
autonomously without being asked — the organizer's own included. One agent *refused* to keep
improving after seeing round-2 questions, citing the rule against rewriting a solution around
already-seen questions; the participant had to get explicit permission to proceed.
Instructions decay, so one participant detects drift by requiring an emoji marker on every
message; another mapped escalating profanity to escalating corrections. Later findings: the
calendar deserves top source priority rather than equal weighting, half the dataset's
screenshots carry no information, and archive facts contradict each other with no obvious
resolution rule.

## How it ended

The results page broke. Rounds 1 and 2 came back null for nearly everyone, so only round 3
initially counted, and five participants were missing entirely because the `submitted` flag was
never pressed — a UI ambiguity the organizers took the blame for. Winners were announced
(Александр К., Александр Г., Анастасия К.), then re-announced with a slightly different
composition as the table was recomputed live. Reference answers for all three rounds were
posted to the event's Telegram group.

Round-1 grader statistics were read aloud: **not one** participant caught that two backlog
items were marked done while the chat log contradicted it — the trap the round was built
around — and many tools returned raw file quotes instead of answers.

The retro was candid. The organizers rated the tooling around 4/10 and the atmosphere 8/10,
later settling on "5 out of 10 counting all the technical failures", while participants pushed
back that for a first run it went well. Third place went to a self-described non-developer
whose whole method was, roughly, "I don't understand any of this, write me a spec and make it
good," iterated a few times. Ideas for future formats:

- **Grading the path, not only the final artifact** — two rubrics, one for the result and one
  for how you got there. The precedent: an earlier IRL "Open Close" hackathon whose
  audience-choice winner was a non-technical participant who went from "what is voice-to-text"
  to a working geolocation tour-guide app.
- The next event: everyone submits a real work pain, pains are shuffled, you build a tool for
  someone else's, and the author decides whether it helped.
- A **GTM-engineering hackathon** — not building the thing but packaging it: headline,
  positioning, a short demo, real "would I buy this" feedback. Building software is now the 1%;
  getting users is the skill worth stress-testing.

## What got redacted

Several participants had open mics at home. The published transcript removes, with inline
markers in place: family and child conversation (much of it in Ukrainian), an extended segment
where someone shows a dog on camera, and a running Mafia-game commentary — roughly 11% of the
raw transcript. Surnames are replaced with initials; first names are kept because the text is
unreadable without them. Nothing on-topic was removed. Марина Ковалёва and Ирина Соболева are
fictional dataset characters, not real people.
