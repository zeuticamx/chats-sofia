"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  ChevronDown,
  LogOut,
  MessagesSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearStoredUsuario } from "@/lib/auth";
import { setStoredTheme, useStoredTheme } from "@/lib/theme";
import { countUnread, useAlertasState } from "@/lib/notifications";
import { Badge } from "./badge";

const NAV_ITEMS = [
  { icon: MessagesSquare, label: "Conversaciones", href: "/" },
  { icon: AlertTriangle, label: "Alertas", href: "/alertas" },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const theme = useStoredTheme();
  const isLight = theme === "light";
  const { alertas } = useAlertasState();
  const unread = countUnread(alertas);

  useEffect(() => {
    document.documentElement.classList.toggle("light", isLight);
  }, [isLight]);

  const handleLogout = () => {
    clearStoredUsuario();
    setConfirmOpen(false);
    router.replace("/login");
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-bg-700 bg-bg-900 transition-[width] duration-150",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className="flex items-center justify-between px-3 py-3">
        {!collapsed && (
          <span className="font-mono text-xs text-text-400">Global AI</span>
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

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          const showBadge = href === "/alertas" && unread > 0;

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded px-2 py-1.5 text-sm",
                active
                  ? "bg-bg-800 text-text-100"
                  : "text-text-400 hover:bg-bg-800 hover:text-text-100",
              )}
            >
              <span className="relative shrink-0">
                <Icon size={16} />
                {showBadge && collapsed && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-danger" />
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {showBadge && (
                    <Badge tone="danger">{unread > 99 ? "99+" : unread}</Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}

        <button
          onClick={() => setSettingsOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded px-2 py-1.5 text-sm text-text-400 hover:bg-bg-800 hover:text-text-100"
          aria-expanded={settingsOpen}
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Configuración</span>
              <ChevronDown
                size={14}
                className={cn(
                  "shrink-0 transition-transform",
                  settingsOpen && "rotate-180",
                )}
              />
            </>
          )}
        </button>

        {settingsOpen && !collapsed && (
          <div className="ml-2 flex flex-col border-l border-bg-700 pl-3">
            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
              <span className="flex items-center gap-2 text-sm text-text-400">
                {isLight ? <Sun size={14} /> : <Moon size={14} />}
                Tema {isLight ? "claro" : "oscuro"}
              </span>
              <button
                role="switch"
                aria-checked={isLight}
                aria-label="Cambiar entre tema claro y oscuro"
                onClick={() => setStoredTheme(isLight ? "dark" : "light")}
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full border border-bg-600 transition-colors",
                  isLight ? "bg-text-400" : "bg-bg-800",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-text-100 transition-transform",
                    isLight && "translate-x-4",
                  )}
                />
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-bg-700 px-2 py-2">
        <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
          <Dialog.Trigger asChild>
            <button
              className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-sm text-text-400 hover:bg-bg-800 hover:text-danger"
              aria-label="Cerrar sesión"
            >
              <LogOut size={16} className="shrink-0" />
              {!collapsed && <span>Cerrar sesión</span>}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-bg-700 bg-bg-900 p-5 shadow-xl">
              <Dialog.Title className="text-sm font-medium text-text-100">
                ¿Estás seguro de salir de sesión?
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-xs text-text-400">
                Vas a tener que volver a iniciar sesión para acceder al panel.
              </Dialog.Description>
              <div className="mt-5 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button className="rounded-md border border-bg-700 px-3 py-1.5 text-xs font-medium text-text-100 hover:bg-bg-800">
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-text-100 hover:opacity-90"
                >
                  Cerrar sesión
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </aside>
  );
}
