import type {
  ConversationMessage,
  ConversationRecord,
  ConversationStatus,
} from "./types";
import type { ThreadItem } from "@/app/components/thread-viewer";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function recordsToThreadItems(
  records: ConversationRecord[],
): ThreadItem[] {
  return records.map((r) => {
    const timestamp = formatTime(r.created_at);
    const meta = `id:${r.id} · ${r.session_id}`;

    if (r.message.type === "human") {
      return {
        type: "message",
        from: "contact",
        timestamp,
        meta,
        content: r.message.content,
      };
    }

    if (r.message.type === "ai") {
      const toolCall = r.message.tool_calls?.[0];
      const content =
        typeof r.message.content === "string" && r.message.content.length > 0
          ? r.message.content
          : toolCall
            ? `→ tool_call: ${toolCall.name}`
            : "(sin contenido)";

      return {
        type: "message",
        from: "bot",
        timestamp,
        meta: `agente_n8n · ${meta}`,
        content,
      };
    }

    return {
      type: "audit",
      tone: "neutral",
      timestamp,
      content: `tool:${r.message.name} → ${r.message.content.slice(0, 80)}`,
    };
  });
}

/** Teléfono real embebido en session_id (ej: "sofi_5213325410193"), solo agrupado para lectura. */
export function formatPhoneFromSessionId(sessionId: string): string {
  const digits = sessionId.match(/(\d{6,15})/)?.[1];
  if (!digits) return sessionId;
  const grouped = digits.match(/.{1,4}/g)?.join(" ") ?? digits;
  return `+${grouped}`;
}

/** wa_id crudo (solo dígitos) embebido en session_id, usado como identificador de WhatsApp. */
export function extractWaId(sessionId: string): string {
  return sessionId.match(/(\d{6,15})/)?.[1] ?? sessionId;
}

function previewFromMessage(message: ConversationMessage): string {
  if (message.type === "human") return message.content;
  if (message.type === "ai") {
    if (typeof message.content === "string" && message.content.length > 0) {
      return message.content;
    }
    const toolCall = message.tool_calls?.[0];
    return toolCall ? `→ tool_call: ${toolCall.name}` : "(sin contenido)";
  }
  return `[tool] ${message.name}`;
}

export interface SessionSummary {
  sessionId: string;
  displayPhone: string;
  lastMessage: string;
  lastTimestamp: string;
  messageCount: number;
  /** Estado real devuelto por la API (bot | human_active), tomado del último registro. */
  status: ConversationStatus;
  records: ConversationRecord[];
}

export function groupBySession(records: ConversationRecord[]): SessionSummary[] {
  const bySession = new Map<string, ConversationRecord[]>();

  for (const r of records) {
    const list = bySession.get(r.session_id) ?? [];
    list.push(r);
    bySession.set(r.session_id, list);
  }

  const summaries: SessionSummary[] = [];

  for (const [sessionId, list] of bySession) {
    const sorted = [...list].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const last = sorted[sorted.length - 1];

    summaries.push({
      sessionId,
      displayPhone: formatPhoneFromSessionId(sessionId),
      lastMessage: previewFromMessage(last.message),
      lastTimestamp: last.created_at,
      messageCount: sorted.length,
      status: last.status,
      records: sorted,
    });
  }

  return summaries.sort(
    (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime(),
  );
}
