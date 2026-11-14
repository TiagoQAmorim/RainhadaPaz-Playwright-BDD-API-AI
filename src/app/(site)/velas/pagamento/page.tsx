import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { PixPaymentInstructions } from "@/components/payment/PixPaymentInstructions";
import { formatCandlePrice } from "@/lib/candle-commerce";
import { parishPixPayload } from "@/lib/parish-pix";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ candle?: string; pix?: string }> };

export const metadata = { title: "Pagamento — Vela virtual" };

export default async function VelaPagamentoPage({ searchParams }: Props) {
  const { candle: candleId, pix: pixFallback } = await searchParams;
  if (!candleId) notFound();

  const candle = await prisma.virtualCandle.findUnique({ where: { id: candleId } });
  if (!candle || candle.status === "CANCELLED") notFound();

  const pix = parishPixPayload({
    kind: "VELA",
    referenceId: candle.id,
    amountCents: candle.amountCents,
    payerName: candle.donorName,
    extraMessage: candle.intention.slice(0, 60),
  });

  const showSicrediNotice = candle.paymentMethod === "SICREDI" && pixFallback !== "1";

  if (showSicrediNotice) {
    return (
      <PageContainer className="py-10 md:py-14">
        <div className="mx-auto w-full max-w-lg space-y-4 rounded-2xl border border-parish-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-xl font-semibold text-parish-900">Cartão Sicredi</h1>
          <p className="text-sm text-parish-700">
            Valor: <strong>{formatCandlePrice(candle.amountCents)}</strong> — vela de{" "}
            <strong>{candle.donorName}</strong>.
          </p>
          <p className="text-sm text-parish-600">
            O checkout com cartão Sicredi será conectado assim que a cooperativa liberar as credenciais no
            servidor. Enquanto isso, você pode pagar pelo PIX com o mesmo valor.
          </p>
          <Link
            href={`/velas/pagamento?candle=${candle.id}&pix=1`}
            className="inline-block rounded-xl bg-parish-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-parish-500"
          >
            Pagar com PIX
          </Link>
          <p className="pt-2">
            <Link href="/velas" className="text-sm text-parish-600 hover:underline">
              ← Voltar às velas
            </Link>
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-10 md:py-14">
      <div className="mx-auto w-full max-w-lg">
      <PixPaymentInstructions
        title="Pague sua vela com PIX"
        legalName={pix.legalName}
        pixKey={pix.pixKey}
        pixKeyType={pix.pixKeyType}
        bank={pix.bank}
        amountLabel={pix.amountLabel}
        reference={pix.reference}
        messageSuggestion={pix.messageSuggestion}
        pixCopiaECola={pix.pixCopiaECola}
        afterPayNote="Após o PIX, a secretaria confere o comprovante e acende a vela no mural (geralmente no mesmo dia útil). Guarde o comprovante."
        backHref="/velas"
        backLabel="Voltar às velas"
      />
      </div>
    </PageContainer>
  );
}