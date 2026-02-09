import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  // GitHub Pages: set VITE_BASE to "/REPO_NAME/" in CI, or keep "/" for root domains.
  const base = process.env.VITE_BASE ?? "/";
  return {
    base,
    build: {
      sourcemap: true
    }
  };
});
