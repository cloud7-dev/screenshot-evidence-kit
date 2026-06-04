#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ZERO_DIGEST = "0".repeat(64);

function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function manifestForDigest(manifest) {
  return {
    ...manifest,
    integrity: {
      ...manifest.integrity,
      manifestDigest: ZERO_DIGEST
    }
  };
}

function computeManifestDigest(manifest) {
  return sha256Buffer(Buffer.from(canonicalize(manifestForDigest(manifest)), "utf8"));
}

function computePacketRoot(manifest) {
  let level = (manifest.evidenceItems ?? []).map((item) => {
    const originalSha = item.files?.original?.sha256 ?? "";
    const renderedSha = item.files?.rendered?.sha256 ?? "";
    return sha256Buffer(Buffer.from(`${item.id}\n${originalSha}\n${renderedSha}`, "utf8"));
  });
  if (level.length === 0) {
    return null;
  }
  while (level.length > 1) {
    const next = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index];
      const right = level[index + 1] ?? left;
      next.push(sha256Buffer(Buffer.from(`${left}${right}`, "utf8")));
    }
    level = next;
  }
  return level[0];
}

function loadManifest(manifestPath) {
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

function readZipUint16(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8);
}

function readZipUint32(buffer, offset) {
  return (buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16) | (buffer[offset + 3] << 24)) >>> 0;
}

function parseZipStore(buffer) {
  const entries = new Map();
  let offset = 0;
  while (offset + 30 <= buffer.length && readZipUint32(buffer, offset) === 0x04034b50) {
    const flags = readZipUint16(buffer, offset + 6);
    const method = readZipUint16(buffer, offset + 8);
    const compressedSize = readZipUint32(buffer, offset + 18);
    const uncompressedSize = readZipUint32(buffer, offset + 22);
    const nameLength = readZipUint16(buffer, offset + 26);
    const extraLength = readZipUint16(buffer, offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (method !== 0) {
      throw new Error("ZIP verifier currently supports store-mode ZIP files only.");
    }
    if ((flags & 0x08) !== 0) {
      throw new Error("ZIP verifier does not support ZIP data descriptors.");
    }
    if (dataEnd > buffer.length || compressedSize !== uncompressedSize) {
      throw new Error("ZIP entry size is invalid.");
    }
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString("utf8");
    entries.set(name, buffer.subarray(dataStart, dataEnd));
    offset = dataEnd;
  }
  if (entries.size === 0) {
    throw new Error("No readable store-mode ZIP entries found.");
  }
  return entries;
}

function parseHashesText(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[a-f0-9]{64}\s+/.test(line))
    .map((line) => {
      const [sha256, ...pathParts] = line.split(/\s+/);
      return { sha256, path: pathParts.join(" ") };
    })
    .filter((entry) => entry.path);
}

function resolveManifestPath(inputPath) {
  const resolved = path.resolve(inputPath);
  const stats = statSync(resolved);
  if (stats.isDirectory()) {
    const candidates = [
      path.join(resolved, "manifest.json"),
      path.join(resolved, "evidence-manifest.json")
    ];
    const found = candidates.find((candidate) => existsSync(candidate));
    if (!found) {
      throw new Error(`No manifest.json or evidence-manifest.json found in ${resolved}`);
    }
    return found;
  }
  return resolved;
}

function createSource(inputPath) {
  const resolved = path.resolve(inputPath);
  const stats = statSync(resolved);
  if (stats.isFile() && resolved.toLowerCase().endsWith(".zip")) {
    const entries = parseZipStore(readFileSync(resolved));
    const manifestBuffer = entries.get("manifest.json") ?? entries.get("evidence-manifest.json");
    if (!manifestBuffer) {
      throw new Error(`No manifest.json or evidence-manifest.json found in ${resolved}`);
    }
    return {
      manifest: JSON.parse(manifestBuffer.toString("utf8")),
      readFile: (packetPath) => {
        const buffer = entries.get(packetPath);
        if (!buffer) {
          throw new Error(`No ZIP entry ${packetPath}`);
        }
        return buffer;
      },
      hasFile: (packetPath) => entries.has(packetPath),
      sourceLabel: resolved,
      hashesText: entries.get("hashes.txt")?.toString("utf8") ?? null
    };
  }

  const resolvedManifestPath = resolveManifestPath(inputPath);
  const baseDir = path.dirname(resolvedManifestPath);
  return {
    manifest: loadManifest(resolvedManifestPath),
    readFile: (packetPath) => readFileSync(path.resolve(baseDir, packetPath)),
    hasFile: (packetPath) => existsSync(path.resolve(baseDir, packetPath)),
    sourceLabel: resolvedManifestPath,
    hashesText: existsSync(path.resolve(baseDir, "hashes.txt")) ? readFileSync(path.resolve(baseDir, "hashes.txt"), "utf8") : null
  };
}

function fileDigest(source, packetFile) {
  const buffer = source.readFile(packetFile.path);
  return {
    actualSha256: sha256Buffer(buffer),
    actualSizeBytes: buffer.length
  };
}

function shouldSkipMissingFile(manifest, fileRole, filePath) {
  return fileRole === "original"
    && manifest.packetOptions?.originalsIncluded === false
    && String(filePath).startsWith("originals/");
}

