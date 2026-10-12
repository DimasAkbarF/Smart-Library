import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BookmarkCheck,
  BookOpen,
  FileText,
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

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    group: "SIRKULASI",
    items: [
      { href: "/admin/borrow", label: "Pinjam Buku", icon: ArrowUpFromLine },
      { href: "/admin/return", label: "Kembalikan Buku", icon: ArrowDownToLine },
      { href: "/admin/transactions", label: "Daftar Transaksi", icon: ArrowLeftRight },
    ],
  },
  {
    group: "KOLEKSI",
    items: [
      { href: "/admin/books", label: "Katalog Buku", icon: BookOpen },
      { href: "/admin/copies", label: "Eksemplar Fisik", icon: Layers },
      { href: "/admin/qr", label: "Cetak Label QR", icon: QrCode },
      { href: "/admin/import", label: "Impor Data", icon: Upload },
    ],
  },
  {
    group: "ANGGOTA",
    items: [
      { href: "/admin/students", label: "Data Siswa", icon: Users },
    ],
  },
  {
    group: "LAPORAN",
    items: [
      { href: "/admin/reports", label: "Laporan Sirkulasi", icon: FileText },
      { href: "/admin/audit-logs", label: "Log Audit", icon: ScrollText },
    ],
  },
  {
    group: "PENGATURAN",
    items: [
      { href: "/admin/users", label: "Pengguna & Akses", icon: UserCog },
      { href: "/admin/refs", label: "Kategori & Kelas", icon: BookmarkCheck },
    ],
  },
];

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { href: "/student", label: "Beranda", icon: Home },
  { href: "/student/books", label: "Katalog", icon: BookOpen },
  { href: "/student/loans", label: "Pinjaman", icon: ArrowLeftRight },
  { href: "/student/profile", label: "Kartu", icon: Users },
];

export const NAV_GROUPS: Record<Role, NavGroup[]> = {
  admin: [
    {
      group: "RINGKASAN",
      items: [{ href: "/admin", label: "Dashboard", icon: Home }],
    },
    ...ADMIN_NAV_GROUPS,
  ],
  student: [
    {
      group: "NAVIGASI",
      items: STUDENT_NAV_ITEMS,
    },
  ],
};

export const NAV: Record<Role, NavItem[]> = {
  admin: NAV_GROUPS.admin.flatMap((g) => g.items),
  student: STUDENT_NAV_ITEMS,
};

export const ROLE_LABEL: Record<Role, string> = {
  student: "Siswa",
  admin: "Petugas Perpustakaan",
};
