/**
 * Utility functions for hashing passwords and deriving keys.
 * These are pure utility exports (no React component) so other screens
 * can import them directly:
 *
 * import { hashTextSHA256, pbkdf2Hash, generateSalt } from '../utils/Passwordhasher'
 */

/** Convert ArrayBuffer / Uint8Array to hex string */
function toHex(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Convert ArrayBuffer / Uint8Array to base64 string */
function toBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Hash a string using SHA-256 and return hex string. */
export async function hashTextSHA256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(hashBuffer));
}

/** Generate a cryptographically secure random salt (Uint8Array). */
export function generateSalt(length = 16) {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Derive a key from a password using PBKDF2 and return hex string.
 * - password: string
 * - salt: Uint8Array (or string - will be encoded as utf-8)
 * - iterations: number (default 100_000)
 * - hash: SHA algorithm name (default 'SHA-256')
 * - dkLen: derived key length in bytes (default 32)
 */
export async function pbkdf2Hash(password, salt, iterations = 100000, hash = "SHA-256", dkLen = 32) {
  const enc = new TextEncoder();
  const passKey = enc.encode(password);
  const saltBytes = typeof salt === "string" ? enc.encode(salt) : salt;

  const key = await crypto.subtle.importKey("raw", passKey, { name: "PBKDF2" }, false, ["deriveBits"]);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations, hash },
    key,
    dkLen * 8
  );
  return toHex(new Uint8Array(derivedBits));
}

/** Return base64 of SHA-256 (useful for compact storage) */
export async function hashTextSHA256Base64(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return toBase64(new Uint8Array(hashBuffer));
}

// Named exports only — no default React component here.