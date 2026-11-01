"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { adminInput } from "@/components/admin/AdminFormStyles";
import { parseCandleReportFilter, type CandleReportFilter } from "@/lib/candle-report";

const options: { value: CandleReportFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "ativas", label: "Ativas no mural" },
  { value: "inativas", label: "Inativas no mural" },
  { value: "periodo", label: "Por período" },
];

export function CandleReportControls() {
  const searchParams = useSearchParams();
  const initial = parseCandleReportFilter(searchParams.get("filtro") ?? undefined);
  const [filtro, setFiltro] = useState<CandleReportFilter>(initial);
  const de = searchParams.get("de") ?? "";
  const ate = searchParams.get("ate") ?? "";

  return (
    <div className="print:hidden mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/velas"
          className="text-sm font-semibold text-parish-600 hover:text-parish-800"
        >
          ← Voltar às velas
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-parish-600 px-4 py-2 text-sm font-semibold text-white hover:bg-parish-500"
        >
          Exportar PDF (imprimir)
        </button>
      </div>

      <form
        method="get"
        action="/admin/velas/relatorio"
        className="rounded-2xl border border-parish-200 bg-white p-4 shadow-sm"
      >
        <p className="text-sm font-semibold text-parish-900">Filtrar relatório</p>
        <fieldset className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {options.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="filtro"
                value={opt.value}
                checked={filtro === opt.value}
                onChange={() => setFiltro(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </fieldset>

        {filtro === "periodo" ? (
          <div className="mt-4 grid max-w-md gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-parish-700">De</label>
              <input type="date" name="de" defaultValue={de} className={adminInput} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-parish-700">Até</label>
              <input type="date" name="ate" defaultValue={ate} className={adminInput} required />
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-xl border border-parish-300 bg-parish-50 px-4 py-2 text-sm font-semibold text-parish-800 hover:bg-parish-100"
          >
            Aplicar filtro
          </button>
          <Link
            href="/admin/velas/relatorio"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-parish-600 hover:text-parish-900"
          >
            Limpar
          </Link>
        </div>
      </form>

      <p className="text-xs text-parish-500">
        Escolha o filtro, clique em <strong>Aplicar filtro</strong> e depois em{" "}
        <strong>Exportar PDF</strong>. Na impressão, use <strong>Salvar como PDF</strong>.
      </p>
    </div>
  );
}
