import { Info } from 'lucide-react'
import { useState } from 'react'
import { getOAuthNotice } from '../../services/authService'

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12z"
      />
      <path
        fill="#34A853"
        d="M3.5 7.3l3.2 2.4C7.6 7.8 9.6 6.4 12 6.4c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 8.2 2.4 5 4.4 3.5 7.3z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.6c2.5 0 4.6-.8 6.2-2.2l-2.9-2.4c-.8.6-1.8 1-3.3 1-3.8 0-5.1-2.5-5.4-3.7l-3.2 2.5C5 19.7 8.2 21.6 12 21.6z"
      />
      <path
        fill="#4285F4"
        d="M21.2 14.3c0-.5-.1-.9-.1-1.3H12v3.9h5.4c-.3 1.2-1 2.2-2.1 2.8l2.9 2.4c1.7-1.6 3-4 3-7.8z"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

export function SocialAuthButtons({ actionLabel = 'Continue' }) {
  const [notice, setNotice] = useState('')

  const handleOAuthClick = (provider) => {
    setNotice(getOAuthNotice(provider))
  }

  return (
    <div>
      {/* Divider with OR */}
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="font-mono text-[11px] font-medium tracking-widest text-[#71717A] uppercase">
          OR
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleOAuthClick('Google')}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-[#080A0E] px-4 py-2.5 text-sm font-medium text-[#E4E4E7] transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white active:scale-[0.99]"
        >
          <GoogleIcon />
          <span>{actionLabel} with Google</span>
        </button>

        <button
          type="button"
          onClick={() => handleOAuthClick('GitHub')}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-[#080A0E] px-4 py-2.5 text-sm font-medium text-[#E4E4E7] transition hover:border-white/25 hover:bg-white/[0.05] hover:text-white active:scale-[0.99]"
        >
          <GitHubIcon />
          <span>{actionLabel} with GitHub</span>
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-[#B8F36B]/25 bg-[#B8F36B]/[0.07] p-3 text-xs leading-relaxed text-[#D4D4D8]"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#B8F36B]" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  )
}
