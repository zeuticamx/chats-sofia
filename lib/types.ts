export type MessageRole = "human" | "ai" | "tool";

export interface ToolCall {
  id: string;
  name: string;
  type: "tool_call";
  args: Record<string, unknown>;
}

interface BaseMessage {
  additional_kwargs?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
}

export interface HumanMessage extends BaseMessage {
  type: "human";
  content: string;
}

export interface AiMessage extends BaseMessage {
  type: "ai";
  content: string | unknown[];
  tool_calls?: ToolCall[];
  invalid_tool_calls?: unknown[];
}

export interface ToolMessage extends BaseMessage {
  type: "tool";
  name: string;
  content: string;
  tool_call_id: string;
}

export type ConversationMessage = HumanMessage | AiMessage | ToolMessage;

/** Quién está atendiendo la sesión actualmente, según lo devuelve la API. */
export type ConversationStatus = "bot" | "human_active";

/** Fila tal como se almacena en Postgres (tabla de historial n8n). */
export interface ConversationRecord {
  id: number;
  session_id: string;
  message: ConversationMessage;
  created_at: string;
  status: ConversationStatus;
}
