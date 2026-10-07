import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BookmarkCheck,
  BookOpen,
  FileText,
  History,
  Home,
  Layers,
  QrCode,
  ScrollText,
  Upload,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV_GROUPS: Record<Role, NavGroup[]> = {
  admin: [
    {
      group: "RINGKASAN",
      items: [{ href: "/admin", label: "Dasbor", icon: Home }],
    },
    {
      group: "PERPUSTAKAAN",
      items: [
        { href: "/admin/books", label: "Buku", icon: BookOpen },
        { href: "/admin/copies", label: "Eksemplar", icon: Layers },
        { href: "/librarian/transactions", label: "Peminjaman", icon: ArrowLeftRight },
        { href: "/librarian/return", label: "Pengembalian", icon: History },
      ],
    },
    {
      group: "DATA",
      items: [
        { href: "/admin/students", label: "Siswa", icon: Users },
        { href: "/admin/users", label: "Pengguna", icon: UserCog },
        { href: "/admin/import", label: "Import", icon: Upload },
      ],
    },
    {
      group: "LAPORAN",
      items: [
        { href: "/admin/reports", label: "Laporan", icon: FileText },
        { href: "/admin/audit-logs", label: "Audit", icon: ScrollText },
      ],
    },
    {
      group: "SYSTEM",
      items: [
        { href: "/admin/qr", label: "QR Code", icon: QrCode },
        { href: "/admin/refs", label: "Referensi", icon: BookmarkCheck },
      ],
    },
  ],
  librarian: [
    {
      group: "RINGKASAN",
      items: [{ href: "/librarian", label: "Beranda", icon: Home }],
    },
    {
      group: "SIRKULASI",
      items: [
        { href: "/librarian/borrow", label: "Pinjam Buku", icon: ArrowUpFromLine },
        { href: "/librarian/return", label: "Kembalikan Buku", icon: ArrowDownToLine },
        { href: "/librarian/transactions", label: "Transaksi", icon: ScrollText },
      ],
    },
    {
      group: "KATALOG",
      items: [{ href: "/librarian/books", label: "Katalog", icon: BookOpen }],
    },
    {
      group: "LAPORAN",
      items: [{ href: "/librarian/reports", label: "Laporan", icon: FileText }],
    },
  ],
  student: [
    {
      group: "RINGKASAN",
      items: [
        { href: "/student", label: "Beranda", icon: Home },
        { href: "/student/books", label: "Katalog", icon: BookOpen },
      ],
    },
    {
      group: "AKTIVITAS SAYA",
      items: [
        { href: "/student/loans", label: "Buku Saya", icon: ArrowLeftRight },
        { href: "/student/history", label: "Riwayat", icon: History },
        { href: "/student/profile", label: "Profil & Kartu", icon: Users },
      ],
    },
  ],
};

export const NAV: Record<Role, NavItem[]> = {
  admin: NAV_GROUPS.admin.flatMap((g) => g.items),
  librarian: NAV_GROUPS.librarian.flatMap((g) => g.items),
  student: NAV_GROUPS.student.flatMap((g) => g.items),
};

export const ROLE_LABEL: Record<Role, string> = {
  student: "Siswa",
  librarian: "Penjaga Perpustakaan",
  admin: "Admin Data",
};
