import resolve from "rollup-plugin-node-resolve"
import commonjs from "rollup-plugin-commonjs"
import builtins from "rollup-plugin-node-builtins"
import nodeglobals from "rollup-plugin-node-globals"
import svelte from "rollup-plugin-svelte"
import alias from "rollup-plugin-alias"
import path from "path"

const production = !process.env.ROLLUP_WATCH
const projectRootDir = path.resolve(__dirname)

export default {
  input: "src/index.js",
  output: [
    {
      sourcemap: true,
      format: "iife",
      name: "app",
      file: `./dist/budibase-client.js`,
    },
    {
      file: "dist/budibase-client.esm.mjs",
      format: "esm",
      sourcemap: "inline",
    },
  ],
  plugins: [
    alias({
      entries: [
        {
          find: "@budibase/component-sdk",
          replacement: path.resolve(
            projectRootDir,
            "../component-sdk/dist/budibase-component-sdk"
          ),
        },
      ],
    }),
    svelte({
      dev: !production,
    }),
    resolve({
      preferBuiltins: true,
      browser: true,
    }),
    commonjs(),
    builtins(),
    nodeglobals(),
  ],
  watch: {
    clearScreen: false,
  },
}
