import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  neutral: "border-bg-600 text-text-400",
  success: "border-success/40 text-success",
  warning: "border-warning/40 text-warning",
  danger: "border-danger/40 text-danger",
} as const;

export type BadgeTone = keyof typeof TONE_CLASSES;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[11px] leading-none",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ModelBadge({ model }: { model: string }) {
  return <Badge tone="neutral">{model}</Badge>;
}
