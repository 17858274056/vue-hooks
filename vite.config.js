import {defineConfig} from "vite";
import dts from "vite-plugin-dts";
import {resolve} from "path";
import {fileURLToPath} from "url";

export default defineConfig({
  plugins: [dts({})],
  build: {
    lib: {
      entry: resolve(fileURLToPath(import.meta.url), "../src/result.ts"),
      name: "hooks",
      formats: ["es"],
      fileName: "hooks-libs",
    },
  },
});
