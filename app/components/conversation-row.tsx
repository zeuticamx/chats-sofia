import { cn } from "@/lib/utils";
import { StatusBadge, type StatusKey } from "./status";

interface ConversationRowProps {
  name: string;
  phone: string;
  preview: string;
  timestamp: string;
  status: StatusKey;
  unread?: number;
  active?: boolean;
  onClick?: () => void;
}

export function ConversationRow({
  name,
  phone,
  preview,
  timestamp,
  status,
  unread,
  active,
  onClick,
}: ConversationRowProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b border-bg-800 px-3 py-2.5 text-left hover:bg-bg-800",
        active && "bg-bg-800",
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-700 font-mono text-xs text-text-400">
        {name.slice(0, 2).toUpperCase()}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-text-100">
            {name}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-text-600">
            {timestamp}
          </span>
        </div>
        <span className="truncate text-xs text-text-400">{preview}</span>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-text-600">{phone}</span>
          <StatusBadge status={status} />
        </div>
      </div>

      {unread ? (
        <span className="ml-1 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-success px-1 font-mono text-[10px] text-bg-950">
          {unread}
        </span>
      ) : null}
    </button>
  );
}
