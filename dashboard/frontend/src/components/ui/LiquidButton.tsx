"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  textColor?: string;
  /** Optional padding override for the inner frosted layer. */
  innerClassName?: string;
}

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, children, textColor, innerClassName, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "liquid-shell group/lb relative inline-flex items-center justify-center rounded-full p-[2px] text-sm transition-opacity hover:opacity-90 active:opacity-75",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "liquid-inner flex items-center justify-center rounded-full px-2 py-1",
            innerClassName,
          )}
        >
          <span
            className="liquid-text flex items-center gap-1.5 whitespace-nowrap font-semibold text-[rgb(61,61,61)] dark:text-white/90"
            style={textColor ? { color: textColor } : undefined}
          >
            {children}
          </span>
        </span>
      </button>
    );
  },
);

LiquidButton.displayName = "LiquidButton";
export { LiquidButton };
export default LiquidButton;
