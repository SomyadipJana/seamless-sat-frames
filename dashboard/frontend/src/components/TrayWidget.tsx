import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { useClaudeUsage, useQuota, useModels, useTrends, type QuotaLimit } from '@/hooks/useMetrics'
import { useThemeStore } from '@/stores/themeStore'
import { ModelBadge } from '@/components/ModelBadge'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { extractModelName } from '@/lib/modelName'
import { cn } from '@/lib/utils'

// Apply dark/light class without triggering a broadcast back to main window.
function applyThemeClass(resolved: 'light' | 'dark') {
  const root = document.documentElement
  if (resolved === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

const trendConfig = {
  input: { label: 'Input', color: '#71717a' },
  output: { label: 'Output', color: '#b8b8b8' },
} satisfies ChartConfig

function fmtCost(n: number): string {
  return n < 0.01 ? '<$0.01' : `$${n.toFixed(2)}`
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

// Compact reset countdown: "4h 25m", "4d 19h", "soon".
function fmtCountdown(iso?: string): string {
  if (!iso) return '—'
  const diff = new Date(iso).getTime() - Date.now()
  if (Number.isNaN(diff) || diff <= 0) return 'soon'
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) {
    const rh = hours % 24
    return rh > 0 ? `${days}d ${rh}h` : `${days}d`
  }
  if (hours > 0) {
    const rm = minutes % 60
    return rm > 0 ? `${hours}h ${rm}m` : `${hours}h`
  }
  return `${minutes}m`
}

// "claude-sonnet-4-6" → "Claude Sonnet 4.6", "gpt-4o" → "GPT 4o".
function prettyModel(model: string): string {
  return extractModelName(model)
    .replace(/(\d)[-_](\d)/g, '$1.$2')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => {
      const lw = w.toLowerCase()
      if (lw === 'gpt') return 'GPT'
      if (lw === 'ai') return 'AI'
      if (lw === 'llm') return 'LLM'
      if (/^\d/.test(w)) return w
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(' ')
}

function barColor(pct: number): string {
  if (pct >= 90) return 'bg-red-400'
  if (pct >= 70) return 'bg-amber-400'
  return 'bg-emerald-400'
}

export function TrayWidget() {
  const initTheme = useThemeStore((s) => s.init)
  const dark = useThemeStore((s) => s.resolved) === 'dark'
  const setThemeState = useThemeStore.setState
  const queryClient = useQueryClient()

  const { data: usage } = useClaudeUsage()
  const { data: quotas } = useQuota()
  const { data: models } = useModels('today')
  const { data: trends } = useTrends('today', false)

  useEffect(() => { initTheme() }, [initTheme])

  // Listen for theme broadcasts from the main window and apply them here.
  useEffect(() => {
    const unsub = window.electronAPI?.onThemeChanged?.((mode, resolved, accent) => {
      applyThemeClass(resolved as 'light' | 'dark')
      setThemeState({ mode: mode as 'light' | 'dark' | 'system', resolved: resolved as 'light' | 'dark', accent })
    })
    return () => unsub?.()
  }, [setThemeState])

  // Force refetch whenever the tray window becomes visible — intervals pause
  // while the window is hidden, so a freshly-shown widget can show stale data.
  useEffect(() => {
    const unsub = window.electronAPI?.onTrayShown?.(() => {
      queryClient.invalidateQueries()
    })
    return () => unsub?.()
  }, [queryClient])

  // Collapse per-source trend rows into one input/output series per time bucket.
  const trendData = useMemo(() => {
    const byBucket = new Map<string, { bucket: string; input: number; output: number }>()
    for (const t of trends ?? []) {
      const e = byBucket.get(t.bucket) ?? { bucket: t.bucket, input: 0, output: 0 }
      e.input += t.input_tokens
      e.output += t.output_tokens
      byBucket.set(t.bucket, e)
    }
    return Array.from(byBucket.values())
  }, [trends])

  // Report rendered content height so the frameless tray window wraps it
  // exactly — no scrollbar, no empty transparent gap below the panel.
  const rootRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const report = () => window.electronAPI?.resizeTrayWidget?.(el.getBoundingClientRect().height)
    report()
    const ro = new ResizeObserver(report)
    ro.observe(el)
    return () => ro.disconnect()
  })

  const muted = dark ? 'text-white/40' : 'text-zinc-400'
  const strong = dark ? 'text-white/85' : 'text-zinc-700'
  const mid = dark ? 'text-white/70' : 'text-zinc-600'

  const claudeQuota = quotas?.find((q) => q.provider === 'claude')
  const findLimit = (id: string) => claudeQuota?.limits.find((l) => l.id === id)
  const windows: { label: string; limit: QuotaLimit }[] = [
    { id: 'rolling', label: '5-hour' },
    { id: 'weekly', label: 'Weekly' },
  ]
    .map((w) => {
      const limit = findLimit(w.id)
      return limit ? { label: w.label, limit } : null
    })
    .filter((w): w is { label: string; limit: QuotaLimit } => w !== null)

  const topModels = (models ?? []).slice(0, 3)

  return (
    <div ref={rootRef} className="px-4  pb-6">
      <div
        className={cn(
          'rounded-xl px-4 py-2.5 w-[272px] select-none border backdrop-blur-xl',
          'shadow-[0_10px_30px_-6px_rgba(0,0,0,0.45),0_2px_8px_-2px_rgba(0,0,0,0.3)]',
          dark
            ? 'bg-[#2b2b2d]/95 border-white/[0.08]'
            : 'bg-[#f6f6f6]/95 border-black/[0.08]'
        )}
      >

        {/* Header */}
        <div className="flex items-center gap-2 mb-2.5">
          <img src={`${import.meta.env.BASE_URL}logos/claude.svg`} alt="Claude" className="size-4" />
          <span className={cn('text-xs font-semibold liquid-text', strong)}>Claude usage</span>
     
        </div>

        {/* Window table */}
        {windows.length > 0 ? (
          <div className="space-y-1.5">
            <div className={cn('grid grid-cols-[3.25rem_1fr_3.5rem] items-center gap-2 text-[10px] uppercase tracking-wide', muted)}>
              <span>Window</span>
              <span>Share</span>
              <span className="text-right">Resets</span>
            </div>
            {windows.map(({ label, limit }) => {
              const pct = Math.min(Math.max(limit.utilization, 0), 100)
              return (
                <div key={label} className="grid grid-cols-[3.25rem_1fr_3.5rem] items-center gap-2">
                  <span className={cn('text-xs font-medium', strong)}>{label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', barColor(pct))}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={cn('text-[11px] tabular-nums w-9 text-right', mid)}>{pct.toFixed(0)}%</span>
                  </div>
                  <span className={cn('text-[11px] tabular-nums text-right', muted)}>{fmtCountdown(limit.resets_at)}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className={cn('text-xs', muted)}>Window usage unavailable</p>
        )}

        {/* Divider */}
        <div className={cn('border-t -mx-4 my-2.5', dark ? 'border-white/[0.08]' : 'border-black/[0.08]')} />

        {/* This week */}
        <div className="flex items-center justify-between">
          <span className={cn('text-xs', dark ? 'text-white/50' : 'text-zinc-400')}>This week</span>
          <span className={cn('text-xs tabular-nums', mid)}>
            {usage ? <>{usage.weekly.tokens.toLocaleString()} tokens &nbsp;|&nbsp;{fmtCost(usage.weekly.cost)}</> : '—'}
          </span>
        </div>

        {/* Usage trend (today) */}
        {trendData.length > 1 && (
          <>
            <div className={cn('border-t -mx-4 my-2.5', dark ? 'border-white/[0.08]' : 'border-black/[0.08]')} />
            <p className={cn('text-[10px] uppercase tracking-wide mb-1.5', muted)}>Usage today</p>
            <ChartContainer config={trendConfig} className="aspect-auto h-20 w-full">
              <AreaChart data={trendData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="trayFillInput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-input)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-input)" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="trayFillOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-output)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-output)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal vertical={false} strokeOpacity={0.15} />
                <XAxis dataKey="bucket" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" hideLabel />} />
                <Area dataKey="input" type="natural" stackId="a" stroke="var(--color-input)" fill="url(#trayFillInput)" strokeWidth={1.5} />
                <Area dataKey="output" type="natural" stackId="a" stroke="var(--color-output)" fill="url(#trayFillOutput)" strokeWidth={1.5} />
              </AreaChart>
            </ChartContainer>
          </>
        )}

        {/* Top models today */}
        {topModels.length > 0 && (
          <>
            <div className={cn('border-t -mx-4 my-2.5', dark ? 'border-white/[0.08]' : 'border-black/[0.08]')} />
            <p className={cn('text-[10px] uppercase tracking-wide mb-2', muted)}>Top models today</p>
            <div className="space-y-2">
              {topModels.map((m) => (
                <div key={`${m.source}-${m.model}`} className="flex items-center gap-2">
                  <ModelBadge model={m.model} source={m.source} size="sm" />
                  <span className={cn('text-xs font-medium truncate min-w-0', strong)} title={m.model}>
                    {prettyModel(m.model)}
                  </span>
                  <span className={cn('text-[11px] tabular-nums shrink-0 ml-auto', muted)}>
                    {fmtTokens(m.input_tokens + m.output_tokens)}&nbsp;·&nbsp;{fmtCost(m.cost)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
