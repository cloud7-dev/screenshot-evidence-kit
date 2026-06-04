# Contributing

Thanks for helping improve Screenshot Evidence Kit.

## Product Principles

- Local-first: do not add server upload requirements to the public core.
- Privacy-first: never require real evidence in examples or tests.
- Technical format: do not describe the manifest as a legal evidence standard.
- Honest limits: do not claim admissibility, court approval, or legal advice.

## Good First Contributions

- Improve sample packet fixtures with synthetic screenshots.
- Add tests for verifier mismatch cases.
- Improve print-to-PDF packet HTML.
- Improve accessibility and responsive layout.
- Expand legal pack checklists as general information with sources.

## Development

Run a local static server:

```bash
python3 -m http.server 4173
```

Verify the sample packet:

```bash
./scripts/sek-verify.mjs verify examples/marketplace-refund
```

## Pull Request Checklist

- No real personal data or real dispute evidence is committed.
- CLI verifier still passes for the sample packet.
- Browser UI still works without a backend.
- New legal or jurisdiction text says it is general information, not legal advice.
- No wording claims evidence admissibility or court approval.

