import type { ReactNode } from "react";
import { MessageBubble } from "./message-bubble";
import { AuditNote } from "./audit-note";

export type ThreadItem =
  | {
      type: "message";
      from: "contact" | "bot" | "human";
      timestamp: string;
      meta?: string;
      content: ReactNode;
    }
  | {
      type: "audit";
      tone?: "neutral" | "warning" | "danger";
      timestamp: string;
      content: ReactNode;
    };

export function ThreadViewer({ items }: { items: ThreadItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) =>
        item.type === "message" ? (
          <MessageBubble
            key={i}
            from={item.from}
            timestamp={item.timestamp}
            meta={item.meta}
          >
            {item.content}
          </MessageBubble>
        ) : (
          <AuditNote key={i} tone={item.tone} timestamp={item.timestamp}>
            {item.content}
          </AuditNote>
        ),
      )}
    </div>
  );
}
