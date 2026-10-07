"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadQrButton({ token, label }: { token: string; label: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(token, { width: 512, margin: 2 });
        const a = document.createElement("a");
        a.href = url;
        a.download = `${label}.png`;
        a.click();
      }}
    >
      <Download aria-hidden /> PNG
    </Button>
  );
}
