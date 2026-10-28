import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// jsdom has neither. Components only ask for prefers-reduced-motion and
// watch their own size, so a never-matching query and a silent observer do.
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: ResizeObserverMock,
})

// Nor these. Windows fly into the dock with the Web Animations API, the
// terminal scrolls its prompt into view and the router restores scroll on
// navigation; an animation that ends at once and scrolls that do nothing
// are enough.
window.scrollTo = () => {}
Element.prototype.getAnimations ??= () => []
Element.prototype.animate ??= () =>
  ({
    finished: Promise.resolve(),
    playbackRate: 1,
    cancel: () => {},
  }) as unknown as Animation
Element.prototype.scrollIntoView ??= () => {}

// Nor video playback. The Travel player plays and pauses its clips; a
// play that starts at once and a pause that does nothing are enough.
HTMLMediaElement.prototype.play = () => Promise.resolve()
HTMLMediaElement.prototype.pause = () => {}
