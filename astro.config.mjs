import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  srcDir: "./web",
  outDir: "./dist",
  integrations: [react()],
});
