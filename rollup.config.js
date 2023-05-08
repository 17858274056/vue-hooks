import typescript from "rollup-plugin-typescript2";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import vuePlugin from "rollup-plugin-vue";
export default {
  input: "./src/index.ts",
  output: {
    dir: "dist",
    format: "esm",
  },
  external: ["vue", "lodash-es"], // 忽略vue 不打包进去，因为默认外面就得有

  plugins: [
    vuePlugin(),
    nodeResolve({
      extensions: [".js", ".ts"],
    }),
    typescript({
      compilerOptions: {
        tsconfig: "./tsconfig.json",
      },
    }),
    // terser(),
  ],
};
