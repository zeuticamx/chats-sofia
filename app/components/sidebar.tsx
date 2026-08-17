"use client";

import { useState } from "react";
import {
  AlertTriangle,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: MessagesSquare, label: "Conversaciones" },
  { icon: AlertTriangle, label: "Alertas" },
  { icon: Settings, label: "Config" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-bg-700 bg-bg-900 transition-[width] duration-150",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className="flex items-center justify-between px-3 py-3">
        {!collapsed && (
          <span className="font-mono text-xs text-text-400">Empresa X</span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="rounded p-1 text-text-400 hover:bg-bg-800 hover:text-text-100"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <PanelLeftClose size={16} />
          )}
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-2.5 rounded px-2 py-1.5 text-sm text-text-400 hover:bg-bg-800 hover:text-text-100"
          >
            <Icon size={16} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
