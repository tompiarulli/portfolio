import { EmailAlertChannel } from 'checkly/constructs'

/** The site checks run against: production, or a preview passed in as
 *  ENVIRONMENT_URL by `checkly test`. */
export const SITE = process.env.ENVIRONMENT_URL ?? 'https://tompiarulli.com'

export const email = new EmailAlertChannel('email-tom', {
  address: 'tom@tompiarulli.com',
  sendFailure: true,
  sendRecovery: true,
  sslExpiry: true,
})
