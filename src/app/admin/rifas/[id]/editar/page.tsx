import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateRaffleAction } from "@/app/admin/raffle-actions";
import { adminBtn, adminCard, adminInput, adminTextarea } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { ticketPriceLabel } from "@/lib/raffle-rules";
import { prisma } from "@/lib/prisma";

function toDatetimeLocal(value: Date | null) {
  if (!value) return "";
  const d = new Date(value);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default async function AdminEditarRifaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const { id } = await params;
  const { erro } = await searchParams;
  const raffle = await prisma.raffle.findUnique({ where: { id } });
  if (!raffle) notFound();

  if (raffle.drawRecordedAt) {
    redirect(`/admin/rifas/${id}`);
  }

  const priceBrl = (raffle.ticketPriceCents / 100).toFixed(2);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/admin/rifas/${id}`} className="text-sm text-parish-600 hover:text-parish-900">
          ← Voltar à rifa
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-parish-900">Editar rifa</h1>
        <p className="text-sm text-parish-600">
          {raffle.totalTickets} cotas · slug público:{" "}
          <code className="text-xs">{raffle.slug}</code> (não alterável)
        </p>
        {erro ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {erro}
          </p>
        ) : null}
      </div>

      <form action={updateRaffleAction} className={`${adminCard} space-y-3`}>
        <input type="hidden" name="id" value={id} />
        <Field label="Nome da rifa" name="title" defaultValue={raffle.title} required />
        <TextArea label="Descrição" name="description" rows={3} defaultValue={raffle.description} required />
        <TextArea
          label="Finalidade da arrecadação"
          name="purpose"
          rows={2}
          defaultValue={raffle.purpose ?? ""}
        />
        <Field label="Prêmio (título)" name="prizeTitle" defaultValue={raffle.prizeTitle} required />
        <TextArea
          label="Descrição do prêmio"
          name="prizeDescription"
          rows={2}
          defaultValue={raffle.prizeDescription ?? ""}
        />
        <p className="text-sm text-parish-600">
          Quantidade de cotas: <strong>{raffle.totalTickets}</strong> (fixo após criação). Valor atual:{" "}
          {ticketPriceLabel(raffle.ticketPriceCents)}.
        </p>
        <Field
          label="Valor da cota (R$)"
          name="ticketPriceBrl"
          defaultValue={priceBrl}
          placeholder="10,00"
          required
        />
        <Field
          label="Data prevista do sorteio"
          name="drawScheduledAt"
          type="datetime-local"
          defaultValue={toDatetimeLocal(raffle.drawScheduledAt)}
        />
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select name="status" className={adminInput} defaultValue={raffle.status}>
            <option value="DRAFT">Rascunho</option>
            <option value="ACTIVE">Ativa</option>
            <option value="CLOSED">Encerrada</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </div>
        <button type="submit" className={adminBtn}>
          Salvar alterações
        </button>
      </form>
    </div>
  );
}

function Field(props: React.ComponentProps<"input"> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input {...rest} className={adminInput} />
    </div>
  );
}

function TextArea(props: React.ComponentProps<"textarea"> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <textarea {...rest} className={adminTextarea} />
    </div>
  );
}
