import { AssertionError } from "assert"
import { getWriteStream, error } from "./stdio.js"
import { handler } from "gitlab-ci-local/src/handler.js"
import { cleanupJobResources } from "gitlab-ci-local/src/job.js"
/** @typedef {import('gitlab-ci-local/src/job').Job} Job */

/**
 * Run a GitLab CI project locally
 * @param {{ cwd: string, variable: string[], variablesFile?: string }} options
 */
export async function execPipeline(options) {
  /** @type Job[] */
  const jobs = []
  runningTasks.push(jobs)
  try {
    await handler(options, getWriteStream(options.silent), jobs)
  } catch (e) {
    if (e instanceof AssertionError) {
      error(e.message.trim())
    } else if (e instanceof AggregateError) {
      e.errors.forEach((aggE) => error(aggE.stack ?? aggE))
    } else {
      error(e.stack ?? e)
    }
  }
  await cleanupRunningTask(jobs)
  return jobs
}

/** @type Job[][] */
let runningTasks = []
// Graceful cleanup running jobs on exit
async function cleanupRunningTask(jobs) {
  await cleanupJobResources(jobs)
  runningTasks.splice(runningTasks.indexOf(jobs), 1)
}
const cleanupRunningTasks = () => Promise.all(runningTasks.map(cleanupRunningTask))

let cleanupOnExitDone = false
export function cleanupOnExit() {
  // Avoid registering handlers multiple times
  if (cleanupOnExitDone) return
  cleanupOnExitDone = true

  process.on("SIGINT", (_, code) => cleanupRunningTasks().then(() => process.exit(code)))
  process.on("SIGUSR2", cleanupRunningTasks)
}
