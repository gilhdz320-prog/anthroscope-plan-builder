// Minimal, dependency-free QR Code generator (byte mode, EC level M).
// Implements the QR spec well enough to encode a short URL and return a
// boolean module matrix. Supports versions 1–10 (up to ~154 bytes at EC-M),
// which comfortably covers a share link.
//
// References: ISO/IEC 18004. Kept intentionally compact; no external packages.

// ---- Galois field GF(256) for Reed–Solomon ---------------------------------
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGeneratorPoly(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const d of data) {
    const factor = d ^ res[0];
    res.shift();
    res.push(0);
    for (let j = 0; j < ecLen; j++) res[j] ^= gfMul(gen[j], factor);
  }
  return res;
}

// ---- Version tables (EC level M only) ---------------------------------------
// [ total data codewords, ecCodewordsPerBlock, [ [count, dataPerBlock], ... ] ]
interface VerInfo {
  dataCodewords: number;
  ecPerBlock: number;
  blocks: [number, number][];
  align: number[];
}
const VERSIONS: Record<number, VerInfo> = {
  1: { dataCodewords: 16, ecPerBlock: 10, blocks: [[1, 16]], align: [] },
  2: { dataCodewords: 28, ecPerBlock: 16, blocks: [[1, 28]], align: [6, 18] },
  3: { dataCodewords: 44, ecPerBlock: 26, blocks: [[1, 44]], align: [6, 22] },
  4: { dataCodewords: 64, ecPerBlock: 18, blocks: [[2, 32]], align: [6, 26] },
  5: { dataCodewords: 86, ecPerBlock: 24, blocks: [[2, 43]], align: [6, 30] },
  6: { dataCodewords: 108, ecPerBlock: 16, blocks: [[4, 27]], align: [6, 34] },
  7: { dataCodewords: 124, ecPerBlock: 18, blocks: [[4, 31]], align: [6, 22, 38] },
  8: { dataCodewords: 154, ecPerBlock: 22, blocks: [[2, 38], [2, 39]], align: [6, 24, 42] },
  9: { dataCodewords: 182, ecPerBlock: 22, blocks: [[3, 36], [2, 37]], align: [6, 26, 46] },
  10: { dataCodewords: 216, ecPerBlock: 26, blocks: [[4, 43], [1, 44]], align: [6, 28, 50] },
};

function chooseVersion(byteLen: number): number {
  // header = mode(4) + charcount(8 for v1-9, 16 for v10) bits => 2 or 3 bytes
  for (let v = 1; v <= 10; v++) {
    const headerBytes = v >= 10 ? 3 : 2;
    if (byteLen + headerBytes <= VERSIONS[v].dataCodewords) return v;
  }
  throw new Error("Data too long for supported QR versions");
}

// ---- Bit buffer -------------------------------------------------------------
class BitBuffer {
  bits: number[] = [];
  put(value: number, length: number) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }
  get length() {
    return this.bits.length;
  }
}

function encodeData(text: string, version: number): number[] {
  const bytes = Array.from(new TextEncoder().encode(text));
  const info = VERSIONS[version];
  const bb = new BitBuffer();
  bb.put(0b0100, 4); // byte mode
  bb.put(bytes.length, version >= 10 ? 16 : 8);
  for (const b of bytes) bb.put(b, 8);

  const capacityBits = info.dataCodewords * 8;
  // Terminator
  const term = Math.min(4, capacityBits - bb.length);
  bb.put(0, term);
  // Pad to byte boundary
  while (bb.length % 8 !== 0) bb.bits.push(0);

  const codewords: number[] = [];
  for (let i = 0; i < bb.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bb.bits[i + j];
    codewords.push(v);
  }
  // Pad bytes
  const pads = [0xec, 0x11];
  let pi = 0;
  while (codewords.length < info.dataCodewords) {
    codewords.push(pads[pi % 2]);
    pi++;
  }
  return codewords;
}

function interleave(dataCodewords: number[], version: number): number[] {
  const info = VERSIONS[version];
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let idx = 0;
  for (const [count, dataPer] of info.blocks) {
    for (let c = 0; c < count; c++) {
      const block = dataCodewords.slice(idx, idx + dataPer);
      idx += dataPer;
      blocks.push(block);
      ecBlocks.push(rsEncode(block, info.ecPerBlock));
    }
  }
  const maxData = Math.max(...blocks.map((b) => b.length));
  const result: number[] = [];
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.length) result.push(b[i]);
  }
  for (let i = 0; i < info.ecPerBlock; i++) {
    for (const e of ecBlocks) result.push(e[i]);
  }
  return result;
}

// ---- Matrix -----------------------------------------------------------------
type Grid = (boolean | null)[][];

