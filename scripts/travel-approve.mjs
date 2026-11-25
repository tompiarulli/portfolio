#!/usr/bin/env node
// Nothing from the Travel channels goes public until Tom has watched it.
//
//   assets/inbox/               raw footage, unsorted        (ignored by git)
//   assets/review/<channel>/    sorted, named and trimmed    (ignored by git)
//   assets/travel/<channel>/    approved masters             (committed, in LFS)
//   public/travel/<channel>/    what the site plays          (committed, in LFS)
//
//   pnpm travel:approve              # watch and approve what's new, every channel
//   pnpm travel:approve stanley      # one
//   pnpm travel:approve --check      # fail if anything staged isn't approved
//
// Approving plays each file in `assets/review/` that has no master yet, or
// has changed since its master was made, in Quick Look; close it (Space or
// Esc) and answer y to approve, n to leave it for now, r to watch it again
// or q to stop. A yes writes its master to `assets/travel/`: the picture
// at full size, copied as it is, without sound or any metadata (the
// camera's GPS stays home), and records the master's SHA-256 in
// `scripts/travel.approved.json`. `pnpm travel` encodes the site's copies
// from the masters alone, so footage nobody has approved never reaches
// `public/travel/`. It only runs from a terminal, so nothing but a person
// at the keyboard can approve a clip. To take a clip out later, delete its
// master and run `pnpm travel` again.
//
// The check, which the pre-commit hook and CI run, reads git's index, not
// the working tree, so it sees what a commit would hold: every master must
// be approved byte for byte, and every file in `public/travel/` must come
// from an approved master (or be one approved before masters were kept).
// Git LFS stores each file as a pointer naming its SHA-256, so CI checks
// the pointers without downloading the footage.

import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { ReadStream, WriteStream, isatty } from 'node:tty'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url))
const REVIEW = 'assets/review'
const MASTERS = 'assets/travel'
const MADE = 'public/travel'
const APPROVED = 'scripts/travel.approved.json'

const VIDEO = new Set(['.mov', '.mp4', '.m4v'])
const PHOTO = new Set(['.heic', '.heif', '.jpg', '.jpeg', '.png'])

const FFMPEG = existsSync('/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg')
  ? '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg'
  : 'ffmpeg'

const say = (line) => process.stderr.write(`${line}\n`)

const sha256 = (data) => createHash('sha256').update(data).digest('hex')

/** The file's name as the site has it, as `scripts/travel.mjs` makes it:
 *  `Hedge Maze.mov` → `hedge_maze`. */
