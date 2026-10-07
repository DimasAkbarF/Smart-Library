"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { Camera, Keyboard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

type Phase = "idle" | "scanning" | "detected" | "no-camera";

export function QrScanner({
  title,
  hint,
  onDetected,
}: {
  title: string;
  hint: string;
  onDetected: (token: string) => void;
}) {
  const elementId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [lastScanned, setLastScanned] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [manual, setManual] = useState("");
  const callbackRef = useRef(onDetected);

  useEffect(() => {
    callbackRef.current = onDetected;
  }, [onDetected]);

  const stop = useCallback(async () => {
    try {
      await scannerRef.current?.stop();
      await scannerRef.current?.clear();
    } catch {
      /* ignore */
    }
    scannerRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setCameraError("");
    setPhase("scanning");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(`qr-${elementId}`);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (lockedRef.current) return;
          lockedRef.current = true;
          const cleanCode = decoded.trim();
          setLastScanned(cleanCode);
          setPhase("detected");
          callbackRef.current(cleanCode);
          setTimeout(() => {
            lockedRef.current = false;
            setPhase((p) => (p === "detected" ? "scanning" : p));
          }, 1500);
        },
        undefined
      );
    } catch {
      setCameraError("Kamera tidak dapat diakses di perangkat ini. Silakan gunakan input kode manual.");
      setPhase("no-camera");
    }
  }, [elementId]);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  return (
    <section aria-label={title} className="space-y-4">
      {/* Scanner Viewfinder Box */}
      <div className="relative overflow-hidden rounded-card border-2 border-outline bg-ink shadow-card">
        {phase === "idle" || phase === "no-camera" ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center text-white">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15 text-white">
              <Camera className="size-7" aria-hidden />
            </span>
            <div>
              <p className="font-display text-base font-bold">Kamera Pemindai QR</p>
              <p className="mt-1 max-w-xs text-xs text-white/70">
                {phase === "no-camera" ? cameraError : hint}
              </p>
            </div>
            {phase === "idle" && (
              <Button
                type="button"
                size="lg"
                onClick={start}
                className="mt-2 bg-sky text-white hover:bg-sky-deep shadow-md font-bold text-sm"
              >
                <Camera className="size-4" aria-hidden />
                <span>Aktifkan Kamera</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Html5Qrcode container */}
            <div id={`qr-${elementId}`} className="w-full min-h-[300px]" />

            {/* Viewfinder Target Overlays */}
            {phase === "scanning" && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                {/* Targeting reticle corners */}
                <div className="relative size-60 rounded-xl border border-white/20">
                  {/* Top-left */}
                  <span className="absolute -top-1 -left-1 size-6 border-t-3 border-l-3 border-sky rounded-tl" />
                  {/* Top-right */}
                  <span className="absolute -top-1 -right-1 size-6 border-t-3 border-r-3 border-sky rounded-tr" />
                  {/* Bottom-left */}
                  <span className="absolute -bottom-1 -left-1 size-6 border-b-3 border-l-3 border-sky rounded-bl" />
                  {/* Bottom-right */}
                  <span className="absolute -bottom-1 -right-1 size-6 border-b-3 border-r-3 border-sky rounded-br" />

                  {/* Alignment guide line */}
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 border-t border-dashed border-sky/50" />
                </div>
                <p className="mt-4 rounded-full bg-black/80 px-3.5 py-1 text-xs font-semibold text-white">
                  Arahkan kamera tepat ke QR Code
                </p>
              </div>
            )}

            {/* Detected Success State Animation */}
            {phase === "detected" && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-leaf-deep/20 animate-in fade-in duration-150">
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-modal animate-in zoom-in-95 duration-200">
                  <span className="flex size-12 items-center justify-center rounded-full bg-leaf text-white shadow-xs">
                    <CheckCircle2 className="size-7" />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-ink">QR Berhasil Dideteksi</p>
                    <p className="font-mono text-xs font-semibold text-leaf-deep">{lastScanned}</p>
                    <p className="mt-0.5 text-[11px] text-ink-subtle">Memproses data secara otomatis...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Input Fallback */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) onDetected(manual.trim());
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Keyboard
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Atau ketik kode manual (cth. BOOK-000001 / SIS-1001)"
            aria-label="Kode manual"
            className="pl-10 font-mono text-xs sm:text-sm"
          />
        </div>
        <Button type="submit" variant="secondary" size="md" className="shrink-0">
          Cari
        </Button>
      </form>
    </section>
  );
}
