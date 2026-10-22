/** A random number from min up to max. */
export const random = (min: number, max: number) =>
  min + Math.random() * (max - min)
