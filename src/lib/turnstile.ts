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
 * Aturan Keras:
 * - Dilarang memakai atau fallback ke dummy/test key.
 * - Baca secret HANYA dari env TURNSTILE_SECRET_KEY.
 * - Jika env var kosong, gagal tertutup (fail-closed) dan catat log error server.
 * - Jika timeout atau network error, tolak login (fail-closed).
 * - Cek validitas action dan hostname pada payload respons siteverify.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string,
  options: TurnstileVerifyOptions = { action: "login" },
): Promise<TurnstileVerificationResult> {
  cleanupConsumedTokens();

  // 1. Validasi keberadaan token dari client
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      success: false,
      message: "Verifikasi keamanan (Turnstile) diperlukan. Silakan centang widget verifikasi.",
    };
  }

  const cleanToken = token.trim();

  // 2. Proteksi Anti-Replay: Token hanya boleh dipakai tepat satu kali
  if (consumedTokens.has(cleanToken)) {
    console.warn("[TURNSTILE REPLAY BLOCKED] Percobaan penggunaan ulang token Turnstile terdeteksi.");
    return {
      success: false,
      message: "Token verifikasi keamanan sudah pernah digunakan. Silakan muat ulang verifikasi.",
    };
  }

  // 3. Baca Secret Key HANYA dari variabel lingkungan TURNSTILE_SECRET_KEY
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  // Jika env var kosong: GAGAL TERTUTUP (Fail-closed)
  if (!secretKey) {
    console.error(
      "[SECURITY CRITICAL - FAIL CLOSED] Variabel lingkungan TURNSTILE_SECRET_KEY belum diisi atau kosong di server. " +
      "Seluruh permintaan login otomatis ditolak demi keamanan data sekolah.",
    );
    return {
      success: false,
      message: "Layanan verifikasi bot belum dikonfigurasi pada server perpustakaan. Hubungi administrator.",
    };
  }

  // 4. Verifikasi ke Cloudflare challenges API
  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", cleanToken);
    if (remoteIp && remoteIp !== "127.0.0.1" && remoteIp !== "::1") {
      formData.append("remoteip", remoteIp);
    }

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
        message: "Layanan verifikasi keamanan Cloudflare mengalami gangguan (HTTP Error). Permintaan masuk ditolak.",
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
      console.warn("[TURNSTILE REJECTED] Respons verifikasi Cloudflare menolak token:", data["error-codes"]);
      return {
        success: false,
        message: "Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan muat ulang tantangan.",
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
    if (options.expectedHostname && data.hostname) {
      const cleanExpected = options.expectedHostname.toLowerCase().split(":")[0];
      const cleanReceived = data.hostname.toLowerCase().split(":")[0];

      // Izinkan jika cocok persis atau subdomain yang sah
      const isMatch =
        cleanReceived === cleanExpected ||
        cleanExpected.endsWith(`.${cleanReceived}`) ||
        (cleanExpected === "localhost" && cleanReceived === "127.0.0.1") ||
        (cleanExpected === "127.0.0.1" && cleanReceived === "localhost");

      if (!isMatch) {
        console.warn(
          `[TURNSTILE HOSTNAME MISMATCH] Token berasal dari hostname "${cleanReceived}", sedangkan host server adalah "${cleanExpected}". Login ditolak.`,
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
      "[TURNSTILE NETWORK/TIMEOUT ERROR] Gagal menghubungi endpoint Cloudflare siteverify dalam batas waktu 5 detik:",
      err,
    );
    return {
      success: false,
      message: "Verifikasi bot mengalami batas waktu (timeout) atau gangguan koneksi. Permintaan masuk ditolak demi keamanan.",
    };
  }
}
