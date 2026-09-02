"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Sidebar } from "./sidebar";
import { StatCard } from "./stat-card";
import { StatusBadge } from "./status";
import { BarList, ChartTable, ColumnChart, FunnelBars } from "./charts";
import { cn } from "@/lib/utils";
import { useStoredUsuario } from "@/lib/auth";
import { useConversationRecords } from "@/lib/use-conversations";
import { relativeTime } from "@/lib/relative-time";
import {
  LEAD_STAGES,
  computeDashboardMetrics,
  formatDayLabel,
  formatDuration,
  formatPct,
  shiftDayKey,
  todayKey,
  type DayRange,
} from "@/lib/metrics";

type Preset = "today" | "7d" | "30d" | "all" | "custom";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "all", label: "Todo" },
];

function rangeForPreset(preset: Preset, custom: DayRange): DayRange {
  const today = todayKey();
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: shiftDayKey(today, -6), to: today };
    case "30d":
      return { from: shiftDayKey(today, -29), to: today };
    case "all":
      return {};
    case "custom":
      return custom;
  }
}

const fmtInt = new Intl.NumberFormat("es-MX");

function Card({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-md border border-bg-700 bg-bg-800 p-4",
        className,
      )}
    >
      <header className="mb-3">
        <h2 className="text-sm font-medium text-text-100">{title}</h2>
        {subtitle && (
          <p className="font-mono text-[11px] text-text-600">{subtitle}</p>
        )}
      </header>
      {children}
    </section>
  );
}

