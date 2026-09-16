import { useState, useEffect } from "react"
import { LiquidButton } from "@/components/ui/LiquidButton"

export function UpdateBanner() {
  const [updateReady, setUpdateReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!window.electronAPI?.onUpdateDownloaded) return
    const cleanup = window.electronAPI.onUpdateDownloaded(() => {
      setUpdateReady(true)
    })
    return cleanup
  }, [])

  if (!updateReady || dismissed) return null

  return (
    <div className="relative z-20 flex items-center justify-between gap-3 border-b border-[var(--app-hairline)] bg-[var(--app-canvas)] px-4 py-2 text-sm">
      <span className="text-[var(--app-ink)]">
        A new version of Trace is ready.
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <LiquidButton
          onClick={() => window.electronAPI?.restartAndInstall()}
          className="text-xs"
          innerClassName="px-3 py-1"
        >
          Restart &amp; Update
        </LiquidButton>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md px-2 py-1 text-xs text-[var(--app-muted)] hover:text-[var(--app-ink)] transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