const slug = (file) =>
  basename(file, extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

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

const folders = (dir) =>
  existsSync(root(dir))
    ? readdirSync(root(dir), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : []

const media = (dir) =>
  existsSync(root(dir))
    ? readdirSync(root(dir))
        .filter((f) => {
          const ext = extname(f).toLowerCase()
          return VIDEO.has(ext) || PHOTO.has(ext)
        })
        .sort()
    : []

/** Where a file under review goes once approved: a video keeps its
 *  container; a photo becomes a lossless PNG, which carries no metadata. */
const masterOf = (channel, file) => {
  const ext = extname(file).toLowerCase()
  return `${MASTERS}/${channel}/${slug(file)}${VIDEO.has(ext) ? ext : '.png'}`
}

/** The files under review with no master, or changed since theirs was
 *  made. */
export function waiting(named = []) {
  return (named.length ? named : folders(REVIEW)).flatMap((channel) =>
    media(`${REVIEW}/${channel}`)
      .map((file) => ({
        source: `${REVIEW}/${channel}/${file}`,
        master: masterOf(channel, file),
      }))
      .filter(
        ({ source, master }) =>
          !existsSync(root(master)) ||
          statSync(root(source)).mtimeMs > statSync(root(master)).mtimeMs,
      ),
  )
}

/** Writes a master: the picture alone, untouched, with no sound, no
 *  location or camera tracks, and no tags. */
function makeMaster(source, master) {
  const dir = root(join(master, '..'))
  mkdirSync(dir, { recursive: true })
  // Written beside it and moved in whole, so a master is never half made.
  const temp = join(dir, `.partial-${basename(master)}`)
  if (VIDEO.has(extname(source).toLowerCase())) {
    // The first video stream, copied as it is; nothing else.
    execFileSync(FFMPEG, [
      '-v',
      'error',
      '-y',
      '-i',
      root(source),
      '-map',
      '0:v:0',
      '-c',
      'copy',
      '-map_metadata',
      '-1',
      '-map_metadata:s:v',
      '-1',
      '-map_chapters',
      '-1',
      '-fflags',
      '+bitexact',
      temp,
    ])
  } else {
    // Decoded by macOS, which reads HEIC and turns it upright.
    const png = join(tmpdir(), `travel-${process.pid}-${basename(master)}`)
    execFileSync('sips', ['-s', 'format', 'png', root(source), '--out', png])
    execFileSync(FFMPEG, [
      '-v',
      'error',
      '-y',
      '-i',
      png,
      '-map_metadata',
      '-1',
      temp,
    ])
    rmSync(png)
  }
  renameSync(temp, root(master))
}

/** Every master staged is approved, byte for byte, and every file staged
 *  under `public/travel/` comes from one. */
function check() {
  const git = (args, input) =>
    execFileSync('git', args, { input, maxBuffer: 1 << 30 })
  let approved = {}
  try {
    approved = JSON.parse(git(['show', `:${APPROVED}`]).toString())
  } catch {
    // Nothing approved yet.
  }
  const staged = git(['ls-files', '-s', '-z', '--', MASTERS, MADE])
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
  const hashes = new Map()
  for (const { path } of staged) {
    const header = out.subarray(at, out.indexOf(10, at)).toString()
    const size = Number(header.split(' ')[2])
    const start = at + header.length + 1
    const body = out.subarray(start, start + size)
    at = start + size + 1
    const text = body.toString('latin1')
    hashes.set(
      path,
      text.startsWith('version https://git-lfs')
        ? /^oid sha256:([0-9a-f]{64})$/m.exec(text)?.[1]
        : sha256(body),
    )
  }

  const bad = []
  // The clips with an approved master: `<channel>/<name>`.
  const backed = new Set()
  for (const [path, hash] of hashes) {
    if (!path.startsWith(`${MASTERS}/`)) continue
    if (approved[path] === hash) {
      const [channel, file] = path.slice(MASTERS.length + 1).split('/')
      backed.add(`${channel}/${slug(file)}`)
    } else bad.push(path)
  }
  for (const [path, hash] of hashes) {
    if (!path.startsWith(`${MADE}/`)) continue
    const [channel, file] = path.slice(MADE.length + 1).split('/')
    const name = file.replace(/\.poster\.webp$|\.[^.]+$/, '')
    if (!backed.has(`${channel}/${name}`) && approved[path] !== hash)
      bad.push(path)
  }
  if (!bad.length) return true
  say(`Not approved, so not committed:\n${bad.map((p) => `  ${p}`).join('\n')}`)
  say(
    'Approve the footage with `pnpm travel:approve`, run `pnpm travel`, then stage again.',
  )
  return false
}

/** Plays each file waiting for approval and asks about it. */
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
  // Files gone from the repo drop out of the list.
  for (const path of Object.keys(approved))
    if (!existsSync(root(path))) delete approved[path]
  save(approved)

  // Two files can't share a name: `IMG_1.HEIC` and `IMG_1.MOV` would.
  const queue = waiting(named)
  const taken = new Map()
  for (const { source, master } of queue) {
    const key = master.replace(/\.[^.]+$/, '')
    if (taken.has(key)) {
      say(`${taken.get(key)} and ${source} would both be ${key}; rename one.`)
      prompt.close()
      return false
    }
    taken.set(key, source)
  }

  if (!queue.length) say('Nothing waiting for approval.')
  let made = 0
  for (const [i, { source, master }] of queue.entries()) {
    let answer = 'r'
    while (answer === 'r') {
      say(
        `\n${i + 1}/${queue.length}  ${source}  (close the preview to answer)`,
      )
      await new Promise((done) =>
        spawn('qlmanage', ['-p', root(source)], { stdio: 'ignore' }).on(
          'close',
          done,
        ),
      )
      answer = (await prompt.question('Approve? [y]es [n]o [r]eplay [q]uit '))
        .trim()
        .toLowerCase()
    }
    if (answer === 'q') break
    if (answer !== 'y') continue
    // A master of another type, from a source re-exported, goes.
    for (const ext of [...VIDEO, '.png']) {
      const other = master.replace(/\.[^.]+$/, ext)
      if (other !== master && existsSync(root(other))) {
        rmSync(root(other))
        delete approved[other]
      }
    }
    makeMaster(source, master)
    approved[master] = sha256(readFileSync(root(master)))
    save(approved)
    made++
  }
  prompt.close()
  if (made) say(`\n${made} approved. Run \`pnpm travel\` to encode them.`)
  return true
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const args = process.argv.slice(2)
  const ok = args.includes('--check')
    ? check()
    : await approve(args.filter((a) => !a.startsWith('--')))
  if (!ok) process.exitCode = 1
}
