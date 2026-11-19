export function AuthInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  error,
  icon: Icon,
  disabled = false,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium tracking-wide text-[#D4D4D8]"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#71717A] transition-colors"
          />
        )}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-[#080A0E] py-3 text-sm text-white placeholder-[#52525B] transition-all duration-200 focus:outline-none ${
            Icon ? 'pr-4 pl-10' : 'px-4'
          } ${
            error
              ? 'border-red-500/70 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
              : 'border-white/10 hover:border-white/20 focus:border-[#8BFF19]/70 focus:ring-2 focus:ring-[#8BFF19]/20'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        />
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  )
}
