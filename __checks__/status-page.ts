import {
  StatusPageV3,
  StatusPageV3AutomationRule,
  StatusPageV3Component,
} from 'checkly/constructs'

// A public status page for the README to link to; checks tagged
// 'portfolio' report into it.
const page = new StatusPageV3('status', {
  name: 'tompiarulli.com',
  url: 'tompiarulli',
  defaultTheme: 'AUTO',
})

const website = new StatusPageV3Component('website', {
  statusPage: page,
  name: 'Website',
  displayOrder: 0,
})

// A failing check tagged 'portfolio' opens an incident on the page.
new StatusPageV3AutomationRule('website-down', {
  statusPage: page,
  name: 'Website down',
  firstUpdate: "The site isn't loading right now. Looking into it.",
  lastUpdate: 'The site is back up.',
  tags: ['portfolio'],
  components: [{ component: website, targetImpact: 'MAJOR_OUTAGE' }],
})
