import { defineConfig } from 'checkly'
import { Frequency } from 'checkly/constructs'

// Production monitoring as code: `pnpm checkly test` dry-runs it against
// ENVIRONMENT_URL, and the release workflow deploys it after each release.
export default defineConfig({
  projectName: 'tompiarulli.com',
  logicalId: 'tompiarulli-portfolio',
  repoUrl: 'https://github.com/tompiarulli/portfolio',
  checks: {
    activated: true,
    frequency: Frequency.EVERY_10M,
    locations: ['us-east-1', 'eu-west-1'],
    tags: ['portfolio'],
    checkMatch: '__checks__/**/*.check.ts',
    ignoreDirectoriesMatch: ['node_modules/**', '.output/**', '.vercel/**'],
  },
  cli: {
    runLocation: 'us-east-1',
    retries: 1,
  },
})
