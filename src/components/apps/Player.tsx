import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

import { FilmGrain } from '#/components/FilmGrain'
import { Window } from '#/components/Window'
import { useWindows } from '#/components/WindowManager'
import { clockMode } from '#/lib/clock'
import { channels } from '#/lib/site'
import type { Channel } from '#/lib/site'
import {
  DEFAULT_THEME,
  THEMES,
  currentTheme,
  subscribeTheme,
} from '#/lib/theme'
import type { Theme } from '#/lib/theme'

// Module load is near enough to page load for the tape counter.
const loadedAt = Date.now()

const MONTHS = 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split(' ')

const pad = (n: number) => String(n).padStart(2, '0')
const number = (i: number) => pad(i + 1)

/** "38.72°N 9.14°W" */
const coords = ({ lat, lon }: Channel) =>
  `${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'S' : 'N'} ${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'W' : 'E'}`

/** The theme's day, unless Settings asks for today, at the real time. */
function themedNow(theme: Theme, now: Date) {
  const date = THEMES.find((t) => t.id === theme)?.date
  if (!date || clockMode() !== 'theme') return now
  const d = new Date(`${date}T12:00:00`)
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds())
  return d
}

/** The second, ticking; null on the server and until mounted, so the
 *  prerendered HTML never bakes in a time. */
function useNow() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

/** Each theme's on-screen display, over the picture: a ship's feed with
 *  its telemetry, a security camera's stamp, a VCR's readout, or an old
 *  film's title card each time the channel changes. */
function Osd({
  theme,
  channel,
  index,
  tunedAt,
  playing,
}: {
  theme: Theme
  channel: Channel
  index: number
  tunedAt: number
  playing: boolean
}) {
  const now = useNow()
  const corner = 'absolute flex gap-[1ch] whitespace-nowrap'
  if (theme === 'steamboat')
    return (
      // Keyed, so the card plays again on every channel.
      <div
        key={index}
        className="tv-title-card absolute inset-0 flex flex-col items-center justify-center gap-1 bg-(--tv-card) text-(--tv-card-ink)"
      >
        <span className="font-(family-name:--start-title-font) text-[max(34px,6cqw)] leading-none">
          {channel.place}
        </span>
        <span className="font-(family-name:--script-font) text-[max(15px,2.6cqw)] italic underline">
          {channel.country}
        </span>
      </div>
    )
  if (theme === 'rabbit') {
    const d = now && themedNow(theme, now)
    return (
      <>
        <span className={`${corner} top-2 left-3`}>CAM {number(index)}</span>
        <span className={`${corner} top-2 right-3`}>
          <span className="blink">●</span> REC
        </span>
        <span className={`${corner} bottom-2 left-3 uppercase`}>
          {channel.place}
        </span>
        {d && (
          <span className={`${corner} right-3 bottom-2 tabular-nums`}>
            {pad(d.getMonth() + 1)}-{pad(d.getDate())}-{d.getFullYear()}{' '}
            {pad(d.getHours())}:{pad(d.getMinutes())}:{pad(d.getSeconds())}
          </span>
        )}
      </>
    )
  }
  if (theme === 'traveler') {
    const d = now && themedNow(theme, now)
    const run = now
      ? Math.max(0, Math.floor((+now - (tunedAt || loadedAt)) / 1000))
      : 0
    return (
      <>
        <span className={`${corner} top-2 left-3`}>
          {playing ? 'PLAY ▶' : 'PAUSE ❚❚'}
        </span>
        <span className={`${corner} top-2 right-3`}>CH {number(index)}</span>
        <span className={`${corner} bottom-2 left-3 tabular-nums`}>
          {Math.floor(run / 3600)}:{pad(Math.floor(run / 60) % 60)}:
          {pad(run % 60)}
        </span>
        {d && (
          <span className={`${corner} right-3 bottom-2 tabular-nums`}>
            {MONTHS[d.getMonth()]}. {d.getDate()} {d.getFullYear()}
          </span>
        )}
      </>
    )
  }
  // Orbital: a feed on a ship's monitor, framed by corner marks.
  return (
    <>
      <span aria-hidden className="tv-reticle absolute inset-2" />
      <span className={`${corner} top-3 left-4 uppercase`}>
        Feed {number(index)} · {channel.place}
      </span>
      <span className={`${corner} top-3 right-4`}>
        <span className="blink">●</span> Live
      </span>
      <span className={`${corner} bottom-3 left-4 tabular-nums`}>
        {coords(channel)}
      </span>
      <span className={`${corner} right-4 bottom-3`}>Sig ▮▮▮▮▯</span>
    </>
  )
}

