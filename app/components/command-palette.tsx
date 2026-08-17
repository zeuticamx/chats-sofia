"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { Search } from "lucide-react";

interface ConversationItem {
  id: string;
  title: string;
  meta: string;
}

export function CommandPalette({ items }: { items: ConversationItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex w-56 items-center gap-2 rounded border border-bg-700 bg-bg-900 px-2.5 py-1.5 text-left text-xs text-text-600 hover:border-bg-600">
          <Search size={13} />
          <span className="flex-1">Buscar conversaciones…</span>
          <kbd className="font-mono text-[10px] text-text-600">⌘K</kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed top-24 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border border-bg-700 bg-bg-900 shadow-xl">
          <Dialog.Title className="sr-only">
            Buscar conversaciones
          </Dialog.Title>
          <Command className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-bg-700 px-3">
              <Search size={14} className="text-text-600" />
              <Command.Input
                autoFocus
                placeholder="Filtrar por contacto, teléfono o estado…"
                className="w-full bg-transparent py-3 font-mono text-sm text-text-100 outline-none placeholder:text-text-600"
              />
            </div>
            <Command.List className="max-h-80 overflow-y-auto p-1.5">
              <Command.Empty className="px-3 py-6 text-center text-xs text-text-600">
                Sin resultados.
              </Command.Empty>
              <Command.Group>
                {items.map((item) => (
                  <Command.Item
                    key={item.id}
                    onSelect={() => setOpen(false)}
                    className="flex cursor-pointer items-center justify-between rounded px-2.5 py-2 text-sm text-text-100 data-[selected=true]:bg-bg-800"
                  >
                    <span>{item.title}</span>
                    <span className="font-mono text-xs text-text-600">
                      {item.meta}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
