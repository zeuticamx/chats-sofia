"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  extractToken,
  getStoredUsuario,
  setStoredToken,
  setStoredUsuario,
} from "@/lib/auth";
import Image from 'next/image';


export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getStoredUsuario()) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.trim(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? `error ${res.status}`);
      }
      const token = extractToken(data);
      if (token) setStoredToken(token);
      setStoredUsuario(usuario.trim());
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden">
      <Image
        src="/imagenes/banner_login.png"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-bg-950/40" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-bg-700 bg-bg-900/90 p-8 shadow-xl backdrop-blur-md">
        <span className="font-mono text-xs text-text-400">Empresa X</span>
        <h1 className="mt-2 text-2xl font-medium text-text-100">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-sm text-text-400">
          Portal para auditoría de agente AI
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="usuario" className="text-xs text-text-400">
              Usuario
            </label>
            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              disabled={loading}
              placeholder="usuario"
              className="rounded-md border border-bg-700 bg-bg-900 px-3 py-2 text-sm text-text-100 placeholder:text-text-600 focus:outline-none focus:border-bg-600 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs text-text-400">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              placeholder="••••••••"
              className="rounded-md border border-bg-700 bg-bg-900 px-3 py-2 text-sm text-text-100 placeholder:text-text-600 focus:outline-none focus:border-bg-600 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-[11px] text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !usuario.trim() || !password.trim()}
            className="mt-2 flex items-center justify-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-medium text-bg-950 hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
