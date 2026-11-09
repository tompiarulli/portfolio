#!/usr/bin/env node
// Turns a folder of phone footage into a Travel channel: every video and
// photo in it, cropped to the screen's 16:9, with no sound and no metadata
// (the camera's GPS stays home). The player deals them in a random order.
//
//   pnpm travel                  # every channel in assets/travel/
//   pnpm travel stanley          # one
//   pnpm travel --watch          # again on every change, until stopped
//   pnpm travel --force          # everything, not just what changed
//
// Each folder in `assets/travel/` is a channel, named by the folder.
// Videos become H.264 MP4s with a WebP poster, HDR tone-mapped to SDR;
// photos become WebP stills. They land in `public/travel/<channel>/`,
// which git keeps in LFS and the site serves as it is, named after the
// file they came from, which the player shows: rename `IMG_8920.MOV` to
// `Hedge Maze.mov` and it becomes `hedge_maze.mp4`. The list of what's
// there goes to `src/lib/travel.gen.ts`, which `src/lib/site.ts` reads
// each channel's clips from.
//
// The source folders are the channels: add, remove, rename or re-export
// files there and run the script again (or leave it watching), and it
// encodes only what's new or changed since its last run and deletes what
// no longer has a source, so the files git sees change only when the
// footage does. --force encodes everything again, for when the settings
// below change.
//
// H.264 because every browser plays it. AV1 is 20 to 50% smaller at the
// same quality, but Safari only plays it on recent hardware, so it would
// need an H.264 copy beside it.
//
// macOS only: HEIC photos decode through sips. Needs ffmpeg with zscale for the tone mapping:
// `brew install ffmpeg-full`.

import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  watch,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// The Player's screen is 446 by 251 px; over twice that, with
// room for full screen through the theme's filters.
const WIDTH = 960
const HEIGHT = 540
// x264 quality: lower is better and bigger. 26 keeps a clip near
// 100 KB a second at this size; the cap holds busy shots (leaves in the
// wind, low-light noise) to about 190 KB a second. The slowest preset
// takes longer, once, for files a few percent smaller.
const CRF = 26
const PRESET = 'veryslow'
const MAXRATE = '1500k'
const PHOTO_QUALITY = 80
const POSTER_QUALITY = 70

const VIDEO = new Set(['.mov', '.mp4', '.m4v'])
const PHOTO = new Set(['.heic', '.heif', '.jpg', '.jpeg', '.png'])

const FFMPEG = existsSync('/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg')
  ? '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg'
  : 'ffmpeg'
const FFPROBE = FFMPEG.replace(/ffmpeg$/, 'ffprobe')

const say = (line) => process.stderr.write(`${line}\n`)

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url))
const SOURCES = root('assets/travel')
const MADE = root('public/travel')
const LIST = root('src/lib/travel.gen.ts')

const args = process.argv.slice(2)
const force = args.includes('--force')
const watching = args.includes('--watch')
const named = args.filter((a) => !a.startsWith('--'))