function makeMatrix(version: number, finalBits: number[]): boolean[][] {
  const size = version * 4 + 17;
  const m: Grid = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    new Array(size).fill(false),
  );

  function setFn(r: number, c: number, val: boolean) {
    m[r][c] = val;
    reserved[r][c] = true;
  }

  function placeFinder(r: number, c: number) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        const inRing =
          dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
          (dr === 0 || dr === 6 || dc === 0 || dc === 6);
        const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFn(rr, cc, inRing || inCore);
      }
    }
  }
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  const ap = VERSIONS[version].align;
  for (const r of ap) {
    for (const c of ap) {
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6))
        continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const ring = Math.max(Math.abs(dr), Math.abs(dc));
          setFn(r + dr, c + dc, ring !== 1);
        }
      }
    }
  }

  // Dark module
  setFn(size - 8, 8, true);

  // Reserve format info areas
  for (let i = 0; i < 9; i++) {
    if (!reserved[8][i]) reserved[8][i] = true;
    if (!reserved[i][8]) reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // Reserve version info (v>=7)
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        reserved[i][size - 11 + j] = true;
        reserved[size - 11 + j][i] = true;
      }
    }
  }

  // Place data bits (zigzag, upward/downward columns)
  let bitIdx = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip timing column
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (let k = 0; k < 2; k++) {
        const c = col - k;
        if (reserved[row][c]) continue;
        const bit = bitIdx < finalBits.length ? finalBits[bitIdx] === 1 : false;
        m[row][c] = bit;
        bitIdx++;
      }
    }
    upward = !upward;
  }

  // Try all masks, pick lowest penalty
  let best: { grid: boolean[][]; penalty: number } | null = null;
  for (let mask = 0; mask < 8; mask++) {
    const g = applyMask(m as boolean[][], reserved, mask, size);
    placeFormat(g, reserved, version, mask, size);
    if (version >= 7) placeVersion(g, version, size);
    const p = penalty(g, size);
    if (!best || p < best.penalty) {
      best = { grid: g, penalty: p };
    }
  }
  return best!.grid;
}

function maskFn(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return false;
  }
}

function applyMask(
  base: boolean[][],
  reserved: boolean[][],
  mask: number,
  size: number,
): boolean[][] {
  const g = base.map((row) => row.slice());
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      if (maskFn(mask, r, c)) g[r][c] = !g[r][c];
    }
  }
  return g;
}

// Format info: EC level M = 0b00, with mask; BCH + XOR mask 0x5412
function placeFormat(
  g: boolean[][],
  _reserved: boolean[][],
  _version: number,
  mask: number,
  size: number,
) {
  const data = (0b00 << 3) | mask; // EC M
  let bch = data << 10;
  const g15 = 0b10100110111;
  for (let i = 14; i >= 10; i--) {
    if ((bch >> i) & 1) bch ^= g15 << (i - 10);
  }
  const format = ((data << 10) | bch) ^ 0b101010000010010;
  const bits: number[] = [];
  for (let i = 14; i >= 0; i--) bits.push((format >> i) & 1);

  // Top-left
  for (let i = 0; i < 6; i++) g[8][i] = bits[i] === 1;
  g[8][7] = bits[6] === 1;
  g[8][8] = bits[7] === 1;
  g[7][8] = bits[8] === 1;
  for (let i = 9; i < 15; i++) g[14 - i][8] = bits[i] === 1;

  // Top-right & bottom-left
  for (let i = 0; i < 8; i++) g[8][size - 1 - i] = bits[i] === 1;
  for (let i = 8; i < 15; i++) g[size - 15 + i][8] = bits[i] === 1;
}

function placeVersion(g: boolean[][], version: number, size: number) {
  let bch = version << 12;
  const g13 = 0b1111100100101;
  for (let i = 17; i >= 12; i--) {
    if ((bch >> i) & 1) bch ^= g13 << (i - 12);
  }
  const v = (version << 12) | bch;
  const bits: number[] = [];
  for (let i = 0; i < 18; i++) bits.push((v >> i) & 1);
  for (let i = 0; i < 18; i++) {
    const r = Math.floor(i / 3);
    const c = i % 3;
    g[r][size - 11 + c] = bits[i] === 1;
    g[size - 11 + c][r] = bits[i] === 1;
  }
}

function penalty(g: boolean[][], size: number): number {
  let score = 0;
  // Rule 1: runs of 5+
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (g[r][c] === g[r][c - 1]) run++;
      else { if (run >= 5) score += 3 + (run - 5); run = 1; }
    }
    if (run >= 5) score += 3 + (run - 5);
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (g[r][c] === g[r - 1][c]) run++;
      else { if (run >= 5) score += 3 + (run - 5); run = 1; }
    }
    if (run >= 5) score += 3 + (run - 5);
  }
  // Rule 2: 2x2 blocks
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = g[r][c];
      if (v === g[r][c + 1] && v === g[r + 1][c] && v === g[r + 1][c + 1]) score += 3;
    }
  }
  return score;
}

export interface QRResult {
  size: number;
  modules: boolean[][];
}

export function generateQR(text: string): QRResult {
  const bytes = new TextEncoder().encode(text);
  const version = chooseVersion(bytes.length);
  const data = encodeData(text, version);
  const finalCodewords = interleave(data, version);
  const finalBits: number[] = [];
  for (const cw of finalCodewords) {
    for (let i = 7; i >= 0; i--) finalBits.push((cw >> i) & 1);
  }
  const modules = makeMatrix(version, finalBits);
  return { size: version * 4 + 17, modules };
}

/** Render a QR matrix as an SVG string. */
export function qrToSvg(qr: QRResult, sizePx = 180, margin = 4): string {
  const total = qr.size + margin * 2;
  const scale = sizePx / total;
  let path = "";
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.modules[r][c]) {
        const x = ((c + margin) * scale).toFixed(2);
        const y = ((r + margin) * scale).toFixed(2);
        const s = scale.toFixed(2);
        path += `M${x},${y}h${s}v${s}h-${s}z`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}"><rect width="${sizePx}" height="${sizePx}" fill="#ffffff"/><path d="${path}" fill="#000000"/></svg>`;
}
