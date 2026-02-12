import { collectStdio } from "./stdio.js"
import path from "path"
import { existsSync } from "fs"
/** @typedef {import('gitlab-ci-local/src/job').Job} Job */

/** Check if all jobs are successful
 * @param {Job[]} jobs */
export function isSuccess(jobs) {
  return jobs.every(isJobSuccessful)
}
/** Check if a job is successful
 * @param {Job} job */
export function isJobSuccessful(job) {
  return !job.finished || job.allowFailure || !job.preScriptsExitCode
}

/** Get all jobs that are finished
 * @param {Job[]} jobs */
export function getRunJobs(jobs) {
  return jobs.filter((job) => job.finished)
}

/** Get a job by name
 * @param {Job[]} jobs */
export function findJob(jobs, name) {
  return jobs.find((job) => job.name === name)
}

/** Get standard output of a job
 * @param {Job} job */
export function getStdout(job) {
  return collectStdio(job.writeStreams.stdoutLines, job.formattedJobName)
}
/** Get standard output of a job
 * @param {Job} job */
export function getStderr(job) {
  return collectStdio(job.writeStreams.stderrLines, job.formattedJobName)
}

/** Check if an artifact exists
 * @param {Job} job */
export function artifactExists(job, artifactPath) {
  return existsSync(getArtifactFullPath(job, artifactPath))
}
export function getArtifactFullPath(job, artifactPath) {
  return path.join(job.projectPath, ".gitlab-ci-local", "artifacts", job.name, artifactPath)
}
