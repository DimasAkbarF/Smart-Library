import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-btn font-plex-sans font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-hover active:bg-[#13234A]",
        secondary: "border border-rule-strong bg-white text-ink hover:bg-surface-sunken-ed active:bg-[#E5E2D9]",
        ghost: "bg-transparent text-ink hover:bg-surface-sunken-ed active:bg-[#E5E2D9]",
        danger: "bg-danger text-white hover:bg-[#8A2424] active:bg-[#721E1E]",
      },
      size: {
        sm: "h-9 px-3 text-[13px] [&_svg]:size-4 [&_svg]:shrink-0",
        md: "h-10 px-4 text-sm [&_svg]:size-4.5 [&_svg]:shrink-0",
        lg: "h-11 px-6 text-base [&_svg]:size-5 [&_svg]:shrink-0",
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
