import { useEffect, useState } from "react";
import { getCalApi } from "@calcom/embed-react";
import { X, Mail, Globe, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface HelpCenterModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpCenterModal({ open, onClose }: HelpCenterModalProps) {
  const [calReady, setCalReady] = useState(false);

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "trace-discussion-call" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
      setCalReady(true);
    })();
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.28, ease: EASE_OUT }}
            className="fixed bottom-20 left-4 z-50 w-72"
          >
            <div className="liquid-card-shell rounded-2xl p-[2px]">
              <div className="liquid-card-inner rounded-[14px] p-5 relative">
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 size-6 flex items-center justify-center rounded-full text-[var(--app-muted)] hover:text-[var(--app-ink)] hover:bg-[var(--app-soft)] transition-colors"
                  aria-label="Close"
                >
                  <X className="size-3.5" />
                </button>

                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-12 rounded-xl overflow-hidden border border-[var(--app-hairline)] bg-[var(--app-soft)] shrink-0">
                    <img
                      src={`${import.meta.env.BASE_URL}images/profile.png`}
                      alt="Subham Karmakar"
                      className="size-full object-cover object-top"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--app-ink)]">Subham Karmakar</p>
                    <p className="text-xs text-[var(--app-muted)]">Founder · Trace</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--app-hairline)] mb-4" />

                {/* Contact links */}
                <div className="space-y-2 mb-4">
                  <button
                    onClick={() => {
                      const url = "mailto:rikk4335@gmail.com";
                      if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
                      else window.open(url, "_blank");
                    }}
                    className="flex items-center gap-2.5 text-xs text-[var(--app-muted)] hover:text-[var(--app-ink)] transition-colors group w-full text-left"
                  >
                    <Mail className="size-3.5 shrink-0" />
                    <span>rikk4335@gmail.com</span>
                  </button>
                  <button
                    onClick={() => {
                      const url = "https://subham12r.me";
                      if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
                      else window.open(url, "_blank");
                    }}
                    className="flex items-center gap-2.5 text-xs text-[var(--app-muted)] hover:text-[var(--app-ink)] transition-colors group w-full text-left"
                  >
                    <Globe className="size-3.5 shrink-0" />
                    <span>subham12r.me</span>
                  </button>
                </div>

                {/* Book a call */}
                <button
                  data-cal-namespace="trace-discussion-call"
                  data-cal-link="subham12r/trace-discussion-call"
                  data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
                  disabled={!calReady}
                  className={cn(
                    "liquid-shell w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-medium text-[var(--app-ink)] transition-opacity",
                    calReady ? "hover:opacity-80" : "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Calendar className="size-4" />
                  Book a call
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
