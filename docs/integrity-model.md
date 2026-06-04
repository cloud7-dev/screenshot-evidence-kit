# Integrity Model

Screenshot Evidence Kit v1 uses local integrity checks. It does not use blockchain, cloud notarization, or external timestamp authorities by default.

## Guarantees

- A verifier can detect whether imported files changed after their SHA-256 hashes were recorded.
- A verifier can detect whether the manifest changed after its digest was recorded.
- The packet can distinguish original imported files from redacted submission renders.
- Redaction metadata can explain why a submission render differs from the original file.

## Non-Guarantees

- It does not prove that screenshot content is true.
- It does not prove that the user did not edit a screenshot before import.
- It does not prove that the device clock was correct.
- It does not guarantee court, agency, marketplace, or platform admissibility.
- It does not replace legal advice or professional forensic collection.

## v1 Hash Flow

1. Hash each original imported file with SHA-256.
2. Hash each rendered/redacted submission file with SHA-256.
3. Record file paths, hashes, timestamps, redactions, and notes in `manifest.json`.
4. Canonicalize the manifest with `sek-canonical-json-v1`.
5. Set `integrity.manifestDigest` to 64 zeroes while computing the canonical digest.
6. Store the computed digest in `integrity.manifestDigest`.
7. Embed the digest in exported PDFs or packet summaries.
8. Recompute hashes locally during verification.

## v1.2 Timestamp Proof

Timestamping is optional and only applies to the manifest digest. The app should send only a digest, never the original image or PDF.

Supported future options:

- RFC 3161 Time-Stamp Protocol
- OpenTimestamps proof anchored to Bitcoin

Do not market this as "blockchain court evidence." Use "optional timestamp proof" or "existence-time proof for the packet digest."

## v1.1 Packet Root

`integrity.packetRoot` is an optional Merkle root for evidence items.

For each evidence item, compute:

```text
leaf = SHA-256(item.id + "\n" + originalSha256 + "\n" + renderedSha256)
```

Then build a binary Merkle tree:

- Keep leaves in manifest order.
- If a level has an odd number of hashes, duplicate the last hash.
- Parent hash is `SHA-256(left + right)`, where `left` and `right` are lowercase hex strings.
- A single evidence item uses its leaf as the root.

The packet root makes it easier to compare evidence item sets without parsing the whole manifest.