const KEY =
  'flex h-[26px] shrink-0 cursor-pointer items-center justify-center rounded-(--close-radius) border border-(--ink) px-2 font-(family-name:--font-label) text-(length:--label-size) [font-weight:var(--label-weight)] tracking-(--label-tracking) [text-transform:var(--label-case)] -outline-offset-4 outline-current outline-dotted not-focus-visible:outline-none hover:bg-(--accent) hover:text-(--on-accent) active:translate-y-px disabled:cursor-default disabled:*:opacity-40 disabled:hover:bg-transparent disabled:hover:text-current disabled:active:translate-y-0'

function Key({
  children,
  className = '',
  ...props
}: {
  children: ReactNode
  onClick: () => void
  'aria-label'?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <button type="button" className={`${KEY} ${className}`} {...props}>
      {children}
    </button>
  )
}

/** A key on the clip's strip: the strip's full height, ruled off from
 *  its neighbours on the side `className` names. */
function StripKey({
  children,
  className,
  ...props
}: {
  children: ReactNode
  onClick: () => void
  'aria-label': string
  disabled?: boolean
  className: string
}) {
  return (
    <button
      type="button"
      className={`flex w-[22px] shrink-0 cursor-pointer items-center justify-center border-(--ink) -outline-offset-2 outline-current outline-dotted not-focus-visible:outline-none hover:bg-(--accent) hover:text-(--on-accent) disabled:cursor-default disabled:*:opacity-40 disabled:hover:bg-transparent disabled:hover:text-current ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/** Keys that work together, joined into one ruled block: neighbours
 *  share a rule, and only the block's outer corners round. */
function Joined({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-[100px] *:flex-1 *:px-0 [&>*:not(:first-child)]:-ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none">
      {children}
    </div>
  )
}

/** A key's symbol, drawn on an 8px grid: filled, or ruled in 1px lines. */
function Glyph({
  d,
  ruled = false,
  size = 10,
}: {
  d: string
  ruled?: boolean
  size?: number
}) {
  return (
    <svg aria-hidden viewBox="0 0 8 8" width={size} height={size}>
      {ruled ? (
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeLinecap="square"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <path d={d} fill="currentColor" />
      )}
    </svg>
  )
}

const GLYPHS = {
  previous: 'M1 1h1.2v6H1zM7 1 2.6 4 7 7z',
  next: 'M5.8 1H7v6H5.8zM1 1l4.4 3L1 7z',
  play: 'M2 1l5 3-5 3z',
  pause: 'M1.5 1h1.8v6H1.5zM4.7 1h1.8v6H4.7z',
  full: 'M1 3V1h2M5 1h2v2M7 5v2H5M3 7H1V5',
  // Two lines crossing to arrowheads at the right.
  shuffle: 'M1 2h1.5l3 4H7M1 6h1.5l3-4H7M6 1l1 1-1 1M6 5l1 1-1 1',
  window: 'M3 1v2H1M5 1v2h2M7 5H5v2M1 5h2v2',
}

const OPTION =
  'flex w-full cursor-pointer items-center gap-3 px-3 py-[5px] text-left whitespace-nowrap outline-none pointer-coarse:py-3 hover:bg-(--accent) hover:text-(--on-accent) focus-visible:bg-(--accent) focus-visible:text-(--on-accent)'

/** The channel list: a ruled key naming the channel on, opening a menu
 *  up over the screen, drawn and worked like the system menu. Arrow keys
 *  walk it, Home and End jump to the ends, Escape closes. */
function ChannelPicker({
  index,
  tune,
}: {
  index: number
  tune: (i: number) => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  // The option to focus once the list is open.
  const [start, setStart] = useState(index)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const options = () => [
    ...(list.current?.querySelectorAll<HTMLElement>('[role=menuitemradio]') ??
      []),
  ]
  useEffect(() => {
    if (open) options()[start]?.focus()
  }, [open, start])

  const openAt = (i: number) => {
    setStart(i)
    setOpen(true)
  }
  const close = () => {
    setOpen(false)
    button.current?.focus()
  }
  const pick = (i: number) => {
    tune(i)
    close()
  }

  const onButtonKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    openAt(index)
  }

  // Escape closes the list, not the window: caught on the way down, as
  // the window listens for it before React's handlers run.
  const onEscape = (e: KeyboardEvent) => {
    if (!open || e.key !== 'Escape') return
    e.preventDefault()
    close()
  }

  const onListKeyDown = (e: KeyboardEvent) => {
    const all = options()
    const i = all.indexOf(document.activeElement as HTMLElement)
    const to =
      e.key === 'ArrowDown'
        ? Math.min(all.length - 1, i + 1)
        : e.key === 'ArrowUp'
          ? Math.max(0, i - 1)
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? all.length - 1
              : null
    if (to === null) return
    e.preventDefault()
    all[to]?.focus()
  }

  const channel = channels[index]
  return (
    <div
      ref={root}
      onKeyDownCapture={onEscape}
      // The list opens over the screen, across the whole line it sits in.
      className="min-w-0 flex-1"
      // Tabbing out of the list closes it, as clicking away does.
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      {open && (
        <div
          ref={list}
          role="menu"
          aria-label="Channels"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="os-scroll absolute bottom-full left-0 z-10 mb-[6px] max-h-[180px] w-full rounded-(--close-radius) border border-(--frame) bg-(--surface) py-1 shadow-(--window-shadow)"
        >
          {channels.map((c, i) => (
            <button
              key={c.place}
              type="button"
              role="menuitemradio"
              aria-checked={i === index}
              tabIndex={-1}
              onClick={() => pick(i)}
              className={OPTION}
            >
              <span className="tabular-nums">{number(i)}</span>
              <span className="min-w-0 flex-1 truncate">{c.place}</span>
              <span className="truncate opacity-70">{c.country}</span>
              {/* A lamp for the channel on, like the dock's. */}
              <span
                aria-hidden
                className={`size-[5px] shrink-0 border border-current ${i === index ? 'bg-current' : 'opacity-0'}`}
              />
            </button>
          ))}
        </div>
      )}
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        // Said, not shown, to leave the place the room.
        aria-label={`Channel: ${channel?.place}`}
        onClick={() => (open ? setOpen(false) : openAt(index))}
        onKeyDown={onButtonKeyDown}
        className={`${KEY.replace('justify-center', 'justify-between').replace('px-2', 'px-3')} w-full gap-2 ${open ? 'bg-(--accent) text-(--on-accent)' : ''}`}
      >
        <span className="min-w-0 truncate">{channel?.place}</span>
        <svg
          aria-hidden
          viewBox="0 0 8 8"
          className={`size-2 shrink-0 ${open ? '' : 'rotate-180'}`}
        >
          <path d="M0 6h8L4 1z" fill="currentColor" />
        </svg>
      </button>
    </div>
  )
}

/** Travel videos, one channel per place, as each theme's screen would
 *  show them: the picture runs through the theme's filter (styles.css)
 *  under its own display. */
export function Player() {
  const { minimized } = useWindows()
  const theme = useSyncExternalStore(
    subscribeTheme,
    currentTheme,
    () => DEFAULT_THEME,
  )
  const [index, setIndex] = useState(0)
  // The clip playing on the channel.
  const [clip, setClip] = useState(0)
  // When the picture last changed, by channel or clip; 0 until it first
  // does.
  const [tunedAt, setTunedAt] = useState(0)
  const [playing, setPlaying] = useState(false)
  // Clips are attached once the page has loaded, so they never hold up
  // the first paint; the prerendered screen shows the poster or test card.
  const [ready, setReady] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const channel = channels[index] ?? channels[0]!
  const clips = channel.clips
  const [full, setFull] = useState(false)
  useEffect(() => {
    const onChange = () =>
      setFull(!!screen.current && document.fullscreenElement === screen.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    // Then plays on its own, unless motion is unwelcome.
    const attach = () =>
      (window.requestIdleCallback ?? setTimeout)(() => {
        setReady(true)
        setPlaying(!matchMedia('(prefers-reduced-motion: reduce)').matches)
      })
    if (document.readyState === 'complete') attach()
    else addEventListener('load', attach, { once: true })
    return () => removeEventListener('load', attach)
  }, [])

  // Paused while minimized, so it costs nothing in the dock.
  const hidden = minimized.includes('player')
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (playing && !hidden) void v.play().catch(() => setPlaying(false))
    else v.pause()
  }, [playing, hidden, ready, index, clip])

  const tune = (i: number) => {
    setIndex((i + channels.length) % channels.length)
    setClip(0)
    setTunedAt(Date.now())
  }
  // The clip before or after, round the channel's list.
  const skip = (by: number) => {
    setClip((c) => (c + by + clips.length) % clips.length)
    setTunedAt(Date.now())
  }
  // The screen itself goes full screen, so its look goes with it; where
  // only a video can (an iPhone), the bare clip does.
  const fullScreen = () => {
    if (document.fullscreenElement) return void document.exitFullscreen()
    const el = screen.current
    if (el?.requestFullscreen)
      return void el.requestFullscreen().catch(() => {})
    const v = video.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null
    v?.webkitEnterFullscreen?.()
  }
  // Any channel but this one.
  const shuffle = () =>
    tune(index + 1 + Math.floor(Math.random() * (channels.length - 1)))

  const on = clips[clip] ?? clips[0]
  const src = ready ? on?.src : undefined
  return (
    <Window title="Travel" right x={-159} y={189} width={400} flush>
      <div className="tv" data-tv={theme}>
        {/* The VCR's colour fringing, used by OUTATIME's filter: red pulled
            one way and the rest the other, smeared along the line. */}
        <svg aria-hidden className="absolute size-0">
          <filter id="tv-vhs" colorInterpolationFilters="sRGB">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="0.6 0"
              result="smear"
            />
            <feColorMatrix
              in="smear"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red"
            />
            <feOffset in="red" dx="-1.5" result="red" />
            <feColorMatrix
              in="smear"
              values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
            />
            <feOffset dx="1" result="cyan" />
            <feBlend in="red" in2="cyan" mode="screen" />
          </filter>
        </svg>
        <div
          ref={screen}
          onDoubleClick={fullScreen}
          className="tv-screen relative aspect-video overflow-hidden border-b border-(--frame) bg-(--tv-off)"
        >
          <div className="tv-picture absolute inset-0">
            {src ? (
              // Ambient footage with no speech, so nothing to caption.
              // oxlint-disable-next-line jsx-a11y/media-has-caption
              <video
                ref={video}
                key={src}
                src={src}
                poster={on?.poster}
                // The clips have no sound.
                muted
                // One clip goes round on its own; more play in turn.
                loop={clips.length === 1}
                onEnded={() => skip(1)}
                playsInline
                preload="auto"
                aria-label={`${channel.place}, ${channel.country}`}
                className="size-full object-cover"
              />
            ) : (
              // No footage yet: the channel's test card.
              <div aria-hidden className="tv-bars size-full" />
            )}
          </div>
          <div aria-hidden className="tv-fx absolute inset-0" />
          {theme === 'steamboat' && <FilmGrain strength={0.4} />}
          <div
            aria-hidden
            className="tv-osd absolute inset-0 font-(family-name:--tv-osd-font) leading-none text-(--tv-osd)"
          >
            <Osd
              theme={theme}
              channel={channel}
              index={index}
              tunedAt={tunedAt}
              playing={playing}
            />
          </div>
          {/* A burst of snow between channels; keyed, so it plays on each. */}
          {tunedAt > 0 && (
            <div
              key={tunedAt}
              aria-hidden
              className="tv-static absolute inset-0"
            />
          )}
        </div>
        {/* The clip's strip, under the screen like a viewer's file bar:
            step between the channel's clips, see which is on, or go full
            screen. Its keys fill it, ruled off from the rest. */}
        <div className="flex h-[18px] border-b border-(--frame) bg-(--well)">
          <StripKey
            onClick={() => skip(-1)}
            disabled={clips.length < 2}
            aria-label="Previous clip"
            className="border-r"
          >
            <Glyph d={GLYPHS.previous} size={8} />
          </StripKey>
          <StripKey
            onClick={() => skip(1)}
            disabled={clips.length < 2}
            aria-label="Next clip"
            className="border-r"
          >
            <Glyph d={GLYPHS.next} size={8} />
          </StripKey>
          <p className="flex min-w-0 flex-1 items-center justify-between gap-3 px-2 font-mono text-[11px] leading-none whitespace-nowrap tabular-nums">
            <span className="truncate">
              {on ? (on.name ?? on.src.split('/').pop()) : 'No signal'}
            </span>
            {on && (
              <span>
                {clip + 1}/{clips.length}
              </span>
            )}
          </p>
          <StripKey
            onClick={fullScreen}
            aria-label={full ? 'Exit full screen' : 'Full screen'}
            className="border-l"
          >
            <Glyph d={full ? GLYPHS.window : GLYPHS.full} ruled size={8} />
          </StripKey>
        </div>
        {/* Play, then the channel: picked from the list, stepped, or left
            to chance. Relative, so the list opens across the line. */}
        <div className="relative flex gap-[7px] p-[8px]">
          <Key
            className="w-[34px] px-0"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            <Glyph d={playing ? GLYPHS.pause : GLYPHS.play} />
          </Key>
          <ChannelPicker index={index} tune={tune} />
          <Joined>
            <Key onClick={() => tune(index - 1)} aria-label="Previous channel">
              Ch −
            </Key>
            <Key onClick={() => tune(index + 1)} aria-label="Next channel">
              Ch +
            </Key>
          </Joined>
          <Key className="w-[34px] px-0" onClick={shuffle} aria-label="Shuffle">
            <Glyph d={GLYPHS.shuffle} ruled />
          </Key>
        </div>
      </div>
    </Window>
  )
}
