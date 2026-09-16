import { useState } from "react";
import { Cloud, LogOut, RefreshCw, CheckCircle } from "lucide-react";
import { useCloudAccount } from "@/hooks/useMetrics";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { LiquidCard } from "@/components/ui/LiquidCard";

const CLOUD_LOGIN_URL = import.meta.env.VITE_TRACE_CLOUD_URL
  ? `${import.meta.env.VITE_TRACE_CLOUD_URL}/auth/login`
  : "https://trace.monostack.in/auth/login";

export function AccountPage() {
	const { data: account, isLoading } = useCloudAccount();
	const [isBusy, setIsBusy] = useState(false);
	const queryClient = useQueryClient();

	const handleLogin = () => {
		if (window.electronAPI?.openCloudLogin) {
			window.electronAPI.openCloudLogin(CLOUD_LOGIN_URL);
		} else {
			window.open(CLOUD_LOGIN_URL, "_blank");
		}
	};

	const handleLogout = async () => {
		setIsBusy(true);
		try {
			await api.post("/api/cloud/logout", {});
			queryClient.invalidateQueries({ queryKey: ["cloud", "account"] });
			toast.success("Logged out of Trace Cloud");
		} catch {
			toast.error("Logout failed");
		} finally {
			setIsBusy(false);
		}
	};

	const handleSync = async () => {
		setIsBusy(true);
		try {
			await api.post("/api/cloud/sync", {});
			toast.success("Sync triggered");
		} catch {
			toast.error("Sync failed");
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<div className="h-full overflow-y-auto no-scrollbar apple-scroll-fade p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
			<div className="mb-6 lg:mb-8">
				<h1 className="text-xl sm:text-2xl font-semibold text-[var(--app-ink)]">Account</h1>
				<p className="text-sm text-[var(--app-muted)] mt-1">Manage your Trace Cloud connection</p>
			</div>

			<LiquidCard className="p-6" height="h-auto">
				{isLoading ? (
					<p className="text-sm text-[var(--app-muted)]">Loading…</p>
				) : account?.logged_in ? (
					<div className="space-y-4">
						<div className="flex items-start justify-between">
							<div className="flex items-center gap-3">
								<div className="size-10 rounded-full bg-[var(--app-ink)] flex items-center justify-center">
									<Cloud className="size-5 text-[var(--app-canvas)]" />
								</div>
								<div>
									<p className="text-sm font-semibold text-[var(--app-ink)]">{account.name || "Trace Cloud"}</p>
									<p className="text-xs text-[var(--app-muted)]">{account.email ?? ""}</p>
								</div>
							</div>
							<Badge className="bg-[var(--app-ink)] text-[var(--app-canvas)] hover:bg-[var(--app-ink)] text-[10px] flex items-center gap-1">
								<CheckCircle className="size-3" />
								Connected
							</Badge>
						</div>

						<div className="flex gap-2 pt-2">
							<LiquidButton
								onClick={handleSync}
								disabled={isBusy}
								className="text-xs disabled:opacity-50"
								innerClassName="px-4 py-1.5"
							>
								<RefreshCw className="size-3" />
								{isBusy ? "Syncing…" : "Sync now"}
							</LiquidButton>
							<LiquidButton
								onClick={handleLogout}
								disabled={isBusy}
								className="text-xs disabled:opacity-50"
								innerClassName="px-4 py-1.5"
								textColor="var(--app-muted)"
							>
								<LogOut className="size-3" />
								{isBusy ? "Logging out…" : "Logout"}
							</LiquidButton>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center gap-4 py-6 text-center">
						<div className="size-14 rounded-2xl liquid-row flex items-center justify-center">
							<Cloud className="size-7 text-[var(--app-muted)]" />
						</div>
						<div>
							<p className="text-sm font-semibold text-[var(--app-ink)]">Connect to Trace Cloud</p>
							<p className="text-xs text-[var(--app-muted)] mt-1 max-w-xs">
								Sync your usage data to the cloud to access it from the web dashboard and across devices.
							</p>
						</div>
						<LiquidButton onClick={handleLogin} innerClassName="px-6 py-2">
							Login with Trace Cloud
						</LiquidButton>
					</div>
				)}
			</LiquidCard>
		</div>
	);
}
