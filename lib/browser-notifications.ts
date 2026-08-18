import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** `null` cuando el navegador no soporta la Notification API. */
function getSnapshot(): NotificationPermission | null {
  if (typeof Notification === "undefined") return null;
  return Notification.permission;
}

function getServerSnapshot(): NotificationPermission | null {
  return null;
}

export function useNotificationPermission(): NotificationPermission | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return;
  try {
    await Notification.requestPermission();
  } catch {
    // Safari viejo usa la forma con callback; si falla, queda como estaba.
  }
  for (const listener of listeners) listener();
}
