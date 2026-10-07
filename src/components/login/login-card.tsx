import { LoginForm } from "@/app/login/login-form";
import { supabaseConfigured } from "@/lib/supabase/env";

/**
 * Kartu login. Di mobile/tablet ia surface sendiri (border + radius + shadow);
 * di desktop container sudah menyediakan permukaannya, jadi chrome-nya
 * dilepas agar tidak ada border di dalam border.
 */
export function LoginCard() {
  return (
    <div className="rounded-card border border-outline bg-background p-6 shadow-card sm:p-8 lg:rounded-none lg:border-0 lg:p-0 lg:shadow-none">
      <p className="text-xs font-bold tracking-[0.18em] text-sky-deep">SMART LIBRARY</p>
      <h1 className="mt-2 font-display text-3xl font-bold [@media(max-height:720px)]:text-2xl">
        Selamat Datang
      </h1>
      <p className="mt-2 text-ink-muted">
        Masuk untuk mengakses layanan perpustakaan sekolah.
      </p>

      {!supabaseConfigured && (
        <p
          role="alert"
          className="mt-5 rounded-md bg-sun-soft px-4 py-3 text-sm font-semibold text-sun-deep"
        >
          Server belum terhubung ke database. Lengkapi{" "}
          <span className="font-mono">.env.local</span> lalu jalankan ulang — lihat README.
        </p>
      )}

      <div
        className={
          supabaseConfigured
            ? "mt-7 [@media(max-height:720px)]:mt-5"
            : "mt-5 opacity-60"
        }
      >
        <LoginForm />
      </div>

      <div className="mt-7 border-t border-outline pt-5 [@media(max-height:720px)]:mt-5 [@media(max-height:720px)]:pt-4">
        <p className="text-sm font-semibold text-ink">Lupa password?</p>
        <p className="mt-1 text-sm text-ink-muted">
          Hubungi admin perpustakaan untuk reset password. Siswa masuk memakai NIS, petugas dan
          admin memakai username.
        </p>
      </div>
    </div>
  );
}