import type { ReactNode } from "react";

const TONE_TEXT = {
  neutral: "text-text-100",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
} as const;

export function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: keyof typeof TONE_TEXT;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-bg-700 bg-bg-800 px-4 py-3">
      <span className="font-mono text-[11px] text-text-600">{label}</span>
      <span className={`text-2xl font-semibold ${TONE_TEXT[tone]}`}>
        {value}
      </span>
    </div>
  );
}
