import { LoginForm } from "@/app/login/login-form";
import { supabaseConfigured } from "@/lib/supabase/env";

/**
 * Kartu form login (design.md §6 & PRD §8.1).
 * Konten form berdimensi maksimal 380px terpusat di dalam panel putih.
 * Judul "Masuk" memakai h1 Newsreader + garis ganda editorial.
 */
export function LoginCard() {
  return (
    <div className="w-full max-w-[380px]">
      {/* Judul Masuk dengan font Newsreader & Garis Ganda Editorial (design.md §2, §3, & §6) */}
      <h1 className="font-serif text-[28px] font-semibold tracking-tight text-[#161B26] leading-none sm:text-[32px]">
        Masuk
      </h1>

      {/* Garis ganda header: 1px ink + 3px jarak + 1px rule-strong */}
      <div className="mt-3.5" aria-hidden="true">
        <div className="h-px w-full bg-[#161B26]" />
        <div className="mt-[3px] h-px w-full bg-rule-strong" />
      </div>

      <p className="mt-4 font-plex-sans text-[13.5px] leading-relaxed text-[#4A5160]">
        Gunakan NIS atau nama pengguna yang terdaftar di perpustakaan.
      </p>

      {!supabaseConfigured && (
        <p
          role="alert"
          className="mt-4 rounded-[4px] border border-[#E8CF97] bg-[#FBF1DC] px-3.5 py-2.5 font-plex-sans text-[13px] font-medium text-[#8A5300]"
        >
          Server belum terhubung ke database. Lengkapi{" "}
          <span className="font-plex-mono font-semibold">.env.local</span> lalu jalankan ulang.
        </p>
      )}

      <div className={supabaseConfigured ? "mt-6" : "mt-5 opacity-60"}>
        <LoginForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      </div>

      <div className="mt-6 border-t border-rule pt-4 text-center">
        <p className="font-plex-sans text-[12.5px] text-[#4A5160]">
          Lupa kata sandi?{" "}
          <span className="font-medium text-[#1B2F5B]">Hubungi petugas perpustakaan.</span>
        </p>
        <p className="mt-1 font-plex-sans text-[11.5px] text-[#666C7A]">
          Siswa masuk memakai NIS, petugas dan admin memakai nama pengguna.
        </p>
      </div>
    </div>
  );
}