import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["database/**/*.integration.test.ts"],
    testTimeout: 15_000,
    hookTimeout: 15_000
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname }
  }
});
