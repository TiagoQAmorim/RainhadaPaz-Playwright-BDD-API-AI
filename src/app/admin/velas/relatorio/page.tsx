import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CandleReportControls } from "@/components/admin/CandleReportControls";
import { adminCard } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import {
  candleReportFilterLabel,
  filterCandleReportRows,
  parseCandleReportFilter,
  parseReportDayEnd,
  parseReportDayStart,
  toCandleReportRows,
} from "@/lib/candle-report";
import { prisma } from "@/lib/prisma";
import { getCandleDurationHours, getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Relatório de velas" };

function formatDateTime(d: Date) {
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

type Props = {
  searchParams: Promise<{ filtro?: string; de?: string; ate?: string }>;
};

export default async function AdminVelasRelatorioPage({ searchParams }: Props) {
  if (!(await getSessionAdmin())) redirect("/admin/login");

  const sp = await searchParams;
  const filtro = parseCandleReportFilter(sp.filtro);
  const deRaw = sp.de?.trim() ?? "";
  const ateRaw = sp.ate?.trim() ?? "";

  const [settings, durationHours, candles] = await Promise.all([
    getSiteSettings(),
    getCandleDurationHours(),
    prisma.virtualCandle.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const allRows = toCandleReportRows(candles, durationHours);

  let periodWarning: string | null = null;
  let period: { from: Date; to: Date } | undefined;
  if (filtro === "periodo") {
    const from = parseReportDayStart(deRaw);
    const to = parseReportDayEnd(ateRaw);
    if (!from || !to) {
      periodWarning = "Informe as datas “De” e “Até” e clique em Aplicar filtro.";
    } else if (from.getTime() > to.getTime()) {
      periodWarning = "A data inicial não pode ser posterior à data final.";
    } else {
      period = { from, to };
    }
  }

  const rows =
    filtro === "periodo" && !period ? [] : filterCandleReportRows(allRows, filtro, period);
  const filterLabel = candleReportFilterLabel(filtro, deRaw, ateRaw);
  const generatedAt = new Date();

  return (
    <div className="space-y-4">
      <Suspense fallback={<p className="print:hidden text-sm text-parish-600">Carregando filtros…</p>}>
        <CandleReportControls />
      </Suspense>

      {periodWarning ? (
        <p className="print:hidden rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {periodWarning}
        </p>
      ) : null}

      <section
        id="candle-report"
        className={`${adminCard} candle-report-print text-sm print:max-w-none print:border-0 print:shadow-none print:p-0`}
      >
        <header className="mb-6 border-b border-parish-200 pb-4 print:mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-parish-500 print:text-black">
            Relatório de velas virtuais
          </p>
          <h1 className="mt-1 text-xl font-semibold text-parish-900 print:text-lg">
            {settings.parishName}
          </h1>
          <p className="mt-2 text-xs text-parish-600 print:text-black">
            Gerado em {formatDateTime(generatedAt)} · Filtro: <strong>{filterLabel}</strong> ·{" "}
            {rows.length} registro(s)
          </p>
          <p className="mt-1 text-xs text-parish-500 print:text-black">
            Coluna &quot;Ativa&quot; = vela acesa no mural no momento da geração do relatório.
          </p>
        </header>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="candle-report-table w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-parish-300 bg-parish-50 print:bg-white">
                <th className="px-2 py-2 font-semibold">Data</th>
                <th className="px-2 py-2 font-semibold">Nome</th>
                <th className="px-2 py-2 font-semibold">E-mail</th>
                <th className="px-2 py-2 font-semibold">Intenção</th>
                <th className="px-2 py-2 font-semibold">Oração</th>
                <th className="px-2 py-2 font-semibold text-center">Ativa</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-parish-500">
                    Nenhuma vela encontrada com este filtro.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-parish-100 align-top print:break-inside-avoid">
                    <td className="whitespace-nowrap px-2 py-2">{formatDateTime(r.date)}</td>
                    <td className="px-2 py-2 font-medium">{r.donorName}</td>
                    <td className="max-w-[10rem] break-all px-2 py-2 text-xs">{r.email ?? "—"}</td>
                    <td className="max-w-xs px-2 py-2">{r.intention}</td>
                    <td className="max-w-sm px-2 py-2 text-xs">{r.prayer ?? "—"}</td>
                    <td className="px-2 py-2 text-center font-semibold">
                      {r.activeOnMural ? "Sim" : "Não"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
