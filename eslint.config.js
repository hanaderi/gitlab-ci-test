import globals from "globals"
import pluginJs from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import * as lib from "./src/index.js"
import * as chai from "chai"

const readonlyGlobals = (obj) =>
  Object.keys(obj).reduce((acc, key) => ({ ...acc, [key]: "readonly" }), {})

export default [
  {
    languageOptions: {
      globals: globals.node,
    },
  },

  pluginJs.configs.recommended,
  eslintConfigPrettier,

  {
    files: ["test/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.mocha,
        ...readonlyGlobals(chai),
        ...readonlyGlobals(lib),
      },
    },
  },
]
