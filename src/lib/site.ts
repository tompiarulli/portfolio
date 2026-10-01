export const site = {
  name: 'Tom Piarulli',
  title: 'Tom Piarulli ☼',
  tagline: 'Software engineer',
  letter: [
    'Welcome to my small corner of the internet.',
    "I'm a software developer with 15+ years of experience across engineering, product, and design. Most recently I was CTO at Nerd Street, an esports events company.",
    "I'm also a former digital nomad and 90s kid with a deep love of travel, movies, and pop culture.",
  ],
  signoff: '- Tom',
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
  /** The Shut Down photo, credited in System Info. */
  grassPhoto: {
    by: 'Bruno Aguirre',
    url: 'https://unsplash.com/photos/green-field-YRfaG3JVwkU',
  },
}

export type Profile = {
  label: string
  /** What the link shows, like a username or address. */
  handle: string
  url: string
}

/** Where to find me, in the order Contact lists them. */
export const profiles: Profile[] = [
  {
    label: 'Email',
    handle: 'tom@tompiarulli.com',
    url: 'mailto:tom@tompiarulli.com',
  },
  {
    label: 'LinkedIn',
    handle: 'tompiarulli',
    url: 'https://www.linkedin.com/in/tompiarulli/',
  },
  { label: 'GitHub', handle: 'tomparkp', url: 'https://github.com/tomparkp' },
]
