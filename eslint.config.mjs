import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next. This replaces rather
  // than extends them, so anything not listed here is fair game for ESLint
  // to walk — that silently included the whole Xcode project (ios/**,
  // including build archives) until this line was added, making
  // `npm run lint` scan gigabytes of unrelated native build output.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Native iOS project — not JS/TS, nothing here for ESLint to check.
    "ios/**",
  ]),
]);

export default eslintConfig;
