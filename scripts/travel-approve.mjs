#!/usr/bin/env node
// Nothing from the Travel channels goes public until Tom has watched it.
// `scripts/travel.approved.json` holds the SHA-256 of every file in
// `public/travel/` he has approved; the pre-commit hook and CI refuse any
// file whose exact bytes aren't in it.
//
//   pnpm travel:approve              # watch and approve what's new, every channel
//   pnpm travel:approve stanley      # one
//   pnpm travel:approve --check      # fail if anything staged isn't approved
//
// Approving plays each new or re-encoded clip in Quick Look; close it
// (Space or Esc) and answer y to approve, n to leave it out, r to watch it
// again or q to stop. It only runs from a terminal, so nothing but a person
// at the keyboard can approve a clip. A clip left out stays unapproved, and
// blocks the commit until its source is taken out of `assets/travel/` and
// `pnpm travel` run again.
//
// The check reads git's index, not the working tree, so it sees what a
// commit would hold. Git LFS stores each clip as a pointer naming its
// SHA-256, so CI checks the pointers without downloading the footage.

import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  openSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { ReadStream, WriteStream, isatty } from 'node:tty'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url))
const MADE = root('public/travel')
const APPROVED = 'scripts/travel.approved.json'

const say = (line) => process.stderr.write(`${line}\n`)

const sha256 = (data) => createHash('sha256').update(data).digest('hex')

const load = () =>
  existsSync(root(APPROVED))
    ? JSON.parse(readFileSync(root(APPROVED), 'utf8'))
    : {}

const save = (approved) => {
  const sorted = Object.fromEntries(
    Object.entries(approved).sort(([a], [b]) => a.localeCompare(b)),
  )
  writeFileSync(root(APPROVED), `${JSON.stringify(sorted, null, 2)}\n`)
}

const channels = () =>
  existsSync(MADE)
    ? readdirSync(MADE, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : []

/** Each clip in a channel, as the files that ship with it: a video and
 *  its poster, which is its first frame, or a photo. */
function clips(channel) {
  const files = readdirSync(`${MADE}/${channel}`).sort()
  return files
    .filter((f) => !f.endsWith('.poster.webp'))
    .map((f) => {
      const poster = f.replace(/\.mp4$/, '.poster.webp')
      return [
        f,
        ...(f.endsWith('.mp4') && files.includes(poster) ? [poster] : []),
      ].map((name) => `${channel}/${name}`)
    })
}

const hashOf = (path) => sha256(readFileSync(`${MADE}/${path}`))

/** The clips in `public/travel/` not approved as they are now. */
export function unapproved(named = []) {
  const approved = load()
  return (named.length ? named : channels())
    .filter((c) => existsSync(`${MADE}/${c}`))
    .flatMap(clips)
    .filter((files) => files.some((f) => approved[f] !== hashOf(f)))
}

/** Every file staged under `public/travel/` is approved, byte for byte. */
function check() {
  const git = (args, input) =>
    execFileSync('git', args, { input, maxBuffer: 1 << 30 })
  let approved = {}
  try {
    approved = JSON.parse(git(['show', `:${APPROVED}`]).toString())
  } catch {
    // Nothing approved yet.
  }
  const staged = git(['ls-files', '-s', '-z', '--', 'public/travel'])
    .toString()
    .split('\0')
    .filter(Boolean)
    .map((line) => {
      const [info, path] = line.split('\t')
      return { blob: info.split(' ')[1], path }
    })
  if (!staged.length) return true

  // Each blob's bytes: an LFS pointer, which names the file's SHA-256, or
  // the file itself if it went in without LFS.
  const out = git(
    ['cat-file', '--batch'],
    staged.map((s) => s.blob).join('\n') + '\n',
  )
  let at = 0
  const bad = []
  for (const { path } of staged) {
    const header = out.subarray(at, out.indexOf(10, at)).toString()
    const size = Number(header.split(' ')[2])
    const start = at + header.length + 1
    const body = out.subarray(start, start + size)
    at = start + size + 1
    const oid = /^oid sha256:([0-9a-f]{64})$/m.exec(body.toString('latin1'))
    const hash = body.toString('latin1').startsWith('version https://git-lfs')
      ? oid?.[1]
      : sha256(body)
    if (approved[path.replace(/^public\/travel\//, '')] !== hash) bad.push(path)
  }
  if (!bad.length) return true
  say(`Not approved, so not committed:\n${bad.map((p) => `  ${p}`).join('\n')}`)
  say('Watch and approve them with `pnpm travel:approve`, then stage again.')
  return false
}

/** Plays each clip that isn't approved and asks about it. */
async function approve(named) {
  let fd
  try {
    fd = openSync('/dev/tty', 'r+')
  } catch {}
  if (fd === undefined || !isatty(fd)) {
    say('Approving needs a terminal: run `pnpm travel:approve` yourself.')
    return false
  }
  const prompt = createInterface({
    input: new ReadStream(fd),
    output: new WriteStream(fd),
  })

  const approved = load()
  // Clips gone from `public/travel/` drop out of the list.
  const there = new Set(channels().flatMap(clips).flat())
  for (const path of Object.keys(approved))
    if (!there.has(path)) delete approved[path]
  save(approved)

  const waiting = unapproved(named)
  if (!waiting.length) say('Every clip is approved.')
  const left = []
  for (const [i, files] of waiting.entries()) {
    const [clip] = files
    let answer = 'r'
    while (answer === 'r') {
      say(
        `\n${i + 1}/${waiting.length}  ${clip}  (close the preview to answer)`,
      )
      await new Promise((done) =>
        spawn('qlmanage', ['-p', `${MADE}/${clip}`], { stdio: 'ignore' }).on(
          'close',
          done,
        ),
      )
      answer = (await prompt.question('Approve? [y]es [n]o [r]eplay [q]uit '))
        .trim()
        .toLowerCase()
    }
    if (answer === 'q') break
    if (answer === 'y') {
      for (const f of files) approved[f] = hashOf(f)
      save(approved)
    } else left.push(clip)
  }
  prompt.close()
  if (left.length)
    say(
      `\nLeft out, and blocking a commit until their sources go from assets/travel/:\n${left.map((c) => `  ${c}`).join('\n')}`,
    )
  return true
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  const ok = args.includes('--check')
    ? check()
    : await approve(args.filter((a) => !a.startsWith('--')))
  if (!ok) process.exitCode = 1
}