function verifyPacket(inputPath) {
  const source = createSource(inputPath);
  const manifest = source.manifest;
  const failures = [];
  const checks = [];
  const skipped = [];

  const actualManifestDigest = computeManifestDigest(manifest);
  checks.push(["manifest digest", actualManifestDigest, manifest.integrity?.manifestDigest]);
  if (actualManifestDigest !== manifest.integrity?.manifestDigest) {
    failures.push(`manifest digest mismatch: expected ${manifest.integrity?.manifestDigest}, got ${actualManifestDigest}`);
  }

  if (manifest.integrity?.packetRoot) {
    const actualPacketRoot = computePacketRoot(manifest);
    checks.push(["packet root", actualPacketRoot, manifest.integrity.packetRoot]);
    if (actualPacketRoot !== manifest.integrity.packetRoot) {
      failures.push(`packet root mismatch: expected ${manifest.integrity.packetRoot}, got ${actualPacketRoot}`);
    }
  }

  for (const item of manifest.evidenceItems ?? []) {
    for (const fileRole of ["original", "rendered"]) {
      const packetFile = item.files?.[fileRole];
      if (!packetFile) {
        failures.push(`${item.id}.${fileRole} missing file metadata`);
        continue;
      }
      try {
        const digest = fileDigest(source, packetFile);
        checks.push([`${item.id}.${fileRole}`, digest.actualSha256, packetFile.sha256]);
        if (digest.actualSha256 !== packetFile.sha256) {
          failures.push(`${item.id}.${fileRole} hash mismatch: expected ${packetFile.sha256}, got ${digest.actualSha256}`);
        }
        if (typeof packetFile.sizeBytes === "number" && digest.actualSizeBytes !== packetFile.sizeBytes) {
          failures.push(`${item.id}.${fileRole} size mismatch: expected ${packetFile.sizeBytes}, got ${digest.actualSizeBytes}`);
        }
      } catch (error) {
        if (shouldSkipMissingFile(manifest, fileRole, packetFile.path)) {
          checks.push([`${item.id}.${fileRole} (originals excluded)`, null, null, "skip"]);
          skipped.push(`${item.id}.${fileRole}`);
          continue;
        }
        failures.push(`${item.id}.${fileRole} read failed: ${error.message}`);
      }
    }
  }

  for (const artifact of manifest.packetArtifacts ?? []) {
    try {
      const digest = fileDigest(source, artifact);
      checks.push([`artifact:${artifact.path}`, digest.actualSha256, artifact.sha256]);
      if (digest.actualSha256 !== artifact.sha256) {
        failures.push(`artifact ${artifact.path} hash mismatch: expected ${artifact.sha256}, got ${digest.actualSha256}`);
      }
      if (typeof artifact.sizeBytes === "number" && digest.actualSizeBytes !== artifact.sizeBytes) {
        failures.push(`artifact ${artifact.path} size mismatch: expected ${artifact.sizeBytes}, got ${digest.actualSizeBytes}`);
      }
    } catch (error) {
      failures.push(`artifact ${artifact.path} read failed: ${error.message}`);
    }
  }

  if (source.hashesText) {
    for (const hashEntry of parseHashesText(source.hashesText)) {
      try {
        const digest = fileDigest(source, hashEntry);
        checks.push([`hashes.txt:${hashEntry.path}`, digest.actualSha256, hashEntry.sha256]);
        if (digest.actualSha256 !== hashEntry.sha256) {
          failures.push(`hashes.txt ${hashEntry.path} mismatch: expected ${hashEntry.sha256}, got ${digest.actualSha256}`);
        }
      } catch (error) {
        if (shouldSkipMissingFile(manifest, "original", hashEntry.path)) {
          checks.push([`hashes.txt:${hashEntry.path} (originals excluded)`, null, null, "skip"]);
          skipped.push(`hashes.txt:${hashEntry.path}`);
          continue;
        }
        failures.push(`hashes.txt ${hashEntry.path} read failed: ${error.message}`);
      }
    }
  }

  return { checks, failures, actualManifestDigest, skipped };
}

function printUsage() {
  console.error("Usage:");
  console.error("  node scripts/sek-verify.mjs digest <manifest.json>");
  console.error("  node scripts/sek-verify.mjs verify <manifest.json>");
  console.error("  node scripts/sek-verify.mjs verify <packet-folder>");
  console.error("  node scripts/sek-verify.mjs verify <evidence-packet.zip>");
}

const [command, manifestPath] = process.argv.slice(2);
if (!command || !manifestPath || !["digest", "verify"].includes(command)) {
  printUsage();
  process.exit(2);
}

try {
  if (command === "digest") {
    const manifest = createSource(manifestPath).manifest;
    console.log(computeManifestDigest(manifest));
  } else {
    const result = verifyPacket(manifestPath);
    for (const [label, actual, expected, forcedStatus] of result.checks) {
      const status = forcedStatus ?? (actual === expected ? "ok" : "fail");
      console.log(`${status} ${label}`);
    }
    if (result.failures.length > 0) {
      console.error("");
      console.error("Verification failed:");
      for (const failure of result.failures) {
        console.error(`- ${failure}`);
      }
      process.exit(1);
    }
    console.log("");
    console.log(`Verification passed. manifestDigest=${result.actualManifestDigest}`);
    if (result.skipped.length > 0) {
      console.log("Some checks were skipped because originals were excluded.");
    }
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
