"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  X,
  ChevronRight as BreadcrumbSeparator,
} from "lucide-react";
import {
  NAV_GROUPS,
  STUDENT_NAV_ITEMS,
  ROLE_LABEL,
  type NavItem,
} from "@/lib/nav";
import { logout } from "@/features/auth/actions";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./command-palette";
import { NotificationsPanel } from "./notifications-panel";
import { ToastProvider } from "@/components/ui/toast";
import { SchoolLogo } from "@/components/ui/school-logo";
import { OfflineBanner } from "@/components/ui/offline-banner";

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="shrink-0">
        <SchoolLogo size="sm" />
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1 leading-tight">
          <span className="block truncate font-serif text-[15px] font-medium tracking-tight text-ink">
            Perpustakaan
          </span>
          <span className="block truncate text-[11px] font-plex-sans text-ink-muted">
            SMPN 17 Tangsel
          </span>
        </div>
      )}
    </Link>
  );
}

function AdminNavItemLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname === item.href || pathname.startsWith(item.href + "/");

  const Icon = item.icon;

  return (
    <div className="group relative">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex items-center gap-3 px-3.5 py-2 text-sm font-plex-sans transition-colors duration-150",
          collapsed ? "mx-auto h-9 w-9 justify-center rounded-btn px-0" : "w-full rounded-r-btn",
          active
            ? "border-l-2 border-primary bg-primary-soft font-medium text-primary"
            : "border-l-2 border-transparent text-ink-muted hover:bg-surface-sunken-ed hover:text-ink",
        )}
      >
        <Icon
          className={cn(
            "size-4 shrink-0 transition-colors",
            active ? "text-primary" : "text-ink-muted group-hover:text-ink",
          )}
          aria-hidden
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>

      {/* Floating tooltip saat sidebar diciutkan */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-btn border border-rule-strong bg-white px-2.5 py-1 font-plex-sans text-xs font-medium text-ink shadow-dropdown group-hover:block">
          {item.label}
        </div>
      )}
    </div>
  );
}

