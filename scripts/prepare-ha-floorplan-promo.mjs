import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

const ROOT = process.cwd();
const VENDOR_DIR = path.join(ROOT, "vendor", "ha-floorplan-promo");
const OUTPUT_DIR = path.join(ROOT, "components", "ha-floorplan", "lib");
const EXPECTED_SHA256 = "93ec60c0d5adf522e8fa7f6d90dbfe094991a16529b7096cca3ae1e415f5bdb5";
const PARTS = [
  "archive.part01.b64",
  "archive.part02.b64",
  "archive.part03a.b64",
  "archive.part03b.b64",
  "archive.part04a.b64",
  "archive.part04b.b64",
  "archive.part05.b64",
  "archive.part06.b64",
].map((name) => path.join(VENDOR_DIR, name));
const TARGETS = new Map([
  ["export/nextjs/ha-floorplan/lib/animations-v3.js", 57234],
  ["export/nextjs/ha-floorplan/lib/hero-piece.js", 15585],
  ["export/nextjs/ha-floorplan/lib/promo-piece.js", 55809],
  ["export/nextjs/ha-floorplan/lib/tweaks-panel.js", 26858],
]);

function findEndOfCentralDirectory(buffer) {
  const signature = 0x06054b50;
  const start = Math.max(0, buffer.length - 0xffff - 22);
  for (let offset = buffer.length - 22; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) return offset;
  }
  throw new Error("Unable to locate ZIP end-of-central-directory record.");
}

function extractTargets(zip) {
  const eocd = findEndOfCentralDirectory(zip);
  const entries = zip.readUInt16LE(eocd + 10);
  let cursor = zip.readUInt32LE(eocd + 16);
  const extracted = new Map();

  for (let index = 0; index < entries; index += 1) {
    if (zip.readUInt32LE(cursor) !== 0x02014b50) throw new Error("Invalid ZIP central-directory entry.");
    const method = zip.readUInt16LE(cursor + 10);
    const compressedSize = zip.readUInt32LE(cursor + 20);
    const uncompressedSize = zip.readUInt32LE(cursor + 24);
    const nameLength = zip.readUInt16LE(cursor + 28);
    const extraLength = zip.readUInt16LE(cursor + 30);
    const commentLength = zip.readUInt16LE(cursor + 32);
    const localOffset = zip.readUInt32LE(cursor + 42);
    const name = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");

    if (TARGETS.has(name)) {
      if (zip.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`Invalid local ZIP entry for ${name}.`);
      const localNameLength = zip.readUInt16LE(localOffset + 26);
      const localExtraLength = zip.readUInt16LE(localOffset + 28);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = zip.subarray(dataOffset, dataOffset + compressedSize);
      const output = method === 0 ? compressed : method === 8 ? inflateRawSync(compressed) : null;
      if (!output) throw new Error(`Unsupported ZIP compression method ${method} for ${name}.`);
      if (output.length !== uncompressedSize || output.length !== TARGETS.get(name)) {
        throw new Error(`Unexpected extracted size for ${name}: ${output.length}.`);
      }
      extracted.set(name, output);
    }

    cursor += 46 + nameLength + extraLength + commentLength;
  }

  if (extracted.size !== TARGETS.size) {
    const missing = [...TARGETS.keys()].filter((name) => !extracted.has(name));
    throw new Error(`Promo archive is missing expected files: ${missing.join(", ")}`);
  }
  return extracted;
}

async function main() {
  const base64Parts = await Promise.all(PARTS.map(async (file) => (await readFile(file, "utf8")).trim()));
  const zip = Buffer.from(base64Parts.join(""), "base64");
  const actualHash = createHash("sha256").update(zip).digest("hex");
  if (actualHash !== EXPECTED_SHA256) {
    throw new Error(`HAFloorplan promo archive integrity check failed. Expected ${EXPECTED_SHA256}, received ${actualHash}.`);
  }

  const files = extractTargets(zip);
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const [sourceName, contents] of files) {
    await writeFile(path.join(OUTPUT_DIR, path.basename(sourceName)), contents);
  }
  console.log(`Prepared ${files.size} HAFloorplan promo runtime files.`);
}

await main();
