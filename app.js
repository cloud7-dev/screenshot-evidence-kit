const ZERO_DIGEST = "0".repeat(64);
const APP_VERSION = "0.4.0";
const REVIEW_ENGINE_VERSION = "smart-review-v1";

const state = {
  items: [],
  selectedId: null,
  verifyManifest: null,
  verifyFiles: [],
  verifyZipEntries: null
};

const els = {
  caseTitle: document.querySelector("#caseTitle"),
  disputeType: document.querySelector("#disputeType"),
  requestedOutcome: document.querySelector("#requestedOutcome"),
  country: document.querySelector("#country"),
  stateOrProvince: document.querySelector("#stateOrProvince"),
  language: document.querySelector("#language"),
  legalPackVersion: document.querySelector("#legalPackVersion"),
  caseSummary: document.querySelector("#caseSummary"),
  dropZone: document.querySelector("#dropZone"),
  fileInput: document.querySelector("#fileInput"),
  chooseFilesButton: document.querySelector("#chooseFilesButton"),
  timeline: document.querySelector("#timeline"),
  timelineMeta: document.querySelector("#timelineMeta"),
  itemTemplate: document.querySelector("#itemTemplate"),
  inspectorEmpty: document.querySelector("#inspectorEmpty"),
  inspectorContent: document.querySelector("#inspectorContent"),
  previewImage: document.querySelector("#previewImage"),
  redactionOverlay: document.querySelector("#redactionOverlay"),
  itemSource: document.querySelector("#itemSource"),
  itemCapturedAt: document.querySelector("#itemCapturedAt"),
  itemNote: document.querySelector("#itemNote"),
  itemKeyEvidence: document.querySelector("#itemKeyEvidence"),
  originalHash: document.querySelector("#originalHash"),
  renderedHash: document.querySelector("#renderedHash"),
  addRedactionButton: document.querySelector("#addRedactionButton"),
  redactionList: document.querySelector("#redactionList"),
  sortButton: document.querySelector("#sortButton"),
  includeOriginalsInput: document.querySelector("#includeOriginalsInput"),
  downloadZipButton: document.querySelector("#downloadZipButton"),
  downloadPdfButton: document.querySelector("#downloadPdfButton"),
  downloadManifestButton: document.querySelector("#downloadManifestButton"),
  downloadHashesButton: document.querySelector("#downloadHashesButton"),
  downloadRendersButton: document.querySelector("#downloadRendersButton"),
  downloadPacketButton: document.querySelector("#downloadPacketButton"),
  smartReviewScore: document.querySelector("#smartReviewScore"),
  smartReviewSummary: document.querySelector("#smartReviewSummary"),
  smartReviewList: document.querySelector("#smartReviewList"),
  runSmartReviewButton: document.querySelector("#runSmartReviewButton"),
  verifyZipInput: document.querySelector("#verifyZipInput"),
  verifyManifestInput: document.querySelector("#verifyManifestInput"),
  verifyFilesInput: document.querySelector("#verifyFilesInput"),
  runVerifyButton: document.querySelector("#runVerifyButton"),
  verifyOutput: document.querySelector("#verifyOutput"),
  loadSampleButton: document.querySelector("#loadSampleButton"),
  verifySampleButton: document.querySelector("#verifySampleButton"),
  newCaseButton: document.querySelector("#newCaseButton")
};

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(input) {
  const buffer = input instanceof ArrayBuffer ? input : await input.arrayBuffer();
  return bytesToHex(await crypto.subtle.digest("SHA-256", buffer));
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function hashText(text) {
  return sha256(new TextEncoder().encode(text).buffer);
}

async function manifestDigest(manifest) {
  const digestManifest = {
    ...manifest,
    integrity: {
      ...manifest.integrity,
      manifestDigest: ZERO_DIGEST
    }
  };
  return hashText(canonicalize(digestManifest));
}

async function packetRoot(manifest) {
  let level = [];
  for (const item of manifest.evidenceItems) {
    level.push(await hashText(`${item.id}\n${item.files.original.sha256}\n${item.files.rendered.sha256}`));
  }
  if (level.length === 0) {
    return null;
  }
  while (level.length > 1) {
    const next = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index];
      const right = level[index + 1] ?? left;
      next.push(await hashText(`${left}${right}`));
    }
    level = next;
  }
  return level[0];
}

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function nowIso() {
  return new Date().toISOString();
}

function datetimeLocalToIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isoToDatetimeLocal(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function shortHash(hash) {
  return hash ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : "-";
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function imageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for rendering."));
    image.src = url;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function renderItemBlob(item) {
  const image = await imageFromUrl(item.dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000000";
  for (const redaction of item.redactions) {
    context.fillRect(
      redaction.x * canvas.width,
      redaction.y * canvas.height,
      redaction.width * canvas.width,
      redaction.height * canvas.height
    );
  }
  const blob = await canvasToBlob(canvas);
  return blob;
}

async function blobFromText(text, type = "text/plain") {
  return new Blob([text], { type });
}

async function refreshRendered(item) {
  const blob = await renderItemBlob(item);
  item.renderedBlob = blob;
  item.renderedSha256 = await sha256(blob);
  item.renderedSizeBytes = blob.size;
  item.renderedDataUrl = await readAsDataUrl(blob);
}

async function addFiles(files) {
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  for (const file of imageFiles) {
    const id = `E-${String(state.items.length + 1).padStart(3, "0")}`;
    const dataUrl = await readAsDataUrl(file);
    const item = {
      id,
      file,
      originalName: safeName(file.name || `${id}.png`),
      sourceLabel: "Screenshot",
      capturedAt: file.lastModified ? new Date(file.lastModified).toISOString() : null,
      importedAt: nowIso(),
      note: "",
      keyEvidence: state.items.length === 0,
      originalSha256: await sha256(file),
      originalSizeBytes: file.size,
      originalMimeType: file.type || "application/octet-stream",
      dataUrl,
      redactions: []
    };
    await refreshRendered(item);
    state.items.push(item);
    state.selectedId = item.id;
  }
  render();
}

async function addSampleCase() {
  resetCase();
  els.caseTitle.value = "Used GPU refund dispute";
  els.disputeType.value = "marketplace_refund";
  els.requestedOutcome.value = "Refund or repair reimbursement";
  els.country.value = "US";
  els.language.value = "en-US";
  els.legalPackVersion.value = "us-2026-06";
  els.caseSummary.value = [
    "Seller represented the item as working.",
    "Buyer paid after the representation.",
    "The packet demonstrates file integrity after import."
  ].join("\n");
  const response = await fetch("examples/marketplace-refund/originals/chat-001.svg");
  const blob = await response.blob();
  const file = new File([blob], "chat-001.svg", {
    type: "image/svg+xml",
    lastModified: Date.parse("2026-05-30T11:12:00Z")
  });
  await addFiles([file]);
  const item = selectedItem();
  if (item) {
    item.sourceLabel = "Marketplace chat";
    item.capturedAt = "2026-05-30T11:12:00.000Z";
    item.note = "Seller represented that the item worked normally.";
    item.redactions = [
      {
        id: "R-001",
        label: "REDACTED CONTACT",
        x: 0.78,
        y: 0.72,
        width: 0.15,
        height: 0.06
      }
    ];
    await refreshRendered(item);
  }
  els.verifyOutput.textContent = "Sample case loaded. Export the ZIP packet or generate a manifest to inspect the integrity metadata.";
  render();
}

function selectedItem() {
  return state.items.find((item) => item.id === state.selectedId) ?? null;
}

function updateLegalPackDefault() {
  if (els.country.value === "KR" && els.legalPackVersion.value.startsWith("us-")) {
    els.legalPackVersion.value = "kr-2026-06";
    els.language.value = "ko-KR";
  }
  if (els.country.value === "US" && els.legalPackVersion.value.startsWith("kr-")) {
    els.legalPackVersion.value = "us-2026-06";
    els.language.value = "en-US";
  }
}

function caseSummaryLines() {
  return els.caseSummary.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function containsSensitiveCandidate(value) {
  const text = String(value ?? "");
  return [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    /\b01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}\b/,
    /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/,
    /\b(?:account|address|phone|email|ssn|계좌|주소|전화|이메일|주민등록)\b/i
  ].some((pattern) => pattern.test(text));
}

function addReviewFinding(findings, severity, code, title, detail, evidenceItemId = null) {
  findings.push({
    id: `SR-${String(findings.length + 1).padStart(3, "0")}`,
    severity,
    code,
    title,
    detail,
    evidenceItemId
  });
}

function smartReview(manifest) {
  const findings = [];
  const items = manifest.evidenceItems ?? [];
  const summaryLines = manifest.case?.summary ?? [];
  const originalHashes = new Map();

  if (items.length === 0) {
    addReviewFinding(findings, "critical", "no-evidence-items", "No evidence items", "Add at least one screenshot before exporting.");
  }
  if (!manifest.case?.requestedOutcome?.trim()) {
    addReviewFinding(findings, "warning", "missing-requested-outcome", "Requested outcome missing", "State what refund, repair, reimbursement, or response you are asking for.");
  }
  if (summaryLines.length < 2) {
    addReviewFinding(findings, "warning", "thin-case-summary", "Case summary is thin", "Add two or more short factual summary lines so the packet has context.");
  }
  if (!items.some((item) => item.keyEvidence)) {
    addReviewFinding(findings, "warning", "no-key-evidence", "No key evidence marked", "Mark the most important screenshot as key evidence.");
  }
  if (manifest.packetOptions?.originalsIncluded === false) {
    addReviewFinding(findings, "info", "originals-excluded", "Originals excluded", "Original hashes remain recorded, but full original-file verification requires separately supplied originals.");
  }

  for (const item of items) {
    if (!item.capturedAt) {
      addReviewFinding(findings, "warning", "missing-captured-at", "Missing captured timestamp", "Add a captured/imported time for this screenshot.", item.id);
    } else if (item.importedAt && new Date(item.capturedAt).getTime() > new Date(item.importedAt).getTime()) {
      addReviewFinding(findings, "warning", "captured-after-imported", "Captured time is after import time", "Check whether this timestamp was entered incorrectly.", item.id);
    }
    if (!item.sourceLabel || item.sourceLabel.toLowerCase() === "screenshot") {
      addReviewFinding(findings, "warning", "generic-source", "Source label is generic", "Name the source, such as marketplace chat, order page, payment receipt, or repair invoice.", item.id);
    }
    if (!item.note?.trim()) {
      addReviewFinding(findings, "warning", "missing-note", "Evidence note missing", "Add a short factual note explaining why this screenshot matters.", item.id);
    }
    const originalHash = item.files?.original?.sha256;
    if (originalHash) {
      if (originalHashes.has(originalHash)) {
        addReviewFinding(findings, "info", "duplicate-original-hash", "Duplicate original hash", `This file appears to match ${originalHashes.get(originalHash)}. Confirm the duplicate is intentional.`, item.id);
      } else {
        originalHashes.set(originalHash, item.id);
      }
    }
    const textForSensitiveReview = [
      item.sourceLabel,
      item.note,
      item.files?.original?.path,
      ...summaryLines
    ].join("\n");
    if (containsSensitiveCandidate(textForSensitiveReview) && item.redactions.length === 0) {
      addReviewFinding(findings, "warning", "sensitive-text-no-redaction", "Possible sensitive text without redaction", "Review this screenshot for phone, email, address, account, or ID details before sharing.", item.id);
    }
  }

  const penalty = findings.reduce((total, finding) => {
    if (finding.severity === "critical") return total + 30;
    if (finding.severity === "warning") return total + 10;
    return total + 3;
  }, 0);
  const score = Math.max(0, 100 - penalty);
  const highestSeverity = findings.some((finding) => finding.severity === "critical")
    ? "critical"
    : findings.some((finding) => finding.severity === "warning")
      ? "warning"
      : findings.some((finding) => finding.severity === "info")
        ? "info"
        : "pass";
  return {
    engine: REVIEW_ENGINE_VERSION,
    scope: "metadata-redaction-quality",
    ocr: {
      enabled: false,
      reason: "Dependency-free v0.4 review uses local metadata, notes, filenames, timestamps, and redaction state only."
    },
    score,
    highestSeverity,
    findingCount: findings.length,
    findings
  };
}

function manifestWithoutDigest() {
  const originalsIncluded = Boolean(els.includeOriginalsInput.checked);
  const legalModeLimitations = els.country.value === "KR"
    ? [
        "대한민국 모드는 사실관계와 개인정보 점검을 돕기 위한 문서화 체크리스트이며 법률 자문이 아닙니다.",
        "전자문서/소비자분쟁 관련 설명은 일반 정보이며 증거 채택이나 분쟁 결과를 보장하지 않습니다."
      ]
    : els.country.value === "US"
      ? [
          "United States mode provides documentation and authentication prompts only, not legal advice.",
          "Federal and state rules may differ; admissibility and hearsay issues are not decided by this app."
        ]
      : [
          "No jurisdiction-specific legal checklist is selected."
        ];
  const manifest = {
    formatVersion: "1.0.0",
    packetId: `vp-${Date.now()}`,
    generatedBy: {
      appName: "VeriPacket",
      appVersion: APP_VERSION,
      website: "https://cloud7-dev.github.io/screenshot-evidence-kit/"
    },
    createdAt: nowIso(),
    jurisdiction: {
      country: els.country.value,
      stateOrProvince: els.stateOrProvince.value.trim() || null,
      language: els.language.value,
      legalPackVersion: els.legalPackVersion.value.trim() || "unspecified"
    },
    case: {
      title: els.caseTitle.value.trim() || "Untitled evidence packet",
      disputeType: els.disputeType.value,
      requestedOutcome: els.requestedOutcome.value.trim(),
      summary: caseSummaryLines()
    },
    evidenceItems: state.items.map((item) => ({
      id: item.id,
      sourceLabel: item.sourceLabel,
      capturedAt: item.capturedAt,
      importedAt: item.importedAt,
      note: item.note,
      keyEvidence: item.keyEvidence,
      files: {
        original: {
          path: `originals/${item.originalName}`,
          sha256: item.originalSha256,
          mimeType: item.originalMimeType,
          sizeBytes: item.originalSizeBytes
        },
        rendered: {
          path: `rendered/${item.id}-redacted.png`,
          sha256: item.renderedSha256,
          mimeType: "image/png",
          sizeBytes: item.renderedSizeBytes
        }
      },
      redactions: item.redactions.map((redaction) => ({ ...redaction }))
    })),
    packetArtifacts: [],
    packetOptions: {
      originalsIncluded
    },
    review: null,
    integrity: {
      hashAlgorithm: "SHA-256",
      canonicalization: "oep-canonical-json-v1",
      manifestDigest: ZERO_DIGEST,
      packetRoot: ZERO_DIGEST,
      timestampProof: null
    },
    limitations: [
      "This technical packet format does not provide legal advice.",
      "This packet does not guarantee admissibility.",
      "File hashes verify integrity after import, not truth of screenshot content.",
      "No blockchain or external timestamp proof is included in v1.",
      ...(originalsIncluded
        ? []
        : ["Original files were excluded from this packet; original file hashes remain recorded, but verifier results for originals will be incomplete unless those files are supplied separately."]),
      ...legalModeLimitations
    ]
  };
  manifest.review = smartReview(manifest);
  return manifest;
}

async function buildPacketParts() {
  const manifest = manifestWithoutDigest();
  const packetHtmlText = packetHtml(manifest);
  const packetBlob = await blobFromText(packetHtmlText, "text/html");
  const packetArtifact = {
    path: "packet.html",
    sha256: await sha256(packetBlob),
    mimeType: "text/html",
    sizeBytes: packetBlob.size
  };
  manifest.packetArtifacts = [packetArtifact];
  manifest.integrity.packetRoot = (await packetRoot(manifest)) ?? ZERO_DIGEST;
  manifest.integrity.manifestDigest = await manifestDigest(manifest);
  const finalPacketHtml = packetHtml(manifest);
  const finalPacketBlob = await blobFromText(finalPacketHtml, "text/html");
  manifest.packetArtifacts = [
    {
      path: "packet.html",
      sha256: await sha256(finalPacketBlob),
      mimeType: "text/html",
      sizeBytes: finalPacketBlob.size
    }
  ];
  manifest.integrity.manifestDigest = await manifestDigest(manifest);
  const pdfBlob = await packetPdfBlob(manifest);
  const companionArtifacts = [
    {
      path: "packet.pdf",
      sha256: await sha256(pdfBlob),
      mimeType: "application/pdf",
      sizeBytes: pdfBlob.size
    }
  ];
  return {
    manifest,
    hashesText: buildHashesText(manifest, companionArtifacts),
    packetHtmlText: finalPacketHtml,
    packetBlob: finalPacketBlob,
    pdfBlob,
    companionArtifacts
  };
}

async function buildManifest() {
  return (await buildPacketParts()).manifest;
}

function buildHashesText(manifest, companionArtifacts = []) {
  const lines = [`SHA-256 file hashes for ${manifest.packetId}`, ""];
  for (const item of manifest.evidenceItems) {
    lines.push(`${item.files.original.sha256}  ${item.files.original.path}`);
    lines.push(`${item.files.rendered.sha256}  ${item.files.rendered.path}`);
  }
  for (const artifact of manifest.packetArtifacts ?? []) {
    lines.push(`${artifact.sha256}  ${artifact.path}`);
  }
  for (const artifact of companionArtifacts) {
    lines.push(`${artifact.sha256}  ${artifact.path}`);
  }
  lines.push("");
  lines.push(`manifestDigest ${manifest.integrity.manifestDigest}`);
  lines.push(`packetRoot ${manifest.integrity.packetRoot}`);
  return `${lines.join("\n")}\n`;
}

function pdfSafeText(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(value, maxLength = 86) {
  const words = String(value).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current.length + word.length + 1) <= maxLength) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function packetPdfLines(manifest) {
  const lines = [
    "Jeunggeo Jeongriham (VeriPacket) - Evidence Packet Cover",
    "",
    `Case: ${manifest.case.title}`,
    `Created: ${manifest.createdAt}`,
    `Generated by: ${manifest.generatedBy.appName} ${manifest.generatedBy.appVersion}`,
    `Jurisdiction: ${manifest.jurisdiction.country}${manifest.jurisdiction.stateOrProvince ? ` / ${manifest.jurisdiction.stateOrProvince}` : ""}`,
    `Dispute type: ${manifest.case.disputeType}`,
    `Requested outcome: ${manifest.case.requestedOutcome || "Not provided"}`,
    "",
    `Manifest digest: ${manifest.integrity.manifestDigest}`,
    `Packet root: ${manifest.integrity.packetRoot}`,
    `Original files included: ${manifest.packetOptions?.originalsIncluded === false ? "No" : "Yes"}`,
    `Smart review: ${manifest.review?.score ?? "Not run"}/100 (${manifest.review?.highestSeverity ?? "unknown"})`,
    "",
    "Timeline"
  ];
  for (const item of manifest.evidenceItems) {
    lines.push(`${item.id} | ${item.capturedAt || "Not provided"} | ${item.sourceLabel}`);
    for (const noteLine of wrapText(item.note || "No note provided.", 78)) {
      lines.push(`  ${noteLine}`);
    }
  }
  lines.push("", "Smart Review");
  for (const finding of manifest.review?.findings ?? []) {
    lines.push(`${finding.severity.toUpperCase()} ${finding.code}${finding.evidenceItemId ? ` ${finding.evidenceItemId}` : ""}`);
    for (const detailLine of wrapText(finding.detail, 78)) {
      lines.push(`  ${detailLine}`);
    }
  }
  if ((manifest.review?.findings ?? []).length === 0) {
    lines.push("No review findings.");
  }
  lines.push("", "Limitations");
  for (const limitation of manifest.limitations) {
    for (const line of wrapText(limitation, 82)) {
      lines.push(`- ${line}`);
    }
  }
  return lines;
}

function buildPdfDocument(lines) {
  const linesPerPage = 46;
  const pages = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject(null);
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];
  for (const pageLines of pages) {
    const streamLines = ["BT", "/F1 11 Tf", "50 770 Td", "14 TL"];
    pageLines.forEach((line, lineIndex) => {
      if (lineIndex > 0) streamLines.push("T*");
      streamLines.push(`(${pdfSafeText(line)}) Tj`);
    });
    streamLines.push("ET");
    const stream = `${streamLines.join("\n")}\n`;
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

async function packetPdfBlob(manifest) {
  return blobFromText(buildPdfDocument(packetPdfLines(manifest)), "application/pdf");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function downloadText(text, filename, type = "text/plain") {
  downloadBlob(new Blob([text], { type }), filename);
}

function packetHtml(manifest) {
  const reviewRows = (manifest.review?.findings ?? [])
    .map((finding) => `<tr><td>${escapeHtml(finding.severity)}</td><td>${escapeHtml(finding.code)}</td><td>${escapeHtml(finding.evidenceItemId || "")}</td><td>${escapeHtml(finding.detail)}</td></tr>`)
    .join("");
  const itemSections = state.items
    .map((item) => {
      const manifestItem = manifest.evidenceItems.find((entry) => entry.id === item.id);
      return `
        <section class="evidence-page">
          <h2>${item.id}: ${escapeHtml(item.sourceLabel)}</h2>
          <img src="${item.renderedDataUrl}" alt="${item.id} rendered screenshot">
          <p>${escapeHtml(item.note || "No note provided.")}</p>
          <dl>
            <dt>Captured</dt><dd>${escapeHtml(manifestItem.capturedAt || "Not provided")}</dd>
            <dt>Original SHA-256</dt><dd>${manifestItem.files.original.sha256}</dd>
            <dt>Rendered SHA-256</dt><dd>${manifestItem.files.rendered.sha256}</dd>
          </dl>
        </section>
      `;
    })
    .join("");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(manifest.case.title)} Evidence Packet</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 32px; line-height: 1.45; }
    h1 { font-size: 28px; }
    h2 { font-size: 20px; margin-top: 32px; }
    h3 { font-size: 16px; margin-top: 24px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    img { max-width: 100%; border: 1px solid #d1d5db; }
    dd { word-break: break-all; margin-bottom: 8px; }
    .notice { border: 1px solid #d1d5db; padding: 12px; background: #f9fafb; }
    .digest { word-break: break-all; font-family: monospace; font-size: 12px; }
    @media print { body { margin: 18mm; } .evidence-page { page-break-before: always; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(manifest.case.title)}</h1>
  <p class="notice">Technical evidence packet. Not legal advice. Does not guarantee admissibility.</p>
  <table>
    <tr><th>Created</th><td>${manifest.createdAt}</td></tr>
    <tr><th>Jurisdiction</th><td>${manifest.jurisdiction.country}</td></tr>
    <tr><th>Dispute type</th><td>${manifest.case.disputeType}</td></tr>
    <tr><th>Manifest digest</th><td class="digest">Recorded in manifest.json</td></tr>
    <tr><th>Packet root</th><td class="digest">${manifest.integrity.packetRoot}</td></tr>
    <tr><th>Smart review</th><td>${manifest.review?.score ?? "Not run"}/100 (${escapeHtml(manifest.review?.highestSeverity || "unknown")})</td></tr>
  </table>
  <h2>Summary</h2>
  <ul>${manifest.case.summary.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
  <h2>Timeline</h2>
  <table>
    <thead><tr><th>ID</th><th>Captured</th><th>Source</th><th>Note</th></tr></thead>
    <tbody>${manifest.evidenceItems
      .map((item) => `<tr><td>${item.id}</td><td>${escapeHtml(item.capturedAt || "")}</td><td>${escapeHtml(item.sourceLabel)}</td><td>${escapeHtml(item.note)}</td></tr>`)
      .join("")}</tbody>
  </table>
  <h2>Smart Review</h2>
  <p>Score: ${manifest.review?.score ?? "Not run"}/100. Scope: metadata, timestamps, notes, filenames, redactions, and packet options.</p>
  <table>
    <thead><tr><th>Severity</th><th>Code</th><th>Item</th><th>Detail</th></tr></thead>
    <tbody>${reviewRows || '<tr><td colspan="4">No review findings.</td></tr>'}</tbody>
  </table>
  <h2>Limitations</h2>
  <ul>${manifest.limitations.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
  <h2>Print to PDF</h2>
  <p>Use your browser print dialog and choose Save as PDF, or export the companion packet.pdf cover from the app.</p>
  ${itemSections}
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function exportManifest() {
  if (state.items.length === 0) return;
  const manifest = await buildManifest();
  downloadText(`${JSON.stringify(manifest, null, 2)}\n`, "evidence-manifest.json", "application/json");
}

async function exportHashes() {
  if (state.items.length === 0) return;
  const parts = await buildPacketParts();
  downloadText(parts.hashesText, "hashes.txt");
}

async function exportRenders() {
  for (const item of state.items) {
    downloadBlob(item.renderedBlob, `${item.id}-redacted.png`);
  }
}

async function exportPacket() {
  if (state.items.length === 0) return;
  const parts = await buildPacketParts();
  downloadText(parts.packetHtmlText, "packet.html", "text/html");
}

async function exportPdf() {
  if (state.items.length === 0) return;
  const parts = await buildPacketParts();
  downloadBlob(parts.pdfBlob, "packet.pdf");
}

function crc32(bytes) {
  let crc = -1;
  for (let index = 0; index < bytes.length; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function uint16(value) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function uint32(value) {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

async function zipStore(entries) {
  const encoder = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    const crc = crc32(data);
    const local = new Uint8Array([
      ...uint32(0x04034b50),
      ...uint16(20),
      ...uint16(0x0800),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(crc),
      ...uint32(data.length),
      ...uint32(data.length),
      ...uint16(nameBytes.length),
      ...uint16(0)
    ]);
    chunks.push(local, nameBytes, data);
    central.push({
      nameBytes,
      crc,
      size: data.length,
      offset
    });
    offset += local.length + nameBytes.length + data.length;
  }

  const centralStart = offset;
  for (const entry of central) {
    const header = new Uint8Array([
      ...uint32(0x02014b50),
      ...uint16(20),
      ...uint16(20),
      ...uint16(0x0800),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(entry.crc),
      ...uint32(entry.size),
      ...uint32(entry.size),
      ...uint16(entry.nameBytes.length),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(0),
      ...uint32(entry.offset)
    ]);
    chunks.push(header, entry.nameBytes);
    offset += header.length + entry.nameBytes.length;
  }
  const centralSize = offset - centralStart;
  chunks.push(new Uint8Array([
    ...uint32(0x06054b50),
    ...uint16(0),
    ...uint16(0),
    ...uint16(central.length),
    ...uint16(central.length),
    ...uint32(centralSize),
    ...uint32(centralStart),
    ...uint16(0)
  ]));

  return new Blob(chunks, { type: "application/zip" });
}

function readZipUint16(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readZipUint32(bytes, offset) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

async function parseZipStore(zipBlob) {
  const bytes = new Uint8Array(await zipBlob.arrayBuffer());
  const entries = new Map();
  const decoder = new TextDecoder();
  let offset = 0;
  while (offset + 30 <= bytes.length && readZipUint32(bytes, offset) === 0x04034b50) {
    const flags = readZipUint16(bytes, offset + 6);
    const method = readZipUint16(bytes, offset + 8);
    const compressedSize = readZipUint32(bytes, offset + 18);
    const uncompressedSize = readZipUint32(bytes, offset + 22);
    const nameLength = readZipUint16(bytes, offset + 26);
    const extraLength = readZipUint16(bytes, offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (method !== 0) {
      throw new Error("ZIP verifier currently supports store-mode ZIP files only.");
    }
    if ((flags & 0x08) !== 0) {
      throw new Error("ZIP verifier does not support ZIP data descriptors.");
    }
    if (dataEnd > bytes.length || compressedSize !== uncompressedSize) {
      throw new Error("ZIP entry size is invalid.");
    }
    const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLength));
    entries.set(name, new Blob([bytes.slice(dataStart, dataEnd)]));
    offset = dataEnd;
  }
  if (entries.size === 0) {
    throw new Error("No readable store-mode ZIP entries found.");
  }
  return entries;
}

async function exportZipPacket() {
  if (state.items.length === 0) return;
  const parts = await buildPacketParts();
  const entries = [
    { name: "manifest.json", blob: await blobFromText(`${JSON.stringify(parts.manifest, null, 2)}\n`, "application/json") },
    { name: "hashes.txt", blob: await blobFromText(parts.hashesText) },
    { name: "packet.html", blob: parts.packetBlob },
    { name: "packet.pdf", blob: parts.pdfBlob }
  ];
  for (const item of state.items) {
    entries.push({ name: `rendered/${item.id}-redacted.png`, blob: item.renderedBlob });
    if (parts.manifest.packetOptions?.originalsIncluded !== false) {
      entries.push({ name: `originals/${item.originalName}`, blob: item.file });
    }
  }
  const zipBlob = await zipStore(entries);
  downloadBlob(zipBlob, "evidence-packet.zip");
}

function render() {
  renderTimeline();
  renderInspector();
  renderSmartReview();
}

function renderTimeline() {
  els.timelineMeta.textContent = `${state.items.length} item${state.items.length === 1 ? "" : "s"} ready for local verification.`;
  els.timeline.classList.toggle("empty", state.items.length === 0);
  els.timeline.innerHTML = "";
  if (state.items.length === 0) {
    els.timeline.innerHTML = "<p>Evidence items will appear here after you add screenshots.</p>";
    return;
  }
  for (const item of state.items) {
    const node = els.itemTemplate.content.firstElementChild.cloneNode(true);
    node.classList.toggle("selected", item.id === state.selectedId);
    node.querySelector("img").src = item.renderedDataUrl || item.dataUrl;
    node.querySelector("img").alt = `${item.id} screenshot`;
    node.querySelector("h3").textContent = `${item.id} ${item.originalName}`;
    node.querySelector(".evidence-note").textContent = item.note || "No note yet.";
    node.querySelector(".captured").textContent = item.capturedAt ? new Date(item.capturedAt).toLocaleString() : "Not provided";
    node.querySelector(".sha").textContent = shortHash(item.originalSha256);
    node.addEventListener("click", () => {
      state.selectedId = item.id;
      render();
    });
    els.timeline.append(node);
  }
}

function renderInspector() {
  const item = selectedItem();
  els.inspectorEmpty.hidden = Boolean(item);
  els.inspectorContent.hidden = !item;
  if (!item) return;

  els.previewImage.src = item.renderedDataUrl || item.dataUrl;
  els.itemSource.value = item.sourceLabel;
  els.itemCapturedAt.value = isoToDatetimeLocal(item.capturedAt);
  els.itemNote.value = item.note;
  els.itemKeyEvidence.checked = item.keyEvidence;
  els.originalHash.textContent = item.originalSha256;
  els.renderedHash.textContent = item.renderedSha256;
  renderRedactions(item);
}

function renderSmartReview() {
  if (!els.smartReviewScore || !els.smartReviewList) return;
  if (state.items.length === 0) {
    els.smartReviewScore.textContent = "--";
    els.smartReviewSummary.textContent = "Add evidence to review packet quality.";
    els.smartReviewList.innerHTML = "";
    return;
  }
  const review = smartReview(manifestWithoutDigest());
  els.smartReviewScore.textContent = String(review.score);
  els.smartReviewSummary.textContent = review.findingCount === 0
    ? "No review findings."
    : `${review.findingCount} finding${review.findingCount === 1 ? "" : "s"} before export.`;
  els.smartReviewList.innerHTML = "";
  for (const finding of review.findings) {
    const node = document.createElement("article");
    node.className = "review-finding";
    node.innerHTML = `
      <span class="review-severity ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span>
      <div>
        <h3>${escapeHtml(finding.title)}${finding.evidenceItemId ? ` · ${escapeHtml(finding.evidenceItemId)}` : ""}</h3>
        <p>${escapeHtml(finding.detail)}</p>
      </div>
    `;
    els.smartReviewList.append(node);
  }
}

function renderRedactions(item) {
  els.redactionOverlay.innerHTML = "";
  els.redactionList.innerHTML = "";
  for (const redaction of item.redactions) {
    const box = document.createElement("div");
    box.className = "redaction-box";
    box.style.left = `${redaction.x * 100}%`;
    box.style.top = `${redaction.y * 100}%`;
    box.style.width = `${redaction.width * 100}%`;
    box.style.height = `${redaction.height * 100}%`;
    els.redactionOverlay.append(box);

    const row = document.createElement("div");
    row.className = "redaction-row";
    row.innerHTML = `
      <label>Label <input data-field="label" value="${escapeHtml(redaction.label)}"></label>
      <div class="mini-grid">
        <label>x <input data-field="x" type="number" min="0" max="1" step="0.01" value="${redaction.x}"></label>
        <label>y <input data-field="y" type="number" min="0" max="1" step="0.01" value="${redaction.y}"></label>
        <label>w <input data-field="width" type="number" min="0.01" max="1" step="0.01" value="${redaction.width}"></label>
        <label>h <input data-field="height" type="number" min="0.01" max="1" step="0.01" value="${redaction.height}"></label>
      </div>
      <button type="button">Remove</button>
    `;
    row.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", async () => {
        const field = input.dataset.field;
        redaction[field] = field === "label" ? input.value : clamp(Number(input.value), 0, 1);
        await refreshRendered(item);
        render();
      });
    });
    row.querySelector("button").addEventListener("click", async () => {
      item.redactions = item.redactions.filter((entry) => entry.id !== redaction.id);
      await refreshRendered(item);
      render();
    });
    els.redactionList.append(row);
  }
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

async function updateSelectedFromInspector() {
  const item = selectedItem();
  if (!item) return;
  item.sourceLabel = els.itemSource.value.trim() || "Screenshot";
  item.capturedAt = datetimeLocalToIso(els.itemCapturedAt.value);
  item.note = els.itemNote.value.trim();
  item.keyEvidence = els.itemKeyEvidence.checked;
  renderTimeline();
  renderSmartReview();
}

function basename(pathValue) {
  return String(pathValue).split("/").pop();
}

function verifyFileMap() {
  const map = new Map();
  for (const file of state.verifyFiles) {
    map.set(file.webkitRelativePath || file.name, file);
    map.set(file.name, file);
  }
  if (state.verifyZipEntries) {
    for (const [entryPath, blob] of state.verifyZipEntries.entries()) {
      map.set(entryPath, blob);
      map.set(basename(entryPath), blob);
    }
  }
  return map;
}

function parseHashesText(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[a-f0-9]{64}\s+/.test(line))
    .map((line) => {
      const [sha256Value, ...pathParts] = line.split(/\s+/);
      return { sha256: sha256Value, path: pathParts.join(" ") };
    })
    .filter((entry) => entry.path);
}

function shouldSkipMissingFile(manifest, fileRole, filePath) {
  return fileRole === "original"
    && manifest.packetOptions?.originalsIncluded === false
    && String(filePath).startsWith("originals/");
}

async function runVerify() {
  if (!state.verifyManifest) {
    els.verifyOutput.textContent = "Select a manifest or ZIP packet first.";
    return;
  }
  const failures = [];
  const logs = [];
  const skipped = [];
  const expectedManifestDigest = state.verifyManifest.integrity?.manifestDigest;
  const actualManifestDigest = await manifestDigest(state.verifyManifest);
  logs.push(`${actualManifestDigest === expectedManifestDigest ? "ok" : "fail"} manifest digest`);
  if (actualManifestDigest !== expectedManifestDigest) {
    failures.push(`manifest digest mismatch: expected ${expectedManifestDigest}, got ${actualManifestDigest}`);
  }
  if (state.verifyManifest.integrity?.packetRoot) {
    const actualPacketRoot = await packetRoot(state.verifyManifest);
    logs.push(`${actualPacketRoot === state.verifyManifest.integrity.packetRoot ? "ok" : "fail"} packet root`);
    if (actualPacketRoot !== state.verifyManifest.integrity.packetRoot) {
      failures.push(`packet root mismatch: expected ${state.verifyManifest.integrity.packetRoot}, got ${actualPacketRoot}`);
    }
  }
  if (state.verifyManifest.review) {
    logs.push(`info smart review score ${state.verifyManifest.review.score}/100 (${state.verifyManifest.review.highestSeverity})`);
  }
  const fileMap = verifyFileMap();
  const expectedFiles = [];
  for (const item of state.verifyManifest.evidenceItems ?? []) {
    expectedFiles.push([`${item.id}.original`, item.files.original, "original"]);
    expectedFiles.push([`${item.id}.rendered`, item.files.rendered, "rendered"]);
  }
  for (const artifact of state.verifyManifest.packetArtifacts ?? []) {
    expectedFiles.push([`artifact:${artifact.path}`, artifact, "artifact"]);
  }
  for (const [label, fileMeta, fileRole] of expectedFiles) {
    const file = fileMap.get(fileMeta.path) ?? fileMap.get(basename(fileMeta.path));
    if (!file) {
      if (shouldSkipMissingFile(state.verifyManifest, fileRole, fileMeta.path)) {
        logs.push(`skip ${label} (originals excluded)`);
        skipped.push(label);
        continue;
      }
      logs.push(`fail ${label}`);
      failures.push(`${label} missing file: ${fileMeta.path}`);
      continue;
    }
    const actual = await sha256(file);
    logs.push(`${actual === fileMeta.sha256 ? "ok" : "fail"} ${label}`);
    if (actual !== fileMeta.sha256) {
      failures.push(`${label} hash mismatch: expected ${fileMeta.sha256}, got ${actual}`);
    }
  }

  const hashesFile = fileMap.get("hashes.txt");
  if (hashesFile) {
    const hashesEntries = parseHashesText(await hashesFile.text());
    for (const entry of hashesEntries) {
      const file = fileMap.get(entry.path) ?? fileMap.get(basename(entry.path));
      if (!file) {
        if (shouldSkipMissingFile(state.verifyManifest, "original", entry.path)) {
          logs.push(`skip hashes.txt:${entry.path} (originals excluded)`);
          skipped.push(`hashes.txt:${entry.path}`);
          continue;
        }
        logs.push(`fail hashes.txt:${entry.path}`);
        failures.push(`hashes.txt references missing file: ${entry.path}`);
        continue;
      }
      const actual = await sha256(file);
      logs.push(`${actual === entry.sha256 ? "ok" : "fail"} hashes.txt:${entry.path}`);
      if (actual !== entry.sha256) {
        failures.push(`hashes.txt ${entry.path} mismatch: expected ${entry.sha256}, got ${actual}`);
      }
    }
  }
  els.verifyOutput.textContent = failures.length
    ? `${logs.join("\n")}\n\nVerification failed:\n- ${failures.join("\n- ")}`
    : `${logs.join("\n")}\n\nVerification passed.${skipped.length ? "\nSome checks were skipped because originals were excluded." : ""}`;
}

function resetCase() {
  state.items = [];
  state.selectedId = null;
  state.verifyManifest = null;
  state.verifyFiles = [];
  state.verifyZipEntries = null;
  els.includeOriginalsInput.checked = true;
  els.verifyZipInput.value = "";
  els.verifyManifestInput.value = "";
  els.verifyFilesInput.value = "";
  els.verifyOutput.textContent = "Waiting for manifest and files.";
  render();
}

els.chooseFilesButton.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", async (event) => addFiles(event.target.files));
els.dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  els.dropZone.classList.add("dragging");
});
els.dropZone.addEventListener("dragleave", () => els.dropZone.classList.remove("dragging"));
els.dropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  els.dropZone.classList.remove("dragging");
  await addFiles(event.dataTransfer.files);
});
document.addEventListener("paste", async (event) => {
  const files = [...event.clipboardData.items]
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (files.length > 0) {
    await addFiles(files);
  }
});

els.country.addEventListener("change", () => {
  updateLegalPackDefault();
  renderSmartReview();
});
for (const input of [
  els.caseTitle,
  els.disputeType,
  els.requestedOutcome,
  els.stateOrProvince,
  els.language,
  els.legalPackVersion,
  els.caseSummary,
  els.includeOriginalsInput
]) {
  input.addEventListener("input", renderSmartReview);
  input.addEventListener("change", renderSmartReview);
}
for (const input of [els.itemSource, els.itemCapturedAt, els.itemNote, els.itemKeyEvidence]) {
  input.addEventListener("input", updateSelectedFromInspector);
  input.addEventListener("change", updateSelectedFromInspector);
}
els.runSmartReviewButton.addEventListener("click", renderSmartReview);
els.addRedactionButton.addEventListener("click", async () => {
  const item = selectedItem();
  if (!item) return;
  item.redactions.push({
    id: `R-${String(item.redactions.length + 1).padStart(3, "0")}`,
    label: "REDACTED",
    x: 0.62,
    y: 0.58,
    width: 0.24,
    height: 0.12
  });
  await refreshRendered(item);
  render();
});
els.sortButton.addEventListener("click", () => {
  state.items.sort((a, b) => String(a.capturedAt || a.importedAt).localeCompare(String(b.capturedAt || b.importedAt)));
  render();
});
els.downloadZipButton.addEventListener("click", exportZipPacket);
els.downloadPdfButton.addEventListener("click", exportPdf);
els.downloadManifestButton.addEventListener("click", exportManifest);
els.downloadHashesButton.addEventListener("click", exportHashes);
els.downloadRendersButton.addEventListener("click", exportRenders);
els.downloadPacketButton.addEventListener("click", exportPacket);
els.verifyZipInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) {
    state.verifyZipEntries = null;
    return;
  }
  try {
    state.verifyZipEntries = await parseZipStore(file);
    const manifestBlob = state.verifyZipEntries.get("manifest.json") ?? state.verifyZipEntries.get("evidence-manifest.json");
    if (!manifestBlob) {
      throw new Error("No manifest.json or evidence-manifest.json found in ZIP.");
    }
    state.verifyManifest = JSON.parse(await manifestBlob.text());
    state.verifyFiles = [];
    els.verifyManifestInput.value = "";
    els.verifyFilesInput.value = "";
    els.verifyOutput.textContent = `Loaded ZIP packet with ${state.verifyZipEntries.size} files. Run local verification.`;
  } catch (error) {
    state.verifyZipEntries = null;
    state.verifyManifest = null;
    els.verifyOutput.textContent = `ZIP load failed: ${error.message}`;
  }
});
els.verifyManifestInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  state.verifyManifest = file ? JSON.parse(await file.text()) : null;
  state.verifyZipEntries = null;
  els.verifyZipInput.value = "";
});
els.verifyFilesInput.addEventListener("change", (event) => {
  state.verifyFiles = [...event.target.files];
  state.verifyZipEntries = null;
  els.verifyZipInput.value = "";
});
els.runVerifyButton.addEventListener("click", runVerify);
els.newCaseButton.addEventListener("click", resetCase);
els.loadSampleButton.addEventListener("click", addSampleCase);
els.verifySampleButton.addEventListener("click", async () => {
  const response = await fetch("examples/marketplace-refund/manifest.json");
  state.verifyManifest = await response.json();
  els.verifyOutput.textContent = [
    "Loaded sample manifest.",
    "To verify sample files in the browser, choose the sample files from examples/marketplace-refund.",
    "CLI verification is available with: ./scripts/veripacket-verify.mjs verify examples/marketplace-refund"
  ].join("\n");
});

render();
