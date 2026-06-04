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

function fileDigest(baseDir, packetFile) {
  const fullPath = path.resolve(baseDir, packetFile.path);
  const buffer = readFileSync(fullPath);
  return {
    fullPath,
    actualSha256: sha256Buffer(buffer),
    actualSizeBytes: statSync(fullPath).size
  };
}

function verifyPacket(manifestPath) {
  const resolvedManifestPath = resolveManifestPath(manifestPath);
  const baseDir = path.dirname(resolvedManifestPath);
  const manifest = loadManifest(resolvedManifestPath);
  const failures = [];
  const checks = [];

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
        const digest = fileDigest(baseDir, packetFile);
        checks.push([`${item.id}.${fileRole}`, digest.actualSha256, packetFile.sha256]);
        if (digest.actualSha256 !== packetFile.sha256) {
          failures.push(`${item.id}.${fileRole} hash mismatch: expected ${packetFile.sha256}, got ${digest.actualSha256}`);
        }
        if (typeof packetFile.sizeBytes === "number" && digest.actualSizeBytes !== packetFile.sizeBytes) {
          failures.push(`${item.id}.${fileRole} size mismatch: expected ${packetFile.sizeBytes}, got ${digest.actualSizeBytes}`);
        }
      } catch (error) {
        failures.push(`${item.id}.${fileRole} read failed: ${error.message}`);
      }
    }
  }

  for (const artifact of manifest.packetArtifacts ?? []) {
    try {
      const digest = fileDigest(baseDir, artifact);
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

  return { checks, failures, actualManifestDigest };
}

function printUsage() {
  console.error("Usage:");
  console.error("  node scripts/sek-verify.mjs digest <manifest.json>");
  console.error("  node scripts/sek-verify.mjs verify <manifest.json>");
  console.error("  node scripts/sek-verify.mjs verify <packet-folder>");
}

const [command, manifestPath] = process.argv.slice(2);
if (!command || !manifestPath || !["digest", "verify"].includes(command)) {
  printUsage();
  process.exit(2);
}

try {
  if (command === "digest") {
    const manifest = loadManifest(resolveManifestPath(manifestPath));
    console.log(computeManifestDigest(manifest));
  } else {
    const result = verifyPacket(manifestPath);
    for (const [label, actual, expected] of result.checks) {
      const status = actual === expected ? "ok" : "fail";
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
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
