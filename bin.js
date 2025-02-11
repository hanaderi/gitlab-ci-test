#!/usr/bin/env node

// @ts-check
import { readFile } from "fs/promises"
import { loadAll as loadYaml } from "js-yaml"
import { relative, resolve, dirname } from "path"
import chalk from "chalk"
import * as lib from "./src/index.js"
import Mocha from "mocha"
import * as chai from "chai"

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (process.argv.length < 3) fail(`Usage: ${process.argv[1]} <yaml or js test files...>`)

/** @returns {Promise<void>} */
async function testJs(filePath) {
  console.log("Running test:", filePath)

  // Bad hack to make chai and gitlab-ci-test available in the test file
  Object.assign(global, chai, lib)

  const mocha = new Mocha()
  mocha.addFile(filePath)
  mocha.timeout("10m")
  await mocha.loadFilesAsync()
  return new Promise((resolve, reject) =>
    mocha.run((failures) => {
      if (failures) reject(new Error("Test failed"))
      else resolve()
    }),
  )
}

/** This is trully an eval of user code from their yaml file. Be careful */
function evalInScope(js, context) {
  // nosemgrep: gitlab.eslint.detect-eval-with-expression
  return new Function(`with (this) { return (${js}); }`).call(context)
}

async function testYaml(filePath) {
  const yamlData = loadYaml(await readFile(filePath, "utf8"))
  const [config] = /** @type [{
    description: string
    project?: string
    asserts: [{ test: string }]
}, {[key: string]: string}] */ (yamlData)

  console.log("Running test:", config.description.trim())

  // Project path is relative to the test file
  const projectPath = relative(process.cwd(), resolve(dirname(filePath), config.project ?? "."))

  const jobs = await lib.runPipeline(projectPath, { variablesFile: filePath })

  const context = {
    success: lib.isSuccess(jobs),
    run_jobs: lib.getRunJobs(jobs).map((job) => job.name),
    jobs: jobs.reduce((acc, job, index) => {
      /** @typedef {import('gitlab-ci-local/src/job').Job} Job */
      /** @type Partial<Job> & Record<string, any> */
      const data = Object.assign({ artifacts: {} }, job)
      delete data.argv

      data.stdout = lib.getStdout(job)
      data.stderr = lib.getStderr(job)
      delete data.writeStreams

      data.artifacts.exists = (name) => lib.artifactExists(job, name)

      acc[index] = data // nosemgrep: gitlab.eslint.detect-object-injection
      acc[job.name] = data // nosemgrep: gitlab.eslint.detect-object-injection
      acc[job.name.replaceAll("-", "_")] = data // nosemgrep: gitlab.eslint.detect-object-injection
      return acc
    }, {}),
  }
  for (const { test } of config.asserts) {
    console.log(chalk.grey("evaluating:", test))
    if (!evalInScope(test, context)) fail(chalk.red(`Assertion failed: ${test}`))
  }
}

for (const filePath of process.argv.slice(2)) {
  const ext = filePath.split(".").pop()
  switch (ext) {
    case "js":
    case "mjs":
      await testJs(filePath)
      break
    case "yaml":
    case "yml":
      await testYaml(filePath)
      break
    default:
      fail(`Unsupported file type: ${filePath}`)
  }
}

console.log(chalk.green("All tests passed!"))
