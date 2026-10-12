import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display-lg",
        "text-display-sm",
        "text-title",
        "text-body",
        "text-label",
        "text-meta",
        "text-tap",
      ],
      rounded: [
        "rounded-card",
        "rounded-modal",
        "rounded-chip",
        "rounded-btn",
        "rounded-panel",
      ],
      shadow: ["shadow-card", "shadow-modal", "shadow-dropdown"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}

/**
 * Sanitasi string pencarian agar aman diinterpolasi ke filter DSL PostgREST (.or / .ilike).
 * Menghapus delimiter dan operator PostgREST seperti koma, kurung, kurung siku, persen, dan titik dua.
 */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,():%*\[\]]/g, " ").trim();
}

