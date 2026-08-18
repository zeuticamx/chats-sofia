import { useSyncExternalStore } from "react";

const STORAGE_KEY = "zeutica_usuario";
const TOKEN_KEY = "zeutica_token";
const AUTH_EVENT = "zeutica-auth-change";

export function getStoredUsuario(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setStoredUsuario(usuario: string) {
  window.localStorage.setItem(STORAGE_KEY, usuario);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearStoredUsuario() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/**
 * El backend puede devolver el token con distintos nombres según el servicio.
 * Se prueban los habituales para no acoplarnos a uno solo.
 */
export function extractToken(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const candidates = [obj.token, obj.access_token, obj.accessToken, obj.jwt];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  if (obj.data && typeof obj.data === "object") return extractToken(obj.data);
  return null;
}

function subscribe(onChange: () => void) {
  window.addEventListener(AUTH_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(AUTH_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getServerSnapshot() {
  return null;
}

/** Reactive read of the logged-in usuario, kept in sync with localStorage. */
export function useStoredUsuario(): string | null {
  return useSyncExternalStore(subscribe, getStoredUsuario, getServerSnapshot);
}

/** Reactive read of the auth token, kept in sync with localStorage. */
export function useStoredToken(): string | null {
  return useSyncExternalStore(subscribe, getStoredToken, getServerSnapshot);
}
