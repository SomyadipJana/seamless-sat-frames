import { useRef, useState } from "react";
import { User, Shield, Zap, BarChart3, Flame, Pencil, Camera, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useMetrics, useProviders, useStreak, useModels } from "@/hooks/useMetrics";
import { ProviderLogo } from "./ProviderLogo";
import { ModelBadge } from "./ModelBadge";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { LiquidCard } from "@/components/ui/LiquidCard";
import { extractModelName } from "@/lib/modelName";
import { getStoredProfile, setStoredProfile } from "./OnboardingPage";

export function ProfilePage() {
	const { data: metrics } = useMetrics("all");
	const { data: providers } = useProviders();
	const { data: streak } = useStreak(12);
	const { data: models } = useModels("all");

	const [profile, setProfile] = useState(() => getStoredProfile());
	const [editing, setEditing] = useState(false);
	const [draftName, setDraftName] = useState(profile.name);
	const [draftAvatar, setDraftAvatar] = useState<string | null>(profile.avatar);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const startEdit = () => {
		setDraftName(profile.name);
		setDraftAvatar(profile.avatar);
		setEditing(true);
	};

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => setDraftAvatar(ev.target?.result as string);
		reader.readAsDataURL(file);
	};

	const saveProfile = () => {
		const next = { name: draftName.trim() || "Trace User", avatar: draftAvatar };
		setStoredProfile(next);
		setProfile(next);
		setEditing(false);
		toast.success("Profile updated");
	};

	const detectedProviders = providers?.filter((p) => p.installed) || [];
	const topModels = (models || []).slice(0, 6);
	const streakDays = streak?.days || [];
	const longestStreak = streakDays.reduce(
		(acc, day) => {
			if (day.count > 0) {
				acc.current++;
				acc.longest = Math.max(acc.longest, acc.current);
			} else {
				acc.current = 0;
			}
			return acc;
		},
		{ current: 0, longest: 0 }
	).longest;

	return (
		<div className="h-full overflow-y-auto no-scrollbar apple-scroll-fade p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
			{/* Hero profile band */}
			<div className="mb-6 lg:mb-8">
			<LiquidCard className="relative p-6 sm:p-8" height="h-auto">
				{!editing && (
					<LiquidButton onClick={startEdit} className="absolute top-4 right-4 text-xs" innerClassName="px-3 py-1.5">
						<Pencil className="size-3.5" />
						Edit
					</LiquidButton>
				)}
				<div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
					<div className="relative shrink-0">
						<div className="size-24 rounded-2xl overflow-hidden border-2 border-[var(--app-hairline)] bg-[var(--app-soft)] flex items-center justify-center">
							{(editing ? draftAvatar : profile.avatar) ? (
								<img src={(editing ? draftAvatar : profile.avatar) as string} alt={profile.name} className="size-full object-cover" />
							) : (
								<User className="size-9 text-[var(--app-muted)]" />
							)}
						</div>
						{editing && (
							<button
								onClick={() => fileInputRef.current?.click()}
								className="absolute -bottom-2 -right-2 inline-flex items-center justify-center size-8 rounded-lg border border-[var(--app-hairline)] bg-[var(--app-canvas)] text-[var(--app-ink)] hover:bg-[var(--app-soft)] transition-colors"
								aria-label="Change photo"
							>
								<Camera className="size-4" />
							</button>
						)}
						<input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
					</div>

					<div className="min-w-0 flex-1">
						<p className="text-[11px] font-medium tracking-[0.14em] text-[var(--app-muted)]">Your profile</p>
						{editing ? (
							<div className="mt-2 flex flex-col gap-3">
								<input
									type="text"
									value={draftName}
									onChange={(e) => setDraftName(e.target.value)}
									placeholder="Your name"
									autoFocus
									className="w-full max-w-sm rounded-lg border border-[var(--app-hairline)] bg-[var(--app-soft)] px-3 py-2 text-lg font-medium text-[var(--app-ink)] placeholder:text-[var(--app-muted)] outline-none focus:border-[var(--app-muted)]"
								/>
								<div className="flex items-center gap-2">
									<LiquidButton onClick={saveProfile} className="text-sm" innerClassName="px-3.5 py-2">
										<Check className="size-4" />
										Save
									</LiquidButton>
									<LiquidButton onClick={() => setEditing(false)} className="text-sm" innerClassName="px-3.5 py-2">
										<X className="size-4" />
										Cancel
									</LiquidButton>
								</div>
							</div>
						) : (
							<>
								<h1 className="font-display text-2xl sm:text-3xl lg:text-3xl leading-[1.05] tracking-tight mt-1 text-[var(--app-ink)] [overflow-wrap:anywhere]">
									{profile.name || "Trace User"}
								</h1>
								<p className="mt-2 text-sm text-[var(--app-muted)]">
									A local, private summary of your AI coding usage.
								</p>
							</>
						)}
					</div>
				</div>
			</LiquidCard>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 lg:mb-8">
				<ProfileStat index={0} icon={<BarChart3 className="size-4 text-[var(--app-ink)]" />} label="Total Requests" value={metrics?.total_requests?.toLocaleString() || "0"} />
				<ProfileStat index={1} icon={<Zap className="size-4 text-[var(--app-ink)]" />} label="Total Tokens" value={metrics ? `${((metrics.input_tokens + metrics.output_tokens) / 1000).toFixed(1)}k` : "0"} />
				<ProfileStat index={2} icon={<Flame className="size-4 text-[var(--app-ink)]" />} label="Longest Streak" value={`${longestStreak}d`} />
				<ProfileStat index={3} icon={<Shield className="size-4 text-[var(--app-ink)]" />} label="Providers" value={detectedProviders.length.toString()} />
			</div>

			{/* Top Models */}
			<div className="mb-6">
			<LiquidCard index={4} className="p-5 sm:p-6">
				<h3 className="text-base sm:text-lg font-semibold text-[var(--app-ink)] mb-4">Most-Used Models</h3>
				{topModels.length === 0 ? (
					<p className="text-sm text-[var(--app-muted)]">No model usage yet.</p>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{topModels.map((m) => (
							<div
								key={`${m.source}-${m.model}`}
								className="flex items-center gap-3 p-3 liquid-row rounded-lg"
							>
								<ModelBadge model={m.model} source={m.source} size="lg" />
								<div className="min-w-0">
									<p className="text-sm font-medium text-[var(--app-ink)] truncate">{extractModelName(m.model)}</p>
									<p className="text-[11px] text-[var(--app-muted)]">
										{m.request_count.toLocaleString()} req · ${m.cost.toFixed(2)}
									</p>
								</div>
							</div>
						))}
					</div>
				)}
			</LiquidCard>
			</div>

			{/* Connected Providers */}
			<LiquidCard index={5} className="p-5 sm:p-6">
				<h3 className="text-base sm:text-lg font-semibold text-[var(--app-ink)] mb-4">Connected Providers</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{detectedProviders.length === 0 ? (
						<p className="text-sm text-[var(--app-muted)]">No providers detected yet.</p>
					) : (
						detectedProviders.map((provider) => (
							<div
								key={provider.id}
								className="flex items-center gap-3 p-3 liquid-row rounded-lg"
							>
								<ProviderLogo provider={provider} size="md" />
								<div className="min-w-0">
									<p className="text-sm font-medium text-[var(--app-ink)] capitalize">{provider.name}</p>
									<p className="text-[11px] text-[var(--app-muted)] truncate">{provider.defaults[0]}</p>
								</div>
							</div>
						))
					)}
				</div>
			</LiquidCard>
		</div>
	);
}

function ProfileStat({ icon, label, value, index }: { icon: React.ReactNode; label: string; value: string; index: number }) {
	return (
		<LiquidCard index={index} className="p-4">
			<div className="flex items-center gap-2 text-[var(--app-muted)] mb-1">
				<span className="inline-flex items-center justify-center size-7 rounded-md liquid-row">
					{icon}
				</span>
				<span className="text-[10px] sm:text-xs font-medium uppercase tracking-wide">{label}</span>
			</div>
			<p className="text-xl sm:text-2xl font-semibold text-[var(--app-ink)] mt-2">{value}</p>
		</LiquidCard>
	);
}
