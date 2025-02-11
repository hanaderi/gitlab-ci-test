import { globIterate } from "glob"
import { mkdir, copyFile } from "fs/promises"
import { resolve, dirname } from "path"

/**
 * Copy files matching a glob pattern to a destination
 * @param {string | string[]} glob
 * @param {string} dest
 */
export async function copyGlob(glob, dest) {
  const copies = []
  for await (const src of globIterate(glob)) {
    copies.push(copy(src, resolve(dest, src)))
  }
  return Promise.all(copies)
}

async function copy(from, to) {
  await mkdir(dirname(to), { recursive: true })
  return copyFile(from, to)
}
