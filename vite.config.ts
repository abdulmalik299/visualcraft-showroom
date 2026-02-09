import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // GitHub Pages: set VITE_BASE to "/REPO_NAME/" in CI, or keep "/" for root domains.
  const base = process.env.VITE_BASE ?? "/";
  return {
    base,
    plugins: [react()],
    build: {
      sourcemap: true
    }
  };
});
