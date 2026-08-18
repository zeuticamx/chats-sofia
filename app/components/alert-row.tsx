"use client";

import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneFromSessionId } from "@/lib/conversations";
import { relativeTime } from "@/lib/relative-time";
import type { Alerta } from "@/lib/notifications";

export function AlertRow({
  alerta,
  now,
  onMarkRead,
  onGoToConversation,
}: {
  alerta: Alerta;
  now: number;
  onMarkRead: (id: string) => void;
  onGoToConversation: (sessionId: string) => void;
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 border-l-2 px-4 py-3",
        alerta.read
          ? "border-transparent bg-transparent"
          : "border-warning bg-warning/5",
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
          alerta.read ? "bg-bg-600" : "bg-warning",
        )}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm",
            alerta.read ? "text-text-400" : "text-text-100",
          )}
        >
          {alerta.motivo}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-text-600">
          <span>{formatPhoneFromSessionId(alerta.wa_id)}</span>
          <span aria-hidden>·</span>
          <span>{relativeTime(alerta.received_at, now)}</span>
          {alerta.assigned_agent_id && (
            <>
              <span aria-hidden>·</span>
              <span>{alerta.assigned_agent_id}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!alerta.read && (
          <button
            onClick={() => onMarkRead(alerta.id)}
            title="Marcar como leída"
            aria-label="Marcar como leída"
            className="rounded p-1.5 text-text-400 hover:bg-bg-800 hover:text-text-100"
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={() => onGoToConversation(alerta.session_id)}
          className="flex items-center gap-1.5 rounded border border-bg-700 px-2.5 py-1.5 text-xs font-medium text-text-100 hover:bg-bg-800"
        >
          Ir a conversación
          <ArrowRight size={13} />
        </button>
      </div>
    </li>
  );
}
