import type { ComponentProps } from 'react'

export function Button({
  className = '',
  accent,
  ...rest
}: ComponentProps<'button'> & { accent?: boolean }) {
  return (
    <button
      type="button"
      className={`${accent ? 'bevel-accent' : 'bevel'} px-3 py-1 font-title text-[12px] tracking-tight active:bevel-pressed disabled:opacity-50 ${className}`}
      {...rest}
    />
  )
}
