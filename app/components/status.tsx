export const STATUS = {
  bot: { color: "var(--success)", label: "Atendido por bot" },
  human_active: { color: "var(--warning)", label: "Atendido por humano" },
} as const;

export type StatusKey = keyof typeof STATUS;

export function StatusDot({ status }: { status: StatusKey }) {
  return (
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: STATUS[status].color }}
    />
  );
}

export function StatusBadge({ status }: { status: StatusKey }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-xs"
      style={{ color: STATUS[status].color }}
    >
      <StatusDot status={status} />
      {STATUS[status].label}
    </span>
  );
}
