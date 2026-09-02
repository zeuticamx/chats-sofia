import type { ConversationRecord } from "./types";
import { groupBySession, type SessionSummary } from "./conversations";

/**
 * Etapa del lead inferida a partir de las herramientas que invocó el agente
 * durante la conversación. El orden es el del embudo comercial.
 */
export type LeadStage =
  | "contacto"
  | "cotizacion"
  | "pago_iniciado"
  | "pago_verificado";

export const LEAD_STAGES: ReadonlyArray<{
  key: LeadStage;
  label: string;
  short: string;
}> = [
  { key: "contacto", label: "Contacto inicial", short: "Contacto" },
  { key: "cotizacion", label: "Cotización enviada", short: "Cotización" },
  { key: "pago_iniciado", label: "Datos de pago enviados", short: "Pago iniciado" },
  { key: "pago_verificado", label: "Comprobante verificado", short: "Cerrado" },
];

/** Herramientas de n8n que mueven al lead de etapa. */
const STAGE_BY_TOOL: Record<string, LeadStage> = {
  generar_cotizacion: "cotizacion",
  generar_cotizacion_pdf: "cotizacion",
  enviar_documento: "cotizacion",
  enviar_datos_bancarios: "pago_iniciado",
  verificar_comprobante_pago: "pago_verificado",
};

const ESCALATION_TOOL = "delegar_humano";

export function stageIndex(stage: LeadStage): number {
  return LEAD_STAGES.findIndex((s) => s.key === stage);
}

/** Clave de día en hora local (YYYY-MM-DD), consistente con "Sesiones hoy". */
export function localDayKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return localDayKey(new Date());
}

export function shiftDayKey(key: string, days: number): string {
  const d = dayKeyToDate(key);
  d.setDate(d.getDate() + days);
  return localDayKey(d);
}

export function dayKeyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayLabel(
  key: string,
  opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" },
): string {
  return dayKeyToDate(key).toLocaleDateString("es-MX", opts);
}

export function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "—";
  const s = ms / 1000;
  if (s < 60) return `${Math.round(s)} s`;
  const m = s / 60;
  if (m < 60) return `${m.toFixed(m < 10 ? 1 : 0)} min`;
  return `${(m / 60).toFixed(1)} h`;
}

export function formatPct(value: number): string {
  return `${Math.round(value)}%`;
}

function toolCallsOf(record: ConversationRecord): string[] {
  if (record.message.type !== "ai") return [];
  return (record.message.tool_calls ?? []).map((t) => t.name);
}

export interface LeadMetrics {
  sessionId: string;
  displayPhone: string;
  stage: LeadStage;
  stageIndex: number;
  escalated: boolean;
  status: SessionSummary["status"];
  messageCount: number;
  humanMessages: number;
  aiMessages: number;
  firstTimestamp: string;
  lastTimestamp: string;
  /** Días (local) con al menos una interacción. */
  days: string[];
  botResponseCount: number;
  botResponseTotalMs: number;
  avgBotResponseMs: number | null;
  tools: string[];
}

export function analyzeSession(s: SessionSummary): LeadMetrics {
  const records = s.records;
  let stage: LeadStage = "contacto";
  let escalated = s.status === "human_active";
  let humanMessages = 0;
  let aiMessages = 0;
  let botResponseCount = 0;
  let botResponseTotalMs = 0;
  const days = new Set<string>();
  const tools: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    days.add(localDayKey(r.created_at));

    if (r.message.type === "human") {
      humanMessages++;
      const next = records[i + 1];
      // Tiempo de respuesta solo cuando el bot atiende ambos lados del turno.
      if (
        next &&
        next.message.type === "ai" &&
        r.status === "bot" &&
        next.status === "bot"
      ) {
        const dt =
          new Date(next.created_at).getTime() - new Date(r.created_at).getTime();
        if (dt >= 0) {
          botResponseCount++;
          botResponseTotalMs += dt;
        }
      }
    } else if (r.message.type === "ai") {
      aiMessages++;
      for (const name of toolCallsOf(r)) {
        tools.push(name);
        if (name === ESCALATION_TOOL) escalated = true;
        const next = STAGE_BY_TOOL[name];
        if (next && stageIndex(next) > stageIndex(stage)) stage = next;
      }
    }
  }

  return {
    sessionId: s.sessionId,
    displayPhone: s.displayPhone,
    stage,
    stageIndex: stageIndex(stage),
    escalated,
    status: s.status,
    messageCount: s.messageCount,
    humanMessages,
    aiMessages,
    firstTimestamp: records[0]?.created_at ?? s.lastTimestamp,
    lastTimestamp: s.lastTimestamp,
    days: [...days].sort(),
    botResponseCount,
    botResponseTotalMs,
    avgBotResponseMs: botResponseCount ? botResponseTotalMs / botResponseCount : null,
    tools,
  };
}

