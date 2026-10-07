"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Menu,
  X,
  ChevronRight as BreadcrumbSeparator,
} from "lucide-react";
import { NAV_GROUPS, ROLE_LABEL, type NavItem } from "@/lib/nav";
import { logout } from "@/features/auth/actions";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./command-palette";
import { NotificationsPanel } from "./notifications-panel";
import { ToastProvider } from "@/components/ui/toast";

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky text-white shadow-xs group-hover:bg-sky-deep transition-colors">
        <BookMarked className="size-5.5" aria-hidden />
      </span>
      {!collapsed && (
        <span className="min-w-0 transition-opacity duration-200">
          <span className="block font-display text-base leading-tight font-bold tracking-tight text-ink">
            Smart Library
          </span>
          <span className="block truncate text-[11px] font-medium text-ink-subtle">
            SMPN 17 Tangerang Selatan
          </span>
        </span>
      )}
    </Link>
  );
}

function NavItemLink({
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
    item.href === "/admin" || item.href === "/librarian" || item.href === "/student"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");

  const Icon = item.icon;

  return (
    <div className="relative group">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-all duration-150 relative",
          collapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "w-full",
          active
            ? "bg-sky-soft text-sky-deep font-bold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-sky"
            : "text-ink-muted hover:bg-surface hover:text-ink"
        )}
      >
        <Icon
          className={cn(
            "size-5 shrink-0 transition-transform duration-150",
            active ? "text-sky-deep" : "text-ink-subtle group-hover:text-ink",
            "group-hover:scale-105"
          )}
          aria-hidden
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>

      {/* Floating tooltip when collapsed */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 z-50 hidden rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-white shadow-md group-hover:block whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          {item.label}
        </div>
      )}
    </div>
  );
}

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const getBreadcrumbLabel = (seg: string, idx: number) => {
    if (idx === 0) {
      if (seg === "admin") return "Admin";
      if (seg === "librarian") return "Petugas";
      if (seg === "student") return "Siswa";
    }
    const map: Record<string, string> = {
      books: "Katalog Buku",
      copies: "Eksemplar",
      students: "Data Siswa",
      users: "Pengguna",
      import: "Impor Data",
      reports: "Laporan",
      "audit-logs": "Audit Trail",
      qr: "Label QR",
      refs: "Referensi",
      borrow: "Peminjaman",
      return: "Pengembalian",
      transactions: "Transaksi",
      loans: "Buku Saya",
      history: "Riwayat",
      profile: "Profil Siswa",
      new: "Tambah Baru",
    };
    return map[seg] || (seg.length > 20 ? `${seg.substring(0, 8)}...` : seg);
  };

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-ink-subtle">
      <Link href="/" className="hover:text-sky-deep transition-colors">
        Smart Library
      </Link>
      {segments.map((seg, idx) => {
        const href = `/${segments.slice(0, idx + 1).join("/")}`;
        const isLast = idx === segments.length - 1;
        const label = getBreadcrumbLabel(seg, idx);

        return (
          <div key={href} className="flex items-center gap-1.5">
            <BreadcrumbSeparator className="size-3 text-ink-faint" />
            {isLast ? (
              <span className="font-semibold text-ink" aria-current="page">
                {label}
              </span>
            ) : (
              <Link href={href} className="hover:text-sky-deep transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({
  role,
  userName,
  children,
}: {
  role: Role;
  userName: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isStudent = role === "student";
  const navGroups = NAV_GROUPS[role] || [];

  // Listen for Ctrl+K globally
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

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface/50">
        {/* ============================================================
            DESKTOP SIDEBAR
            Expanded: 260px | Collapsed: 72px (transition 200-240ms)
            ============================================================ */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-outline bg-background transition-[width] duration-220 ease-in-out md:flex",
            collapsed ? "w-[72px]" : "w-[260px]"
          )}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-outline px-4">
            <Brand collapsed={collapsed} />
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
              className="flex size-7 items-center justify-center rounded-md text-ink-subtle hover:bg-surface hover:text-ink transition-colors"
            >
              {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          </div>

          {/* Navigation Links Grouped */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {navGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                {!collapsed ? (
                  <p className="px-3 pb-1 text-[11px] font-bold tracking-wider text-ink-subtle uppercase font-mono">
                    {group.group}
                  </p>
                ) : (
                  <div className="my-2 border-t border-outline/60" />
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavItemLink key={item.href} item={item} collapsed={collapsed} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* User profile & Sign Out footer */}
          <div className="border-t border-outline p-3">
            {!collapsed ? (
              <div className="flex items-center justify-between rounded-lg p-2 hover:bg-surface transition-colors">
                <div className="min-w-0 pr-2">
                  <p className="truncate text-xs font-bold text-ink">{userName}</p>
                  <p className="text-[11px] text-ink-subtle">{ROLE_LABEL[role]}</p>
                </div>
                <form action={logout}>
                  <button
                    type="submit"
                    aria-label="Keluar"
                    className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-coral-soft hover:text-coral-deep transition-colors"
                  >
                    <LogOut className="size-4" />
                  </button>
                </form>
              </div>
            ) : (
              <form action={logout} className="flex justify-center">
                <button
                  type="submit"
                  aria-label="Keluar"
                  className="flex size-10 items-center justify-center rounded-md text-ink-muted hover:bg-coral-soft hover:text-coral-deep transition-colors"
                >
                  <LogOut className="size-5" />
                </button>
              </form>
            )}
          </div>
        </aside>

        {/* ============================================================
            MAIN CONTAINER
            With contained max-width on high resolutions (PRD / directive)
            ============================================================ */}
        <div
          className={cn(
            "flex flex-col min-h-screen transition-[padding] duration-220 ease-in-out",
            collapsed ? "md:pl-[72px]" : "md:pl-[260px]"
          )}
        >
          {/* ============================================================
              TOPBAR (Desktop & Mobile)
              Production grade: Breadcrumb, Global Search, Notifications, Profile
              ============================================================ */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline bg-background px-4 sm:px-6 md:px-8">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {/* Mobile hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka menu navigasi"
                className="flex size-10 items-center justify-center rounded-lg border border-outline text-ink-muted hover:bg-surface hover:text-ink md:hidden"
              >
                <Menu className="size-5" />
              </button>

              <div className="md:hidden">
                <Brand />
              </div>

              {/* Desktop Breadcrumb */}
              <div className="hidden md:block">
                <Breadcrumb />
              </div>
            </div>

            {/* Right Topbar actions: Search, Notifications, Profile */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Global Search Trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 items-center gap-2 rounded-lg border border-outline bg-surface-sunken/40 px-3 text-xs text-ink-subtle hover:border-outline-strong hover:bg-surface hover:text-ink transition-all cursor-pointer"
              >
                <Search className="size-4 text-ink-subtle" />
                <span className="hidden sm:inline">Cari buku, siswa, transaksi...</span>
                <span className="inline sm:hidden">Cari...</span>
                <kbd className="hidden sm:inline-flex items-center rounded border border-outline bg-background px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle shadow-2xs">
                  Ctrl K
                </kbd>
              </button>

              {/* Notifications */}
              <NotificationsPanel />

              {/* User quick badge */}
              <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-outline">
                <div className="flex size-9 items-center justify-center rounded-full bg-sky-soft text-sky-deep font-bold text-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs leading-tight">
                  <span className="block font-semibold text-ink">{userName}</span>
                  <span className="text-[11px] text-ink-subtle">{ROLE_LABEL[role]}</span>
                </div>
              </div>
            </div>
          </header>

          {/* ============================================================
              MAIN CONTENT AREA
              Contained max-width: 1440px
              ============================================================ */}
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-8 lg:px-10 pb-24 md:pb-12">
            <div className="mx-auto max-w-[1440px] w-full">{children}</div>
          </main>
        </div>

        {/* ============================================================
            MOBILE DRAWER (Staff / Student)
            ============================================================ */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-ink/50 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-background p-5 shadow-modal flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-outline">
                  <Brand />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Tutup menu"
                    className="p-1 rounded-md text-ink-subtle hover:bg-surface hover:text-ink"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <div className="mt-4 space-y-4 overflow-y-auto max-h-[70vh]">
                  {navGroups.map((group) => (
                    <div key={group.group}>
                      <p className="px-2 pb-1 text-[11px] font-bold text-ink-subtle uppercase font-mono">
                        {group.group}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((item) => (
                          <NavItemLink
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

              <div className="border-t border-outline pt-4">
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-ink-muted hover:bg-coral-soft hover:text-coral-deep"
                  >
                    <LogOut className="size-5" />
                    Keluar ({userName})
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Mobile bottom nav for students */}
        {isStudent && (
          <nav
            aria-label="Navigasi cepat"
            className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-outline bg-background px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden"
          >
            {navGroups
              .flatMap((g) => g.items)
              .slice(0, 4)
              .map((item) => (
                <NavItemLink key={item.href} item={item} collapsed={true} />
              ))}
          </nav>
        )}

        {/* Global Search Command Palette */}
        <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </ToastProvider>
  );
}
