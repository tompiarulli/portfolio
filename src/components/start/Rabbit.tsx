import type { CSSProperties, ReactNode } from 'react'

import type { StartScreenProps } from '#/components/start'
import { build } from '#/lib/build'
import { site } from '#/lib/site'

/** White Rabbit's start screen: a whole screen of plain console, in the
 *  theme's one green on its near-black, flat and unlit, like an old Unix
 *  workstation, ruled round its edge. A login banner sits in the top left
 *  and a status line along the foot; two shell panes open over it, one
 *  listing the desktop's stopped programs, the other booting the system:
 *  the build and the session print, and the cursor waits after the prompt as an
 *  alert box comes up. Commands type a character at a time; their output
 *  prints a line at a time. Leaving, the panes close front to back, the
 *  banner and status line clear, and the ground steps away top to bottom
 *  onto the desktop. */
export default function RabbitStart({ leaving }: StartScreenProps) {
  // Leaving, each piece vanishes after its delay, in ms.
  const out = (ms: number) => ({
    style: { '--out': `${ms}ms` } as CSSProperties,
    className: leaving
      ? 'invisible transition-[visibility] delay-(--out) duration-0'
      : '',
  })

  const next = clock(BANNER_AT)
  const banner = site.shutdown.banner.map((text) => ({ text, at: next(ROW) }))

  next(PANE - ROW)
  const psAt = next(LINE)
  const psCommand = next('ps'.length * CHAR + LINE)
  const ps = PS.map((text) => ({ text, at: next(ROW) }))

  next(PANE)
  const bootAt = next(LINE)
  const bootCommand = next(BOOT.length * CHAR + LINE)
  const status = `${site.os} (tty1)  build ${build.commit}${build.date ? ` (${build.date})` : ''}`
  const statusAt = next(LINE)
  const session = site.shutdown.session.map((text) => ({
    text,
    at: next(LINE),
  }))
  // The prompt types out like a command; the cursor waits once it's done.
  const promptAt = next(LINE)
  const typedAt = promptAt + site.shutdown.prompt.length * CHAR

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 font-mono text-[12px] leading-[1.35] whitespace-pre text-(--ink) sm:text-[14px]"
    >
      {/* The console's ground, flat over the rain. */}
      <div
        className={`absolute inset-0 bg-(--terminal) ${leaving ? 'console-wipe' : ''}`}
      />

      {/* The login banner, under the menu mark. */}
      <div
        style={out(OUT.chrome).style}
        className={`absolute top-[64px] left-[4vw] ${out(OUT.chrome).className}`}
      >
        {banner.map(({ text, at }, i) => (
          <Out key={i} at={at}>
            {text || ' '}
          </Out>
        ))}
      </div>

      {/* The screen's ruled edge, with the status line along its foot. */}
      <div
        style={out(OUT.chrome).style}
        className={`fade-in absolute inset-[6px] border border-current sm:inset-[10px] ${out(OUT.chrome).className}`}
      />
      <div
        style={out(OUT.chrome).style}
        className={`fade-in absolute inset-x-[6px] bottom-[6px] grid grid-cols-3 border-t border-current px-[4vw] py-[4px] sm:inset-x-[10px] sm:bottom-[10px] ${out(OUT.chrome).className}`}
      >
        <span>{build.commit}</span>
        <span className="text-center">1:tty1</span>
        <span className="text-right">{build.date}</span>
      </div>

      {/* The process list, behind. */}
      <Pane
        title="tty2"
        at={psAt}
        out={out(OUT.ps)}
        className="top-[16%] left-[46%] hidden h-[34%] w-[min(520px,44%)] sm:flex"
      >
        <Command at={psCommand} command="ps" />
        {ps.map(({ text, at }, i) => (
          <Out key={i} at={at}>
            {text}
          </Out>
        ))}
      </Pane>

      {/* The boot, in front. */}
      <Pane
        title="tty1"
        at={bootAt}
        out={out(OUT.boot)}
        className="inset-x-2 top-[20%] bottom-[12%] sm:inset-x-auto sm:top-[28%] sm:bottom-auto sm:left-[10%] sm:h-[54%] sm:w-[min(760px,70%)]"
      >
        <Command at={bootCommand} command={BOOT} />
        <Out at={statusAt}>{status}</Out>
        <Out at={statusAt}> </Out>
        {session.map(({ text, at }, i) => (
          <Out key={i} at={at}>
            {text || ' '}
          </Out>
        ))}
        <Out at={promptAt}>
          <Typed at={promptAt} text={site.shutdown.prompt} />
          <span
            style={{ '--at': `${typedAt}ms` } as CSSProperties}
            className="cursor-on inline-block h-[1.1em] w-[1ch] translate-y-[0.2em] bg-current"
          />
        </Out>
      </Pane>

      {/* The alert, over the boot's lower right. */}
      <Pane
        title="tomos"
        at={typedAt + LINE}
        out={out(OUT.alert)}
        className="right-[6%] bottom-[16%] sm:right-[12%] sm:bottom-[14%]"
      >
        <p className="px-[14px] py-[6px] tracking-[0.08em] uppercase">
          {site.shutdown.halted}
        </p>
      </Pane>
    </div>
  )
}

