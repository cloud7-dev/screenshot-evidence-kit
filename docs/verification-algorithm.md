# Verification Algorithm

This document defines `sek-canonical-json-v1`.

## Canonical JSON

- Objects are serialized with keys sorted lexicographically.
- Arrays keep their original order.
- Strings, numbers, booleans, and null use JSON serialization.
- Whitespace is omitted.
- `integrity.manifestDigest` is replaced with 64 zero characters while computing the digest.

## Manifest Digest

The manifest digest is:

```text
SHA-256(canonical_manifest_json_with_zeroed_manifestDigest)
```

## Packet Root

If `integrity.packetRoot` exists, verify it as a Merkle root over evidence items:

```text
leaf = SHA-256(item.id + "\n" + originalSha256 + "\n" + renderedSha256)
parent = SHA-256(leftHex + rightHex)
```

Leaves stay in manifest order. If a level has an odd number of hashes, duplicate the last hash. One evidence item uses its leaf as the root.

## File Verification

For every evidence item:

- Read `files.original.path` relative to the manifest directory.
- Compute SHA-256 and compare with `files.original.sha256`.
- Read `files.rendered.path` relative to the manifest directory.
- Compute SHA-256 and compare with `files.rendered.sha256`.

For every packet artifact:

- Read `packetArtifacts[].path` relative to the manifest directory.
- Compute SHA-256 and compare with `packetArtifacts[].sha256`.

## Verification Result

The packet passes when:

- all referenced files exist,
- all file hashes match,
- the recomputed manifest digest matches `integrity.manifestDigest`.

## CLI Paths

The CLI accepts either a manifest file or a packet folder:

```bash
./scripts/sek-verify.mjs verify examples/marketplace-refund/manifest.json
./scripts/sek-verify.mjs verify examples/marketplace-refund
```

When a folder is passed, the verifier looks for `manifest.json` first, then `evidence-manifest.json`.
