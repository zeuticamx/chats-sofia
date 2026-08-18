import { useSyncExternalStore } from "react";

const STORAGE_KEY = "zeutica_theme";
const THEME_EVENT = "zeutica-theme-change";

export type Theme = "dark" | "light";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

export function setStoredTheme(theme: Theme) {
  window.localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getServerSnapshot(): Theme {
  return "dark";
}

/** Reactive read of the theme preference, kept in sync with localStorage. */
export function useStoredTheme(): Theme {
  return useSyncExternalStore(subscribe, getStoredTheme, getServerSnapshot);
}
