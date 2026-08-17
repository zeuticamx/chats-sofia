import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  from: "contact" | "bot" | "human";
  timestamp: string;
  meta?: string;
  children: ReactNode;
}

export function MessageBubble({
  from,
  timestamp,
  meta,
  children,
}: MessageBubbleProps) {
  const outgoing = from !== "contact";

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        outgoing ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-md border px-3 py-2 text-sm leading-relaxed text-text-100",
          outgoing
            ? "border-success/30 bg-success-bg"
            : "border-bg-700 bg-bg-800",
        )}
      >
        {children}
      </div>
      <div className="flex items-center gap-2 px-1 font-mono text-[11px] text-text-600">
        {meta && <span>{meta}</span>}
        <span>{timestamp}</span>
      </div>
    </div>
  );
}
