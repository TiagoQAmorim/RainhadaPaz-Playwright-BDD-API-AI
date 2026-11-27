import { redirect } from "next/navigation";
import {
  confirmCandlePixPayment,
  deleteCandle,
  extinguishCandle,
  sendWeeklyCandleEmailTest,
  updateCandleSettings,
} from "@/app/admin/actions";
import { AdminConfirmDeleteForm } from "@/components/admin/AdminConfirmDeleteForm";
import { adminBtn, adminCard, adminInput } from "@/components/admin/AdminFormStyles";
import { CandleEmailFields } from "@/components/admin/CandleEmailFields";
import { WeeklyCandleEmailButton } from "@/components/admin/WeeklyCandleEmailButton";
import { getSessionAdmin } from "@/lib/auth";
import { isCandleActiveOnMural } from "@/lib/candle-report";
import { prisma } from "@/lib/prisma";
import { candleAccessModeLabel, formatCandlePrice } from "@/lib/candle-commerce";
import { getCandleDurationHours, getSiteSettings } from "@/lib/settings";
import {
  CANDLE_EMAIL_TAGS,
  CANDLE_WEEK_INTRO_TAGS,
  CANDLE_WEEK_ITEM_TAGS,
  DEFAULT_CANDLE_EXPIRY_EMAIL_BODY,
  DEFAULT_CANDLE_EXPIRY_EMAIL_SUBJECT,
  DEFAULT_CANDLE_LIT_EMAIL_BODY,
  DEFAULT_CANDLE_LIT_EMAIL_SUBJECT,
  DEFAULT_CANDLE_WEEK_EMAIL_INTRO,
  DEFAULT_CANDLE_WEEK_EMAIL_ITEM,
  DEFAULT_CANDLE_WEEK_EMAIL_SUBJECT,
} from "@/lib/candle-email-template";

