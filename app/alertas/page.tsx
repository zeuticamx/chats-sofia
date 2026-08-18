"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellOff, BellRing, CheckCheck, Volume2, VolumeX } from "lucide-react";
import { Sidebar } from "../components/sidebar";
import { AlertRow } from "../components/alert-row";
import { cn } from "@/lib/utils";
import { useStoredUsuario } from "@/lib/auth";
import {
  countUnread,
  markAlertaRead,
  markAllAlertasRead,
  useAlertasState,
} from "@/lib/notifications";
import { setSoundEnabled, useSoundEnabled } from "@/lib/sound";
import {
  requestNotificationPermission,
  useNotificationPermission,
} from "@/lib/browser-notifications";

/** Refresco de las horas relativas ("hace 3 min") sin depender de mensajes nuevos. */
const TICK_MS = 30000;

export default function AlertasPage() {
  const router = useRouter();
  const usuario = useStoredUsuario();
  const { alertas, connected } = useAlertasState();
  const soundEnabled = useSoundEnabled();
  const [now, setNow] = useState(() => Date.now());
  const permission = useNotificationPermission();

  const unread = countUnread(alertas);

  useEffect(() => {
    if (usuario === null) router.replace("/login");
  }, [usuario, router]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // El permiso se pide acá — al entrar a Alertas — y no al cargar la app entera.
  useEffect(() => {
    if (permission === "default") void requestNotificationPermission();
  }, [permission]);

  if (usuario === null) {
    return (
      <div className="flex flex-1 items-center justify-center font-mono text-xs text-text-600">
        verificando sesión…
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-bg-700 px-6 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-medium text-text-100">Alertas</h1>
            <span
              className="inline-flex items-center gap-1.5 font-mono text-xs"
              style={{
                color: connected ? "var(--success)" : "var(--danger)",
              }}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: connected ? "var(--success)" : "var(--danger)",
                }}
              />
              {connected ? "conectado" : "desconectado"}
            </span>
            {unread > 0 && (
              <span className="font-mono text-xs text-text-600">
                {unread} sin leer
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Silenciar alertas" : "Activar sonido"}
              aria-label={soundEnabled ? "Silenciar alertas" : "Activar sonido"}
              aria-pressed={soundEnabled}
              className={cn(
                "rounded p-1.5 hover:bg-bg-800",
                soundEnabled ? "text-text-100" : "text-text-600",
              )}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {permission !== null && permission !== "granted" && (
              <button
                onClick={() => void requestNotificationPermission()}
                disabled={permission === "denied"}
                title={
                  permission === "denied"
                    ? "Notificaciones bloqueadas en el navegador"
                    : "Activar notificaciones del navegador"
                }
                className="rounded p-1.5 text-text-600 hover:bg-bg-800 hover:text-text-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {permission === "denied" ? (
                  <BellOff size={16} />
                ) : (
                  <BellRing size={16} />
                )}
              </button>
            )}

            <button
              onClick={markAllAlertasRead}
              disabled={unread === 0}
              className="ml-1 flex items-center gap-1.5 rounded border border-bg-700 px-2.5 py-1.5 text-xs font-medium text-text-100 hover:bg-bg-800 disabled:opacity-50"
            >
              <CheckCheck size={13} />
              Marcar todas como leídas
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {alertas.length === 0 ? (
            <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-text-600">
              {connected
                ? "sin escalaciones por ahora"
                : "sin escalaciones · esperando conexión con el servidor"}
            </div>
          ) : (
            <ul className="divide-y divide-bg-700">
              {alertas.map((alerta) => (
                <AlertRow
                  key={alerta.id}
                  alerta={alerta}
                  now={now}
                  onMarkRead={markAlertaRead}
                  onGoToConversation={(sessionId) => {
                    markAlertaRead(alerta.id);
                    router.push(`/?session=${encodeURIComponent(sessionId)}`);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
