export const site = {
  name: 'Tom Piarulli',
  title: 'Tom Piarulli ☼',
  tagline: 'Software engineer',
  email: 'tompiarulli@gmail.com',
  os: 'TomOS 9.2',
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
