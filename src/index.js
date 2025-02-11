import { copyGlob } from "./fs.js"
import { trace } from "./stdio.js"
import { execPipeline, cleanupOnExit } from "./pipeline.js"
import { relative } from "path"
export * from "./jobs.js"

/** @typedef {{ 
    variables?: Record<string, any>
    variablesFile?: string
    templates?: string
    silent?: boolean
}} PipelineOptions */
/** @typedef {import('gitlab-ci-local/src/job').Job} Job */

/**
 * Run a GitLab CI project locally
 * @param {string} projectPath
 * @param {PipelineOptions} options
 * @returns {Promise<Job[]>}
 */
export async function runPipeline(projectPath, options = {}) {
  // should be a relative path
  const cwd = relative(process.cwd(), projectPath)
  trace("project path:", cwd)

  const templates = options.templates ?? "templates/*.yml"
  trace("copying templates", templates)
  await copyGlob(templates, cwd)

  const { variables = {}, silent } = options
  const variable = Object.entries(variables).map(([key, value]) => `${key}=${value}`)
  // should be relative to the project path
  const variablesFile = options.variablesFile && relative(projectPath, options.variablesFile)

  trace("executing pipeline")
  cleanupOnExit()
  const jobs = await execPipeline({ cwd, variable, variablesFile, silent })
  jobs.forEach((job) => (job.projectPath = cwd))

  return jobs
}
