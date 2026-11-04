import { defineConfig } from "vitest/config";

// Unit tests for the touchscreen state machine. Plain TypeScript only, so
// skip the site's PostCSS/Tailwind pipeline and run in Node.
export default defineConfig({
  css: { postcss: {} },
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    environment: "node",
    pool: "threads",
  },
});
