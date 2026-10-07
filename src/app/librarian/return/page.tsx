import { ReturnWorkspace } from "./return-workspace";
import { getPolicy } from "@/features/loans/actions";

export default async function ReturnPage() {
  const policy = await getPolicy();
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Kembalikan Buku</h1>
        <p className="mt-1 text-ink-muted">
          Pindai QR pada buku. Denda Rp{policy.fine_per_day.toLocaleString("id-ID")} per hari keterlambatan.
        </p>
      </div>
      <ReturnWorkspace finePerDay={policy.fine_per_day} />
    </div>
  );
}

export const dynamic = "force-dynamic";
