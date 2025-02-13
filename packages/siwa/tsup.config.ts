import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["./src/index.ts"],
  splitting: false,
  sourcemap: true,
  format: ["cjs", "esm"],
  dts: true,
  clean: !options.watch,
  minify: !options.watch,
}));
