/**
 * Web Crypto API utilities for genuine SHA-256 cryptographic hashing
 * Conforms to NIST FIPS 180-4 standard
 */

/**
 * Calculates genuine SHA-256 hash of an ArrayBuffer using window.crypto.subtle
 * Returns 64-character lowercase hex string
 */
export async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Calculates genuine SHA-256 hash of a browser File or Blob
 */
export async function hashFile(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return hashArrayBuffer(arrayBuffer);
}

/**
 * Calculates genuine SHA-256 hash of any text string (UTF-8 encoded)
 */
export async function hashString(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return hashArrayBuffer(data.buffer as ArrayBuffer);
}

/**
 * Detailed side-by-side hash comparison for forensic integrity validation
 */
export interface HashComparisonResult {
  isMatch: boolean;
  mismatchIndices: number[];
  matchPercentage: number;
  storedHashClean: string;
  computedHashClean: string;
}

export function compareHashes(storedHash: string, computedHash: string): HashComparisonResult {
  const h1 = (storedHash || '').trim().toLowerCase();
  const h2 = (computedHash || '').trim().toLowerCase();

  const isMatch = h1 === h2 && h1.length === 64;
  const mismatchIndices: number[] = [];

  const maxLen = Math.max(h1.length, h2.length, 64);
  let matches = 0;

  for (let i = 0; i < maxLen; i++) {
    const char1 = h1[i];
    const char2 = h2[i];
    if (char1 === char2) {
      matches++;
    } else {
      mismatchIndices.push(i);
    }
  }

  const matchPercentage = maxLen === 0 ? 0 : Math.round((matches / maxLen) * 100);

  return {
    isMatch,
    mismatchIndices,
    matchPercentage,
    storedHashClean: h1,
    computedHashClean: h2,
  };
}

/**
 * Simulates a single-bit/byte corruption on a hash for forensic testing
 */
export function simulateTamperedHash(originalHash: string): string {
  if (!originalHash || originalHash.length < 64) {
    return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  }
  const chars = originalHash.split('');
  // Flip character at index 14
  const targetIdx = 14;
  const currentChar = chars[targetIdx];
  chars[targetIdx] = currentChar === 'a' ? 'b' : currentChar === 'f' ? '0' : 'f';
  return chars.join('');
}

/**
 * Formats byte size into human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Truncates hash for compact visual inspection (e.g. "8a91bc72...f9e2")
 */
export function truncateHash(hash: string, frontChars = 8, backChars = 8): string {
  if (!hash) return '';
  if (hash.length <= frontChars + backChars + 3) return hash;
  return `${hash.slice(0, frontChars)}...${hash.slice(-backChars)}`;
}
