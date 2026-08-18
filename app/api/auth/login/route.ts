import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { usuario, password } = payload;

    if (!usuario || !password) {
      return NextResponse.json(
        { error: "usuario y password requeridos" },
        { status: 400 },
      );
    }

    const LOGIN_URL = process.env.LOGIN_ZEUTICA;
    if (!LOGIN_URL) {
      return NextResponse.json(
        { error: "LOGIN_ZEUTICA no configurada" },
        { status: 500 },
      );
    }

    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `credenciales inválidas (${res.status})` },
        { status: res.status === 401 ? 401 : 502 },
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
