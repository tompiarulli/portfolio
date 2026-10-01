export const site = {
  name: 'Tom Piarulli',
  title: 'Tom Piarulli ☼',
  tagline: 'Software engineer',
  letter: [
    'Welcome to my small corner of the internet.',
    "I'm a software developer with 15+ years of experience across engineering, product, and design. I run technology for Nerd Street, a national network of esports venues and events.",
    "I'm also a former digital nomad and 90s kid with a deep love of travel, movies, and pop culture.",
  ],
  signoff: '- Tom',
  os: 'TomOS 9.2',
  builtWith: 'React 19, TanStack Start, Tailwind 4',
}

export type Profile = {
  label: string
  /** What the link shows, like a username or address. */
  handle: string
  url: string
}

/** Where to find me, in the order they show. */
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
