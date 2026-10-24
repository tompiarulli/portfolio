import { Engine, Frequency, PlaywrightCheck } from 'checkly/constructs'

import { SITE, email } from './site'

// The same Playwright smoke tests CI runs, tagged @smoke, against the live
// site: the desktop loads with its windows, the dock and menu open windows,
// unknown URLs get File Not Found with a 404, and nothing logs an error or
// trips the Content Security Policy.
new PlaywrightCheck('smoke', {
  name: 'Desktop smoke tests',
  playwrightConfigPath: '../playwright.config.ts',
  pwProjects: ['chromium'],
  pwTags: ['@smoke'],
  installCommand: 'pnpm install --frozen-lockfile',
  engine: Engine.node('24'),
  frequency: Frequency.EVERY_30M,
  locations: ['us-east-1'],
  alertChannels: [email],
  environmentVariables: [{ key: 'ENVIRONMENT_URL', value: SITE }],
})
