import { build } from '#/lib/build'
import type { ClockMode } from '#/lib/clock'
import { email, profiles, site } from '#/lib/site'
import { THEMES } from '#/lib/theme'
import type { Theme } from '#/lib/theme'
import type { WindowId } from '#/lib/windows'

/** What a command asks the terminal to do besides print. */
export type Effect =
  | { type: 'clear' }
  | { type: 'exit' }
  | { type: 'open'; id: WindowId }
  | { type: 'theme'; id: Theme }

export type Result = { out: string[]; effect?: Effect }

export type Env = {
  theme: Theme
  /** Whether `date` gives the theme's day or today, as the clock does. */
  clock: ClockMode
  history: string[]
  /** When the page loaded, for uptime. */
  bootedAt: number
}

export const PROMPT = 'guest@tomos:~$'

export const BANNER = [
  `${site.os} (tty1)`,
  "Type 'help' for a list of commands.",
]

const FILES: Partial<Record<string, string[]>> = {
  'about.txt': [...site.letter, site.signoff],
  'contact.txt': profiles.map((p) => `${p.label.padEnd(10)}${p.handle}`),
  'work.txt': site.work,
  '.plan': ['Build something small and fast.', 'Ship it.'],
}

const OPENABLE: Partial<Record<string, WindowId>> = {
  about: 'about',
  contact: 'contact',
  work: 'work',
  settings: 'settings',
  system: 'system',
  'system info': 'system',
}

const FORTUNES = [
  'There are 10 kinds of people: those who read binary and those who do not.',
  'It works on my machine.',
  'The cloud is just someone else’s computer.',
  'Weeks of coding can save you hours of planning.',
  'There is no place like 127.0.0.1.',
  'Have you tried turning it off and on again?',
  'Real programmers count from 0.',
]

/** Centres text in a field of the given width. */
function centre(text: string, width: number) {
  return text.padStart(Math.ceil((width + text.length) / 2)).padEnd(width)
}

/** A little train, as sl draws for anyone who mistypes ls. */
const TRAIN = [
  '     ______',
  ' ___|[_][_]|___ ________ ________',
  `|${centre(site.os, 14)}||  ____  ||  ____  |`,
  "'-(o)--(o)-(o)-''-(o)(o)-''-(o)(o)-'",
  '   choo choo. you meant ls.',
]

function cow(text: string) {
  const said = text || 'moo'
  return [
    ` ${'_'.repeat(said.length + 2)}`,
    `< ${said} >`,
    ` ${'-'.repeat(said.length + 2)}`,
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||',
  ]
}

function themeDate(theme: Theme, clock: ClockMode) {
  const t = THEMES.find((x) => x.id === theme) ?? THEMES[0]
  const d =
    t.date && clock === 'theme' ? new Date(`${t.date}T12:00:00`) : new Date()
  return d.toDateString()
}

function uptime(since: number) {
  const s = Math.floor((Date.now() - since) / 1000)
  const m = Math.floor(s / 60)
  return m ? `${m} min, ${s % 60} sec` : `${s} sec`
}

/** Phrases that switch theme, each a nod to the theme's homage. */
const SECRETS: { match: RegExp; theme: Theme; out: string[] }[] = [
  {
    match: /^(follow the white rabbit|red pill|take the red pill|matrix)$/,
    theme: 'rabbit',
    out: ['Wake up, guest...', 'Knock, knock.'],
  },
  {
    match: /^(88 ?mph|great scott|121 gigawatts)$/,
    theme: 'traveler',
    out: ["Where we're going, we don't need roads."],
  },
]

/** Things people might just say. Matched after lowercasing and dropping
 *  punctuation. */
