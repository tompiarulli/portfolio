import { afterEach, describe, expect, it, vi } from 'vitest'

import { build } from '#/lib/build'
import { site } from '#/lib/site'
import { COMMANDS, complete, run } from '#/lib/terminal'
import type { Env } from '#/lib/terminal'
import { DEFAULT_THEME, THEMES } from '#/lib/theme'

const env = (over: Partial<Env> = {}): Env => ({
  theme: DEFAULT_THEME,
  clock: 'theme',
  history: [],
  bootedAt: Date.now(),
  ...over,
})

const out = (line: string, over?: Partial<Env>) => run(line, env(over)).out

afterEach(() => {
  vi.useRealTimers()
})

describe('run', () => {
  it('prints nothing for a blank line', () => {
    expect(run('', env())).toEqual({ out: [] })
    expect(run('   ', env())).toEqual({ out: [] })
  })

  it('reports unknown commands by name, with no effect', () => {
    const result = run('frobnicate now', env())
    expect(result.effect).toBeUndefined()
    expect(result.out).toHaveLength(1)
    expect(result.out[0]).toContain('command not found')
    expect(result.out[0]).toContain('frobnicate')
  })

  it.each(COMMANDS)('knows %s', (cmd) => {
    expect(out(cmd).join('\n')).not.toContain('command not found')
  })

  it('ignores case in command names', () => {
    expect(out('WHOAMI')).toEqual(['guest'])
  })

  describe('help', () => {
    it('lists every command', () => {
      const text = out('help').join('\n')
      for (const cmd of COMMANDS) expect(text).toContain(cmd)
    })
  })

  describe('ls', () => {
    it('lists the files, hiding dotfiles', () => {
      const [line = ''] = out('ls')
      expect(line).toContain('about.txt')
      expect(line).toContain('contact.txt')
      expect(line).not.toContain('.plan')
    })

    it('shows dotfiles with -a', () => {
      for (const flags of ['-a', '-la', '-al']) {
        const names = (out(`ls ${flags}`)[0] ?? '').split(/\s+/)
        expect(names).toEqual(expect.arrayContaining(['.', '..', '.plan']))
      }
    })
  })

  describe('cat', () => {
    it('prints a file', () => {
      expect(out('cat about.txt')).toEqual([...site.letter, site.signoff])
      expect(out('cat work.txt')).toEqual(site.work)
      expect(out('cat .plan').length).toBeGreaterThan(0)
    })

    it('needs a file name', () => {
      expect(out('cat')[0]).toContain('missing file operand')
    })

    it('reports a missing file by name', () => {
      const [line = ''] = out('cat nope.txt')
      expect(line).toContain('nope.txt')
      expect(line).toContain('No such file')
    })
  })

  describe('cd', () => {
    it('stays home quietly', () => {
      for (const to of ['cd', 'cd ~', 'cd .']) expect(out(to)).toEqual([])
    })

    it('has nowhere to go up to', () => {
      for (const to of ['cd ..', 'cd /']) {
        const lines = out(to)
        expect(lines).toHaveLength(1)
        expect(lines[0]).not.toContain('no such file')
      }
    })

    it('reports a missing directory by name', () => {
      expect(out('cd projects')[0]).toContain('projects')
    })
  })

  describe('open', () => {
    it.each([
      ['about', 'about'],
      ['contact', 'contact'],
      ['work', 'work'],
      ['settings', 'settings'],
      ['system', 'system'],
      ['system info', 'system'],
      ['System   Info', 'system'],
      ['ABOUT', 'about'],
    ])('open %s opens %s', (name, id) => {
      expect(run(`open ${name}`, env())).toEqual({
        out: [],
        effect: { type: 'open', id },
      })
    })

    it('reports an unknown app by name, with no effect', () => {
      const result = run('open doom', env())
      expect(result.effect).toBeUndefined()
      expect(result.out[0]).toContain('doom')
    })
  })

  it('whoami is the guest', () => {
    expect(out('whoami')).toEqual(['guest'])
  })

  it('pwd is the guest home', () => {
    expect(out('pwd')).toEqual(['/home/guest'])
  })

  describe('date', () => {
    it.each(THEMES.filter((t) => t.date))(
      "shows $label's day",
      ({ id, date }) => {
        expect(out('date', { theme: id })).toEqual([
          new Date(`${date}T12:00:00`).toDateString(),
        ])
      },
    )

    it('shows today for a theme without a day', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 9, 22, 9))
      expect(out('date', { theme: 'orbital' })).toEqual([
        new Date(2026, 9, 22).toDateString(),
      ])
    })

    it.each(THEMES)(
      'shows today in $label with the clock set to Current',
      ({ id }) => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2026, 9, 22, 9))
        expect(out('date', { theme: id, clock: 'accurate' })).toEqual([
          new Date(2026, 9, 22).toDateString(),
        ])
      },
    )
  })

  describe('uname', () => {
    it('prints the OS name', () => {
      expect(out('uname')).toEqual([site.os])
    })

    it('adds the build with -a', () => {
      const [line = ''] = out('uname -a')
      expect(line).toContain(site.os)
      expect(line).toContain(build.commit)
    })
  })

  describe('neofetch', () => {
    it('shows the OS, the build and the current theme', () => {
      const text = out('neofetch', { theme: 'steamboat' }).join('\n')
      expect(text).toContain(site.os)
      expect(text).toContain(build.commit)
      expect(text).toContain('Steamboat')
    })

    it('counts uptime from boot', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 9, 22, 9, 0, 0))
      const bootedAt = Date.now() - 125_000
      const text = out('neofetch', { bootedAt }).join('\n')
      expect(text).toContain('2 min, 5 sec')
    })
  })

  describe('theme', () => {
    it('lists every theme and marks the current one', () => {
      const lines = out('theme', { theme: 'steamboat' })
      for (const t of THEMES) {
        const line = lines.find((l) => l.includes(t.label))
        expect(line).toBeDefined()
        expect(line?.startsWith('*')).toBe(t.id === 'steamboat')
      }
    })

    it.each(THEMES)('switches to $label by id or by name', ({ id, label }) => {
      for (const name of [id, label, label.toUpperCase()]) {
        const result = run(`theme ${name}`, env())
        expect(result.effect).toEqual({ type: 'theme', id })
        expect(result.out.join('\n')).toContain(label)
      }
    })

    it('ignores extra spaces around and inside the name', () => {
      for (const line of [
        'theme   white rabbit',
        'theme white    rabbit',
        '  theme   outatime  ',
      ])
        expect(run(line, env()).effect?.type).toBe('theme')
      expect(run('theme  white   rabbit ', env()).effect).toEqual({
        type: 'theme',
        id: 'rabbit',
      })
    })

    it('reports an unknown theme by name, with no effect', () => {
      const result = run('theme vaporwave', env())
      expect(result.effect).toBeUndefined()
      expect(result.out[0]).toContain('vaporwave')
    })
  })

  it('history numbers what was typed', () => {
    expect(out('history', { history: ['ls', 'cat about.txt'] })).toEqual([
      '   1  ls',
      '   2  cat about.txt',
    ])
  })

  it('echo prints its arguments', () => {
    expect(out('echo  hello   there ')).toEqual(['hello there'])
    expect(out('echo')).toEqual([''])
  })

  it.each(['clear', 'cls'])('%s clears the screen', (cmd) => {
    expect(run(cmd, env())).toEqual({ out: [], effect: { type: 'clear' } })
  })

  it.each(['exit', 'logout', 'quit'])('%s closes the terminal', (cmd) => {
    expect(run(cmd, env())).toEqual({ out: [], effect: { type: 'exit' } })
  })

  it.each(['restart', 'reboot'])('%s restarts the desktop', (cmd) => {
    expect(run(cmd, env())).toEqual({ out: [], effect: { type: 'restart' } })
  })

  describe('easter eggs', () => {
    // Behaviour only: the replies are free to change.
    it.each([
      'sudo rm -rf /',
      'sudo make me a sandwich',
      'make me a sandwich',
      'make coffee',
      'coffee',
      'rm -rf /',
      'vim',
      ':q!',
      'ping',
      'ping example.com',
      'man ls',
      'git status',
      'git blame',
      'git push',
      'git log',
      'git rebase',
      'sl',
      'cowsay',
      'cowsay hi there',
      'fortune',
      'hello',
      'xyzzy',
      '42',
      'hack',
      'blue pill',
      'take the blue pill',
      'hello world',
      'Hello, Neo!',
      'there is no spoon',
      'open the pod bay doors hal',
      'up up down down left right left right b a start',
      'Thanks!',
    ])('%s gets a reply', (line) => {
      const result = run(line, env())
      expect(result.effect).toBeUndefined()
      expect(result.out.length).toBeGreaterThan(0)
      expect(result.out.join('')).not.toBe('')
      expect(result.out.join('\n')).not.toContain('command not found')
    })

    it.each([
      ['follow the white rabbit', 'rabbit'],
      ['Take the red pill.', 'rabbit'],
      ['Great Scott!', 'traveler'],
      ['88mph', 'traveler'],
      ['88 mph', 'traveler'],
    ])('%s switches theme to %s', (line, id) => {
      const result = run(line, env())
      expect(result.effect).toEqual({ type: 'theme', id })
      expect(result.out.length).toBeGreaterThan(0)
    })

    it('blue on its own is not a command', () => {
      expect(out('blue')[0]).toContain('command not found')
      expect(out('take')[0]).toContain('command not found')
    })

    it('cowsay frames what it says', () => {
      const said = out('cowsay moo moo').join('\n')
      expect(said).toContain('< moo moo >')
    })
  })
})

describe('complete', () => {
  it('completes a unique prefix to the command and a space', () => {
    expect(complete('neo')).toBe('neofetch ')
    expect(complete('whoa')).toBe('whoami ')
    expect(complete('p')).toBe('pwd ')
  })

  it('completes a whole command name too', () => {
    expect(complete('help')).toBe('help ')
  })

  it('ignores case in the prefix', () => {
    expect(complete('HEL')).toBe('help ')
  })

  it('leaves an ambiguous prefix alone', () => {
    // cat, cd, clear
    expect(complete('c')).toBe('c')
    // help, history
    expect(complete('h')).toBe('h')
    expect(complete('')).toBe('')
  })

  it('leaves a prefix that fits nothing alone', () => {
    expect(complete('zz')).toBe('zz')
  })

  it('only completes the first word', () => {
    expect(complete('cat ab')).toBe('cat ab')
    expect(complete('neo ')).toBe('neo ')
  })

  it('only completes to listed commands', () => {
    for (const prefix of 'abcdefghijklmnopqrstuvwxyz') {
      const done = complete(prefix)
      if (done !== prefix) expect(COMMANDS).toContain(done.trimEnd())
    }
  })
})
