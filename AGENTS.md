<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Smart Library — Engineering Context & Operational Rules

## Technical Ground Rules
1. **App Router Conventions:** We run Next.js 16.3 with Turbopack and React 19. All server mutations live in `src/features/*/actions.ts` marked with `"use server"`.
2. **Quality Gates:** Every commit must clear:
   - `npx tsc --noEmit` (0 errors)
   - `npm run lint` (0 errors, 0 warnings)
   - `npm test` (26/26 features passed via `scripts/test-all-features.mjs`)
3. **Authentication Invariants:**
   - Single staff portal at `/login` (`admin` / `librarian` roles only).
   - `/admin/login` redirects permanently (301) to `/login`.
   - Never reintroduce Cloudflare Turnstile or CAPTCHA dependencies. Security is server-side rate-limited (5 attempts per username, 10 per IP) with anti-timing delays.
   - Never call `auth.admin.updateUserById({ password })` inside the login action (it revokes active refresh tokens).
4. **Circulation Invariants:**
   - All loan checkout and check-in mutations MUST call PostgreSQL RPC functions `borrow_book` and `return_book`.
   - Never write loose multi-statement SQL outside RPC for loans.
5. **Student Access:**
   - Students access their cards via cryptographic token `/card/[token]`. No student login accounts exist.
6. **Documentation & ADRs:**
   - For all architecture decisions, see `docs/decisions/`.
   - For public API and server action contracts, see `docs/api-specification.md`.
