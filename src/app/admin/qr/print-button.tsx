"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      Cetak / Simpan PDF
    </Button>
  );
}