export default async function AdminVelasPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const { erro } = await searchParams;
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
  const priceBrlDefault = (settings.candlePriceCents ?? 1000) / 100;
  const accessMode = settings.candleAccessMode ?? "paid";

  return (
    <div className="space-y-8">
      {erro ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</p>
      ) : null}
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
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Vela apagada continua visível</label>
              <input
                type="number"
                name="candleAfterglowAmount"
                min={0}
                max={8760}
                step={1}
                defaultValue={settings.candleAfterglowAmount ?? 2}
                className={adminInput}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Unidade</label>
              <select
                name="candleAfterglowUnit"
                className={adminInput}
                defaultValue={settings.candleAfterglowUnit ?? "days"}
              >
                <option value="hours">Horas</option>
                <option value="days">Dias</option>
              </select>
            </div>
            <p className="w-full text-xs text-parish-500">
              Depois que o tempo acaba, a vela fica com fumaça no mural e na esteira por esse prazo.
              Zero some na hora.
            </p>
          </div>
          <div className="max-w-lg space-y-3 border-t border-parish-100 pt-4">
            <h2 className="text-sm font-semibold text-parish-900">Pagamento e valor</h2>
            <div className="space-y-2">
              <label className="mb-1 block text-sm font-medium">Modo</label>
              <select
                name="candleAccessMode"
                className={adminInput}
                defaultValue={accessMode}
              >
                <option value="paid">Paga (PIX ou cartão)</option>
                <option value="free_donation">Gratuita com oferta opcional</option>
                <option value="free">Gratuita (sem pagamento)</option>
              </select>
              <p className="text-xs text-parish-500">
                Atual: <strong>{candleAccessModeLabel(accessMode as "free" | "free_donation" | "paid")}</strong>
                {accessMode === "paid" ? (
                  <>
                    {" "}
                    — valor: <strong>{formatCandlePrice(settings.candlePriceCents ?? 1000)}</strong>
                  </>
                ) : accessMode === "free_donation" ? (
                  <> — oferta: valor escolhido pelo fiél no site</>
                ) : null}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Valor da vela paga (R$)</label>
              <input
                type="number"
                name="candlePriceBrl"
                min={0.01}
                step={0.01}
                defaultValue={priceBrlDefault}
                className={adminInput}
                required={accessMode === "paid"}
                disabled={accessMode === "free"}
                aria-describedby="candle-price-hint"
              />
              <p id="candle-price-hint" className="mt-1 text-xs text-parish-500">
                {accessMode === "paid"
                  ? "Usado quando o modo é pago (PIX ou cartão)."
                  : accessMode === "free_donation"
                    ? "No modo com oferta opcional o fiél informa o valor; este campo só vale se voltar ao modo pago."
                    : "Sem uso no modo totalmente gratuito."}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="candlePaymentPix"
                  defaultChecked={settings.candlePaymentPix !== false}
                />
                PIX (conta Itaú no site)
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="candlePaymentSicredi"
                  defaultChecked={settings.candlePaymentSicredi === true}
                />
                Cartão
              </label>
            </div>
            <p className="text-xs text-parish-500">
              O cartão no site só aparece ativo quando <code className="text-parish-700">SICREDI_ENABLED=true</code>{" "}
              e as credenciais estiverem no servidor. Até lá, marque Cartão aqui para preparar e use PIX na prática.
            </p>
          </div>
          <div className="max-w-xs">
            <label className="mb-1 block text-sm font-medium">Avisar antes de apagar (minutos)</label>
            <input
              type="number"
              name="candleExpiryNoticeMinutes"
              min={1}
              max={1440}
              step={1}
              defaultValue={settings.candleExpiryNoticeMinutes ?? 60}
              className={adminInput}
              required
            />
            <p className="mt-1.5 text-xs text-parish-500">
              O e-mail sai quando falta esse tempo. Para testar, use 5. A vela precisa durar mais
              do que esse prazo, senão o aviso sairia no instante em que ela acende. No site
              publicado, a conferência roda cerca de uma vez por minuto.
            </p>
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
              Destino dos avisos da paróquia. Se ficar vazio, usa o e-mail geral de Informações
              {settings.email ? ` (${settings.email})` : " (ainda não configurado)"}.
            </p>
          </div>
          <CandleEmailFields
            litSubject={settings.candleLitEmailSubject ?? DEFAULT_CANDLE_LIT_EMAIL_SUBJECT}
            litBody={settings.candleLitEmailBody ?? DEFAULT_CANDLE_LIT_EMAIL_BODY}
            expirySubject={settings.candleExpiryEmailSubject ?? DEFAULT_CANDLE_EXPIRY_EMAIL_SUBJECT}
            expiryBody={settings.candleExpiryEmailBody ?? DEFAULT_CANDLE_EXPIRY_EMAIL_BODY}
            weekSubject={settings.candleWeekEmailSubject ?? DEFAULT_CANDLE_WEEK_EMAIL_SUBJECT}
            weekIntro={settings.candleWeekEmailIntro ?? DEFAULT_CANDLE_WEEK_EMAIL_INTRO}
            weekItem={settings.candleWeekEmailItem ?? DEFAULT_CANDLE_WEEK_EMAIL_ITEM}
            personTags={CANDLE_EMAIL_TAGS}
            weekIntroTags={CANDLE_WEEK_INTRO_TAGS}
            weekItemTags={CANDLE_WEEK_ITEM_TAGS}
          />
          <button type="submit" className={adminBtn}>
            Salvar configurações
          </button>
        </form>
        <p className="mt-3 text-xs text-parish-500">
          Envio automático exige SMTP no arquivo <code className="text-parish-700">.env</code>{" "}
          (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).
        </p>
        <form action={sendWeeklyCandleEmailTest} className="mt-4">
          <WeeklyCandleEmailButton />
          <p className="mt-1.5 text-xs text-parish-500">
            Teste: manda a lista de domingo a sexta desta semana para o e-mail das velas, com
            [Teste] no assunto. Não conta como o envio automático de sexta às 23h.
          </p>
        </form>
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
              <th className="py-2 pr-2">Telefone</th>
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
                <td className="whitespace-nowrap py-2 pr-2 text-xs">{c.phone ?? "—"}</td>
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
                    {c.status === "PENDING" ? (
                      <form action={confirmCandlePixPayment}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-xs font-semibold text-parish-700 hover:underline">
                          Confirmar pagamento recebido
                        </button>
                      </form>
                    ) : null}
                    {c.status === "PAID" ? (
                      <AdminConfirmDeleteForm
                        action={extinguishCandle}
                        confirmMessage="Encerrar esta vela no mural? Ela deixará de aparecer como acesa."
                      >
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-xs text-amber-700 hover:underline">
                          Encerrar no mural
                        </button>
                      </AdminConfirmDeleteForm>
                    ) : null}
                    <AdminConfirmDeleteForm
                      action={deleteCandle}
                      confirmMessage={
                        c.status === "PAID" || c.amountCents > 0
                          ? `ATENÇÃO: esta vela tem pagamento ou valor registrado (R$ ${(c.amountCents / 100).toFixed(2)}). Excluir apaga o registro permanentemente.`
                          : c.status === "PENDING"
                            ? "Esta vela aguarda pagamento. Excluir cancela o pedido permanentemente."
                            : "Excluir esta vela permanentemente? Ela será removida do mural e do registro."
                      }
                      confirmPhrase={
                        c.status === "PAID" || c.status === "PENDING" || c.amountCents > 0
                          ? "EXCLUIR"
                          : undefined
                      }
                    >
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="text-xs font-semibold text-red-700">
                        Excluir
                      </button>
                    </AdminConfirmDeleteForm>
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
