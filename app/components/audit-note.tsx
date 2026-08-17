import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  neutral: "border-bg-600 text-text-400",
  warning: "border-warning/40 text-warning",
  danger: "border-danger/40 text-danger",
} as const;

export function AuditNote({
  tone = "neutral",
  timestamp,
  children,
}: {
  tone?: keyof typeof TONE_CLASSES;
  timestamp: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "self-center rounded border border-dashed px-2.5 py-1 font-mono text-[11px]",
        TONE_CLASSES[tone],
      )}
    >
      {children} · {timestamp}
    </div>
  );
}