/** A console pane: a solid bar with two boxes at its left and its title in
 *  brackets at its right, over a ruled screen. It comes up at `at`, and
 *  closes as `out` says. */
function Pane({
  title,
  at,
  out,
  className,
  children,
}: {
  title: string
  at: number
  out: { style: CSSProperties; className: string }
  className: string
  children: ReactNode
}) {
  return (
    <div
      style={{ '--at': `${at}ms`, ...out.style } as CSSProperties}
      className={`print-line absolute flex flex-col border border-current bg-(--terminal) ${className} ${out.className}`}
    >
      <div className="flex h-[17px] shrink-0 items-center gap-[3px] bg-(--ink) px-[3px] text-(--terminal)">
        <span className="size-[9px] border border-current" />
        <span className="size-[9px] border border-current" />
        <span className="ml-auto pr-[6px] text-[11px] leading-none sm:text-[12px]">
          [{title}]
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-[8px] py-[4px]">
        {children}
      </div>
    </div>
  )
}

/** A line of output, printed whole at `at`. */
function Out({
  at,
  className = '',
  children,
}: {
  at: number
  className?: string
  children: ReactNode
}) {
  return (
    <p
      style={{ '--at': `${at}ms` } as CSSProperties}
      className={`print-line ${className}`}
    >
      {children}
    </p>
  )
}

/** A root prompt, with its command typed out from `at`. */
function Command({ at, command }: { at: number; command: string }) {
  return (
    <Out at={at}>
      {'# '}
      <Typed at={at} text={command} />
    </Out>
  )
}

/** Text typed out a character at a time from `at`. */
function Typed({ at, text }: { at: number; text: string }) {
  return (
    <span
      style={
        {
          '--chars': text.length,
          '--type': `${text.length * CHAR}ms`,
          '--at': `${at}ms`,
        } as CSSProperties
      }
      className="type-line inline-block"
    >
      {text}
    </span>
  )
}

/** Hands out start times in order: each call says when the next thing
 *  starts and moves the clock on by how long it takes. */
function clock(start: number) {
  let t = start
  return (takes: number) => {
    const at = t
    t += takes
    return at
  }
}

const BOOT = 'boot -v tomos'

/** The desktop's programs, all stopped. */
const PS = [
  '  PID TTY    STAT  COMMAND',
  '    1 ?      Ss    init',
  '  212 tty1   T     about',
  '  213 tty1   T     contact',
  '  214 tty1   T     work',
  '  215 tty1   T     terminal',
  '  216 tty1   T     settings',
]

// The pace: when the banner starts; the pause before a pane comes up;
// how long one character takes to type; and the pause after each row of
// a listing and each line.
const BANNER_AT = 200

/** When each piece vanishes as the screen leaves, in ms; the ground's
 *  wipe follows the last (see .console-wipe in styles.css). */
const OUT = { alert: 0, boot: 70, ps: 140, chrome: 210 }
const PANE = 300
const CHAR = 30
const ROW = 50
const LINE = 220
