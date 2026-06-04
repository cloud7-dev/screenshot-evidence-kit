# Screenshot Evidence Kit

Local-first tools and public technical documents for turning dispute screenshots into chronological, verifiable evidence packets.

This repository publishes the **Open Evidence Packet Format**, a technical packet format for organizing screenshots, redactions, hashes, and review notes. It is not a legal evidence standard, does not provide legal advice, and does not guarantee admissibility in any court, agency, marketplace, or platform process.

## Use The Local Web App

This project is a static local web app. No build step is required.

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

Core workflow:

1. Add screenshots by drag and drop, file picker, or clipboard paste.
2. Edit case details, country mode, timeline source, timestamp, and notes.
3. Add opaque redaction rectangles to create a separate submission render.
4. Export `evidence-manifest.json`, `hashes.txt`, redacted renders, and printable `evidence-packet.html`.
5. Verify the manifest and supporting files locally.

## What Is Public

- Evidence manifest schema
- SHA-256 verification model
- Redaction metadata model
- Sample evidence packets
- Local verifier CLI
- Integrity and limitation docs

## What Is Not In This Public Core

- Lawyer matching or referral workflows
- Paid legal-pack operations
- Lawyer or customer network data
- Payment, ad ranking, or profile placement systems
- Advanced OCR or AI privacy review
- Hosted SaaS dashboards

## v1 Integrity Model

v1 is blockchain-free:

- Hash original imported files with SHA-256.
- Hash redacted/submission renders separately.
- Canonicalize the manifest JSON.
- Compute the manifest digest.
- Embed the digest in exported PDFs or packet summaries.
- Verify the packet locally with no server upload.

Optional RFC 3161 or OpenTimestamps proof can be added later for existence-time proof of the manifest digest only. It must not be marketed as "blockchain court evidence."

## Quick Verify

```bash
node scripts/sek-verify.mjs verify examples/marketplace-refund/manifest.json
```

The command checks file hashes, recomputes the canonical manifest digest, and reports whether the packet is intact.

Expected sample result:

```text
ok manifest digest
ok packet root
ok E-001.original
ok E-001.rendered
ok artifact:packet-summary.txt
ok artifact:hashes.txt

Verification passed. manifestDigest=44456b7590da182eaa9dee8569c7117f4639cef272480614ad4b6530eaca853e
```

## Repository Layout

```text
index.html                  Local web app entrypoint
app.js                      Browser-only packet builder and verifier
styles.css                  App UI styles
schema/                     Open Evidence Packet Format schema
docs/                       Integrity, redaction, and boundary docs
scripts/sek-verify.mjs      Node CLI verifier
examples/                   Sample evidence packet fixtures
outputs/                    Research and product planning artifacts
```

## License

Apache-2.0. See [LICENSE](LICENSE).
