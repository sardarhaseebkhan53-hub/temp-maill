import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const nextBase = nextVitals.find((entry) => entry.name === "next");
const nextTypeScript = nextVitals.find((entry) => entry.name === "next/typescript");

export default defineConfig([
  ...nextVitals,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": nextTypeScript.plugins["@typescript-eslint"],
      react: nextBase.plugins.react,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
      // Existing effects intentionally initialize browser-only state and
      // subscriptions after hydration. React 19's advisory rule treats all
      // synchronous initialization as an error, even for these valid cases.
      "react-hooks/set-state-in-effect": "off",
      // Reveal forwards an element ref without reading ref.current in render;
      // the React 19 rule currently flags cloneElement ref forwarding.
      "react-hooks/refs": "off",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "database/generated/**"]),
]);
