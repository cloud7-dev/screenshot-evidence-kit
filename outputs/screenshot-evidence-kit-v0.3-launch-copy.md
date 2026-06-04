# VeriPacket v0.3 Launch Copy

## GitHub Release Draft

Title: `v0.3.0 - ZIP packet verification and PDF cover export`

VeriPacket v0.3 makes the local-first evidence packet flow verifiable end to end. Users can load the sample case, export an `evidence-packet.zip`, and verify the ZIP locally in the browser or CLI without uploading screenshots to a server.

Highlights:

- ZIP verifier for `manifest.json`, packet folders, and `evidence-packet.zip`
- Browser ZIP upload verification
- Basic `packet.pdf` cover export with manifest digest, packet root, timeline, and limitations
- `Include originals in ZIP` privacy toggle
- Updated sample packet fixture and CI checks

Boundaries:

- Not legal advice
- No lawyer referral, payment, or case outcome prediction
- No admissibility guarantee
- No blockchain or external timestamping in v0.3

## Show HN Draft

Title: `Show HN: Local-first screenshot evidence packet builder`

I built VeriPacket, a static local-first web app for organizing dispute screenshots into a chronological evidence packet.

It runs in the browser with no server upload. v0.3 exports an `evidence-packet.zip` containing a manifest, hashes, HTML/PDF packet covers, redacted renders, and optional originals. The same packet can be verified locally in the browser or CLI with SHA-256 hashes, a canonical manifest digest, and a packet root.

This is not legal advice and does not guarantee admissibility. The goal is a practical, honest technical packet format for refunds, marketplace disputes, defective goods, and similar documentation workflows.

Demo: https://cloud7-dev.github.io/screenshot-evidence-kit/

Repo: https://github.com/cloud7-dev/screenshot-evidence-kit

## Reddit Draft

I made a small local-first tool for people who need to organize screenshots for refunds, marketplace disputes, defective goods, or support claims.

VeriPacket runs as a static web app. It does not upload screenshots. You can load a sample case, redact sensitive areas, export an `evidence-packet.zip`, and verify the ZIP locally.

What v0.3 includes:

- SHA-256 manifest and packet verification
- ZIP packet upload verifier
- Basic PDF cover export
- Optional exclusion of originals from the ZIP
- MIT/Apache-style OSS positioning with clear "not legal advice" boundaries

Demo: https://cloud7-dev.github.io/screenshot-evidence-kit/

Repo: https://github.com/cloud7-dev/screenshot-evidence-kit
