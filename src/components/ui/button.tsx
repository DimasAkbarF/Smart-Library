import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-display font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-sky text-white hover:bg-sky-deep active:bg-sky-deep",
        secondary: "border border-outline bg-background text-ink hover:border-outline-strong hover:bg-surface active:bg-surface-sunken",
        danger: "bg-coral text-white hover:bg-coral-deep active:bg-coral-deep",
        ghost: "text-ink-muted hover:bg-surface hover:text-ink active:bg-surface-sunken",
      },
      size: {
        sm: "min-h-10 px-3 text-body [&_svg]:size-4 [&_svg]:shrink-0",
        md: "min-h-12 px-5 text-body [&_svg]:size-5 [&_svg]:shrink-0",
        // Big Friendly Button (PRD §14.1): min 56px untuk aksi utama
        lg: "min-h-14 px-6 text-title [&_svg]:size-5 [&_svg]:shrink-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}