export interface FunnelStep {
  key: LeadStage;
  label: string;
  short: string;
  count: number;
  pctOfTotal: number;
  /** % respecto a la etapa anterior; null en la primera. */
  pctOfPrev: number | null;
}

export interface DayPoint {
  day: string;
  label: string;
  sessions: number;
  messages: number;
}

export interface DashboardMetrics {
  leads: LeadMetrics[];
  totalLeads: number;
  totalMessages: number;
  quoted: number;
  paymentStarted: number;
  closed: number;
  conversionPct: number;
  escalated: number;
  escalationPct: number;
  humanActive: number;
  avgMessages: number;
  avgBotResponseMs: number | null;
  funnel: FunnelStep[];
  perDay: DayPoint[];
  perHour: { hour: number; messages: number }[];
  toolUsage: { name: string; count: number }[];
}

export interface DayRange {
  /** Inclusive, clave local YYYY-MM-DD. Sin valor = sin límite. */
  from?: string;
  to?: string;
}

export function filterRecordsByRange(
  records: ConversationRecord[],
  range: DayRange,
): ConversationRecord[] {
  if (!range.from && !range.to) return records;
  return records.filter((r) => {
    const k = localDayKey(r.created_at);
    return (!range.from || k >= range.from) && (!range.to || k <= range.to);
  });
}

export function computeDashboardMetrics(
  records: ConversationRecord[],
  range: DayRange = {},
): DashboardMetrics {
  const filtered = filterRecordsByRange(records, range);
  const sessions = groupBySession(filtered);
  const leads = sessions.map(analyzeSession);

  const totalLeads = leads.length;
  const countAtLeast = (idx: number) =>
    leads.filter((l) => l.stageIndex >= idx).length;

  const funnel: FunnelStep[] = LEAD_STAGES.map((s, i) => {
    const count = countAtLeast(i);
    const prev = i === 0 ? null : countAtLeast(i - 1);
    return {
      ...s,
      count,
      pctOfTotal: totalLeads ? (count / totalLeads) * 100 : 0,
      pctOfPrev: prev === null ? null : prev ? (count / prev) * 100 : 0,
    };
  });

  const quoted = countAtLeast(1);
  const paymentStarted = countAtLeast(2);
  const closed = countAtLeast(3);
  const escalated = leads.filter((l) => l.escalated).length;
  const humanActive = leads.filter((l) => l.status === "human_active").length;
  const totalMessages = leads.reduce((n, l) => n + l.messageCount, 0);
  const respCount = leads.reduce((n, l) => n + l.botResponseCount, 0);
  const respTotal = leads.reduce((n, l) => n + l.botResponseTotalMs, 0);

  // Serie diaria: rellena días sin actividad para que el eje sea continuo.
  const dayMap = new Map<string, { sessions: Set<string>; messages: number }>();
  for (const r of filtered) {
    const k = localDayKey(r.created_at);
    const entry = dayMap.get(k) ?? { sessions: new Set<string>(), messages: 0 };
    entry.sessions.add(r.session_id);
    entry.messages++;
    dayMap.set(k, entry);
  }
  const knownDays = [...dayMap.keys()].sort();
  const start = range.from ?? knownDays[0];
  const end = range.to ?? knownDays[knownDays.length - 1];
  const perDay: DayPoint[] = [];
  if (start && end && start <= end) {
    for (let k = start; k <= end; k = shiftDayKey(k, 1)) {
      const e = dayMap.get(k);
      perDay.push({
        day: k,
        label: formatDayLabel(k, { day: "numeric", month: "short" }),
        sessions: e?.sessions.size ?? 0,
        messages: e?.messages ?? 0,
      });
      if (perDay.length > 366) break;
    }
  }

  const perHour = Array.from({ length: 24 }, (_, hour) => ({ hour, messages: 0 }));
  for (const r of filtered) {
    if (r.message.type !== "human") continue;
    perHour[new Date(r.created_at).getHours()].messages++;
  }

  const toolCounts = new Map<string, number>();
  for (const l of leads) {
    for (const t of l.tools) toolCounts.set(t, (toolCounts.get(t) ?? 0) + 1);
  }
  const toolUsage = [...toolCounts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    leads,
    totalLeads,
    totalMessages,
    quoted,
    paymentStarted,
    closed,
    conversionPct: totalLeads ? (closed / totalLeads) * 100 : 0,
    escalated,
    escalationPct: totalLeads ? (escalated / totalLeads) * 100 : 0,
    humanActive,
    avgMessages: totalLeads ? totalMessages / totalLeads : 0,
    avgBotResponseMs: respCount ? respTotal / respCount : null,
    funnel,
    perDay,
    perHour,
    toolUsage,
  };
}
