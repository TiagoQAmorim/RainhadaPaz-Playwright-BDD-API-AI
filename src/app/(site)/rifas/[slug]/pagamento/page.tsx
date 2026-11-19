import { notFound, redirect } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { PixPaymentInstructions } from "@/components/payment/PixPaymentInstructions";
import { CancelRaffleHoldButton } from "@/components/raffle/CancelRaffleHoldButton";
import { RaffleHoldCountdown } from "@/components/raffle/RaffleHoldCountdown";
import { parishPixPayload } from "@/lib/parish-pix";
import { formatTicketNumber } from "@/lib/raffle-rules";
import { expireOrderIfDue } from "@/lib/raffle-reservations";
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
    include: {
      lines: { include: { ticket: { select: { ticketNumber: true, reservationExpiresAt: true } } } },
    },
  });
  if (!order) notFound();
  if (order.status === "CANCELLED") redirect(`/rifas/${slug}`);

  const expiryTimes = order.lines
    .map((line) => line.ticket.reservationExpiresAt)
    .filter((date): date is Date => date instanceof Date)
    .map((date) => date.getTime());
  const expiresAt =
    expiryTimes.length > 0
      ? new Date(Math.min(...expiryTimes)).toISOString()
      : new Date(order.createdAt.getTime() + raffle.reservationMinutes * 60_000).toISOString();

  if (order.status === "PENDING" && new Date(expiresAt).getTime() <= Date.now()) {
    await expireOrderIfDue(order.id);
    redirect(`/rifas/${slug}`);
  }

  const paid = order.status === "PAID";

  const pix = parishPixPayload({
    kind: "RIFA",
    referenceId: order.id,
    amountCents: order.totalCents,
    payerName: order.buyerName,
    extraMessage: `${order.lines.length} cota(s)`,
  });

  const reservedNote =
    order.status === "PENDING"
      ? "Pague antes do cronômetro zerar. Se o tempo acabar, as cotas voltam para a rifa. Esta página confirma sozinha quando a secretaria registrar o pagamento."
      : "Pedido já processado. Em dúvida, fale com a secretaria.";

  return (
    <PageContainer className="py-10 md:py-14">
      <div className="mx-auto w-full max-w-lg">
      <RaffleHoldCountdown
        slug={slug}
        orderId={order.id}
        initialStatus={order.status}
        expiresAt={order.status === "PENDING" ? expiresAt : null}
        holdSeconds={raffle.reservationMinutes * 60}
        initialSeconds={Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))}
      />
      {paid ? (
        <div className="mb-6 rounded-2xl border border-parish-200 bg-white p-6 text-parish-900 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-600">Pagamento confirmado</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold">Obrigado pela participação</h1>
          <p className="mt-3 text-sm text-parish-700">
            O PIX foi confirmado.{" "}
            {order.lines.length === 1
              ? "Sua cota está garantida para o sorteio."
              : "Suas cotas estão garantidas para o sorteio."}
          </p>
          <ul className="mt-4 space-y-1 text-sm font-semibold">
            {order.lines.map((line) => (
              <li key={line.id}>Número {formatTicketNumber(line.ticket.ticketNumber)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mb-4 text-center text-sm text-parish-700">
          O PIX cai na conta da paróquia. Esta página confirma sozinha quando a secretaria registrar o pagamento.
        </p>
      )}
      {raffle.kind === "NUMBERS" && paid ? (
        <p className="mb-4 text-center text-sm text-parish-800">
          <a
            href={`/api/rifas/pedidos/${order.id}/pdf`}
            className="inline-flex rounded-full bg-parish-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-parish-500"
          >
            Baixar PDF dos bilhetes
          </a>
        </p>
      ) : null}
      {paid ? (
        <p className="text-center">
          <a href={`/rifas/${slug}`} className="text-sm font-semibold text-parish-700 underline">
            Voltar à rifa
          </a>
        </p>
      ) : (
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
        depositTitle="Conta para depósito"
        cardNote="Pagamento com cartão entra em breve. Agora vale PIX ou depósito nesta conta Sicredi."
        afterPayNote={reservedNote}
        backHref={`/rifas/${slug}`}
        backLabel="Voltar à rifa"
      />
      )}
      {order.status === "PENDING" ? (
        <div className="mt-4">
          <CancelRaffleHoldButton slug={slug} orderId={order.id} />
        </div>
      ) : null}
      </div>
    </PageContainer>
  );
}