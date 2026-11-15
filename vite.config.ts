import { defineConfig } from "vite";
export default defineConfig({
  optimizeDeps: { exclude: ["@kuntay/swisseph"] },
  assetsInclude: ["**/*.wasm"],
  build: { target: "es2022" },
});
