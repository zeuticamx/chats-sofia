import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { wa_id } = payload;

    if (!wa_id) {
      return NextResponse.json({ error: "wa_id requerido" }, { status: 400 });
    }

    const body = { wa_id };
    const HANDLE_AI_URL = process.env.NEXT_PUBLIC_HANDLE_AI_URL;
    if (!HANDLE_AI_URL) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_HANDLE_AI_URL no configurada" },
        { status: 500 },
      );
    }

    const res = await fetch(HANDLE_AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `respuesta ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "error desconocido" },
      { status: 500 },
    );
  }
}
