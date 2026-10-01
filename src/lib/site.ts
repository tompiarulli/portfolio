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
  email: 'tom@tompiarulli.com',
  os: 'TomOS 9.2',
  builtWith: 'React 19, TanStack Start, Tailwind 4',
}

export type Profile = {
  label: string
  /** What the link shows, like a username. */
  handle: string
  url: string
}

/** Where else to find me, under the email in Contact. */
export const profiles: Profile[] = [
  {
    label: 'LinkedIn',
    handle: 'tompiarulli',
    url: 'https://www.linkedin.com/in/tompiarulli/',
  },
  { label: 'GitHub', handle: 'tomparkp', url: 'https://github.com/tomparkp' },
]
