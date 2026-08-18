const rtf = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

/** Hora relativa legible: "hace instantes", "hace 3 minutos", "hace 2 horas". */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const seconds = Math.round((now - then) / 1000);
  if (seconds < 45) return "hace instantes";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");

  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");

  const days = Math.round(hours / 24);
  return rtf.format(-days, "day");
}
