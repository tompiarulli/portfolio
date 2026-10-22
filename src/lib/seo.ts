import { site } from '#/lib/site'

/** The link preview card every page shares: the desktop in the default
 *  theme, captured from the built site at 1200x630. */
export const ogImage = {
  url: new URL('/og.png', site.url).href,
  width: 1200,
  height: 630,
  alt: `${site.name}'s desktop: About and Contact windows over grey orbital rings on black`,
}

type Page = {
  /** The page's own URL path, like /contact. */
  path: string
  title: string
  description: string
  /** Keep it out of search results, and give it no canonical URL. */
  noindex?: boolean
}

/** A route's head(): title, description, canonical URL and the link preview
 *  tags that differ per page. The rest is shared, in the root route. */
export function pageHead({ path, title, description, noindex = false }: Page) {
  const url = new URL(path, site.url).href
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      ...(noindex
        ? [{ name: 'robots', content: 'noindex' }]
        : [{ property: 'og:url', content: url }]),
    ],
    links: noindex ? [] : [{ rel: 'canonical', href: url }],
  }
}
