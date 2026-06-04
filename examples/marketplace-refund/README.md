# Marketplace Refund Sample

This sample demonstrates local integrity verification.

It contains:

- one original dummy screenshot,
- one redacted/submission render,
- one packet summary artifact,
- one manifest with SHA-256 hashes and a manifest digest.

Run:

```bash
../../scripts/sek-verify.mjs verify .
```

The verifier does not prove the screenshot content is true. It only checks that the files match the hashes recorded in the manifest.
