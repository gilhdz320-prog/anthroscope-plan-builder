import { randomBytes } from "crypto";

// Code format: APB-XXXX-XXXX-XXXX (uppercase alphanumeric, no ambiguous chars)
// e.g. APB-A4F7-9XKD-2MNP
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function generateAccessCode(): string {
  const groups: string[] = ["APB"];
  for (let g = 0; g < 3; g++) {
    const buf = randomBytes(4);
    let out = "";
    for (let i = 0; i < 4; i++) {
      out += ALPHABET[buf[i] % ALPHABET.length];
    }
    groups.push(out);
  }
  return groups.join("-");
}

export function normalizeCode(input: string): string {
  return input.toUpperCase().trim().replace(/\s+/g, "");
}
