import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**.ts"],
      exclude: ["src/internal.ts", "src/types.ts", "src/index.ts"],
    },
  },
});
