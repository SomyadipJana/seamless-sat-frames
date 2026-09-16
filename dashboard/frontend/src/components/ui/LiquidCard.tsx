import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface LiquidCardProps {
	/** Stagger index — multiplies the entrance delay. */
	index?: number;
	/** Classes applied to the inner frosted content layer (padding, layout). */
	className?: string;
	children: React.ReactNode;
	/** Custom height class. */
	height?: string;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * A liquid-glass card: two-layer shell (gradient border + frosted inner)
 * with the same staggered fade-up entrance as MotionCard. Theme-aware via the
 * shared .liquid-shell / .liquid-inner utilities.
 */
export function LiquidCard({ index = 0, className, children, height = "h-full" }: LiquidCardProps) {
	const reduce = useReducedMotion();
	return (
		<motion.div
			initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: reduce ? 0.15 : 0.42, delay: index * 0.05, ease: EASE_OUT }}
			className={cn("liquid-card-shell rounded-[18px] p-[2px] transition-transform duration-200 hover:-translate-y-0.5", height)}
		>
			<div className={cn("liquid-card-inner liquid-inner-strong rounded-2xl", height, className)}>{children}</div>
		</motion.div>
	);
}
