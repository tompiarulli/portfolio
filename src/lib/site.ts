import { travel } from '#/lib/travel.gen'

const version = '9.2'

export type WorkEntry = {
  company: string
  role: string
  /** Where the Work list files it: under Career, unless one of these. */
  section?: 'Side Projects' | 'Volunteering' | 'Education'
  /** What the company does, in a line. */
  about?: string
  /** First and last month, as `YYYY-MM`, or year as `YYYY` where the
   *  month isn't known. */
  start: string
  end: string
  /** The role in a sentence or two. */
  summary: string
  /** What I did there, a line each. */
  highlights: string[]
}

const NERD_STREET =
  'Esports venues, events, and camps, funded by Founders Fund, Comcast, and Five Below'

export const site = {
  url: 'https://tompiarulli.com',
  name: 'Tom Piarulli',
  title: 'Tom Piarulli ☼',
  tagline: 'Software Engineer',
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
    "I'm also a former digital nomad and 90s kid who loves travel, movies, and pop culture.",
  ],
  signoff: '- Tom',
  /** The Work window: every role, most recent first, side projects,
   *  volunteering and school among them, listed by company and read alongside, with a link
   *  under the list to the full history on LinkedIn. Roles in a row at
   *  one company share a line. */
  work: [
    {
      company: 'Nerd Street',
      role: 'Chief Technology Officer',
      about: NERD_STREET,
      start: '2023-07',
      end: '2026-09',
      summary:
        'Hands-on CTO who led architecture and development of the consumer platform, payments, and data infrastructure. The platform has powered 3,700+ events, including tournaments with Riot Games, Ubisoft, and BLAST.',
      highlights: [
        "Established a strategic plan spanning infrastructure consolidation, a new admin and CMS, BI, and a product roadmap, mapped to the company's annual priorities",
        'Rebuilt business intelligence from the ground up: Snowflake warehouse, Fivetran ETL, a custom connector for the venue PC-management system, and Hex dashboards for all-hands, board, and investor reporting',
        'Ran successive rounds of vendor and infrastructure consolidation, reducing recurring spend by $50K+ a year with no loss of product capability',
        'Built the foundation for Lobby, a multi-tenant events and ticketing platform: architecture, shared component library, draft/publish versioning, and WorkOS authentication on Next.js and Cloudflare',
        'Led an AI adoption initiative, building custom Slack agents integrated with company tools using Mastra',
      ],
    },
    {
      company: 'Nerd Street',
      role: 'Head of Platform',
      about: NERD_STREET,
      start: '2023-01',
      end: '2023-06',
      summary:
        'Took over the platform after a company restructuring and owned it end to end, running product, engineering, and DevOps across two websites, a CMS, an events platform, a mobile app, and venue integrations.',
      highlights: [
        'Audited ~30 SaaS and cloud services, took over core accounts and infrastructure, and fixed a broken CI/CD pipeline in week one',
        'Stood up a Turborepo/tRPC monorepo with shared packages and GitHub Actions deployments alongside the legacy platform, cutting deploys from 25 minutes to 40 seconds',
        'Led the move to a new support platform, re-engineering its integrations and triage process while cutting costs by over 80%',
        'Designed and launched a private-event booking funnel, bringing in 220+ requests in its first year',
        'Ran the platform through the restructuring with no downtime or significant incidents while shipping product work',
      ],
    },
    {
      company: 'Nerd Street',
      role: 'Development Lead',
      about: NERD_STREET,
      start: '2021-01',
      end: '2022-12',
      summary:
        "One of the technical leads on the web platform while Nerd Street ran Riot Games' North American VALORANT Challengers, with ~6,000 players competing across its tournaments in 2021.",
      highlights: [
        'Built tournament hubs end to end in three weeks: GraphQL schema, data model, admin with live preview, and frontend',
        'Launched the consumer app on both app stores, moving it to bare React Native and adding component, unit, and Detox end-to-end tests',
        'Optimized event page images, cutting background image sizes by 80%+ and the image CDN bill by 70%',
        "Audited the GraphQL API's access control and redesigned it around separate public and admin queries, enforced in the data layer",
        'Mentored three engineers through pairing and wrote 10 design docs on topics including data modeling and API access control',
      ],
    },
    {
      company: 'Nerd Street',
      role: 'Mobile Developer',
      about: NERD_STREET,
      start: '2020-01',
      end: '2020-12',
      summary:
        "Built the consumer mobile app for the company's gaming venues from scratch in React Native as lead mobile engineer, with a Node.js API, Stripe payments, and PC-session integration.",
      highlights: [
        'Shipped the paid-session flow to TestFlight within 8 weeks of kickoff: signup, saved cards via Stripe, time-bundle checkout, and PC unlock through the venue management system',
        "Designed the app's data layer behind custom React hooks, so a later move from REST to GraphQL needed no UI changes",
        'Built a cross-platform design system in Storybook rendering every screen on web, iOS, and Android',
        'Designed a PCI-conscious payment flow: client-side tokenization only, with all card operations server-side',
      ],
    },
    {
      company: '2028 Games Guide',
      role: 'Creator',
      section: 'Side Projects',
      about:
        'A searchable guide to every session of the 2028 Summer Games in Los Angeles',
      start: '2026-04',
      end: '2026-11',
      summary:
        'Built a guide to all 800+ sessions of the 2028 Summer Games to pick tickets in the local presale, then open-sourced it for Olympics planning communities on Reddit and Facebook.',
      highlights: [
        'Filters by sport, round, venue, and rating, with a shortlist of saved sessions and a page for each one',
        'An AI pipeline grounds each session in current news and Paris 2024 results, writes its summary, and scores it across five weighted dimensions',
        'Connects to Claude and ChatGPT, so people can ask about sessions in their own words and get linked back to the guide',
      ],
    },
    {
      company: 'III Tech',
      role: 'Senior Product Manager',
      about: 'Omnichannel delivery platform startup',
      start: '2019-07',
      end: '2020-01',
      summary:
        'Ran product and managed engineering for III Tech, a startup building a delivery platform in partnership with STIIIZY, the best-selling cannabis brand in the US.',
      highlights: [
        'Established the product process for a five-person team across two native iOS apps, an SMS ordering bot, a React web store, and a call-center CRM',
        'Ran field research with retail, hub, and delivery staff to define ordering and delivery workflows',
        'Managed pilot scope directly with the client, including data-integration boundaries and delivery and cancellation rules',
        'Owned QA and acceptance through beta: TestFlight build testing, sprint-card sign-off, and user-facing copy and flow decisions',
      ],
    },
    {
      company: 'Travel Break',
      role: 'Travel break',
      start: '2018-04',
      end: '2019-06',
      summary:
        'Traveled around the world while prototyping independent product ideas.',
      highlights: [],
    },
    {
      company: 'FS Investments',
      role: 'UX Designer, Software Consultant',
      about: 'Alternative asset manager, now Future Standard',
      start: '2017-04',
      end: '2018-03',
      summary:
        'Lead design contractor on a new alternatives trading platform at FS Investments, a $20B asset manager, from wireframes to pilots with two national broker-dealers.',
      highlights: [
        "Built coded React prototypes for the order workflow, account performance, and fund onboarding, used to debut the platform at a broker-dealer's home office",
        'Designed the UI for a ~300-screen platform, producing the phased mockups the engineering teams built from',
        "Designed and ran the team's design-sprint process, facilitating five sprints with 20+ expert interviews",
        'Co-authored the product roadmap with the digital strategy director and the CIO',
      ],
    },
    {
      company: 'Sinq Technologies',
      role: 'Lead Software Architect',
      about: 'Home care visit and caregiver management startup',
      start: '2015-04',
      end: '2017-04',
      summary:
        "Built Sinq's platform from prototype to a live pilot with BAYADA, one of the world's largest home health providers. Sinq later became part of CareBridge, which Elevance Health bought for a reported $2.7B.",
      highlights: [
        'Shipped the HIPAA-compliant pilot end to end in 5 months: native iOS app, Ruby on Rails API on PostgreSQL, and admin portal, with offline support, GPS-verified check-ins, and Spanish localization',
        'Owned data integrations and security reviews with BAYADA and Horizon BCBS NJ, and presented the platform to NJ Medicaid leadership',
        "Led the platform's expansion beyond the pilot: multi-tenant backend, React Native, a React web portal, Node/GraphQL services, and a phone-based fallback for caregivers without smartphones",
        'Recruited and led a five-person distributed engineering team',
      ],
    },
    {
      company: 'AMMO',
      role: 'Full Stack Developer, UX Designer',
      start: '2015-01',
      end: '2015-06',
      summary:
        "Sole designer and developer on the redesign of The World Bank's WDR 2015 iPad app, covering client collaboration, research, UX design, and Objective-C development.",
      highlights: [
        'Refreshed the UI to modern iOS standards with targeted improvements to navigation and browsing',
        'Overhauled the legacy Objective-C codebase for performance and maintainability; later editions of the app were built on it',
        "Ran the client loop directly with the World Bank's product owner through beta, QA, and App Store submission",
      ],
    },
    {
      company: 'CocoaLove',
      role: 'Co-Organizer',
      section: 'Volunteering',
      about: 'An indie Apple developer conference in Philadelphia',
      start: '2014',
      end: '2016',
      summary:
        'Co-organized three annual conferences, volunteer-run and homegrown out of the Philly CocoaHeads meetup. Our 2014 tagline was "A conference about people, not tech."',
      highlights: [
        'Built the conference website each year',
        'Organized six conference "adventures" in 2016: hand-picked group activities that let attendees explore Philadelphia together in the off-hours',
      ],
    },
    {
      company: 'Philly CocoaHeads',
      role: 'Co-Organizer',
      section: 'Volunteering',
      about: "Philadelphia's Apple developer meetup",
      start: '2014',
      end: '2016',
      summary:
        "Ran the meetup's monthly side project sessions, mentoring developers on their own apps.",
      highlights: [],
    },
    {
      company: 'THON',
      role: 'Volunteer',
      section: 'Volunteering',
      about: "Penn State's student-run dance marathon for children with cancer",
      start: '2006',
      end: '2011',
      summary:
        'Raised money for children with cancer on canning trips throughout college, and was elected a THON dancer.',
      highlights: [],
    },
    {
      company: 'Freelance',
      role: 'Software Consultant',
      start: '2013-03',
      end: '2015-01',
      summary:
        'Ran an independent design and development practice for startups and small businesses, handling UX, design, and engineering as a one-person product team.',
      highlights: [
        'Designed and built responsive web apps and marketing sites in HTML, CSS, JavaScript, and AngularJS',
        'Built custom Ruby on Rails applications with third-party API integrations, including Instagram video ingestion and public voting',
        'Developed native iOS apps, both greenfield and overhauls of inherited codebases',
        'Led UX and UI design across onboarding, billing, e-commerce, and map-based search flows',
      ],
    },
    {
      company: 'KPMG',
      role: 'Associate, IT Advisory',
      about: 'Big Four professional services firm',
      start: '2011-07',
      end: '2013-03',
      summary:
        'Ran security testing and IT controls reviews across 16 engagements for a dozen clients in energy, financial services, healthcare, and real estate, earning multiple Encore awards.',
      highlights: [
        'Ran penetration tests and phishing simulations for clients including a nuclear energy company and a Federal Home Loan Bank',
        'Delivered IT controls reviews, including two SOX audits, an access-control assessment, and a disaster recovery planning review',
        "Selected and set up Dradis Pro as the team's penetration-test collaboration and reporting platform",
      ],
    },
    {
      company: 'Penn State',
      role: 'B.S., Security and Risk Analysis',
      section: 'Education',
      about: 'Minors in Political Science and Global Security',
      start: '2006',
      end: '2011',
      summary:
        'Bachelor of Science in Security and Risk Analysis, with minors in Political Science and Global Security.',
      highlights: [
        'Man of the Year, Penn State Greek Life (2011), awarded each year to one of 5,000+ members; the citation recognized student safety reforms and community leadership',
        'President of Phi Kappa Tau and of the Order of Omega honor society, and VP of Risk Management for the Interfraternity Council',
        'Member of the Skull & Bones honor society',
      ],
    },
  ] satisfies WorkEntry[],
  /** Before the link to LinkedIn under the Work list. */
  workLink: 'Connect on',
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
    /** Steamboat's end card, as it shuts down. */
    end: 'The End',
    /** OUTATIME's fuel gauge, running dry as it shuts down: its label,
     *  its warning lamp, and the marks at either end. */
    fuel: { label: 'Fuel', empty: 'Empty', low: 'E', high: 'F' },
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
  /** The clip, an MP4 with no sound track, or a photo: its path under
   *  `travel/`, like `stanley/stanley-01.mp4`. */
  src: string
  /** A photo, not a video: it holds the screen for a few seconds of play,
   *  like a brief clip of the feed. */
  still?: boolean
  /** A still to show while a video loads. */
  poster?: string
  /** What the player's strip calls it, like `sardegna_1993.mp4`; else
   *  the file's own name. */
  name?: string
}

