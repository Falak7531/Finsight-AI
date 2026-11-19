export function Logo({ className = '', showText = true }) {
  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E110D] ring-1 ring-[#8BFF19]/30 shadow-[0_0_18px_rgba(139,255,25,0.16)]">
        <svg
          width="20"
          height="20"
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4.5 18C8.1 11.7 12.8 8.8 18 8.8C23.2 8.8 27.9 11.7 31.5 18C27.9 24.3 23.2 27.2 18 27.2C12.8 27.2 8.1 24.3 4.5 18Z"
            stroke="#8BFF19"
            strokeOpacity="0.45"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M10 21L15 16L18.8 19.2L25.5 12.5"
            stroke="#8BFF19"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="25.5" cy="12.5" r="2.3" fill="#8BFF19" />
        </svg>
      </span>
      {showText && (
        <span className="font-display text-[1.1rem] font-bold tracking-tight text-white">
          Fin<span className="text-[#8BFF19]">Sight</span>
        </span>
      )}
    </span>
  )
}
