import { useState, useRef, useEffect } from "react";
import { useSystemUser } from "@/hooks/useMetrics";
import { Camera, ArrowRight } from "lucide-react";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { cn } from "@/lib/utils";

const ONBOARDED_KEY = "trace-onboarded";
const USER_NAME_KEY = "trace-user-name";
const USER_AVATAR_KEY = "trace-user-avatar";

export function isOnboarded(): boolean {
	return localStorage.getItem(ONBOARDED_KEY) === "true";
}

export function getStoredProfile(): { name: string; avatar: string | null } {
	return {
		name: localStorage.getItem(USER_NAME_KEY) || "",
		avatar: localStorage.getItem(USER_AVATAR_KEY),
	};
}

export function setStoredProfile(profile: { name: string; avatar: string | null }) {
	localStorage.setItem(USER_NAME_KEY, profile.name.trim() || "Trace User");
	if (profile.avatar) localStorage.setItem(USER_AVATAR_KEY, profile.avatar);
	else localStorage.removeItem(USER_AVATAR_KEY);
}

export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
	const { data: systemUser, isLoading: userLoading } = useSystemUser();
	const [step, setStep] = useState<"intro" | "form" | "loading">("intro");
	const [name, setName] = useState("");
	const [avatar, setAvatar] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (systemUser?.name && !name) {
			setName(systemUser.name);
		}
		if (systemUser?.avatar_url && !avatar) {
			setAvatar(systemUser.avatar_url);
		}
	}, [systemUser, name, avatar]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => setAvatar(ev.target?.result as string);
		reader.readAsDataURL(file);
	};

	const handleStart = async () => {
		const displayName = name.trim() || "Trace User";
		localStorage.setItem(USER_NAME_KEY, displayName);
		if (avatar) localStorage.setItem(USER_AVATAR_KEY, avatar);
		else localStorage.removeItem(USER_AVATAR_KEY);

		setStep("loading");
		await new Promise((resolve) => setTimeout(resolve, 1800));
		localStorage.setItem(ONBOARDED_KEY, "true");
		onComplete();
	};

	const initials = name
		? name
				.split(" ")
				.map((n) => n[0])
				.slice(0, 2)
				.join("")
				.toUpperCase()
		: "T";

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
			{/* Background banner */}
			<div
				className={cn(
					"absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700",
					step === "intro" ? "scale-100" : "scale-105 blur-md brightness-75"
				)}
				style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/banner.png)` }}
			/>

			{/* Dark overlay for text legibility on intro */}
			{step === "intro" && (
				<div className="absolute inset-0 bg-gradient-to-b from-[#171717]/20 via-transparent to-[#171717]/40" />
			)}

			{/* Intro step */}
			{step === "intro" && (
				<div className="absolute bottom-10 items-end text-center px-6">
					<LiquidButton onClick={() => setStep("form")} className="group text-sm shadow-lg" innerClassName="px-8 py-2">
						Get Started
						<ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
					</LiquidButton>
				</div>
			)}

			{/* Form step */}
			{step === "form" && (
				<div className="relative z-10 w-full max-w-md px-6 transition-all duration-500 ease-out opacity-100 scale-100">
					<div className="bg-[#fffbf7]/95 backdrop-blur-xl rounded-[20px] border border-[#fffbf7]/40 p-6 sm:p-8 shadow-2xl">
						<div className="text-center mb-6">
							<h2 className="text-xl font-semibold text-[#171717]">Set up your profile</h2>
							<p className="text-sm text-[#6b6b6b] mt-1">Personalize your Trace dashboard</p>
						</div>

						<div className="flex flex-col items-center mb-6">
							<button
								onClick={() => fileInputRef.current?.click()}
								className="group relative size-24 rounded-full border border-[#e5e2df] bg-[#fffbf7] overflow-hidden flex items-center justify-center transition-colors hover:border-[#171717]"
							>
								{avatar ? (
									<img src={avatar} alt="Profile" className="size-full object-cover" />
								) : (
									<span className="text-2xl font-semibold text-[#171717]">{initials}</span>
								)}
								<div className="absolute inset-0 bg-[#171717]/0 group-hover:bg-[#171717]/10 transition-colors flex items-center justify-center">
									<Camera className="size-5 text-[#171717] opacity-0 group-hover:opacity-100 transition-opacity" />
								</div>
							</button>
							<input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
							<p className="text-xs text-[#6b6b6b] mt-2">Tap to add a photo</p>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-xs font-medium text-[#6b6b6b] uppercase tracking-wide mb-1.5">Your name</label>
								<input
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Enter your name"
									disabled={userLoading}
									className="w-full px-4 py-2.5 rounded-[12px] border border-[#e5e2df] bg-[#fffbf7] text-[#171717] placeholder:text-[#9e9ea0] focus:outline-none focus:border-[#171717] transition-colors disabled:opacity-50"
								/>
							</div>

							<LiquidButton
								onClick={handleStart}
								disabled={userLoading || !name.trim()}
								className="w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
								innerClassName="w-full px-5 py-3"
							>
								Continue
								<ArrowRight className="size-4" />
							</LiquidButton>
						</div>
					</div>
				</div>
			)}

			{/* Loading overlay */}
			{step === "loading" && (
				<div className="absolute inset-0 bg-[#fffbf7]/60 backdrop-blur-md flex flex-col items-center justify-center z-[110]">
					<div className="relative">
						<div className="size-12 rounded-full border-2 border-[#e5e2df] border-t-[#171717] animate-spin" />
					</div>
					<p className="mt-4 text-sm font-medium text-[#171717]">Fetching your data…</p>
					<p className="text-xs text-[#6b6b6b] mt-1">This may take a few seconds</p>
				</div>
			)}
		</div>
	);
}