export type Channel = {
  /** The place, as the screen and the channel list name it. */
  place: string
  /** Where it is, freeform: a town and state, a country. */
  region: string
  /** What the place is, a paragraph per string, for the player's Info
   *  panel; without it, Info is off. */
  about?: string[]
  /** Where it was shot, in degrees, for the readouts some themes put on
   *  screen: north and east positive. */
  lat: number
  lon: number
  /** Its clips, dealt in a random order and round again: the ones
   *  `scripts/travel.mjs` made, from `travel` by the channel's folder
   *  name. With none, the channel shows a test card. */
  clips: Clip[]
}

/** The Player's channels, one per place, in the order they're tuned.
 *  Placeholders, but for the first, until their footage is in. */
export const channels: Channel[] = [
  {
    place: 'The Stanley Hotel',
    region: 'Estes Park, CO',
    about: [
      'A Colonial Revival hotel opened in 1909 by Freelan Oscar Stanley, of the Stanley Steamer, at the edge of the Rockies above Estes Park.',
      'Stephen King spent a night in room 217 in 1974, with the hotel all but empty at the end of the season, and left with the idea for The Shining. It leans into that now, ghost tours and all.',
    ],
    lat: 40.38,
    lon: -105.52,
    clips: travel.stanley ?? [],
  },
  { place: 'Lisbon', region: 'Portugal', lat: 38.72, lon: -9.14, clips: [] },
  { place: 'Kyoto', region: 'Japan', lat: 35.01, lon: 135.77, clips: [] },
  {
    place: 'Mexico City',
    region: 'Mexico',
    lat: 19.43,
    lon: -99.13,
    clips: [],
  },
]
