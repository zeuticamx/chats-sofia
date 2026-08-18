"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";
import { ConversationRow } from "./conversation-row";
import { ThreadViewer } from "./thread-viewer";
import { JsonTreeView } from "./json-tree";
import { StatCard } from "./stat-card";
import { StatusBadge } from "./status";
import { extractWaId, groupBySession, recordsToThreadItems } from "@/lib/conversations";
import { useStoredUsuario } from "@/lib/auth";
import type { ConversationRecord } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LiveDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  /** Sesión pedida por URL (?session=…), p. ej. al venir desde una alerta. */
  const sessionFromUrl = searchParams.get("session");
  const assignedAgentId = useStoredUsuario();
  const [records, setRecords] = useState<ConversationRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setActionFeedback({ type, text });
    feedbackTimeoutRef.current = setTimeout(() => setActionFeedback(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (assignedAgentId === null) {
      router.replace("/login");
    }
  }, [assignedAgentId, router]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/conversations", { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data: ConversationRecord[] = await res.json();
        if (!cancelled) {
          setRecords(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "error desconocido");
        }
      }
    }

    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const sessions = groupBySession(records ?? []);
  const activeSessionId =
    selectedSession ?? sessionFromUrl ?? sessions[0]?.sessionId ?? null;
  const activeSession = sessions.find((s) => s.sessionId === activeSessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSessionId, activeSession?.records.length]);

  if (assignedAgentId === null) {
    return (
      <div className="flex flex-1 items-center justify-center font-mono text-xs text-text-600">
        verificando sesión…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="rounded-md border border-danger/40 bg-bg-800 px-4 py-3 font-mono text-xs text-danger">
            error al leer /api/conversations: {error}
          </div>
        </div>
      </div>
    );
  }

  if (!records) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center p-6 font-mono text-xs text-text-600">
          cargando datos de n8n…
        </div>
      </div>
    );
  }

  const today = new Date().toDateString();
  const sessionsToday = sessions.filter(
    (s) => new Date(s.lastTimestamp).toDateString() === today,
  ).length;
  const needsHuman = sessions.filter((s) => s.status === "human_active").length;
  const autoPct = sessions.length
    ? Math.round(((sessions.length - needsHuman) / sessions.length) * 100)
    : 0;

  const handleHumanButton = async () => {
    if (!activeSession || !assignedAgentId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/conversations/handle-human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wa_id: extractWaId(activeSession.sessionId),
          assigned_agent_id: assignedAgentId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? `error ${res.status}`);
      }
      showFeedback("success", "Conversación asignada a un humano.");
    } catch (e) {
      showFeedback(
        "error",
        e instanceof Error ? e.message : "No se pudo asignar a un humano.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAI = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const res = await fetch("/api/conversations/handle-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wa_id: extractWaId(activeSession.sessionId),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? `error ${res.status}`);
      }
      showFeedback("success", "Conversación devuelta a la IA.");
    } catch (e) {
      showFeedback(
        "error",
        e instanceof Error ? e.message : "No se pudo devolver a la IA.",
      );
    } finally {
      setLoading(false);
    }
  };

  const canSendMessage = activeSession?.status === "human_active";

  const handleSendMessage = async () => {
    if (!activeSession || !messageText.trim() || !canSendMessage || !assignedAgentId) return;
    setSendingMessage(true);
    try {
      const res = await fetch("/api/conversations/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wa_id: extractWaId(activeSession.sessionId),
          text: messageText.trim(),
          assigned_agent_id: assignedAgentId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? `error ${res.status}`);
      }
      setMessageText("");
    } catch (e) {
      showFeedback(
        "error",
        e instanceof Error ? e.message : "No se pudo enviar el mensaje.",
      );
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="grid grid-cols-3 gap-3 border-b border-bg-700 p-4">
          <StatCard label="Sesiones hoy" value={sessionsToday} />
          <StatCard
            label="% con respuesta automática"
            value={`${autoPct}%`}
            tone="success"
          />
          <StatCard
            label="Esperando respuesta humana"
            value={needsHuman}
            tone="warning"
          />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-bg-700 bg-bg-900">
            {sessions.map((s) => (
              <ConversationRow
                key={s.sessionId}
                active={s.sessionId === activeSessionId}
                name={s.displayPhone}
                phone={s.sessionId}
                preview={s.lastMessage}
                timestamp={formatTime(s.lastTimestamp)}
                status={s.status}
                onClick={() => setSelectedSession(s.sessionId)}
              />
            ))}
            {sessions.length === 0 && (
              <div className="p-3 font-mono text-xs text-text-600">
                sin sesiones registradas
              </div>
            )}
          </aside>

          <main className="flex flex-1 flex-col overflow-hidden">
            {activeSession ? (
              <>
                <header className="flex items-center justify-between border-b border-bg-700 px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-text-100">
                      {activeSession.displayPhone}
                    </span>
                    <span className="font-mono text-xs text-text-600">
                      {activeSession.sessionId}
                    </span>
                    <StatusBadge status={activeSession.status} />
                  </div>
                  <CommandPalette
                    items={sessions.map((s) => ({
                      id: s.sessionId,
                      title: s.displayPhone,
                      meta: s.sessionId,
                    }))}
                  />
                </header>

                <div className="flex-1 overflow-y-auto">
                  <div className="mx-auto w-full max-w-2xl p-6">
                    <ThreadViewer
                      items={recordsToThreadItems(activeSession.records)}
                    />
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="border-t border-bg-700 p-4">
                  <div className="mx-auto w-full max-w-2xl">
                    {!canSendMessage && (
                      <div className="mb-2 rounded-md border border-bg-700 bg-bg-900 px-3 py-2 font-mono text-[11px] text-text-600">
                        La conversación está atendida por el bot. Tomá la conversación con
                        &quot;Humano&quot; para poder enviar mensajes.
                      </div>
                    )}
                    <div className="flex gap-2">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={
                          canSendMessage
                            ? "Escribir mensaje…"
                            : "Solo disponible en modo humano"
                        }
                        rows={2}
                        disabled={sendingMessage || !canSendMessage}
                        className="flex-1 resize-none rounded-md border border-bg-700 bg-bg-900 px-3 py-2 text-sm text-text-100 placeholder:text-text-600 focus:outline-none focus:border-bg-500 disabled:opacity-50"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendingMessage || !canSendMessage}
                        className="rounded bg-fill-accent px-4 py-2 text-xs font-medium text-on-accent hover:opacity-90 disabled:opacity-50"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center font-mono text-xs text-text-600">
                sin conversaciones
              </div>
            )}
          </main>

          <aside className="w-80 shrink-0 overflow-y-auto border-l border-bg-700 bg-bg-950 p-3">
            <div className="mb-4 font-mono text-[11px] text-text-600">
              último registro Postgres
            </div>

            <div className="mb-2 flex gap-2">
              <button
                onClick={handleHumanButton}
                disabled={!activeSession || loading}
                className="flex-1 rounded bg-yellow-600 px-3 py-2 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
              >
                Humano
              </button>
              <button
                onClick={handleReturnAI}
                disabled={!activeSession || loading}
                className="flex-1 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Devolver IA
              </button>
            </div>

            {actionFeedback && (
              <div
                className={`mb-4 rounded-md border px-3 py-2 font-mono text-[11px] ${
                  actionFeedback.type === "success"
                    ? "border-green-700/40 bg-green-950/40 text-green-400"
                    : "border-red-700/40 bg-red-950/40 text-red-400"
                }`}
              >
                {actionFeedback.text}
              </div>
            )}

            {activeSession && (
              <JsonTreeView
                data={JSON.parse(
                  JSON.stringify(
                    activeSession.records[activeSession.records.length - 1],
                  ),
                )}
                rootLabel="record"
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
