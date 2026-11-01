"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Falha no login.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-parish-900">Entrar no painel</h1>
      <p className="mt-2 text-sm text-parish-700">
        Use o e-mail e senha configurados no servidor (variáveis de ambiente).
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-parish-200 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Senha</label>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-xl border border-parish-200 px-3 py-2"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-parish-600 py-2.5 font-semibold text-white hover:bg-parish-500 disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
