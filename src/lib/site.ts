export const site = {
  name: 'Tom Piarulli',
  title: 'Tom Piarulli ☼',
  tagline: 'Software engineer',
  bio: 'Write a short bio here. Keep it to a few lines; the window scrolls if it must.',
  email: 'tompiarulli@gmail.com',
  os: 'TomOS 9.2',
  builtWith: 'React 19, TanStack Start, Tailwind 4',
  iconCredit: {
    name: 'Icons8 Flat Color Icons',
    url: 'https://github.com/icons8/flat-color-icons',
  },
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
