import { useEffect, useState } from "react";
import { MOCK_CONVERSATIONS } from "./mock-conversations";
import type { ConversationRecord } from "./types";

export const POLL_INTERVAL_MS = 5000;

/**
 * Lee /api/conversations con polling y mezcla las conversaciones de ejemplo.
 * Compartido por el panel de conversaciones y el dashboard de leads para que
 * ambos vean exactamente los mismos registros.
 */
export function useConversationRecords() {
  const [records, setRecords] = useState<ConversationRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/conversations", { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data: ConversationRecord[] = await res.json();
        if (!cancelled) {
          setRecords([...MOCK_CONVERSATIONS, ...data]);
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

  return { records, error };
}
