import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";
import { prisma } from "@/lib/prisma";
import { ticketPriceLabel } from "@/lib/raffle-rules";

export default async function RifaSucessoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string; status?: string }>;
}) {
  const { slug } = await params;
  const { order: orderId, status } = await searchParams;

  const order = orderId
    ? await prisma.raffleOrder.findUnique({
        where: { id: orderId },
        include: {
          raffle: true,
          lines: { include: { ticket: { include: { saint: true } } } },
        },
      })
    : null;

  const pending = status === "pending" || order?.status === "PENDING";

  return (
    <PageContainer className="py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-parish-900">
        {pending ? "Pagamento em análise" : "Obrigado pela participação!"}
      </h1>
      {order ? (
        <div className="mt-6 space-y-4 text-parish-800">
          <p>
            Rifa: <strong>{order.raffle.title}</strong>
          </p>
          <p>Total: {ticketPriceLabel(order.totalCents)}</p>
          <ul className="list-inside list-disc text-sm">
            {order.lines.map((l) => (
              <li key={l.id}>
                #{String(l.ticket.ticketNumber).padStart(4, "0")} — {l.ticket.saint.name}
              </li>
            ))}
          </ul>
          {pending ? (
            <p className="text-sm text-parish-600">
              Assim que o pagamento for confirmado, suas cotas aparecerão como vendidas na grade.
            </p>
          ) : (
            <p className="text-sm text-parish-700">Suas cotas foram confirmadas. Boa sorte no sorteio!</p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-parish-700">Participação registrada.</p>
      )}
      <Link href={`/rifas/${slug}`} className="mt-8 inline-block font-semibold text-parish-700 underline">
        Voltar à rifa
      </Link>
    </PageContainer>
  );
}
