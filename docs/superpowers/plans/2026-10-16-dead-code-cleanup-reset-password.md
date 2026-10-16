# Dead-Code Cleanup + Admin Reset Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hapus cabang role `librarian` yang sudah mati (dimigrasi Migration 004) beserta klaim docs-nya, dan tampilkan tombol Reset Kata Sandi di dashboard `/admin/users` dengan menyambungkan server action `resetUserPassword` yang sudah ada namun belum terpakai.

**Architecture:** Dua perubahan kecil yang independen. Task 1 = delesi + sinkronisasi dokumen (tidak ada kode baru). Task 2 = wiring UI saja: server action `resetUserPassword` sudah ada dan role-gated; UI memakai pola `useSweetAlert` (confirm → alert) yang sudah dipakai halaman circulation lain — tanpa endpoint/JS baru di backend, hanya 1 guard baris.

**Tech Stack:** Next.js 16 App Router, React 19 client components, Tailwind v4, Puppeteer E2E (`scripts/test-all-features.mjs`).

**Spec:** Permintaan user (2026-10-16) + invarian di `CLAUDE.md` §4 dan `AGENTS.md`. Tidak ada spec formal terpisah.

## Global Constraints

- Quality gates per commit: `npx tsc --noEmit` 0 errors; `npm run lint` 0 errors 0 warnings; `npm test` 26/26 lulus (butuh server `npm run dev` di port 3000 dengan data `npm run seed`).
- Zero suppression: tanpa `@ts-ignore` / eslint-disable untuk lolos error.
- DB constraint `profiles_role_check check (role in ('student','admin'))` — baris `'librarian'` tidak bisa ada (Migration 004 sudah mengkonversi semua ke `'admin'`).
- `updateUserById({ password })` HANYA di aksi admin reset — tidak pernah di `login` (AGENTS.md §3).
- Reset WAJIB mempertahankan perilaku: set `must_change_password: true`, tulis audit `user.reset_password_by_admin`, tampilkan temp password sekali saja di dialog admin (tidak dicetak ke log/halaman lain).
- Label tombol harus persis `Reset Kata Sandi` (di-assert E2E).
- Semua mutasi tetap di `src/features/*/actions.ts` (`"use server"`).

## Review Focus

1. **Delesi `librarian` tidak boleh mengubah login akun yang ada** — hanya baris role `admin` yang ada di DB; dites: suite E2E login tetap 26/26 (Task 1, Step 4).
2. **Sisa klaim `librarian` di docs membingungkan agent berikutnya** — dites: grep `grep -rn librarian src CLAUDE.md AGENTS.md docs/api-specification.md` menghasilkan hanya argumen RPC `p_librarian_id` (Task 1, Step 3).
3. **Reset orang lain mencabut sesi target (by design)** — tetapi reset akun sendiri akan mencabut refresh token admin yang sedang login (foot-gun ADR-001); dites: guard server `SELF_RESET` + pesan ramah (Task 2, Step 3), dan E2E tidak menekan tombol reset di test.
4. **Temp password bocor/tersimpan** — hanya dikirim balik ke caller role-gated dan dirender sekali di `<details>` dialog `alert`; tidak ada `console.log`/audit metadata berisi password (Task 2, Step 3 — audit metadata tetap `{}`).
5. **Tabel user kosong / data belum di-seed** — tombol per-baris hilang sehingga validator E2E gagal; suite sudah berasumsi ter-seed (tes login juga butuh akun admin), jadi tidak ada perubahan asumsi (Task 2, Step 1).

---

### Task 1: Hapus cabang role `librarian` mati + sinkronisasi docs

**Files:**
- Modify: `src/features/auth/actions.ts:136`
- Modify: `CLAUDE.md:40`
- Modify: `AGENTS.md:20`
- Modify: `docs/api-specification.md:22` dan `docs/api-specification.md:125`

**Interfaces:**
- Consumes: konstanta `profile.role` (tipe `Role = "student" | "admin"` dari `src/lib/types.ts:1` — tidak diubah).
- Produces: tidak ada perubahan API. login() tetap `Promise<LoginState>`.

- [ ] **Step 1: Hapus cabang mati**

Di `src/features/auth/actions.ts:136`, ubah:

```ts
if (!profile || (profile.role !== "admin" && profile.role !== "librarian")) {
```

menjadi:

```ts
if (!profile || profile.role !== "admin") {
```

(Tidak ada tempat lain: `grep -rn '"librarian"' src` hanya match baris ini.)

- [ ] **Step 2: Sinkronisasi 4 tempat docs**

- `CLAUDE.md:40`: `Only \`admin\` and \`librarian\` can authenticate.` → `Only \`admin\` can authenticate. The legacy \`librarian\` role was migrated to \`admin\` (Migration 004).`
- `AGENTS.md:20`: `` (`admin` / `librarian` roles only)`` → `` (`admin` role only; `librarian` sudah dimigrasi — Migration 004)``
- `docs/api-specification.md:22`: `**Role Wajib:** \`admin\` atau \`librarian\`` → `**Role Wajib:** \`admin\``
- `docs/api-specification.md:125`: `` `"admin" \| "librarian"` *(staf terotentikasi)* `` → `` `"admin"` *(staf terotentikasi)* ``

