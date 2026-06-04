# Redaction Model

Redactions are submission-render metadata. They do not modify or replace the original imported file.

## Rules

- Keep original imported files unchanged.
- Render a separate submission file with opaque redaction boxes.
- Prefer black or white opaque boxes over blur.
- Record every redaction rectangle in the manifest.
- Label sensitive categories when useful, such as `REDACTED PHONE` or `REDACTED ADDRESS`.
- Display both original and rendered hashes in the evidence packet.

## Why Not Blur

Blur can imply privacy while still leaking shape, length, layout, or recoverable information. Opaque boxes are simpler to explain and safer for evidence packets.

## Manifest Relationship

Each evidence item stores:

- `files.original.sha256`
- `files.rendered.sha256`
- `redactions[]`

This makes it clear that the submission image is intentionally different from the original.

