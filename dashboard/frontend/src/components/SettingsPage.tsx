import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProviders, useAuthStatus, useProxyStatus, connectProvider, disconnectProvider } from "@/hooks/useMetrics";
import { XCircle, Folder, Cloud, Lock, Eye, EyeOff, Download, Radio, Power } from "lucide-react";
import { ProviderLogo } from "./ProviderLogo";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const CLOUD_PROVIDERS = [
  {
    id: "anthropic",
    name: "Claude Code (Anthropic)",
    description: "Fetch hourly and weekly usage from Anthropic API",
  },
  {
    id: "opencode-cloud",
    name: "OpenCode Cloud",
    description: "Sync usage data from OpenCode cloud account",
  },
];

export function SettingsPage() {
	const { data: providers, isLoading } = useProviders();
	const { data: authStatus, isLoading: authLoading } = useAuthStatus();
	const { data: proxyStatus } = useProxyStatus();
	const queryClient = useQueryClient();

	const handleExport = async (format: 'json' | 'csv') => {
		try {
			const base = await getBaseUrl()
			const url = `${base}/api/export/${format}?range=all`
			if (window.electronAPI) {
				await window.electronAPI.downloadUrl(url)
			} else {
				const res = await fetch(url)
				if (!res.ok) throw new Error(`Export failed: ${res.status}`)
				const blob = await res.blob()
				const a = document.createElement('a')
				a.href = URL.createObjectURL(blob)
				a.download = `trace-export.${format}`
				a.click()
				URL.revokeObjectURL(a.href)
			}
		} catch {
			toast.error('Export failed')
		}
	}

	return (
		<div className="h-full overflow-y-auto no-scrollbar apple-scroll-fade p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
			<div className="mb-6 lg:mb-8">
				<h1 className="text-xl sm:text-2xl font-semibold text-[var(--app-ink)]">Settings</h1>
				<p className="text-sm text-[var(--app-muted)] mt-1">Configure providers and cloud sync</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* Local Providers */}
				<Card className="liquid-card p-4 rounded-[14px]">
					<CardHeader>
						<CardTitle className="text-lg font-semibold text-[var(--app-ink)]">Local Providers</CardTitle>
						<CardDescription className="text-[var(--app-muted)]">AI CLI tools detected on your system</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2 mt-4">
						{isLoading ? (
							<p className="text-sm text-[var(--app-muted)]">Scanning...</p>
						) : (
							providers?.map((provider) => (
								<div
									key={provider.id}
									className="flex items-center justify-between p-3 rounded-[10px] liquid-row hover:bg-[var(--app-soft)] transition-colors animate-fade-in"
								>
									<div className="flex items-center gap-3">
										{provider.installed ? (
											<ProviderLogo provider={provider} size="sm" />
										) : (
											<XCircle className="size-4 text-[var(--app-muted)]/65" />
										)}
										<div>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-[var(--app-ink)]">{provider.name}</span>
												{provider.installed ? (
													<Badge variant="glass-success" className="text-[10px]">Detected</Badge>
												) : (
													<Badge variant="glass-muted" className="text-[10px]">Not Found</Badge>
												)}
											</div>
											<div className="flex items-center gap-1 text-[11px] text-[var(--app-muted)] mt-0.5">
												<Folder className="size-3" />
												{provider.defaults[0]}
											</div>
										</div>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				{/* Cloud Sync */}
				<Card className="liquid-card p-4 rounded-[14px]">
					<CardHeader>
						<CardTitle className="text-lg font-semibold text-[var(--app-ink)]">Cloud Sync</CardTitle>
						<CardDescription className="text-[var(--app-muted)]">Connect accounts for real-time usage data</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-3 mt-4">
						<div className="p-4 liquid-row rounded-[10px]">
							<div className="flex items-center gap-2 mb-2">
								<Lock className="size-4 text-[var(--app-ink)]" />
								<span className="text-sm font-medium text-[var(--app-ink)]">Secure Storage</span>
							</div>
							<p className="text-xs text-[var(--app-muted)]">
								API keys are stored securely in your OS keychain. Claude Code usage can also be synced via OAuth credentials.
							</p>
						</div>

						{authLoading ? (
							<p className="text-sm text-[var(--app-muted)]">Loading...</p>
						) : (
							CLOUD_PROVIDERS.map((provider) => (
								<CloudProviderCard
									key={provider.id}
									provider={provider}
									connected={authStatus?.[provider.id]?.connected || false}
									onRefresh={() => queryClient.invalidateQueries({ queryKey: ['auth', 'status'] })}
								/>
							))
						)}
					</CardContent>
				</Card>

				{/* Ollama Proxy */}
				<Card className="liquid-card p-4 rounded-[14px]">
					<CardHeader>
						<CardTitle className="text-lg font-semibold text-[var(--app-ink)] flex items-center gap-2">
							<Radio className="size-4" />
							Ollama Proxy
						</CardTitle>
						<CardDescription className="text-[var(--app-muted)]">
							Track tokens from third-party apps (Open WebUI, Msty, scripts)
						</CardDescription>
					</CardHeader>
					<CardContent className="mt-4 space-y-3">
						<div className="flex items-center justify-between p-3 rounded-[10px] liquid-row">
							<div>
								<p className="text-sm font-medium text-[var(--app-ink)]">Proxy Status</p>
								<p className="text-[11px] text-[var(--app-muted)] mt-0.5">
									{proxyStatus?.requests_logged ?? 0} requests logged
								</p>
							</div>
							{proxyStatus?.running ? (
								<Badge variant="glass-success" className="text-[10px]">Running</Badge>
							) : (
								<Badge variant="glass-muted" className="text-[10px]">Stopped</Badge>
							)}
						</div>
						<div className="p-3 rounded-[10px] liquid-row">
							<p className="text-xs text-[var(--app-muted)]">
								Point other apps to{" "}
								<code className="font-mono bg-[var(--app-soft)] px-1 py-0.5 rounded text-[var(--app-ink)]">
									localhost:{proxyStatus?.port ?? 11435}
								</code>{" "}
								instead of{" "}
								<code className="font-mono bg-[var(--app-soft)] px-1 py-0.5 rounded text-[var(--app-ink)]">
									localhost:11434
								</code>{" "}
								to track their token usage.
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Export Data */}
				<Card className="liquid-card p-4 rounded-[14px]">
					<CardHeader>
						<CardTitle className="text-lg font-semibold text-[var(--app-ink)] flex items-center gap-2">
							<Download className="size-4" />
							Export Data
						</CardTitle>
						<CardDescription className="text-[var(--app-muted)]">
							Download your full usage history
						</CardDescription>
					</CardHeader>
					<CardContent className="mt-4 flex flex-col gap-3">
						<div className="flex gap-3">
							<LiquidButton onClick={() => handleExport('json')} className="flex-1" innerClassName="w-full px-4 py-2.5">
								Export JSON
							</LiquidButton>
							<LiquidButton onClick={() => handleExport('csv')} className="flex-1" innerClassName="w-full px-4 py-2.5">
								Export CSV
							</LiquidButton>
						</div>
						<p className="text-[11px] text-[var(--app-muted)]">
							Exports all-time data. Use the API directly for filtered ranges:<br />
							<code className="font-mono">/api/export/csv?range=week</code>
						</p>
					</CardContent>
				</Card>

				{/* General */}
				<GeneralCard />
			</div>
		</div>
	);
}

function CloudProviderCard({
	provider,
	connected,
	onRefresh,
}: {
	provider: { id: string; name: string; description: string };
	connected: boolean;
	onRefresh: () => void;
}) {
	const [key, setKey] = useState("");
	const [showKey, setShowKey] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleConnect = async () => {
		if (!key.trim()) return;
		setIsSubmitting(true);
		try {
			await connectProvider(provider.id, key.trim());
			setKey("");
			onRefresh();
			toast.success(`${provider.name} connected`);
		} catch {
			toast.error(`Failed to connect ${provider.name}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDisconnect = async () => {
		setIsSubmitting(true);
		try {
			await disconnectProvider(provider.id);
			onRefresh();
			toast.success(`${provider.name} disconnected`);
		} catch {
			toast.error(`Failed to disconnect ${provider.name}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="p-4 rounded-[10px] liquid-row">
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3">
					<Cloud className="size-4 text-[var(--app-ink)]" />
					<div>
						<p className="text-sm font-medium text-[var(--app-ink)]">{provider.name}</p>
						<p className="text-[11px] text-[var(--app-muted)]">{provider.description}</p>
					</div>
				</div>
				{connected ? (
					<Badge variant="glass-success" className="text-[10px]">Connected</Badge>
				) : (
					<Badge variant="glass-muted" className="text-[10px]">Disconnected</Badge>
				)}
			</div>

			{connected ? (
				<LiquidButton
					onClick={handleDisconnect}
					disabled={isSubmitting}
					className="text-xs disabled:opacity-50"
					innerClassName="px-3 py-1.5"
				>
					{isSubmitting ? "Disconnecting..." : "Disconnect"}
				</LiquidButton>
			) : (
				<div className="flex gap-2">
					<div className="relative flex-1">
						<input
							type={showKey ? "text" : "password"}
							value={key}
							onChange={(e) => setKey(e.target.value)}
							placeholder={`Enter ${provider.name} API key`}
							className="w-full px-3 py-1.5 pr-8 text-xs rounded-[10px] liquid-row text-[var(--app-ink)] placeholder:text-[var(--app-muted)]/60 focus:outline-none focus:border-[var(--app-ink)]"
						/>
						<button
							type="button"
							onClick={() => setShowKey(!showKey)}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-ink)]"
						>
							{showKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
						</button>
					</div>
					<LiquidButton
						onClick={handleConnect}
						disabled={isSubmitting || !key.trim()}
						className="text-xs disabled:opacity-50"
						innerClassName="px-4 py-1.5"
					>
						{isSubmitting ? "Connecting..." : "Connect"}
					</LiquidButton>
				</div>
			)}
		</div>
	);
}

function GeneralCard() {
	const [enabled, setEnabled] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const supported = typeof window !== "undefined" && !!window.electronAPI?.getLaunchAtLogin;

	useEffect(() => {
		if (!supported) return;
		window.electronAPI.getLaunchAtLogin().then((v) => {
			setEnabled(v);
			setLoaded(true);
		});
	}, [supported]);

	const toggle = async () => {
		if (!supported) return;
		const next = !enabled;
		setEnabled(next);
		try {
			const applied = await window.electronAPI.setLaunchAtLogin(next);
			setEnabled(applied);
			toast.success(applied ? "Launch at login enabled" : "Launch at login disabled");
		} catch {
			setEnabled(!next);
			toast.error("Failed to update launch setting");
		}
	};

	return (
		<Card className="liquid-card p-4 rounded-[14px]">
			<CardHeader>
				<CardTitle className="text-lg font-semibold text-[var(--app-ink)] flex items-center gap-2">
					<Power className="size-4" />
					General
				</CardTitle>
				<CardDescription className="text-[var(--app-muted)]">
					System behavior and startup
				</CardDescription>
			</CardHeader>
			<CardContent className="mt-4">
				<div className="flex items-center justify-between p-3 rounded-[10px] liquid-row">
					<div className="pr-4">
						<p className="text-sm font-medium text-[var(--app-ink)]">Launch at login</p>
						<p className="text-[11px] text-[var(--app-muted)] mt-0.5">
							Start the Trace server and menu bar widget when you log in. The main window stays hidden until you open it.
						</p>
					</div>
					<button
						role="switch"
						aria-checked={enabled}
						disabled={!supported || !loaded}
						onClick={toggle}
						className={cn(
							"relative shrink-0 w-10 h-6 rounded-full transition-colors disabled:opacity-50",
							enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
						)}
					>
						<span
							className={cn(
								"absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
								enabled && "translate-x-4"
							)}
						/>
					</button>
				</div>
			</CardContent>
		</Card>
	);
}
