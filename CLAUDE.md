# Smart Library — Agent Guidelines & Project Context

## 1. Project Overview & Architecture
Smart Library SMP Negeri 17 Tangerang Selatan is a high-reliability school library information system built with Next.js 16 App Router, React 19, Supabase SSR, and PostgreSQL.

- **Production Domain:** `https://perpustakaansmp17tangsel.web.id`
- **Release Path:** Vercel builds production from `main`. Pushing a feature branch does not deploy it — merge the branch into `main` and push `main` to release.
- **Architecture Decisions:** Always consult [`docs/decisions/README.md`](docs/decisions/README.md) before altering system behavior.
- **API & Interface Specs:** Refer to [`docs/api-specification.md`](docs/api-specification.md).

---

## 2. Tech Stack & Dependencies
- **Framework:** Next.js 16.3.8 (App Router, Turbopack)
- **UI & Runtime:** React 19.2.8, Tailwind CSS v4 (`@theme` tokens in `src/app/globals.css`)
- **Database & Auth:** PostgreSQL on Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Validation:** Zod v4 schemas at system boundaries
- **QR Engine:** `html5-qrcode` (camera scanning), `qrcode` (SVG generation)
- **Spreadsheet:** `xlsx` (dynamic lazy import for bulk catalog/students)
- **Icons:** `lucide-react`

---

## 3. Core Commands
| Task | Command | Standard |
|---|---|---|
| **Development** | `npm run dev` | Port 3000 (Turbopack) |
| **Type Check** | `npx tsc --noEmit` | Must pass with 0 errors |
| **Linting** | `npm run lint` | ESLint 9, 0 errors, 0 warnings |
| **Production Build** | `npm run build` | Compiles 26 routes in ~2s |
| **End-to-End Tests** | `npm test` (or `node scripts/test-all-features.mjs`) | Headless Chrome, 26/26 must pass |
| **Database Seed** | `npm run seed` | Seeds initial demonstration data |

---

## 4. Key Architectural Rules & Constraints

### Authentication & RBAC
- **Single Portal:** The only staff login is at `/login`.
- **Permanent Redirect:** `/admin/login` must permanently redirect (`HTTP 301 / permanentRedirect`) to `/login`.
- **Allowed Roles:** Only `admin` can authenticate. The legacy `librarian` role was migrated to `admin` (Migration 004).
- **No Turnstile / Cloudflare:** Cloudflare Turnstile has been completely removed. Do NOT re-introduce any Turnstile or CAPTCHA dependencies. Security is enforced server-side via dual-key rate limiting (per-username & per-IP) and anti-timing cryptographic delays (`dummyCryptoDelay`).
- **No Password Auto-Update on Login:** Never call `auth.admin.updateUserById` during login (it revokes active refresh tokens).
- **Password Change Uses the Session Path:** `/change-password` must use `supabase.auth.updateUser({ password })` on the *user session* client, so active refresh tokens survive. `auth.admin.updateUserById({ password })` is only an emergency fallback.
- **Password Change Re-Authenticates:** `/change-password` requires the current password (verified server-side via Supabase Auth) and has its own rate-limit keys (`change_password:id:*` / `change_password:ip:*`) so failed attempts never lock the login counters. Password values must never reach logs, audit metadata, URLs, or error messages.
- **Password Policy:** `src/lib/password.ts` is the single source of truth — min 12 chars, min 3 of 4 character classes, no common/default passwords, and no reuse of username/NIS/email. `scripts/test-password-policy.mjs` guards it. Never hardcode a different minimum in zod schemas, hints, or `minLength` attributes — always read `PASSWORD_POLICY`.
- **Rate Limit Source of Truth:** `auth_rate_limits` (Supabase) is authoritative; the in-memory cache mirrors it. Deleting a row must actually unlock the key, and `unlockIdentifier` / `scripts/reset-lockout.mjs` must also clear `change_password:*` keys.

### Student Access & Digital Cards
- **Tokenized Access:** Students do NOT have login accounts or passwords.
- **Digital Card URL:** Digital cards are accessible via `/card/[token]` where `token` is a high-entropy string (`STU-[A-F0-9]{20}`).
- **IDOR Protection:** Never expose sequential numeric IDs for student cards.

### Circulation & Concurrency
- **Atomic PostgreSQL RPC:** All borrow and return operations MUST be executed via `borrow_book` and `return_book` stored procedures.
- **Row-Level Locking:** Physical copy records are locked with `SELECT ... FOR UPDATE` in the database to prevent double-borrowing.

### Cookie Transport & SSR
- In `src/lib/supabase/server.ts` and `src/lib/supabase/proxy.ts`, `isSecure` dynamically detects HTTPS vs local HTTP.
- Hardcoded `secure: true` must NOT be used because it drops cookies during local automated testing.
- Always enforce `httpOnly: true`, `sameSite: "lax"`, and `path: "/"`.

---

## 5. Directory Structure & Key Files
```
src/
├── app/
│   ├── (auth)/login/       # Canonical staff login
│   ├── admin/              # Protected admin control center
│   │   ├── borrow/         # Circulation: borrow
│   │   ├── return/         # Circulation: return
│   │   ├── books/          # Catalog management
│   │   ├── copies/         # Physical inventory & QR
│   │   ├── students/       # Student management & cards
│   │   └── audit-logs/     # Security audit trail
│   ├── books/              # Public catalog & book detail
│   ├── card/[token]/       # Public digital student card
│   └── api/export/         # CSV export with formula injection sanitization
├── features/
│   ├── auth/actions.ts     # Login, logout, changePassword, unlockIdentifier
│   └── loans/actions.ts    # resolveQr, borrowAction, returnAction, listLoans
├── lib/
│   ├── types.ts            # Domain types, discriminated unions (CopyStatus, LoanStatus)
│   ├── auth.ts             # getSession, assertRole, requireApiRole, audit trail
│   └── supabase/           # server.ts, proxy.ts, service.ts, env.ts
```

---

## 6. Code Style & Design Tokens
- **Typography:** Serif headlines (`Newsreader`, `IBM Plex Serif`), Sans body/UI (`IBM Plex Sans`).
- **Color Palette:** Editorial Navy `#1B2F5B`, Ink `#161B26`, Rule `#D8DEE8`.
- **Accessibility:** Minimum WCAG 2.1 AA contrast, touch targets >= 44×44px, full keyboard Tab cycling.
- **Zero Suppression:** Never use `@ts-ignore` or disable lint rules to bypass errors.
