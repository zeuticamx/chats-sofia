import { NextResponse } from "next/server";
import type { ConversationRecord } from "@/lib/types";

const N8N_WEBHOOK_URL =
  "https://n8n-n8n.i4mjht.easypanel.host/webhook/agenteSofi";

export async function GET() {
  const res = await fetch(N8N_WEBHOOK_URL, { cache: "no-store" });

  if (!res.ok) {
    return NextResponse.json(
      { error: `n8n webhook respondió ${res.status}` },
      { status: 502 },
    );
  }

  const data: ConversationRecord[] = await res.json();
  return NextResponse.json(data);
}
