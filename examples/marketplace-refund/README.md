# Marketplace Refund Sample

This sample demonstrates local integrity verification.

It contains:

- one original dummy screenshot,
- one redacted/submission render,
- one packet HTML cover,
- one basic packet PDF cover,
- one store-mode ZIP packet,
- one manifest with SHA-256 hashes and a manifest digest.

Run:

```bash
../../scripts/sek-verify.mjs verify .
../../scripts/sek-verify.mjs verify evidence-packet.zip
```

The verifier does not prove the screenshot content is true. It only checks that the files match the hashes recorded in the manifest.
