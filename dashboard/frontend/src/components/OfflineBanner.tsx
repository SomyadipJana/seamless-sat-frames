import { useServerStore } from '@/stores/serverStore'

export function OfflineBanner() {
	const status = useServerStore((s) => s.status)
	if (status === 'online') return null
	return (
		<div className="flex items-center gap-2 px-4 py-2 text-xs bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400">
			<span className="size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
			{status === 'connecting'
				? 'Connecting to Trace server…'
				: 'Trace server offline — data may be stale'}
		</div>
	)
}
