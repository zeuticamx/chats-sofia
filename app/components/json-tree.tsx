"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function valueClass(v: JsonValue) {
  if (typeof v === "string") return "text-success";
  if (typeof v === "number") return "text-warning";
  if (typeof v === "boolean" || v === null) return "text-danger";
  return "text-text-400";
}

function JsonNode({
  label,
  value,
  depth,
}: {
  label: string;
  value: JsonValue;
  depth: number;
}) {
  const isObject = value !== null && typeof value === "object";
  const [open, setOpen] = useState(depth < 1);

  if (!isObject) {
    return (
      <div
        className="flex gap-1.5 py-0.5 font-mono text-xs"
        style={{ paddingLeft: depth * 14 }}
      >
        <span className="text-text-400">{label}:</span>
        <span className={valueClass(value)}>{JSON.stringify(value)}</span>
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 py-0.5 font-mono text-xs text-text-100 hover:bg-bg-800"
        style={{ paddingLeft: depth * 14 }}
      >
        <ChevronRight
          size={11}
          className={cn("shrink-0", open && "rotate-90")}
        />
        <span className="text-text-400">{label}</span>
        <span className="text-text-600">
          {Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>
      {open && (
        <div>
          {entries.map(([k, v]) => (
            <JsonNode key={k} label={k} value={v} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function JsonTreeView({
  data,
  rootLabel = "payload",
}: {
  data: JsonValue;
  rootLabel?: string;
}) {
  return (
    <div className="rounded-md border border-bg-700 bg-bg-900 p-2">
      <JsonNode label={rootLabel} value={data} depth={0} />
    </div>
  );
}
