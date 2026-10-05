#!/usr/bin/env bash
# Build the Hive-on-Pears Twitter video.
#
#   ELEVENLABS_API_KEY=sk_...  ./build.sh            clone voice from voice-samples/, then render
#   ELEVENLABS_API_KEY=sk_... VOICE_ID=... ./build.sh  reuse an existing ElevenLabs voice
#   ./build.sh                                      no key: silent video only
#
# Output: out/hive-pears.mp4 (1280x720, H.264 + AAC, Twitter-ready)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out

API=https://api.elevenlabs.io/v1
MODEL=${MODEL:-eleven_multilingual_v2}

if [[ -n "${ELEVENLABS_API_KEY:-}" && ! -f out/voice.mp3 ]]; then
  if [[ -z "${VOICE_ID:-}" ]]; then
    shopt -s nullglob
    samples=(voice-samples/*.{mp3,wav,m4a,ogg,webm,flac})
    (( ${#samples[@]} )) || { echo "put 1-3 min of your voice in voice-samples/ (or set VOICE_ID)" >&2; exit 1; }
    args=(-F "name=${VOICE_NAME:-me}" -F "remove_background_noise=true")
    for f in "${samples[@]}"; do args+=(-F "files=@$f"); done
    VOICE_ID=$(curl -fsS "$API/voices/add" -H "xi-api-key: $ELEVENLABS_API_KEY" "${args[@]}" \
      | python3 -c 'import sys,json; print(json.load(sys.stdin)["voice_id"])')
    echo "cloned voice: $VOICE_ID (reuse with VOICE_ID=$VOICE_ID)"
  fi
  python3 - "$MODEL" > out/tts.json <<'PY'
import json, sys
print(json.dumps({
  "text": open("voiceover.txt").read().strip(),
  "model_id": sys.argv[1],
  "voice_settings": {"stability": 0.45, "similarity_boost": 0.85, "style": 0.2, "use_speaker_boost": True},
}))
PY
  curl -fsS "$API/text-to-speech/$VOICE_ID?output_format=mp3_44100_128" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" -H 'Content-Type: application/json' \
    --data @out/tts.json -o out/voice.mp3
fi

if [[ -f out/voice.mp3 ]]; then
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/voice.mp3)
  secs=$(python3 -c "print(round($dur + 1.2, 2))")
else
  secs=${SECONDS_TOTAL:-40}
fi

rm -f out/*.webm
webm=$(node record.mjs "$secs" out | tail -1)

if [[ -f out/voice.mp3 ]]; then
  ffmpeg -y -loglevel error -i "$webm" -itsoffset 0.4 -i out/voice.mp3 \
    -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -r 30 \
    -c:a aac -b:a 160k -af apad -shortest -movflags +faststart out/hive-pears.mp4
else
  ffmpeg -y -loglevel error -i "$webm" -f lavfi -i anullsrc=r=44100:cl=stereo \
    -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -r 30 \
    -c:a aac -shortest -movflags +faststart out/hive-pears.mp4
fi
echo "done: $(pwd)/out/hive-pears.mp4 (${secs}s)"
