import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
	return (
		<SonnerToaster
			position="bottom-right"
			gap={10}
			toastOptions={{
				classNames: {
					toast:
						"!rounded-xl !border !border-[#e5e2df] !bg-[#fffbf7] !text-[#171717] !shadow-[0_8px_24px_-12px_rgba(23,23,23,0.18)]",
					title: "!font-medium",
					description: "!text-[#6b6b6b]",
					actionButton: "!rounded-md !bg-[#171717] !text-[#fffbf7]",
					cancelButton: "!rounded-md !bg-[#f5f2ef] !text-[#171717]",
					icon: "!text-[#171717]",
				},
			}}
		/>
	);
}
