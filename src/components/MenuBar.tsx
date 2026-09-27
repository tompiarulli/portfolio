import { Link } from '@tanstack/react-router'
import { Clock } from './Clock'
import { useWindows } from './WindowManager'

const BAR =
  'fixed top-0 z-50 flex h-[29px] items-center border-b border-(--ink) bg-(--surface) px-3 text-(length:--label-size)'

export function MenuBar() {
  const { raise } = useWindows()
  return (
    <>
      <nav className={`${BAR} left-0 border-r`}>
        <Link
          to="/system"
          preload="intent"
          onClick={() => raise('system')}
          className="flex"
          aria-label="System Info"
        >
          {/* 11x11 pixel circled i */}
          <svg
            aria-hidden
            viewBox="0 0 11 11"
            className="size-[11px]"
            shapeRendering="crispEdges"
          >
            <path
              fill="currentColor"
              d="M3 0h1v1H3zM4 0h1v1H4zM5 0h1v1H5zM6 0h1v1H6zM7 0h1v1H7zM1 1h1v1H1zM2 1h1v1H2zM8 1h1v1H8zM9 1h1v1H9zM1 2h1v1H1zM9 2h1v1H9zM0 3h1v1H0zM5 3h1v1H5zM10 3h1v1H10zM0 4h1v1H0zM10 4h1v1H10zM0 5h1v1H0zM4 5h1v1H4zM5 5h1v1H5zM10 5h1v1H10zM0 6h1v1H0zM5 6h1v1H5zM10 6h1v1H10zM0 7h1v1H0zM5 7h1v1H5zM10 7h1v1H10zM1 8h1v1H1zM4 8h1v1H4zM5 8h1v1H5zM6 8h1v1H6zM9 8h1v1H9zM1 9h1v1H1zM2 9h1v1H2zM8 9h1v1H8zM9 9h1v1H9zM3 10h1v1H3zM4 10h1v1H4zM5 10h1v1H5zM6 10h1v1H6zM7 10h1v1H7z"
            />
          </svg>
        </Link>
      </nav>
      <header className={`${BAR} right-0 border-l`}>
        <Clock />
      </header>
    </>
  )
}
