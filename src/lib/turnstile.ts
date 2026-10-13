import "server-only";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cache token yang sudah pernah diverifikasi untuk mencegah Replay Attacks
// Cloudflare token berlaku selama maksimal 300 detik (5 menit).
const consumedTokens = new Map<string, number>();

function cleanupConsumedTokens() {
  const now = Date.now();
  for (const [token, expiry] of consumedTokens.entries()) {
    if (now > expiry) {
      consumedTokens.delete(token);
    }
  }
}

export interface TurnstileVerificationResult {
  success: boolean;
  message?: string;
}

export interface TurnstileVerifyOptions {
  action?: string;
  expectedHostname?: string;
}

/**
 * Memvalidasi token Cloudflare Turnstile secara server-side ke API Cloudflare.
 * Wajib dijalankan SEBELUM cek identitas / kata sandi database.
 *
 * Standar Keamanan:
 * - Fail-closed: Jika secret key tidak ada di server, login otomatis ditolak.
 * - Key hanya dari TURNSTILE_SECRET_KEY (tanpa kunci tes dummy / tanpa hardcode).
 * - Logging error-codes dari Cloudflare siteverify tanpa mengekspos secret.
 * - Pengecualian localhost hanya diizinkan saat NODE_ENV=development.
 * - Flag TURNSTILE_ENABLED=false hanya berlaku di development jika dibutuhkan.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  _remoteIp?: string,
  options: TurnstileVerifyOptions = { action: "login" },
): Promise<TurnstileVerificationResult> {
  const isDev = process.env.NODE_ENV === "development";

  // Flag darurat untuk penonaktifan sementara HANYA di lingkungan development
  if (isDev && process.env.TURNSTILE_ENABLED === "false") {
    console.warn(
      "[TURNSTILE DEV BYPASS] Verifikasi Turnstile dinonaktifkan sementara via TURNSTILE_ENABLED=false (Hanya berlaku di development).",
    );
    return { success: true };
  }

  cleanupConsumedTokens();

  // 1. Validasi keberadaan token dari client
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      success: false,
      message: "Verifikasi keamanan (Turnstile) diperlukan. Silakan selesaikan verifikasi.",
    };
  }

  const cleanToken = token.trim();

  // 2. Baca Secret Key HANYA dari variabel lingkungan (tanpa hardcode / tanpa test key bawaan)
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  // Gagal tertutup (Fail-closed) jika secret key belum dikonfigurasi
  if (!secretKey) {
    console.error(
      "[SECURITY CRITICAL - FAIL CLOSED] Variabel lingkungan TURNSTILE_SECRET_KEY belum diisi pada server. " +
      "Permintaan login ditolak demi keamanan data sekolah.",
    );
    return {
      success: false,
      message: "Layanan verifikasi bot belum dikonfigurasi pada server perpustakaan. Hubungi administrator.",
    };
  }

  // 3. Proteksi Anti-Replay: Token hanya boleh dipakai tepat satu kali
  if (consumedTokens.has(cleanToken)) {
    console.warn("[TURNSTILE REPLAY BLOCKED] Percobaan penggunaan ulang token Turnstile terdeteksi.");
    return {
      success: false,
      message: "Token verifikasi keamanan sudah pernah digunakan. Silakan muat ulang halaman.",
    };
  }

  // 4. Verifikasi ke Cloudflare challenges API
  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", cleanToken);

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(5000), // Timeout ketat 5 detik
    });

    if (!res.ok) {
      console.error(`[TURNSTILE HTTP ERROR] Cloudflare siteverify merespons status HTTP ${res.status}. Login ditolak.`);
      return {
        success: false,
        message: "Layanan verifikasi keamanan mengalami gangguan. Permintaan masuk ditolak.",
      };
    }

    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
      hostname?: string;
      action?: string;
      cdata?: string;
    };

    if (!data.success) {
      // Catat error-codes tanpa membocorkan secret key
      const errorCodes = data["error-codes"] || [];
      console.warn(
        `[TURNSTILE REJECTED] Respons Cloudflare siteverify menolak token. Error-codes: ${JSON.stringify(errorCodes)}`,
      );
      return {
        success: false,
        message: "Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan coba kembali.",
      };
    }

    // 5. Validasi Atribut Action
    const expectedAction = options.action ?? "login";
    if (data.action && data.action !== expectedAction) {
      console.warn(
        `[TURNSTILE ACTION MISMATCH] Diterima action "${data.action}", seharusnya "${expectedAction}". Login ditolak.`,
      );
      return {
        success: false,
        message: "Tindakan verifikasi bot tidak sesuai konteks formulir masuk.",
      };
    }

    // 6. Validasi Atribut Hostname
    // Domain produksi WAJIB cocok dengan domain situs perpustakaan (perpustakaansmp17tangsel.web.id).
    // Hostname localhost / 127.0.0.1 HANYA diizinkan jika NODE_ENV === "development".
    if (data.hostname) {
      const cleanReceived = data.hostname.toLowerCase().split(":")[0];
      const cleanExpected = (options.expectedHostname || "perpustakaansmp17tangsel.web.id").toLowerCase().split(":")[0];

      const isLocalhost = cleanReceived === "localhost" || cleanReceived === "127.0.0.1";
      const isAllowedLocal = isDev && isLocalhost;

      const isMatch =
        isAllowedLocal ||
        cleanReceived === cleanExpected ||
        cleanExpected.endsWith(`.${cleanReceived}`) ||
        cleanReceived === "perpustakaansmp17tangsel.web.id";

      if (!isMatch) {
        console.warn(
          `[TURNSTILE HOSTNAME MISMATCH] Token berasal dari hostname "${cleanReceived}", diharapkan "${cleanExpected}". Login ditolak.`,
        );
        return {
          success: false,
          message: "Hostname verifikasi keamanan tidak sesuai dengan domain situs perpustakaan.",
        };
      }
    }

    // 7. Catat token ke cache terpakai selama 10 menit (anti-replay)
    consumedTokens.set(cleanToken, Date.now() + 10 * 60 * 1000);

    return { success: true };
  } catch (err) {
    // Timeout atau galat jaringan: WAJIB tolak (Fail-closed)
    console.error(
      "[TURNSTILE NETWORK/TIMEOUT ERROR] Gagal menghubungi endpoint Cloudflare siteverify dalam 5 detik:",
      err,
    );
    return {
      success: false,
      message: "Verifikasi keamanan mengalami batas waktu (timeout). Permintaan masuk ditolak demi keamanan.",
    };
  }
}
