import { useState, useEffect } from 'react'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (window.electronAPI?.onMaximized) {
      window.electronAPI.onMaximized(setIsMaximized)
    }
  }, [])

  return (
    <header
      className="flex items-center justify-between h-10 bg-white border-b border-zinc-100 select-none flex-shrink-0"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div className="flex items-center gap-2.5 pl-4">
        <span className="text-lg leading-none opacity-70">⚖</span>
        <span className="text-xs font-semibold text-zinc-500 tracking-wide">
          减重追踪
        </span>
      </div>

      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={() => window.electronAPI?.minimize()}
          className="w-10 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 11 11">
            <rect x="1" y="5" width="9" height="1.2" rx="0.6" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={() => window.electronAPI?.maximize()}
          className="w-10 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-colors"
        >
          {isMaximized ? (
            <svg width="11" height="11" viewBox="0 0 11 11">
              <rect x="2.5" y="0" width="7.5" height="7.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.1" />
              <rect x="1" y="2.5" width="7.5" height="7.5" rx="1" fill="white" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 11 11">
              <rect x="1" y="1" width="9" height="9" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          )}
        </button>
        <button
          onClick={() => window.electronAPI?.close()}
          className="w-10 h-full flex items-center justify-center text-zinc-400 hover:bg-rose-500 hover:text-white transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 11 11">
            <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  )
}
