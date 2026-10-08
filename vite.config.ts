import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project URLs use /<repository>/; override with VITE_BASE when needed.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || "./",
});
