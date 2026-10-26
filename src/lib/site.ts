export const site = {
  url: 'https://tompiarulli.com',
  name: 'Tom Piarulli',
  title: 'Tom Piarulli ☼',
  tagline: 'Software engineer',
  /** What search results and link previews say about the site's two pages. */
  descriptions: {
    home: 'Portfolio of Tom Piarulli, a software engineer with 15+ years across engineering, product and design, most recently CTO at Nerd Street. Built as a small late-90s desktop.',
    notFound: "This page isn't on Tom Piarulli's desktop.",
  },
  /** Each page's main heading, for screen readers and outlines; on screen,
   *  the windows' own titles say it. */
  headings: {
    home: 'Tom Piarulli, software engineer',
    notFound: 'File Not Found',
  },
  letter: [
    'Welcome to my small corner of the internet.',
    "I'm a software developer with 15+ years of experience across engineering, product, and design. Most recently I was CTO at Nerd Street, an esports events company.",
    "I'm also a former digital nomad and 90s kid with a deep love of travel, movies, and pop culture.",
  ],
  signoff: '- Tom',
  /** The Work window: a write-up of work history, then a link to the full
   *  history on LinkedIn. Placeholder until written. */
  work: [
    'A short write-up of my work history goes here: the companies, the teams and what we built.',
    'A paragraph or two per role, most recent first.',
  ],
  workLink: 'Full work history on LinkedIn',
  os: 'TomOS 9.2',
  builtWith: 'React 19, TanStack Start, Tailwind 4',
  /** Status lines the splash card walks through at shut down and start up. */
  shutdown: {
    down: [
      'Saving the desktop',
      'Closing windows',
      'Flushing the cache',
      'Parking the heads',
      'Powering off',
    ],
    up: [
      'Checking memory',
      'Loading extensions',
      'Mounting the desktop',
      'Setting the clock',
      'Welcome back',
    ],
  },
}

export type Credit = {
  /** What it is, like a font or a library. */
  name: string
  by?: string
  url: string
  license?: string
}

/** Everything the site borrows, grouped and listed in System Info. */
export const credits: { group: string; items: Credit[] }[] = [
  {
    group: 'Inspired by',
    items: [{ name: 'Poolsuite', url: 'https://poolsuite.net' }],
  },
  {
    group: 'Fonts',
    items: [
      {
        name: 'Iosevka',
        by: 'Renzhi Li',
        url: 'https://github.com/be5invis/Iosevka',
        license: 'OFL 1.1',
      },
      {
        name: 'Geist Mono',
        by: 'the Geist Project Authors',
        url: 'https://github.com/vercel/geist-font',
        license: 'OFL 1.1',
      },
      {
        name: 'Grandstander',
        by: 'the Grandstander Project Authors',
        url: 'https://github.com/Etcetera-Type-Co/Grandstander',
        license: 'OFL 1.1',
      },
      {
        name: 'Recursive',
        by: 'the Recursive Project Authors',
        url: 'https://github.com/arrowtype/recursive',
        license: 'OFL 1.1',
      },
    ],
  },
  {
    group: 'Photo',
    items: [
      {
        name: 'Grass',
        by: 'Bruno Aguirre',
        url: 'https://unsplash.com/photos/green-field-YRfaG3JVwkU',
      },
    ],
  },
  {
    group: 'Built with',
    items: [
      { name: 'React', url: 'https://react.dev' },
      { name: 'TanStack Start', url: 'https://tanstack.com/start' },
      { name: 'Tailwind CSS', url: 'https://tailwindcss.com' },
      { name: 'Vercel', url: 'https://vercel.com' },
      { name: 'Claude Code', url: 'https://claude.com/claude-code' },
    ],
  },
]

export type Profile = {
  label: string
  /** What the link shows, like a username or address. */
  handle: string
  url: string
}

export const email = 'tom@tompiarulli.com'

/** Where to find me, in the order Contact lists them. */
export const profiles: Profile[] = [
  { label: 'Email', handle: email, url: `mailto:${email}` },
  {
    label: 'LinkedIn',
    handle: 'tompiarulli',
    url: 'https://www.linkedin.com/in/tompiarulli/',
  },
  {
    label: 'GitHub',
    handle: 'tompiarulli',
    url: 'https://github.com/tompiarulli',
  },
]
