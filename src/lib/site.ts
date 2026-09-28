export const site = {
  name: 'Tom Piarulli',
  title: 'Tom Piarulli ☼',
  tagline: 'Software engineer',
  letter: [
    'Welcome to my small corner of the internet.',
    "I'm a software developer with 15+ years experience across engineering, product, and design. Currently I run technology for Nerd Street, a national network of esports venues and camps.",
    "I'm also a former digital nomad and 90s kid with a deep love of travel, movies, and pop culture.",
  ],
  signoff: '- Tom',
  email: 'tompiarulli@gmail.com',
  os: 'TomOS 9.2',
  builtWith: 'React 19, TanStack Start, Tailwind 4',
  player: 'No videos yet.',
  blog: 'No posts yet.',
  albums: 'No albums yet.',
}

export type Project = {
  slug: string
  name: string
  year: string
  blurb: string
  stack: string[]
  url?: string
}

export const projects: Project[] = [
  {
    slug: 'example-one',
    name: 'Example Project',
    year: '2026',
    blurb: 'Replace me in src/lib/site.ts.',
    stack: ['React', 'TanStack Start', 'Vercel'],
    url: 'https://example.com',
  },
]