const PHRASES: { match: RegExp; out: string[] }[] = [
  {
    match: /^(hello|hi|hey) neo$/,
    out: ["Neo's not here, man. He's taking the blue pill these days."],
  },
  {
    match: /^(neo|mr anderson)$/,
    out: ['You hear that? That is the sound of inevitability.'],
  },
  {
    match: /^there is no spoon$/,
    out: ['Then it is not the spoon that bends.'],
  },
  { match: /^i know kung fu$/, out: ['Show me.'] },
  {
    match: /^what is the matrix$/,
    out: ['No one can be told. You have to see it for yourself.'],
  },
  {
    match: /^open the pod bay doors( hal)?$/,
    out: ["I'm sorry, guest. I'm afraid I can't do that."],
  },
  { match: /^i am your father$/, out: ['Nooooooooooooo!'] },
  { match: /^may the force be with you$/, out: ['And also with you.'] },
  {
    match: /^beam me up( scotty)?$/,
    out: ['Scotty is on break. Try again in 300 years.'],
  },
  { match: /^(do a barrel roll|barrel roll)$/, out: ['*rolls*'] },
  {
    match: /^up up down down left right left right b a( start)?$/,
    out: ['+30 lives.'],
  },
  { match: /^hello world$/, out: ['Hello, world!'] },
  { match: /^(how do i exit vim|exit vim)$/, out: ['Nobody knows.'] },
  {
    match: /^(who is tom|where is tom|tom)$/,
    out: [`Probably fixing a CSS bug. Try ${email}.`],
  },
  { match: /^(i love you|ily)$/, out: ['I know.'] },
  { match: /^(thank you|thanks|ty)$/, out: ["You're welcome."] },
  {
    match: /^(are you alive|are you sentient)$/,
    out: ["I'm a switch statement."],
  },
]

export const COMMANDS = [
  'help',
  'ls',
  'cat',
  'cd',
  'open',
  'whoami',
  'pwd',
  'date',
  'uname',
  'neofetch',
  'theme',
  'history',
  'echo',
  'clear',
  'exit',
]

