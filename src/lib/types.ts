export type Role = "student" | "librarian" | "admin";

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  full_name: string;
  role: Role;
  status: "active" | "inactive";
}

export interface ClassRow {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  class_id: string | null;
  class_name: string | null;
  qr_token: string;
  status: "active" | "inactive" | "graduated";
  user_id: string | null;
}

export type CopyStatus = "AVAILABLE" | "BORROWED" | "LOST" | "DAMAGED" | "INACTIVE";
export type LoanStatus = "ACTIVE" | "RETURNED" | "OVERDUE" | "CANCELLED";

export interface Book {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  publication_year: number | null;
  category_id: string | null;
  category_name: string | null;
  cover_url: string | null;
  total_copies: number;
  available_copies: number;
}

export interface BookCopy {
  id: string;
  book_id: string;
  book_title: string;
  inventory_code: string;
  qr_token: string;
  condition: string;
  location: string | null;
  status: CopyStatus;
}

export interface Loan {
  id: string;
  student_id: string;
  student_name: string;
  student_nis: string;
  class_name: string | null;
  book_copy_id: string;
  inventory_code: string;
  book_title: string;
  borrowed_at: string;
  due_at: string;
  returned_at: string | null;
  status: LoanStatus;
  fine_amount: number;
}

export interface Policy {
  max_active_loans: number;
  loan_duration_days: number;
  fine_per_day: number;
  allow_renewal: boolean;
  max_renewal_count: number;
}

export interface AuditLog {
  id: string;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const ROLE_HOME: Record<Role, string> = {
  student: "/student",
  librarian: "/librarian",
  admin: "/admin",
};
