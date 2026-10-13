import { permanentRedirect } from "next/navigation";

/**
 * Halaman /admin/login dialihkan secara permanen (301) ke /login.
 * Sistem kini menggunakan satu portal login terpusat di /login khusus admin/petugas.
 */
export default function AdminLoginPage() {
  permanentRedirect("/login");
}

export const dynamic = "force-dynamic";
