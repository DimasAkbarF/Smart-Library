import QRCode from "qrcode";
import { cn } from "@/lib/utils";

const qrSvgCache = new Map<string, { d: string; totalSize: number } | null>();

function getQrSvgData(token: string): { d: string; totalSize: number } | null {
  const key = token || "EMPTY";
  const cached = qrSvgCache.get(key);
  if (cached !== undefined) return cached;

  try {
    const qr = QRCode.create(key, { errorCorrectionLevel: "M" });
    const modSize = qr.modules.size;
    const data = qr.modules.data;
    const margin = 2;
    let d = "";

    for (let r = 0; r < modSize; r++) {
      for (let c = 0; c < modSize; c++) {
        if (data[r * modSize + c]) {
          d += `M${c + margin},${r + margin}h1v1h-1z `;
        }
      }
    }
    const totalSize = modSize + margin * 2;
    const result = { d, totalSize };
    if (qrSvgCache.size > 2000) qrSvgCache.clear();
    qrSvgCache.set(key, result);
    return result;
  } catch {
    qrSvgCache.set(key, null);
    return null;
  }
}

/**
 * Komponen gambar QR berbasis SVG vektor sinkron.
 * Berfungsi lancar di Server Component maupun Client Component tanpa async promise.
 */
export function QrImg({
  token,
  size = 120,
  className,
}: {
  token: string;
  size?: number;
  className?: string;
}) {
  const qrData = getQrSvgData(token);

  if (!qrData) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn(
          "mx-auto flex items-center justify-center rounded bg-surface border border-outline text-meta text-ink-subtle",
          className
        )}
      >
        QR Error
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${qrData.totalSize} ${qrData.totalSize}`}
      width={size}
      height={size}
      className={cn("mx-auto block", className)}
      aria-label={`QR Code ${token}`}
      role="img"
    >
      <rect width={qrData.totalSize} height={qrData.totalSize} fill="#ffffff" rx={1} />
      <path d={qrData.d} fill="#0f172a" />
    </svg>
  );
}
