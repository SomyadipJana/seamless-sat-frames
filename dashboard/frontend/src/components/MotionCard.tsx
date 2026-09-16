import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

interface MotionCardProps extends HTMLMotionProps<"div"> {
	/** Stagger index — multiplies the entrance delay. */
	index?: number;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** A card wrapper with a subtle staggered fade-up entrance. Respects reduced-motion. */
export function MotionCard({ index = 0, children, ...props }: MotionCardProps) {
	const reduce = useReducedMotion();
	return (
		<motion.div
			initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: reduce ? 0.15 : 0.42, delay: index * 0.05, ease: EASE_OUT }}
			{...props}
		>
			{children}
		</motion.div>
	);
}
