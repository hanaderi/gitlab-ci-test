import { WriteStreamsMock, WriteStreamsProcess } from "gitlab-ci-local/src/write-streams.js"
import chalk from "chalk"

/** Capture stdio while printing in process logs */
class WriteStreamsBoth extends WriteStreamsMock {
  constructor() {
    super()
    this.process = new WriteStreamsProcess()
  }
  stderr(txt) {
    super.stderr(txt)
    this.process.stderr(txt)
  }
  stdout(txt) {
    super.stdout(txt)
    this.process.stdout(txt)
  }
  flush() {
    super.flush()
    this.process.flush()
  }
}
export function getWriteStream(silent) {
  return silent ? new WriteStreamsMock() : new WriteStreamsBoth()
}

/** @returns {string} */
export function collectStdio(lines, prefix) {
  return lines
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.substring(prefix.length))
    .join("\n")
}

export function trace(...args) {
  console.log(chalk.gray(...args))
}
export function error(...args) {
  console.error(chalk.red(...args))
}
