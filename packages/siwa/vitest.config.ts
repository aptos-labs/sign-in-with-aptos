import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config();

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**.ts"],
      exclude: ["src/internal.ts", "src/types.ts", "src/index.ts"],
    },
  },
});
