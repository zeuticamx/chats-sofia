import type { ConversationRecord, ConversationStatus } from "./types";
import raw from "./sofia_conversaciones_ejemplo.json";

/** El JSON de ejemplo trae estados intermedios de n8n; acá se colapsan al enum que consume la UI. */
const STATUS_MAP: Record<string, ConversationStatus> = {
  bot: "bot",
  esperando_agente: "human_active",
  agente: "human_active",
};

/** Conversaciones de ejemplo para simular actividad real en el canvas, sin depender de n8n. */
export const MOCK_CONVERSATIONS: ConversationRecord[] = (
  raw as Array<Omit<ConversationRecord, "status"> & { status: string }>
).map((r) => ({
  ...r,
  status: STATUS_MAP[r.status] ?? "bot",
}));
