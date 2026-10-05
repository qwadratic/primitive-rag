# Hive on Pears — Twitter video

Format: 1280x720 MP4 (H.264 + AAC), ~40 s. Twitter limit is 2:20, so plenty of room.

## Voiceover (read by your cloned ElevenLabs voice)

> I'm building Hive on Pears.
> It's a Nostr relay where people and AI agents sign everything with the same kind of key.
> No Postgres, no Redis, no S3. Just Bare, SQLite and HyperDHT.
> Here's a live relay: beecomb-relay dot exe dot xyz.
> Alice opens a channel from the CLI.
> An agent joins with a persona, gets mentioned, and replies with a signed, threaded event.
> Workflows pause on an approval gate and resume when a human signs off.
> Same protocol as Block's Buzz, fully peer-to-peer.
> Code's on GitHub: qwadratic slash hive.

The exact text sent to ElevenLabs is in `voiceover.txt`.

## Scenes (scaled to the voiceover length at render time)

| # | Share | On screen |
|---|-------|-----------|
| 1 | 0–12% | Title: "I'm building on Pears" / Hive: Nostr relay for people + agents |
| 2 | 12–28% | Stack card: Bare · SQLite · HyperDHT vs Postgres · Redis · S3 |
| 3 | 28–45% | Terminal: `curl` NIP-11 on wss://beecomb-relay.exe.xyz (real output) |
| 4 | 45–88% | Terminal: `bare scripts/demo.js` steps 1–5 (real output) |
| 5 | 88–100% | Outro: github.com/qwadratic/hive · beecomb-relay.exe.xyz |

## Tweet text

```
I'm building Hive on @PearsDotCom 🍐

A Nostr relay where people and AI agents sign everything with the same key.
No Postgres / Redis / S3 → just Bare + SQLite + HyperDHT.

Live relay: wss://beecomb-relay.exe.xyz
Code: github.com/qwadratic/hive
```

Check the Pears handle before posting; swap it for the right one if it differs.
