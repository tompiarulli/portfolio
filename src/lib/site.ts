const version = '9.2'

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
  os: `TomOS ${version}`,
  version,
  builtWith: 'React 19, TanStack Start, Tailwind 4',
  /** Status lines Orbital's shut down panel walks through. */
  shutdown: {
    down: [
      'Saving the desktop',
      'Closing windows',
      'Flushing the cache',
      'Parking the heads',
      'Powering off',
    ],
    /** Under the name above the title on Steamboat's start screen, like
     *  an old cartoon's title card. */
    presents: 'presents',
    /** What White Rabbit's console prints as it halts, after root types
     *  the command. */
    halt: [
      'Broadcast message from root@tomos (tty1):',
      'The system is going down for halt NOW!',
      '',
      'Sending SIGTERM to all processes... done',
      'Sending SIGKILL to all processes... done',
      'Unmounting file systems... done',
      'Power down.',
    ],
    /** White Rabbit's start screen: the login banner in its top left, the
     *  session printed in its boot pane, the prompt the cursor waits
     *  after, and what its alert box says. */
    banner: [
      `* Welcome to TomOS ${version} *`,
      'Authorised users only.',
      '',
      'login:',
    ],
    session: ['syncing disks... done', 'all processes stopped', ''],
    prompt: 'press any key to wake up...',
    halted: 'System halted',
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
        name: 'Geist and Geist Mono',
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
      {
        name: 'Righteous',
        by: 'Astigmatic',
        url: 'https://github.com/google/fonts/tree/main/ofl/righteous',
        license: 'OFL 1.1',
      },
      {
        name: 'Space Mono',
        by: 'the Space Mono Project Authors',
        url: 'https://github.com/google/fonts/tree/main/ofl/spacemono',
        license: 'OFL 1.1',
      },
      {
        name: 'Titan One',
        by: 'Rodrigo Fuenzalida',
        url: 'https://github.com/google/fonts/tree/main/ofl/titanone',
        license: 'OFL 1.1',
      },
      {
        name: 'Playfair Display',
        by: 'the Playfair Display Project Authors',
        url: 'https://github.com/google/fonts/tree/main/ofl/playfairdisplay',
        license: 'OFL 1.1',
      },
      {
        name: 'Jost',
        by: 'the Jost Project Authors',
        url: 'https://github.com/google/fonts/tree/main/ofl/jost',
        license: 'OFL 1.1',
      },
      {
        name: 'Saira Semi Condensed',
        by: 'the Saira Project Authors',
        url: 'https://github.com/google/fonts/tree/main/ofl/sairasemicondensed',
        license: 'OFL 1.1',
      },
      {
        name: 'Rubik Glitch',
        by: 'the Rubik Filtered Project Authors',
        url: 'https://github.com/google/fonts/tree/main/ofl/rubikglitch',
        license: 'OFL 1.1',
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

export type Clip = {
  /** The clip on Vercel Blob, an MP4 with no sound track. */
  src: string
  /** A still to show while it loads. */
  poster?: string
  /** What the player's strip calls it, like `sardegna_1993.mp4`; else
   *  the file's own name, which Blob may have suffixed. */
  name?: string
}

export type Channel = {
  /** The place, as the screen and the channel list name it. */
  place: string
  country: string
  /** Where it was shot, in degrees, for the readouts some themes put on
   *  screen: north and east positive. */
  lat: number
  lon: number
  /** Its clips, played in turn and round again. With none, the channel
   *  shows a test card. */
  clips: Clip[]
}

/** The Player's channels, one per place, in the order they're tuned.
 *  Placeholders until the footage is uploaded. */
export const channels: Channel[] = [
  { place: 'Lisbon', country: 'Portugal', lat: 38.72, lon: -9.14, clips: [] },
  { place: 'Kyoto', country: 'Japan', lat: 35.01, lon: 135.77, clips: [] },
  {
    place: 'Mexico City',
    country: 'Mexico',
    lat: 19.43,
    lon: -99.13,
    clips: [],
  },
]
