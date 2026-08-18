import { useSyncExternalStore } from "react";

const STORAGE_KEY = "zeutica_alertas";
/** Tope de alertas persistidas en localStorage; las más viejas se descartan. */
export const MAX_ALERTAS = 50;

/** Payload tal como lo emite el backend por /ws/notificaciones. */
export interface EscalacionPayload {
  tipo: "escalacion";
  session_id: string;
  wa_id: string;
  motivo: string;
  assigned_agent_id: string | null;
}

/** Alerta ya normalizada para la UI (el WS no manda id ni timestamp). */
export interface Alerta extends EscalacionPayload {
  id: string;
  received_at: string;
  read: boolean;
}

interface AlertasState {
  alertas: Alerta[];
  connected: boolean;
}

const EMPTY_STATE: AlertasState = { alertas: [], connected: false };

let state: AlertasState = EMPTY_STATE;
let hydrated = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.alertas));
  } catch {
    // localStorage lleno o deshabilitado: la app sigue funcionando en memoria.
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    state = { ...state, alertas: (parsed as Alerta[]).slice(0, MAX_ALERTAS) };
  } catch {
    // Dato corrupto: arrancamos vacíos en vez de romper el render.
  }
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Valida que un mensaje del socket sea una escalación antes de aceptarlo. */
export function parseEscalacion(raw: unknown): EscalacionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.tipo !== "escalacion") return null;
  if (typeof obj.session_id !== "string" || typeof obj.wa_id !== "string") {
    return null;
  }
  return {
    tipo: "escalacion",
    session_id: obj.session_id,
    wa_id: obj.wa_id,
    motivo: typeof obj.motivo === "string" ? obj.motivo : "Escalación sin motivo",
    assigned_agent_id:
      typeof obj.assigned_agent_id === "string" ? obj.assigned_agent_id : null,
  };
}

export function addAlerta(payload: EscalacionPayload): Alerta {
  const alerta: Alerta = {
    ...payload,
    id: newId(),
    received_at: new Date().toISOString(),
    read: false,
  };
  state = {
    ...state,
    alertas: [alerta, ...state.alertas].slice(0, MAX_ALERTAS),
  };
  persist();
  emit();
  return alerta;
}

export function markAlertaRead(id: string) {
  let changed = false;
  const alertas = state.alertas.map((a) => {
    if (a.id !== id || a.read) return a;
    changed = true;
    return { ...a, read: true };
  });
  if (!changed) return;
  state = { ...state, alertas };
  persist();
  emit();
}

export function markAllAlertasRead() {
  if (!state.alertas.some((a) => !a.read)) return;
  state = {
    ...state,
    alertas: state.alertas.map((a) => (a.read ? a : { ...a, read: true })),
  };
  persist();
  emit();
}

/** Estado del socket; no se persiste, se recalcula en cada sesión. */
export function setConnected(connected: boolean) {
  if (state.connected === connected) return;
  state = { ...state, connected };
  emit();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): AlertasState {
  hydrate();
  return state;
}

function getServerSnapshot(): AlertasState {
  return EMPTY_STATE;
}

export function useAlertasState(): AlertasState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function countUnread(alertas: Alerta[]): number {
  return alertas.reduce((n, a) => (a.read ? n : n + 1), 0);
}