- [ ] **Step 3: Verifikasi sisa referensi**

Run: `grep -rn librarian src CLAUDE.md AGENTS.md docs/api-specification.md`
Expected: hanya kemunculan `p_librarian_id` (nama parameter RPC di `src/features/loans/actions.ts`) — tidak ada klaim role.

- [ ] **Step 4: Jalankan quality gates**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: 0 errors, 0 warnings, 26/26 LULUS (server dev + seed aktif).

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/actions.ts CLAUDE.md AGENTS.md docs/api-specification.md
git commit -m "fix(auth): remove dead librarian role branch and align role docs with migration 004"
```

---

### Task 2: Tombol Reset Kata Sandi di `/admin/users`

**Files:**
- Modify: `scripts/test-all-features.mjs` (validator tes 3.13, baris ~204)
- Modify: `src/features/admin/users.ts:92-104` (`resetUserPassword` — tambah 1 guard)
- Modify: `src/app/admin/users/user-client.tsx` (import + handler + kolom Aksi)

**Interfaces:**
- Consumes: `resetUserPassword(userId: string): Promise<{ ok: boolean; tempPassword?: string }>` (`src/features/admin/users.ts:92`, sudah ada, sudah `assertRole("admin")`); `useSweetAlert()` dari `@/components/ui/confirm-dialog` (sudah di-root `src/app/layout.tsx:295`); `pesanRamah`/`kodeDariError` dari `@/lib/errors`.
- Produces: label DOM persis `Reset Kata Sandi` (diandakan E2E). Tidak ada signature baru.

- [ ] **Step 1: Tambah assertion E2E dulu (failing test)**

Di `scripts/test-all-features.mjs` tes `3.13`, ubah validator menjadi:

```js
await testAdminPage("Pengaturan: Pengguna & Akses", "/admin/users", (t) =>
  (t.includes("Pengguna") || t.includes("Petugas") || t.includes("Role")) &&
    t.includes("Reset Kata Sandi")
);
```

Run: `npm test`
Expected: GAGAL tepat di `Pengaturan: Pengguna & Akses` (tombol belum ada), 25/26.

- [ ] **Step 2: Verifikasi server dev berjalan untuk iterasi**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login`
Expected: `200`. Jika bukan, jalankan `npm run dev` (background) lalu ulangi Step 1.

- [ ] **Step 3: Implement guard + UI**

3a. `src/features/admin/users.ts` — baris pertama setelah `const session = await assertRole("admin");` di `resetUserPassword`, tambah satu guard:

```ts
if (session.userId === userId) throw new Error("Reset hanya untuk pengguna lain. Untuk akun sendiri, gunakan halaman Ubah Kata Sandi.");
```

(Alasan: `updateUserById({password})` mencabut refresh token — reset diri sendiri akan logout admin di tengah sesi. `pesanRamah("", e.message)` menampilkan pesan ini apa adanya.)

3b. `src/app/admin/users/user-client.tsx`:

- Import tambahan: `resetUserPassword` dari `@/features/admin/users` dan `useSweetAlert` dari `@/components/ui/confirm-dialog`.
- Di `UsersSection`, destructure `const { confirm, alert } = useSweetAlert();` dan tambah handler dengan signature:

```ts
async function resetPassword(u: Profile): Promise<void>
```

Alur: `confirm({ title: "Reset kata sandi?", message: "Kata sandi <full_name> akan diganti. Ia akan logout dan wajib ganti kata sandi saat masuk berikutnya.", confirmText: "Reset", tone: "warning" })` → batal? return → `resetUserPassword(u.id)` → sukses? `alert({ tone: "success", title: "Kata Sandi Sementara", message: "Catat sekarang — hanya ditampilkan sekali. Sampaikan ke pengguna; ia wajib menggantinya saat login berikutnya.", confirmText: "Selesai", details: [{ label: "Username", value: `@${u.username}` }, { label: "Kata sandi sementara", value: <code className="font-mono select-all">{res.tempPassword}</code> }] })` lalu `router.refresh()` → gagal? `setMsg(pesanRamah(kodeDariError(e), e instanceof Error ? e.message : undefined))` (pola persis seperti `toggle`).

- Kolom `Aksi` (baris 110-121): bungkus isi sel dengan `<div className="flex flex-wrap gap-2">`, tombol toggle tetap seperti sekarang, tambah tombol kedua dengan kelas tombol yang sama dan:

```tsx
onClick={() => resetPassword(u)}
```

teks: `Reset Kata Sandi`.

- [ ] **Step 4: Jalankan ulang E2E**

Run: `npm test`
Expected: 26/26 LULUS (tes 3.13 kembali lulus dengan assertion baru).

- [ ] **Step 5: Quality gates**

Run: `npx tsc --noEmit && npm run lint`
Expected: 0 errors, 0 warnings.

- [ ] **Step 6: Commit**

```bash
git add scripts/test-all-features.mjs src/features/admin/users.ts src/app/admin/users/user-client.tsx
git commit -m "feat(users): add admin reset-password button with one-time temp password dialog"
```
