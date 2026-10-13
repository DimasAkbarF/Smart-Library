import { createHmac, randomBytes } from "node:crypto";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean.charAt(i));
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Menghasilkan secret key Base32 baru untuk 2FA TOTP (160-bit)
 */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/**
 * Menghasilkan token 6 digit TOTP untuk counter tertentu (RFC 6238)
 */
export function generateTotpCode(secret: string, timeStep: number = 30, forTime: number = Date.now()): string {
  const counter = Math.floor(forTime / 1000 / timeStep);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const keyBuffer = base32Decode(secret);
  const hmac = createHmac("sha1", keyBuffer).update(counterBuffer).digest();

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Memvalidasi token TOTP 6 digit (mendukung toleransi drift +/- 1 langkah = 30 detik)
 */
export function verifyTotpToken(
  secret: string,
  token: string,
  window: number = 1,
): boolean {
  if (!secret || !token || !/^\d{6}$/.test(token.trim())) return false;
  const cleanToken = token.trim();
  const now = Date.now();

  for (let step = -window; step <= window; step++) {
    const time = now + step * 30 * 1000;
    const expected = generateTotpCode(secret, 30, time);
    if (expected === cleanToken) return true;
  }

  return false;
}

/**
 * Menghasilkan URI otpauth:// untuk QR code Authenticator
 */
export function generateOtpAuthUri(
  username: string,
  secret: string,
  issuer: string = "Smart Library SMPN 17",
): string {
  const encIssuer = encodeURIComponent(issuer);
  const encAccount = encodeURIComponent(username);
  return `otpauth://totp/${encIssuer}:${encAccount}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}
