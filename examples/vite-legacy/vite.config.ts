import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [nodePolyfills(), react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
