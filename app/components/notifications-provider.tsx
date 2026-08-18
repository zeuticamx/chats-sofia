"use client";

import { useEffect, type ReactNode } from "react";
import { useStoredToken } from "@/lib/auth";
import { addAlerta, parseEscalacion, setConnected, type Alerta } from "@/lib/notifications";
import { playAlertSound } from "@/lib/sound";

const BASE_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;

/** Notificación del navegador sólo si la pestaña no está en foco. */
function notifyIfHidden(alerta: Alerta) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible" && document.hasFocus()) return;

  try {
    new Notification("Escalación de cliente", {
      body: `${alerta.motivo} · +${alerta.wa_id}`,
      tag: alerta.id,
    });
  } catch {
    // Algunos navegadores exigen Service Worker para notificaciones; se ignora.
  }
}

/**
 * Abre el WebSocket de notificaciones una única vez a nivel app.
 * Vive en el root layout, así que las alertas siguen llegando aunque el
 * usuario no esté parado en la pestaña de Alertas.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const token = useStoredToken();

  useEffect(() => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL;

    if (!token || !wsBase) {
      if (!wsBase) {
        console.warn(
          "[notificaciones] NEXT_PUBLIC_WS_URL no configurada; el socket queda apagado.",
        );
      }
      setConnected(false);
      return;
    }

    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      const url = `${wsBase}${wsBase.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
      socket = new WebSocket(url);

      socket.onopen = () => {
        attempt = 0;
        setConnected(true);
      };

      socket.onmessage = (event) => {
        let raw: unknown;
        try {
          raw = JSON.parse(event.data as string);
        } catch {
          return;
        }

        const payload = parseEscalacion(raw);
        if (!payload) return;

        const alerta = addAlerta(payload);
        playAlertSound();
        notifyIfHidden(alerta);
      };

      socket.onclose = () => {
        setConnected(false);
        if (cancelled) return;
        // Backoff exponencial con tope, para no martillar el backend caído.
        const delay = Math.min(MAX_RETRY_MS, BASE_RETRY_MS * 2 ** attempt);
        attempt += 1;
        retryTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => {
        // El reintento lo maneja onclose, que siempre se dispara después.
        socket?.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      setConnected(false);
    };
  }, [token]);

  return <>{children}</>;
}
