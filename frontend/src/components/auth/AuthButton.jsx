import { Loader2 } from 'lucide-react'

export function AuthButton({
  children,
  loading = false,
  loadingText = 'Please wait...',
  type = 'submit',
  disabled = false,
  onClick,
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8BFF19] px-5 py-3 text-sm font-semibold text-[#050505] shadow-[0_0_28px_rgba(139,255,25,0.28)] transition-all duration-200 hover:bg-[#9eff3d] hover:shadow-[0_0_40px_rgba(139,255,25,0.42)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-65"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
