"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ className }: { className?: string }) {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()} className={className}>
      Cetak / Simpan PDF
    </Button>
  );
}
