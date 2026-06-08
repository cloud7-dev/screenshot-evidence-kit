# 증거정리함 (VeriPacket) v0.4 Launch Copy

Title: `v0.4.0 - Local Smart Review for evidence packets`

증거정리함 (VeriPacket) v0.4 adds a local Smart Review pass for screenshot evidence packets. Before export, the app flags missing timestamps, generic source labels, thin notes, duplicate files, original-exclusion limits, and possible sensitive metadata hints. The result is recorded in `manifest.json` and shown in the HTML/PDF packet outputs.

This is not OCR, legal advice, case-strength scoring, or admissibility review. It is a practical checklist for improving packet completeness before sharing or submitting dispute documentation.

## Release Notes

- Added Smart Review panel in the local web app
- Added `review` metadata to the Open Evidence Packet manifest
- Added review score and findings to `packet.html`
- Added review score and findings to the PDF cover
- Updated the sample packet, hashes, ZIP, schema, and README for v0.4
- Documented OCR limitations in `docs/smart-review.md`

## Short Launch Post

증거정리함 is a local-first web app for turning dispute screenshots into chronological, verifiable evidence packets. The technical OSS/core name is VeriPacket.

v0.4 adds Smart Review: a dependency-free local checklist that catches missing timestamps, generic source labels, thin notes, duplicate files, original-exclusion limits, and possible sensitive metadata hints before export.

No upload. No legal advice. No admissibility guarantee. No OCR yet.

Live demo: https://cloud7-dev.github.io/screenshot-evidence-kit/