const run = (cmd, args) =>
  execFileSync(cmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

/** The file's name as the site has it, lowercase with underscores:
 *  `Hedge Maze.mov` → `hedge_maze`. */
const slug = (file) =>
  basename(file, extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

// Cover the frame, then crop what's left over from the middle.
const FRAME = `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1`
// HLG and PQ to SDR: to linear light, into BT.709, tone mapped, back to
// video levels.
const TONEMAP =
  'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv'

function encodeVideo(file, name, out) {
  const transfer = run(FFPROBE, [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=color_transfer',
    '-of',
    'csv=p=0',
    file,
  ]).trim()
  const hdr = transfer === 'arib-std-b67' || transfer === 'smpte2084'
  const video = join(out, `${name}.mp4`)
  run(FFMPEG, [
    '-v',
    'error',
    '-y',
    '-i',
    file,
    // The picture alone: no sound, no location track, no tags.
    '-map',
    '0:v:0',
    '-an',
    '-map_metadata',
    '-1',
    '-map_chapters',
    '-1',
    '-vf',
    [FRAME, hdr && TONEMAP, 'format=yuv420p'].filter(Boolean).join(','),
    '-c:v',
    'libx264',
    '-preset',
    PRESET,
    '-crf',
    String(CRF),
    '-maxrate',
    MAXRATE,
    '-bufsize',
    '3000k',
    '-profile:v',
    'high',
    '-r',
    '30',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'bt709',
    '-colorspace',
    'bt709',
    '-movflags',
    '+faststart',
    video,
  ])
  run(FFMPEG, [
    '-v',
    'error',
    '-y',
    '-i',
    video,
    '-frames:v',
    '1',
    '-c:v',
    'libwebp',
    '-quality',
    String(POSTER_QUALITY),
    join(out, `${name}.poster.webp`),
  ])
  return [`${name}.mp4`, `${name}.poster.webp`]
}

function encodePhoto(file, name, out) {
  // Decoded by macOS, which reads HEIC and turns it upright.
  const png = join(tmpdir(), `travel-${process.pid}-${name}.png`)
  run('sips', ['-s', 'format', 'png', file, '--out', png])
  run(FFMPEG, [
    '-v',
    'error',
    '-y',
    '-i',
    png,
    '-map_metadata',
    '-1',
    '-vf',
    FRAME,
    '-c:v',
    'libwebp',
    '-quality',
    String(PHOTO_QUALITY),
    join(out, `${name}.webp`),
  ])
  rmSync(png)
  return [`${name}.webp`]
}

const folders = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    : []

/** The files a source makes. */
const outputs = (file) => {
  const name = slug(file)
  return PHOTO.has(extname(file).toLowerCase())
    ? [`${name}.webp`]
    : [`${name}.mp4`, `${name}.poster.webp`]
}

/** Brings one channel's files in line with its source folder; false if
 *  it can't. */
function refresh(channel) {
  const src = join(SOURCES, channel)
  const out = join(MADE, channel)
  const files = readdirSync(src)
    .map((f) => join(src, f))
    .filter(
      (f) =>
        VIDEO.has(extname(f).toLowerCase()) ||
        PHOTO.has(extname(f).toLowerCase()),
    )
    .sort()

  // Two sources can't share a name: `IMG_1.HEIC` and `IMG_1.MOV` would.
  const taken = new Map()
  for (const f of files) {
    const twin = taken.get(slug(f))
    if (twin) {
      say(
        `${channel}: ${basename(twin)} and ${basename(f)} would both be ${slug(f)}; rename one.`,
      )
      return false
    }
    taken.set(slug(f), f)
  }

  mkdirSync(out, { recursive: true })

  // Whatever no source makes any more goes: a file taken out of the
  // folder, or the old name of one renamed.
  const wanted = new Set(files.flatMap(outputs))
  for (const f of readdirSync(out)) {
    if (wanted.has(f)) continue
    rmSync(join(out, f), { recursive: true })
    say(`${channel}: removed ${f}`)
  }

  for (const file of files) {
    // Made already, and since the source last changed.
    const current = outputs(file).every((f) => {
      const made = join(out, f)
      return (
        existsSync(made) && statSync(made).mtimeMs >= statSync(file).mtimeMs
      )
    })
    if (current && !force) continue
    const name = slug(file)
    const made = PHOTO.has(extname(file).toLowerCase())
      ? encodePhoto(file, name, out)
      : encodeVideo(file, name, out)
    say(`${channel}: ${basename(file)} → ${made.join(', ')}`)
  }
  return true
}

/** Writes the list of every channel's clips, from what's in
 *  `public/travel/`, for the site to read. */
function list() {
  const channels = folders(MADE).map((channel) => {
    const files = readdirSync(join(MADE, channel)).sort()
    const clips = files.flatMap((f) => {
      const path = `'${channel}/${f}'`
      if (f.endsWith('.mp4')) {
        const poster = f.replace(/\.mp4$/, '.poster.webp')
        return files.includes(poster)
          ? [`{ src: ${path}, poster: '${channel}/${poster}' }`]
          : [`{ src: ${path} }`]
      }
      if (f.endsWith('.webp') && !f.endsWith('.poster.webp'))
        return [`{ src: ${path}, still: true }`]
      return []
    })
    const kb = files.reduce(
      (n, f) => n + statSync(join(MADE, channel, f)).size / 1024,
      0,
    )
    say(`${channel}: ${clips.length} clips, ${Math.round(kb)} KB`)
    return `  ${channel}: [\n${clips.map((c) => `    ${c},\n`).join('')}  ],`
  })
  const text = `// Written by scripts/travel.mjs from public/travel/; never edit by hand.\n\nimport type { Clip } from './site.ts'\n\nexport const travel: Record<string, Clip[]> = {\n${channels.join('\n')}\n}\n`
  // Left alone when nothing changed, so the dev server doesn't reload.
  if (!existsSync(LIST) || readFileSync(LIST, 'utf8') !== text)
    writeFileSync(LIST, text)
}

function all() {
  const channels = named.length ? named : folders(SOURCES)
  for (const channel of channels) {
    if (!existsSync(join(SOURCES, channel))) {
      say(`No folder assets/travel/${channel}.`)
      process.exitCode = 1
      continue
    }
    if (!refresh(channel)) process.exitCode = 1
  }
  // Run over every channel, a channel whose source folder is gone goes too.
  if (!named.length)
    for (const channel of folders(MADE)) {
      if (channels.includes(channel)) continue
      rmSync(join(MADE, channel), { recursive: true })
      say(`removed channel ${channel}`)
    }
  list()
}

all()

if (watching) {
  say('Watching assets/travel/ for changes; Ctrl-C to stop.')
  // A save or a copy fires a burst of events; wait for it to settle.
  let timer
  watch(SOURCES, { recursive: true }, () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      say('')
      try {
        all()
      } catch (error) {
        say(String(error))
      }
    }, 1000)
  })
}
