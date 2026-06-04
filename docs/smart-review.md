# Smart Review

VeriPacket v0.4 includes a dependency-free local Smart Review pass.

The review is a packet-quality and privacy-risk checklist. It is not legal advice, does not judge case strength, and does not decide whether evidence is admissible.

## Current Scope

The v0.4 review engine checks local packet metadata only:

- missing captured timestamps,
- generic source labels,
- missing evidence notes,
- thin case summaries,
- missing key-evidence marking,
- duplicate original file hashes,
- originals excluded from ZIP verification,
- possible sensitive text hints in user-entered fields and filenames.

The review result is written into `manifest.json` under `review`, and the score is also shown in the app, `packet.html`, and the PDF cover.

## OCR Status

OCR is not enabled in the dependency-free public v0.4 app.

The `review.ocr.enabled=false` field is intentional. It prevents users from assuming the app inspected image pixels or read text inside screenshots. Future OCR should remain opt-in, local-first, and clearly labeled.

## Scoring

The score starts at `100`.

- critical findings subtract `30`
- warning findings subtract `10`
- info findings subtract `3`

Scores are practical checklist signals only. A high score does not mean the screenshot content is true, complete, legally sufficient, or professionally reviewed.

## Findings

Each finding contains:

- `id`
- `severity`
- `code`
- `title`
- `detail`
- `evidenceItemId`

Findings should be written in neutral documentation language. Avoid language that suggests legal conclusions, guaranteed privacy, or guaranteed admissibility.
