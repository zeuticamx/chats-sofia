import { useSyncExternalStore } from "react";

const STORAGE_KEY = "zeutica_sonido";
const SOUND_EVENT = "zeutica-sound-change";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  // Por defecto activado: sólo lo consideramos apagado si se guardó "off".
  return window.localStorage.getItem(STORAGE_KEY) !== "off";
}

export function setSoundEnabled(enabled: boolean) {
  window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  window.dispatchEvent(new Event(SOUND_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(SOUND_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SOUND_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getServerSnapshot() {
  return true;
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, isSoundEnabled, getServerSnapshot);
}

let audioCtx: AudioContext | null = null;

/**
 * Blip corto de dos tonos generado con WebAudio (sin assets).
 * Los navegadores bloquean el audio hasta que hay una interacción previa
 * del usuario con la página, así que la primera alerta puede ser muda.
 */
export function playAlertSound() {
  if (typeof window === "undefined" || !isSoundEnabled()) return;

  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1175, now + 0.09);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // Sin soporte de WebAudio o bloqueado por el navegador: silencio, sin romper.
  }
}
