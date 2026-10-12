import Image from "next/image";
import { cn } from "@/lib/utils";

export type SchoolLogoSize = "sm" | "md" | "lg";
export type SchoolLogoVariant = "default" | "on-dark";

export interface SchoolLogoProps {
  /**
   * Varian ukuran logo:
   * - sm: 32x32 px (navigasi / header padat)
   * - md: 48x48 px (standar lockup / kartu anggota)
   * - lg: 64x64 px (panel brand / modal)
   */
  size?: SchoolLogoSize;
  /**
   * Varian tampilan:
   * - default: Logo transparan tanpa latar tambahan
   * - on-dark: Diberi alas putih dan border halus agar kontras di latar gelap/warna pekat
   */
  variant?: SchoolLogoVariant;
  /**
   * Shorthand boolean untuk variant="on-dark"
   */
  onDark?: boolean;
  className?: string;
  priority?: boolean;
}

const SIZE_CONFIG: Record<
  SchoolLogoSize,
  {
    px: number;
    containerClass: string;
    imageClass: string;
  }
> = {
  sm: {
    px: 32,
    containerClass: "size-8 p-0.5",
    imageClass: "size-8",
  },
  md: {
    px: 48,
    containerClass: "size-12 p-1",
    imageClass: "size-12",
  },
  lg: {
    px: 64,
    containerClass: "size-16 p-1.5",
    imageClass: "size-16",
  },
};

/**
 * Komponen SchoolLogo resmi SMP Negeri 17 Tangerang Selatan.
 * Memakai next/image dengan width & height tetap, alt wajib institusi,
 * dan dukungan alas putih untuk latar gelap.
 */
export function SchoolLogo({
  size = "md",
  variant = "default",
  onDark = false,
  className,
  priority = false,
}: SchoolLogoProps) {
  const { px, containerClass, imageClass } = SIZE_CONFIG[size];
  const isDark = onDark || variant === "on-dark";

  if (isDark) {
    return (
      <div
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-white border border-rule shadow-xs",
          containerClass,
          className
        )}
      >
        <Image
          src="/logo-smpn17.png"
          alt="Logo SMP Negeri 17 Tangerang Selatan"
          width={px}
          height={px}
          className="size-full object-contain"
          priority={priority}
        />
      </div>
    );
  }

  return (
    <Image
      src="/logo-smpn17.png"
      alt="Logo SMP Negeri 17 Tangerang Selatan"
      width={px}
      height={px}
      className={cn("shrink-0 object-contain", imageClass, className)}
      priority={priority}
    />
  );
}
