declare const __BUILD__: { commit: string; date: string }

/** Git commit this build came from; injected by vite.config at build time. */
export const build = __BUILD__
