"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded p-1 text-text-600 hover:bg-bg-800 hover:text-text-100"
      aria-label="Copiar código"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}
