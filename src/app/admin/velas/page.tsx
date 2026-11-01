import { redirect } from "next/navigation";
import { deleteCandle, extinguishCandle, updateCandleSettings } from "@/app/admin/actions";
import { adminBtn, adminCard, adminInput } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { isCandleActiveOnMural } from "@/lib/candle-report";
import { prisma } from "@/lib/prisma";
import { getCandleDurationHours, getSiteSettings } from "@/lib/settings";

export default async function AdminVelasPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const [candles, settings, durationHours] = await Promise.all([
    prisma.virtualCandle.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    getSiteSettings(),
    getCandleDurationHours(),
  ]);

  const durationLabel =
    settings.candleDurationUnit === "days"
      ? `${settings.candleDurationAmount} dia(s) (${durationHours}h no mural)`
      : `${settings.candleDurationAmount} hora(s)`;

  return (
    <div className="space-y-8">
      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Velas virtuais</h1>
        <p className="mt-1 text-sm text-parish-600">
          Duração atual no mural: <strong>{durationLabel}</strong>. Intenções e orações ficam em
          sigilo no mural público; a paróquia vê tudo aqui e por e-mail ao acender.
        </p>
        <form action={updateCandleSettings} className="mt-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Tempo no mural</label>
              <input
                type="number"
                name="candleDurationAmount"
                min={1}
                max={365}
                defaultValue={settings.candleDurationAmount}
                className={adminInput}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Unidade</label>
              <select
                name="candleDurationUnit"
                className={adminInput}
                defaultValue={settings.candleDurationUnit}
              >
                <option value="hours">Horas</option>
                <option value="days">Dias</option>
              </select>
            </div>
          </div>
          <div className="max-w-md">
            <label className="mb-1 block text-sm font-medium">
              E-mail para receber velas e orações
            </label>
            <input
              type="email"
              name="candlesNotifyEmail"
              defaultValue={settings.candlesNotifyEmail ?? ""}
              placeholder={settings.email ?? "contato@paroquia.exemplo"}
              className={`${adminInput} w-full`}
            />
            <p className="mt-1.5 text-xs text-parish-500">
              Ao acender uma vela, intenção e oração são enviadas para este endereço. Se vazio, usa
              o e-mail geral de Informações
              {settings.email ? ` (${settings.email})` : " (ainda não configurado)"}.
            </p>
          </div>
          <button type="submit" className={adminBtn}>
            Salvar configurações
          </button>
        </form>
        <p className="mt-3 text-xs text-parish-500">
          Envio automático exige SMTP no arquivo <code className="text-parish-700">.env</code>{" "}
          (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).
        </p>
      </section>

      <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-parish-600">
            Apagar remove do mural. Encerrar marca como expirada sem apagar o registro.
          </p>
          <a
            href="/admin/velas/relatorio"
            className="rounded-xl border border-parish-200 bg-parish-50 px-4 py-2 text-sm font-semibold text-parish-800 hover:bg-parish-100"
          >
            Relatório em tabela (PDF) →
          </a>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b text-parish-600">
              <th className="py-2 pr-2">Data</th>
              <th className="py-2 pr-2">Nome</th>
              <th className="py-2 pr-2">E-mail</th>
              <th className="py-2 pr-2">Intenção</th>
              <th className="py-2 pr-2">Oração</th>
              <th className="py-2 pr-2">Mural</th>
              <th className="py-2 pr-2">Ativa</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Valor</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {candles.map((c) => (
              <tr key={c.id} className="border-b border-parish-50 align-top">
                <td className="py-2 pr-2 whitespace-nowrap">
                  {c.createdAt.toLocaleString("pt-BR")}
                </td>
                <td className="py-2 pr-2">{c.donorName}</td>
                <td className="max-w-[8rem] break-all py-2 pr-2 text-xs">{c.email ?? "—"}</td>
                <td className="max-w-xs py-2 pr-2">{c.intention}</td>
                <td className="max-w-xs py-2 pr-2 text-xs text-parish-700">
                  {c.prayer ?? "—"}
                </td>
                <td className="py-2 pr-2 text-xs whitespace-nowrap">
                  {c.intentionPublic && c.prayerPublic
                    ? "Pública"
                    : c.intentionPublic || c.prayerPublic
                      ? "Parcial"
                      : "Sigilo"}
                </td>
                <td className="py-2 pr-2 whitespace-nowrap">
                  {isCandleActiveOnMural(c, durationHours) ? "Sim" : "Não"}
                </td>
                <td className="py-2 pr-2">{c.status}</td>
                <td className="py-2 pr-2 whitespace-nowrap">
                  {(c.amountCents / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>
                <td className="py-2">
                  <div className="flex flex-col gap-1">
                    {c.status === "PAID" ? (
                      <form action={extinguishCandle}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-xs text-amber-700 hover:underline">
                          Encerrar no mural
                        </button>
                      </form>
                    ) : null}
                    <form action={deleteCandle}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="text-xs font-semibold text-red-700">
                        Excluir
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