export function LeadsDashboard() {
  const router = useRouter();
  const usuario = useStoredUsuario();
  const { records, error } = useConversationRecords();
  const [preset, setPreset] = useState<Preset>("7d");
  const [custom, setCustom] = useState<DayRange>({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (usuario === null) router.replace("/login");
  }, [usuario, router]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const range = useMemo(() => rangeForPreset(preset, custom), [preset, custom]);
  const metrics = useMemo(
    () => computeDashboardMetrics(records ?? [], range),
    [records, range],
  );

  if (usuario === null) {
    return (
      <div className="flex flex-1 items-center justify-center font-mono text-xs text-text-600">
        verificando sesión…
      </div>
    );
  }

  const rangeLabel =
    range.from && range.to
      ? range.from === range.to
        ? formatDayLabel(range.from)
        : `${formatDayLabel(range.from)} – ${formatDayLabel(range.to)}`
      : "todo el historial";

  const leadsSorted = [...metrics.leads].sort(
    (a, b) =>
      new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime(),
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-bg-700 px-6 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-medium text-text-100">Dashboard de leads</h1>
            <span className="font-mono text-xs text-text-600">{rangeLabel}</span>
          </div>

          {/* Fila única de filtros: alcanza a todo lo que está debajo. */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="radiogroup"
              aria-label="Rango de fechas"
              className="flex overflow-hidden rounded-md border border-bg-700"
            >
              {PRESETS.map((p) => {
                const active = preset === p.key;
                return (
                  <button
                    key={p.key}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPreset(p.key)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-bg-800 text-text-100"
                        : "text-text-400 hover:bg-bg-800 hover:text-text-100",
                    )}
                  >
                    {active && <Check size={12} strokeWidth={3} />}
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-600">
              <label className="sr-only" htmlFor="range-from">
                Desde
              </label>
              <input
                id="range-from"
                type="date"
                value={preset === "custom" ? (custom.from ?? "") : (range.from ?? "")}
                max={todayKey()}
                onChange={(e) => {
                  setCustom((c) => ({ ...c, from: e.target.value || undefined }));
                  setPreset("custom");
                }}
                className="rounded border border-bg-700 bg-bg-900 px-2 py-1 text-text-100 focus:border-bg-500 focus:outline-none"
              />
              <span aria-hidden>–</span>
              <label className="sr-only" htmlFor="range-to">
                Hasta
              </label>
              <input
                id="range-to"
                type="date"
                value={preset === "custom" ? (custom.to ?? "") : (range.to ?? "")}
                max={todayKey()}
                onChange={(e) => {
                  setCustom((c) => ({ ...c, to: e.target.value || undefined }));
                  setPreset("custom");
                }}
                className="rounded border border-bg-700 bg-bg-900 px-2 py-1 text-text-100 focus:border-bg-500 focus:outline-none"
              />
            </div>
          </div>
        </header>

        {error && (
          <div className="mx-6 mt-4 rounded-md border border-danger/40 bg-bg-800 px-4 py-3 font-mono text-xs text-danger">
            error al leer /api/conversations: {error}
          </div>
        )}

        <div
          className={cn(
            "flex-1 overflow-y-auto p-4 transition-opacity duration-300",
            records === null && "opacity-50",
          )}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <StatCard
                label="Leads"
                value={fmtInt.format(metrics.totalLeads)}
                hint={`${fmtInt.format(metrics.totalMessages)} mensajes`}
              />
              <StatCard
                label="Cotizaciones enviadas"
                value={fmtInt.format(metrics.quoted)}
                hint={
                  metrics.totalLeads
                    ? `${formatPct((metrics.quoted / metrics.totalLeads) * 100)} de leads`
                    : "—"
                }
              />
              <StatCard
                label="Cierres (pago verificado)"
                value={fmtInt.format(metrics.closed)}
                tone="success"
                hint={`${fmtInt.format(metrics.paymentStarted)} con datos de pago`}
              />
              <StatCard
                label="Tasa de conversión"
                value={formatPct(metrics.conversionPct)}
                tone={metrics.conversionPct >= 20 ? "success" : "neutral"}
                hint="cierres / leads"
              />
              <StatCard
                label="Escalados a humano"
                value={formatPct(metrics.escalationPct)}
                tone={metrics.escalationPct > 30 ? "warning" : "neutral"}
                hint={`${fmtInt.format(metrics.escalated)} leads · ${fmtInt.format(metrics.humanActive)} activos`}
              />
              <StatCard
                label="Respuesta del bot"
                value={formatDuration(metrics.avgBotResponseMs)}
                hint={`${metrics.avgMessages.toFixed(1)} msjs por lead`}
              />
            </div>

            {/* Tendencia + embudo */}
            <div className="grid gap-4 xl:grid-cols-3">
              <Card
                title="Leads activos por día"
                subtitle="sesiones con al menos una interacción ese día"
                className="xl:col-span-2"
              >
                {metrics.perDay.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ColumnChart
                    ariaLabel="Leads activos por día"
                    data={metrics.perDay.map((d) => ({
                      key: d.day,
                      label: d.label,
                      value: d.sessions,
                      rows: [{ label: "mensajes", value: fmtInt.format(d.messages) }],
                    }))}
                  />
                )}
                <ChartTable
                  columns={["Día", "Leads", "Mensajes"]}
                  rows={metrics.perDay.map((d) => [
                    formatDayLabel(d.day),
                    fmtInt.format(d.sessions),
                    fmtInt.format(d.messages),
                  ])}
                />
              </Card>

              <Card
                title="Embudo comercial"
                subtitle="etapa máxima alcanzada por cada lead"
              >
                {metrics.totalLeads === 0 ? (
                  <EmptyChart />
                ) : (
                  <FunnelBars stages={metrics.funnel} />
                )}
              </Card>
            </div>

            {/* Horario + herramientas */}
            <div className="grid gap-4 xl:grid-cols-3">
              <Card
                title="Mensajes de clientes por hora"
                subtitle="hora local · útil para dimensionar cobertura humana"
                className="xl:col-span-2"
              >
                {metrics.totalMessages === 0 ? (
                  <EmptyChart />
                ) : (
                  <ColumnChart
                    ariaLabel="Mensajes de clientes por hora del día"
                    height={180}
                    labelEvery={3}
                    data={metrics.perHour.map((h) => ({
                      key: String(h.hour),
                      label: `${String(h.hour).padStart(2, "0")}h`,
                      value: h.messages,
                    }))}
                  />
                )}
                <ChartTable
                  columns={["Hora", "Mensajes"]}
                  rows={metrics.perHour
                    .filter((h) => h.messages > 0)
                    .map((h) => [
                      `${String(h.hour).padStart(2, "0")}:00`,
                      fmtInt.format(h.messages),
                    ])}
                />
              </Card>

              <Card
                title="Herramientas usadas por el agente"
                subtitle="tool_calls en el rango"
              >
                <BarList items={metrics.toolUsage} emptyText="sin tool_calls en el rango" />
              </Card>
            </div>

            {/* Tabla de leads */}
            <Card
              title="Leads"
              subtitle={`${fmtInt.format(leadsSorted.length)} en el rango · ordenados por última interacción`}
            >
              {leadsSorted.length === 0 ? (
                <p className="font-mono text-xs text-text-600">
                  sin leads en el rango seleccionado
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-text-400">
                        <th className="px-2 py-1.5 font-medium">Lead</th>
                        <th className="px-2 py-1.5 font-medium">Etapa</th>
                        <th className="px-2 py-1.5 text-right font-medium">Msjs</th>
                        <th className="px-2 py-1.5 text-right font-medium">
                          Resp. bot
                        </th>
                        <th className="px-2 py-1.5 font-medium">Estado</th>
                        <th className="px-2 py-1.5 font-medium">Última interacción</th>
                        <th className="px-2 py-1.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {leadsSorted.map((l) => (
                        <tr
                          key={l.sessionId}
                          className="border-t border-bg-700 hover:bg-bg-900"
                        >
                          <td className="px-2 py-2">
                            <div className="text-text-100">{l.displayPhone}</div>
                            <div className="font-mono text-[11px] text-text-600">
                              {l.sessionId}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <span className="inline-flex items-center gap-1.5 text-text-100">
                              <span
                                aria-hidden
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: `var(--ord-${l.stageIndex + 1})`,
                                }}
                              />
                              {LEAD_STAGES[l.stageIndex].short}
                            </span>
                            {l.escalated && (
                              <span className="ml-2 font-mono text-[11px] text-warning">
                                escalado
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right font-mono tabular-nums text-text-100">
                            {l.messageCount}
                          </td>
                          <td className="px-2 py-2 text-right font-mono tabular-nums text-text-100">
                            {formatDuration(l.avgBotResponseMs)}
                          </td>
                          <td className="px-2 py-2">
                            <StatusBadge status={l.status} />
                          </td>
                          <td className="px-2 py-2 font-mono text-text-400">
                            {relativeTime(l.lastTimestamp, now)}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Link
                              href={`/?session=${encodeURIComponent(l.sessionId)}`}
                              className="inline-flex items-center gap-1 rounded border border-bg-700 px-2 py-1 text-[11px] font-medium text-text-100 hover:bg-bg-800"
                            >
                              Ver
                              <ArrowRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-40 items-center justify-center font-mono text-xs text-text-600">
      sin interacciones en el rango seleccionado
    </div>
  );
}