/** Bottom navigation bar untuk siswa di layar HP (< 768px) per design.md §5 */
function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi siswa"
      className="fixed inset-x-0 bottom-0 z-30 grid h-16 grid-cols-4 border-t border-rule bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {STUDENT_NAV_ITEMS.map((item) => {
        const active =
          item.href === "/student"
            ? pathname === "/student"
            : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-colors",
              active ? "text-primary" : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="size-6 shrink-0" aria-hidden />
            <span
              className={cn(
                "text-[12px] leading-tight font-plex-sans",
                active ? "font-semibold" : "font-normal",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const getBreadcrumbLabel = (seg: string, idx: number) => {
    if (idx === 0) {
      if (seg === "admin") return "Admin";
      if (seg === "student") return "Siswa";
    }
    const map: Record<string, string> = {
      books: "Koleksi Buku",
      copies: "Eksemplar",
      students: "Anggota Siswa",
      users: "Pengguna",
      import: "Impor Data",
      reports: "Laporan",
      "audit-logs": "Log Audit",
      qr: "Cetak Label QR",
      refs: "Referensi",
      borrow: "Peminjaman",
      return: "Pengembalian",
      transactions: "Sirkulasi",
      loans: "Pinjaman",
      history: "Riwayat",
      profile: "Kartu Anggota",
      new: "Tambah",
    };
    return map[seg] || (seg.length > 20 ? `${seg.substring(0, 8)}...` : seg);
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className="hidden items-center gap-1.5 text-xs font-plex-sans text-ink-muted sm:flex"
    >
      <Link href="/admin" className="transition-colors hover:text-primary">
        Perpustakaan
      </Link>
      {segments.map((seg, idx) => {
        const href = `/${segments.slice(0, idx + 1).join("/")}`;
        const isLast = idx === segments.length - 1;
        const label = getBreadcrumbLabel(seg, idx);

        return (
          <div key={href} className="flex items-center gap-1.5">
            <BreadcrumbSeparator className="size-3 text-ink-subtle" />
            {isLast ? (
              <span className="font-medium text-ink" aria-current="page">
                {label}
              </span>
            ) : (
              <Link href={href} className="transition-colors hover:text-primary">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

const sidebarStore = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    sidebarStore.listeners.add(listener);
    return () => {
      sidebarStore.listeners.delete(listener);
    };
  },
  getSnapshot() {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("smartlib_sidebar_collapsed") === "true";
  },
  getServerSnapshot() {
    return false;
  },
  toggle() {
    if (typeof window === "undefined") return;
    const current = sidebarStore.getSnapshot();
    const next = !current;
    localStorage.setItem("smartlib_sidebar_collapsed", String(next));
    sidebarStore.listeners.forEach((l) => l());
  },
};

export function AppShell({
  role,
  userName,
  children,
}: {
  role: Role;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isStudent = role === "student";
  const navGroups = NAV_GROUPS[role] || [];

  const isCollapsed = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
    sidebarStore.getServerSnapshot
  );
  const collapsed = !isStudent && isCollapsed;
  const toggleCollapsed = () => sidebarStore.toggle();

  // Dengarkan pintasan keyboard global Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Kunci scroll saat drawer mobile terbuka
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col bg-paper font-plex-sans text-ink">
        {/* Banner offline otomatis */}
        <OfflineBanner />

        {/* ============================================================
            TATA LETAK ADMIN: SIDEBAR 248px + TOPBAR 56px (PRD §7.2)
            ============================================================ */}
        {!isStudent && (
          <>
            {/* DESKTOP SIDEBAR ADMIN (248px, Collapsible 64px) */}
            <aside
              className={cn(
                "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-rule bg-white transition-[width] duration-200 ease-in-out md:flex",
                collapsed ? "w-16" : "w-[248px]",
              )}
            >
              {/* Header Sidebar */}
              <div className="flex h-14 items-center justify-between border-b border-rule px-4">
                <Brand collapsed={collapsed} />
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label={collapsed ? "Buka sidebar" : "Ciutkan sidebar"}
                  className="flex size-7 items-center justify-center rounded-btn text-ink-muted transition-colors hover:bg-surface-sunken-ed hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {collapsed ? (
                    <ChevronRight className="size-4" />
                  ) : (
                    <ChevronLeft className="size-4" />
                  )}
                </button>
              </div>

              {/* Grup Navigasi Admin */}
              <div className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
                {navGroups.map((group) => (
                  <div key={group.group} className="space-y-0.5">
                    {!collapsed ? (
                      <p className="px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-subtle">
                        {group.group}
                      </p>
                    ) : (
                      <div className="my-2 border-t border-rule" />
                    )}
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <AdminNavItemLink
                          key={item.href}
                          item={item}
                          collapsed={collapsed}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Profil Petugas & Tombol Keluar di Dasar Sidebar */}
              <div className="border-t border-rule p-2.5">
                {!collapsed ? (
                  <div className="flex items-center justify-between rounded-btn p-1.5 transition-colors hover:bg-surface-sunken-ed">
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-xs font-semibold text-ink">{userName}</p>
                      <p className="text-[11px] text-ink-muted">{ROLE_LABEL[role]}</p>
                    </div>
                    <form action={logout}>
                      <button
                        type="submit"
                        aria-label="Keluar"
                        className="flex size-7 items-center justify-center rounded-btn text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        <LogOut className="size-3.5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <form action={logout} className="flex justify-center">
                    <button
                      type="submit"
                      aria-label="Keluar"
                      className="flex size-8 items-center justify-center rounded-btn text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <LogOut className="size-4" />
                    </button>
                  </form>
                )}
              </div>
            </aside>

            {/* AREA UTAMA ADMIN DENGAN TOPBAR 56px */}
            <div
              className={cn(
                "flex min-h-dvh flex-col transition-[padding] duration-200 ease-in-out",
                collapsed ? "md:pl-16" : "md:pl-[248px]",
              )}
            >
              {/* TOPBAR ADMIN */}
              <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-rule bg-white px-4 md:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                  {/* Hamburger Menu di Mobile */}
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Buka navigasi"
                    className="flex size-8 items-center justify-center rounded-btn border border-rule text-ink-muted hover:bg-surface-sunken-ed hover:text-ink md:hidden"
                  >
                    <Menu className="size-4" />
                  </button>

                  <div className="md:hidden">
                    <Brand />
                  </div>

                  {/* Breadcrumb di Desktop */}
                  <div className="hidden min-w-0 truncate md:block">
                    <Breadcrumb />
                  </div>
                </div>

                {/* Aksi Kanan Topbar: Pencarian, Notifikasi, Identitas */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Cari buku, siswa, transaksi (Ctrl+K)"
                    className="flex h-9 cursor-pointer items-center gap-2 rounded-btn border border-rule bg-surface-sunken-ed/60 px-2.5 sm:px-3 text-xs text-ink-muted transition-colors hover:border-rule-strong hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Search className="size-3.5 text-ink-subtle" />
                    <span className="hidden lg:inline">Cari data perpustakaan…</span>
                    <span className="hidden sm:inline lg:hidden">Cari…</span>
                    <kbd className="hidden font-mono text-[11px] text-ink-subtle xl:inline">
                      Ctrl K
                    </kbd>
                  </button>

                  <NotificationsPanel />

                  <div className="hidden items-center gap-2 border-l border-rule pl-2.5 lg:flex">
                    <span className="truncate max-w-[140px] text-xs font-semibold text-ink">{userName}</span>
                  </div>
                </div>
              </header>

              {/* Konten Halaman Admin */}
              <main className="flex-1 p-4 md:p-8">
                <div className="mx-auto w-full max-w-[1280px]">{children}</div>
              </main>
            </div>

            {/* DRAWER MOBILE NAVIGASI ADMIN */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
                <div
                  className="fixed inset-0 bg-[#161B26]/45 transition-opacity"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="fixed inset-y-0 left-0 flex w-[260px] max-w-full flex-col justify-between border-r border-rule bg-white p-4 shadow-dropdown">
                  <div className="min-h-0 overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-rule pb-3">
                      <Brand />
                      <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Tutup menu"
                        className="rounded-btn p-1 text-ink-muted hover:bg-surface-sunken-ed hover:text-ink"
                      >
                        <X className="size-4.5" />
                      </button>
                    </div>
                    <div className="mt-3 space-y-3">
                      {navGroups.map((group) => (
                        <div key={group.group}>
                          <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.04em] text-ink-subtle">
                            {group.group}
                          </p>
                          <div className="space-y-0.5">
                            {group.items.map((item) => (
                              <AdminNavItemLink
                                key={item.href}
                                item={item}
                                collapsed={false}
                                onNavigate={() => setMobileMenuOpen(false)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-rule pt-3">
                    <form action={logout}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-btn px-3 py-2 text-xs font-medium text-ink-muted hover:bg-danger-bg hover:text-danger"
                      >
                        <LogOut className="size-4" />
                        <span>Keluar ({userName})</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============================================================
            TATA LETAK SISWA (PRD §7.2):
            - Tablet/Desktop: Topbar horizontal, konten tengah maks 1040px
            - HP (< 768px): Topbar 56px + Bottom bar 4 item (64px)
            ============================================================ */}
        {isStudent && (
          <div className="flex min-h-dvh flex-col">
            {/* TOPBAR SISWA */}
            <header className="sticky top-0 z-20 border-b border-rule bg-white">
              <div className="mx-auto flex h-14 max-w-[1040px] items-center justify-between px-4 sm:px-6">
                <Brand />

                {/* Tautan Navigasi Horizontal di Tablet/Desktop */}
                <nav
                  aria-label="Navigasi siswa desktop"
                  className="hidden items-center gap-1 md:flex"
                >
                  {STUDENT_NAV_ITEMS.map((item) => {
                    const active =
                      item.href === "/student"
                        ? pathname === "/student"
                        : pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-btn px-3 py-1.5 text-xs transition-colors",
                          active
                            ? "bg-primary-soft font-medium text-primary"
                            : "text-ink-muted hover:bg-surface-sunken-ed hover:text-ink",
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* Aksi Kanan Siswa */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Cari katalog (Ctrl+K)"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-btn border border-rule text-ink-muted hover:bg-surface-sunken-ed hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Search className="size-4" />
                  </button>

                  <NotificationsPanel />

                  <form action={logout} className="hidden md:block">
                    <button
                      type="submit"
                      aria-label="Keluar"
                      title="Keluar"
                      className="flex size-9 items-center justify-center rounded-btn border border-rule text-ink-muted hover:bg-danger-bg hover:text-danger focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <LogOut className="size-4" />
                    </button>
                  </form>
                </div>
              </div>
            </header>

            {/* KONTEN SISWA */}
            <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-12 md:pt-8">
              <div className="mx-auto w-full max-w-[1040px]">{children}</div>
            </main>

            {/* BOTTOM BAR SISWA DI HP (< 768px) */}
            <StudentBottomNav />
          </div>
        )}

        {/* Global Search Command Palette */}
        <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </ToastProvider>
  );
}
