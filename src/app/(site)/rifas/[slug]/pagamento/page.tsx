import { notFound } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { PixPaymentInstructions } from "@/components/payment/PixPaymentInstructions";
import { parishPixPayload } from "@/lib/parish-pix";
import { getRaffleBySlug } from "@/lib/raffles";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getRaffleBySlug(slug);
  return { title: r ? `PIX — ${r.title}` : "Pagamento" };
}

export default async function RifaPagamentoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { order: orderId } = await searchParams;
  if (!orderId) notFound();

  const raffle = await getRaffleBySlug(slug);
  if (!raffle) notFound();

  const order = await prisma.raffleOrder.findFirst({
    where: { id: orderId, raffleId: raffle.id },
    include: { lines: true },
  });
  if (!order || order.status === "CANCELLED") notFound();

  const pix = parishPixPayload({
    kind: "RIFA",
    referenceId: order.id,
    amountCents: order.totalCents,
    payerName: order.buyerName,
    extraMessage: `${order.lines.length} cota(s)`,
  });

  const reservedNote =
    order.status === "PENDING"
      ? "Suas cotas ficam reservadas por tempo limitado. Após o PIX, a secretaria confirma o pagamento no sistema."
      : "Pedido já processado. Em dúvida, fale com a secretaria.";

  return (
    <PageContainer className="py-10 md:py-14">
      <div className="mx-auto w-full max-w-lg">
      {raffle.kind === "NUMBERS" ? (
        <p className="mb-4 text-center text-sm text-parish-800">
          <a
            href={`/api/rifas/pedidos/${order.id}/pdf`}
            className="inline-flex rounded-full bg-parish-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-parish-500"
          >
            Baixar PDF dos bilhetes
          </a>
        </p>
      ) : null}
      <PixPaymentInstructions
        title="Pague suas cotas com PIX"
        legalName={pix.legalName}
        pixKey={pix.pixKey}
        pixKeyType={pix.pixKeyType}
        bank={pix.bank}
        amountLabel={pix.amountLabel}
        reference={pix.reference}
        messageSuggestion={pix.messageSuggestion}
        pixCopiaECola={pix.pixCopiaECola}
        afterPayNote={reservedNote}
        backHref={`/rifas/${slug}`}
        backLabel="Voltar à rifa"
      />
      </div>
    </PageContainer>
  );
}