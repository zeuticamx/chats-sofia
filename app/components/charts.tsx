"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* utilidades                                                          */
/* ------------------------------------------------------------------ */

export function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(Math.round(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width] as const;
}

/** Paso "redondo" (1 / 2 / 5 × 10^n) para los ticks del eje Y. */
function niceStep(rough: number): number {
  if (rough <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const f = rough / pow;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return m * pow;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

/** Columna con extremo superior redondeado (4px) y base cuadrada. */
function columnPath(x: number, yTop: number, w: number, h: number, r: number) {
  if (h <= 0 || w <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  const base = yTop + h;
  return [
    `M${x},${base}`,
    `V${yTop + rr}`,
    `Q${x},${yTop} ${x + rr},${yTop}`,
    `H${x + w - rr}`,
    `Q${x + w},${yTop} ${x + w},${yTop + rr}`,
    `V${base}`,
    "Z",
  ].join(" ");
}

const fmtInt = new Intl.NumberFormat("es-MX");

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

function ChartTooltip({
  x,
  y,
  width,
  value,
  label,
  rows,
}: {
  x: number;
  y: number;
  width: number;
  value: string;
  label: string;
  rows?: { label: string; value: string }[];
}) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 min-w-24 rounded-md border border-bg-700 bg-bg-950 px-2.5 py-1.5 shadow-lg"
      style={{
        left: clamp(x, 70, Math.max(70, width - 70)),
        top: Math.max(0, y - 8),
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="text-sm font-semibold text-text-100">{value}</div>
      <div className="font-mono text-[11px] text-text-600">{label}</div>
      {rows?.map((r) => (
        <div
          key={r.label}
          className="mt-0.5 flex justify-between gap-3 font-mono text-[11px] text-text-400"
        >
          <span>{r.label}</span>
          <span className="tabular-nums text-text-100">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ColumnChart — serie única, magnitud por período/categoría           */
/* ------------------------------------------------------------------ */

export interface ColumnDatum {
  key: string;
  label: string;
  value: number;
  /** Filas extra para el tooltip (otras medidas del mismo punto). */
  rows?: { label: string; value: string }[];
}

const PAD = { top: 18, right: 8, bottom: 22, left: 36 };
const MAX_BAR = 24;
const RADIUS = 4;

export function ColumnChart({
  data,
  height = 200,
  ariaLabel,
  formatValue = (v) => fmtInt.format(v),
  labelEvery,
}: {
  data: ColumnDatum[];
  height?: number;
  ariaLabel: string;
  formatValue?: (v: number) => string;
  /** Mostrar etiqueta del eje X cada N columnas (auto según ancho). */
  labelEvery?: number;
}) {
  const [ref, width] = useContainerWidth();
  const [hover, setHover] = useState<number | null>(null);

  const n = data.length;
  const max = data.reduce((m, d) => Math.max(m, d.value), 0);
  const step = niceStep(Math.max(max, 1) / 4);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const slot = n ? plotW / n : 0;
  const barW = Math.min(MAX_BAR, Math.max(2, slot * 0.6));
  const yOf = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const cxOf = (i: number) => PAD.left + slot * i + slot / 2;
  const every =
    labelEvery ??
    Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotW / 44))));
  const maxIndex = max > 0 ? data.findIndex((d) => d.value === max) : -1;

  const hovered = hover !== null ? data[hover] : null;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          className="block select-none"
        >
          {/* grilla + ticks */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={yOf(t)}
                y2={yOf(t)}
                stroke="var(--grid)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={PAD.left - 6}
                y={yOf(t)}
                dy="0.35em"
                textAnchor="end"
                fontSize={10}
                fontFamily="var(--font-geist-mono)"
                fill="var(--text-600)"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatValue(t)}
              </text>
            </g>
          ))}

          {/* columnas */}
          {data.map((d, i) => {
            const cx = cxOf(i);
            const yTop = yOf(d.value);
            const h = PAD.top + plotH - yTop;
            const isHover = hover === i;
            return (
              <g key={d.key}>
                {d.value > 0 && (
                  <path
                    d={columnPath(cx - barW / 2, yTop, barW, h, RADIUS)}
                    fill="var(--series-1)"
                    fillOpacity={isHover ? 0.75 : 1}
                    style={{ transition: "fill-opacity 150ms" }}
                  />
                )}
                {i === maxIndex && !isHover && (
                  <text
                    x={cx}
                    y={yTop - 5}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="var(--font-geist-mono)"
                    fill="var(--text-400)"
                  >
                    {formatValue(d.value)}
                  </text>
                )}
                {i % every === 0 && (
                  <text
                    x={cx}
                    y={height - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily="var(--font-geist-mono)"
                    fill="var(--text-600)"
                  >
                    {d.label}
                  </text>
                )}
                {/* área de hit: todo el slot, foco por teclado */}
                <rect
                  x={PAD.left + slot * i}
                  y={PAD.top}
                  width={Math.max(slot, 1)}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${d.label}: ${formatValue(d.value)}`}
                  className="cursor-pointer outline-none focus-visible:stroke-series-1"
                  strokeWidth={1}
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>
      )}

      {hovered && hover !== null && (
        <ChartTooltip
          x={cxOf(hover)}
          y={yOf(hovered.value)}
          width={width}
          value={formatValue(hovered.value)}
          label={hovered.label}
          rows={hovered.rows}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FunnelBars — etapas ordenadas, rampa ordinal                        */
/* ------------------------------------------------------------------ */

export function FunnelBars({
  stages,
}: {
  stages: {
    key: string;
    label: string;
    count: number;
    pctOfTotal: number;
    pctOfPrev: number | null;
  }[];
}) {
  return (
    <ol className="flex flex-col gap-3" aria-label="Embudo de leads">
      {stages.map((s, i) => (
        <li key={s.key} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-text-400">{s.label}</span>
            <span className="font-mono text-xs tabular-nums text-text-100">
              {fmtInt.format(s.count)}
              <span className="ml-1.5 text-text-600">
                {Math.round(s.pctOfTotal)}%
              </span>
            </span>
          </div>
          <div
            className="h-5 w-full rounded-sm bg-bg-900"
            role="img"
            aria-label={`${s.label}: ${s.count} (${Math.round(s.pctOfTotal)}% del total)`}
          >
            <div
              className="h-full rounded-sm transition-[width] duration-300 motion-reduce:transition-none"
              style={{
                width: `${Math.max(s.count > 0 ? 1.5 : 0, s.pctOfTotal)}%`,
                backgroundColor: `var(--ord-${Math.min(i + 1, 4)})`,
              }}
            />
          </div>
          {s.pctOfPrev !== null && (
            <span className="font-mono text-[11px] text-text-600">
              {Math.round(s.pctOfPrev)}% de la etapa anterior
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* BarList — barras horizontales para categorías nominales             */
/* ------------------------------------------------------------------ */

export function BarList({
  items,
  emptyText = "sin datos",
}: {
  items: { name: string; count: number }[];
  emptyText?: string;
}) {
  const max = items.reduce((m, i) => Math.max(m, i.count), 0);
  if (items.length === 0) {
    return <p className="font-mono text-xs text-text-600">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it) => (
        <li key={it.name} className="grid grid-cols-[minmax(0,11rem)_1fr_3rem] items-center gap-3">
          <span className="truncate font-mono text-[11px] text-text-400" title={it.name}>
            {it.name}
          </span>
          <div className="h-3 w-full rounded-sm bg-bg-900">
            <div
              className="h-full rounded-sm bg-series-1"
              style={{ width: `${max ? (it.count / max) * 100 : 0}%` }}
            />
          </div>
          <span className="text-right font-mono text-xs tabular-nums text-text-100">
            {fmtInt.format(it.count)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* ChartTable — vista en tabla (gemela accesible de cada gráfico)      */
/* ------------------------------------------------------------------ */

export function ChartTable({
  columns,
  rows,
  summary = "ver datos en tabla",
}: {
  columns: string[];
  rows: ReactNode[][];
  summary?: string;
}) {
  return (
    <details className="mt-3">
      <summary className="cursor-pointer select-none font-mono text-[11px] text-text-600 hover:text-text-100">
        {summary}
      </summary>
      <div className="mt-2 max-h-56 overflow-auto rounded border border-bg-700">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-bg-900">
            <tr>
              {columns.map((c, i) => (
                <th
                  key={c}
                  className={cn(
                    "px-2 py-1.5 text-left font-medium text-text-400",
                    i > 0 && "text-right",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-t border-bg-800">
                {r.map((cell, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "px-2 py-1 font-mono text-text-100",
                      ci > 0 && "text-right tabular-nums",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