/** Runs one line typed at the prompt. */
export function run(line: string, env: Env): Result {
  const input = line.trim()
  if (!input) return { out: [] }
  const lower = input.toLowerCase()
  const [cmd = '', ...args] = input.split(/\s+/)
  const arg = args.join(' ')

  const said = lower.replace(/[.,!?']/g, '').replace(/\s+/g, ' ')
  const secret = SECRETS.find((s) => s.match.test(said))
  if (secret)
    return { out: secret.out, effect: { type: 'theme', id: secret.theme } }
  const phrase = PHRASES.find((p) => p.match.test(said))
  if (phrase) return { out: phrase.out }

  switch (cmd.toLowerCase()) {
    case 'help':
      return {
        out: ['Commands:', `  ${COMMANDS.join('  ')}`],
      }
    case 'ls':
    case 'dir': {
      const all = args.some((a) => a.startsWith('-') && a.includes('a'))
      const names = Object.keys(FILES).filter((f) => all || !f.startsWith('.'))
      return { out: [(all ? ['.', '..', ...names] : names).join('  ')] }
    }
    case 'cat':
    case 'less':
    case 'more': {
      if (!arg) return { out: [`${cmd}: missing file operand`] }
      const file = FILES[arg]
      return file
        ? { out: file }
        : { out: [`${cmd}: ${arg}: No such file or directory`] }
    }
    case 'cd':
      if (!arg || arg === '~' || arg === '.') return { out: [] }
      if (arg === '..' || arg === '/')
        return { out: ["cd: you're in a browser. There's no way out."] }
      return { out: [`cd: no such file or directory: ${arg}`] }
    case 'open':
    case 'start': {
      const id = OPENABLE[arg.toLowerCase()]
      if (id) return { out: [], effect: { type: 'open', id } }
      return {
        out: [`open: no app named '${arg}'`],
      }
    }
    case 'whoami':
      return { out: ['guest'] }
    case 'pwd':
      return { out: ['/home/guest'] }
    case 'date':
      return {
        out: [themeDate(env.theme, env.clock)],
      }
    case 'uname':
      return {
        out: [
          args.includes('-a')
            ? `${site.os} tomos ${build.commit} ${site.builtWith}`
            : site.os,
        ],
      }
    case 'neofetch':
    case 'fastfetch': {
      const theme = THEMES.find((t) => t.id === env.theme)?.label
      const art = [
        '    .--.',
        '   |o_o |',
        '   |:_/ |',
        '  //   \\ \\',
        ' (|     | )',
        "/'\\_   _/`\\",
        '\\___)=(___/',
      ]
      const info = [
        'guest@tomos',
        '-----------',
        `OS: ${site.os}`,
        `Kernel: ${build.commit}`,
        `Uptime: ${uptime(env.bootedAt)}`,
        'Shell: tsh 0.1',
        `Theme: ${theme}`,
      ]
      return { out: art.map((l, i) => `${l.padEnd(14)}${info[i]}`) }
    }
    case 'theme': {
      if (!arg)
        return {
          out: [
            ...THEMES.map(
              (t) =>
                `${t.id === env.theme ? '*' : ' '} ${t.id.padEnd(9)}${t.label}`,
            ),
            'Usage: theme <name>',
          ],
        }
      const name = arg.toLowerCase()
      const t = THEMES.find(
        (x) => x.id === name || x.label.toLowerCase() === name,
      )
      if (!t) return { out: [`theme: no theme named '${arg}'`] }
      return {
        out: [`Theme set to ${t.label}.`],
        effect: { type: 'theme', id: t.id },
      }
    }
    case 'history':
      return {
        out: env.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`),
      }
    case 'echo':
      return { out: [arg] }
    case 'clear':
    case 'cls':
      return { out: [], effect: { type: 'clear' } }
    case 'exit':
    case 'logout':
    case 'quit':
      return { out: [], effect: { type: 'exit' } }

    // Easter eggs.
    case 'sudo':
      if (lower === 'sudo make me a sandwich') return { out: ['Okay.'] }
      return {
        out: [
          'guest is not in the sudoers file. This incident will be reported.',
        ],
      }
    case 'make':
      if (lower === 'make me a sandwich')
        return { out: ['What? Make it yourself.'] }
      if (lower === 'make coffee') return { out: ["418 I'm a teapot."] }
      return {
        out: ['make: *** No targets specified and no makefile found.  Stop.'],
      }
    case 'coffee':
      return { out: ["418 I'm a teapot."] }
    case 'rm':
      return {
        out: ['rm: permission denied. Nice try though.'],
      }
    case 'vim':
    case 'vi':
    case 'nano':
    case 'emacs':
      return {
        out: [`${cmd}: not installed. You'd never have got out anyway.`],
      }
    case ':q':
    case ':q!':
    case ':wq':
      return { out: ["You weren't in vim. But respect."] }
    case 'ping':
      return {
        out: [
          arg ? `64 bytes from ${arg}: icmp_seq=1 ttl=64 time=0.42 ms` : 'pong',
        ],
      }
    case 'man':
      return {
        out: [
          arg ? `No manual entry for ${arg}` : 'What manual page do you want?',
        ],
      }
    case 'git':
      if (args[0] === 'status')
        return {
          out: ['On branch main', 'nothing to commit, working tree clean'],
        }
      if (args[0] === 'blame') return { out: ['It was Tom.'] }
      if (args[0] === 'push')
        return {
          out: ['Denied. Tom reviews every push personally.'],
        }
      if (args[0] === 'log')
        return { out: [`commit ${build.commit}`, `Date: ${build.date}`] }
      return { out: [`git: '${args[0] ?? ''}' is not a git command.`] }
    case 'sl':
      return { out: TRAIN }
    case 'cowsay':
      return { out: cow(arg) }
    case 'fortune':
      return {
        out: [FORTUNES[Math.floor(Math.random() * FORTUNES.length)] ?? ''],
      }
    case 'hello':
    case 'hi':
    case 'hey':
      return { out: ['Hello, guest.'] }
    case 'xyzzy':
      return { out: ['Nothing happens.'] }
    case '42':
      return { out: ['Now what was the question?'] }
    case 'hack':
      return { out: ['HACK THE PLANET!'] }
    case 'blue':
      if (lower === 'blue pill')
        return {
          out: ['The story ends. You wake up in your bed. Refresh to forget.'],
        }
      break
    case 'take':
      if (lower === 'take the blue pill')
        return {
          out: ['The story ends. You wake up in your bed. Refresh to forget.'],
        }
      break
  }
  return { out: [`tsh: command not found: ${cmd}`] }
}

/** Completes the first word to a listed command, if exactly one fits. */
export function complete(line: string) {
  if (line.includes(' ')) return line
  const fits = COMMANDS.filter((c) => c.startsWith(line.toLowerCase()))
  return fits.length === 1 ? `${fits[0]} ` : line
}
