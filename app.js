const ZERO_DIGEST = "0".repeat(64);
const APP_VERSION = "0.2.0";

const state = {
  items: [],
  selectedId: null,
  verifyManifest: null,
  verifyFiles: []
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
  downloadZipButton: document.querySelector("#downloadZipButton"),
  downloadManifestButton: document.querySelector("#downloadManifestButton"),
  downloadHashesButton: document.querySelector("#downloadHashesButton"),
  downloadRendersButton: document.querySelector("#downloadRendersButton"),
  downloadPacketButton: document.querySelector("#downloadPacketButton"),
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

function manifestWithoutDigest() {
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
    packetId: `sek-${Date.now()}`,
    generatedBy: {
      appName: "Screenshot Evidence Kit",
      appVersion: APP_VERSION,
      website: "https://screenshot-evidence-kit.dev"
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
    integrity: {
      hashAlgorithm: "SHA-256",
      canonicalization: "sek-canonical-json-v1",
      manifestDigest: ZERO_DIGEST,
      packetRoot: ZERO_DIGEST,
      timestampProof: null
    },
    limitations: [
      "This technical packet format does not provide legal advice.",
      "This packet does not guarantee admissibility.",
      "File hashes verify integrity after import, not truth of screenshot content.",
      "No blockchain or external timestamp proof is included in v1.",
      ...legalModeLimitations
    ]
  };
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
  return {
    manifest,
    hashesText: buildHashesText(manifest),
    packetHtmlText: finalPacketHtml,
    packetBlob: finalPacketBlob
  };
}

async function buildManifest() {
  return (await buildPacketParts()).manifest;
}

function buildHashesText(manifest) {
  const lines = [`SHA-256 file hashes for ${manifest.packetId}`, ""];
  for (const item of manifest.evidenceItems) {
    lines.push(`${item.files.original.sha256}  ${item.files.original.path}`);
    lines.push(`${item.files.rendered.sha256}  ${item.files.rendered.path}`);
  }
  for (const artifact of manifest.packetArtifacts ?? []) {
    lines.push(`${artifact.sha256}  ${artifact.path}`);
  }
  lines.push("");
  lines.push(`manifestDigest ${manifest.integrity.manifestDigest}`);
  lines.push(`packetRoot ${manifest.integrity.packetRoot}`);
  return `${lines.join("\n")}\n`;
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
  <h2>Limitations</h2>
  <ul>${manifest.limitations.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
  <h2>Print to PDF</h2>
  <p>Use your browser print dialog and choose Save as PDF. Native binary PDF export is not included in this v0.2 static app.</p>
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

async function exportZipPacket() {
  if (state.items.length === 0) return;
  const parts = await buildPacketParts();
  const entries = [
    { name: "manifest.json", blob: await blobFromText(`${JSON.stringify(parts.manifest, null, 2)}\n`, "application/json") },
    { name: "hashes.txt", blob: await blobFromText(parts.hashesText) },
    { name: "packet.html", blob: parts.packetBlob }
  ];
  for (const item of state.items) {
    entries.push({ name: `rendered/${item.id}-redacted.png`, blob: item.renderedBlob });
    entries.push({ name: `originals/${item.originalName}`, blob: item.file });
  }
  const zipBlob = await zipStore(entries);
  downloadBlob(zipBlob, "evidence-packet.zip");
}

function render() {
  renderTimeline();
  renderInspector();
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
}

async function runVerify() {
  if (!state.verifyManifest) {
    els.verifyOutput.textContent = "Select a manifest first.";
    return;
  }
  const failures = [];
  const logs = [];
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
  const fileMap = new Map(state.verifyFiles.map((file) => [file.name, file]));
  const expectedFiles = [];
  for (const item of state.verifyManifest.evidenceItems ?? []) {
    expectedFiles.push([`${item.id}.original`, item.files.original]);
    expectedFiles.push([`${item.id}.rendered`, item.files.rendered]);
  }
  for (const artifact of state.verifyManifest.packetArtifacts ?? []) {
    expectedFiles.push([`artifact:${artifact.path}`, artifact]);
  }
  for (const [label, fileMeta] of expectedFiles) {
    const file = fileMap.get(fileMeta.path.split("/").pop());
    if (!file) {
      logs.push(`skip ${label}`);
      continue;
    }
    const actual = await sha256(file);
    logs.push(`${actual === fileMeta.sha256 ? "ok" : "fail"} ${label}`);
    if (actual !== fileMeta.sha256) {
      failures.push(`${label} hash mismatch: expected ${fileMeta.sha256}, got ${actual}`);
    }
  }
  els.verifyOutput.textContent = failures.length
    ? `${logs.join("\n")}\n\nVerification failed:\n- ${failures.join("\n- ")}`
    : `${logs.join("\n")}\n\nVerification passed.`;
}

function resetCase() {
  state.items = [];
  state.selectedId = null;
  state.verifyManifest = null;
  state.verifyFiles = [];
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

els.country.addEventListener("change", updateLegalPackDefault);
for (const input of [els.itemSource, els.itemCapturedAt, els.itemNote, els.itemKeyEvidence]) {
  input.addEventListener("input", updateSelectedFromInspector);
  input.addEventListener("change", updateSelectedFromInspector);
}
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
els.downloadManifestButton.addEventListener("click", exportManifest);
els.downloadHashesButton.addEventListener("click", exportHashes);
els.downloadRendersButton.addEventListener("click", exportRenders);
els.downloadPacketButton.addEventListener("click", exportPacket);
els.verifyManifestInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  state.verifyManifest = file ? JSON.parse(await file.text()) : null;
});
els.verifyFilesInput.addEventListener("change", (event) => {
  state.verifyFiles = [...event.target.files];
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
    "CLI verification is available with: ./scripts/sek-verify.mjs verify examples/marketplace-refund"
  ].join("\n");
});

render();
