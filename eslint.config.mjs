import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Penjaga design system (design.md §3).
 * Utility ini sengaja tidak ada di sistem desain:
 *  - bayangan hanya untuk dropdown & modal → komponen biasa memakai garis 1px
 *  - transisi dibatasi ke properti yang benar-benar dianimasikan
 *  - rounded-full hanya untuk avatar bulat
 * Lint error = ada pemakaian baru yang perlu ditinjau (bukan aturan otomatis
 * yang harus dipatuhi buta).
 */
const BANNED_UTILITIES = [
  ["shadow-xs", "Gunakan garis 1px --color-rule; bayangan hanya untuk dropdown/modal (design.md §3)."],
  ["shadow-sm", "Gunakan garis 1px --color-rule; bayangan hanya untuk dropdown/modal (design.md §3)."],
  ["shadow-md", "Gunakan garis 1px --color-rule; bayangan hanya untuk dropdown/modal (design.md §3)."],
  ["shadow-lg", "Gunakan garis 1px --color-rule; bayangan hanya untuk dropdown/modal (design.md §3)."],
  ["shadow-2xs", "Gunakan garis 1px --color-rule; bayangan hanya untuk dropdown/modal (design.md §3)."],
  ["shadow-card", "Gunakan garis 1px --color-rule; bayangan hanya untuk dropdown/modal (design.md §3)."],
  ["shadow-modal", "Gunakan shadow-dropdown (satu-satunya bayangan yang sah, design.md §3)."],
  ["shadow-focus", "Fokus memakai outline 2px --color-primary (design.md §3)."],
  ["transition-all", "Transisi hanya untuk properti yang dianimasikan: transition-colors / transition-[width] / transition-transform."],
  ["rounded-full", "rounded-full hanya untuk avatar bulat (design.md §3); untuk badge/ikon pakai rounded-btn."],
];

const noBannedUtilities = {
  meta: {
    type: "problem",
    docs: {
      description: "Larang utility desain yang dieliminasi pada T1 (design.md §3)",
    },
  },
  create(context) {
    const reported = new Set();
    function check(node, value) {
      if (typeof value !== "string") return;
      for (const [token, hint] of BANNED_UTILITIES) {
        if (reported.has(token)) continue;
        const pattern = new RegExp(`(?<![\\w-])${token}(?![\\w-])`);
        if (pattern.test(value)) {
          reported.add(token);
          context.report({ node, message: `Utility "${token}" dilarang. ${hint}` });
        }
      }
    }
    return {
      JSXAttribute(node) {
        const value = node.value;
        if (!value) return;
        if (value.type === "Literal" && typeof value.value === "string") {
          check(node, value.value);
        } else if (value.type === "JSXExpressionContainer" && value.expression.type === "TemplateLiteral") {
          for (const quasi of value.expression.quasis) check(node, quasi.value.cooked ?? "");
        }
      },
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? "");
      },
    };
  },
};

const localPlugin = {
  rules: {
    "no-banned-utilities": noBannedUtilities,
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      local: localPlugin,
    },
    rules: {
      "local/no-banned-utilities": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Alat bantu lokal (skill, probe browser, scratchpad) — bukan kode aplikasi.
    ".agents/**",
    ".browser-tests/**",
    ".superpowers/**",
  ]),
]);

export default eslintConfig;
