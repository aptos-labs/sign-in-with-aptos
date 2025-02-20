import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["./src/index.ts", "./src/legacy.ts"],
  splitting: false,
  sourcemap: true,
  format: ["cjs", "esm"],
  clean: !options.watch,
  minify: !options.watch,
  onSuccess: "tsc --project tsconfig.build.json",
}));
