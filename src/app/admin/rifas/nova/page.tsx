import Link from "next/link";
import { redirect } from "next/navigation";
import { createRaffleAction } from "@/app/admin/raffle-actions";
import { adminBtn, adminCard, adminInput, adminTextarea } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { ensureSaintCatalogInDb } from "@/lib/saints-catalog";
import { RAFFLE_MAX_TICKETS, RAFFLE_TICKET_QUANTITY_OPTIONS } from "@/lib/raffle-rules";

export default async function AdminNovaRifaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const dbSaintCount = await ensureSaintCatalogInDb();
  const { erro } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/admin/rifas" className="text-sm text-parish-600 hover:text-parish-900">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-parish-900">Nova rifa</h1>
        <p className="text-sm text-parish-600">
          Escolha de {RAFFLE_TICKET_QUANTITY_OPTIONS[0]} a {RAFFLE_MAX_TICKETS} cotas (de 100 em 100).
          Catálogo ampliado: {dbSaintCount} santos/personagens — até {RAFFLE_MAX_TICKETS} cotas distintas
          (de 100 em 100).
        </p>
        {erro ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {erro}
          </p>
        ) : null}
      </div>

      <form action={createRaffleAction} className={`${adminCard} space-y-3`}>
        <Field label="Nome da rifa" name="title" required />
        <TextArea label="Descrição" name="description" rows={3} required />
        <TextArea label="Finalidade da arrecadação" name="purpose" rows={2} />
        <Field label="Prêmio (título)" name="prizeTitle" required />
        <TextArea label="Descrição do prêmio" name="prizeDescription" rows={2} />
        <div>
          <label className="mb-1 block text-sm font-medium">Quantidade de cotas</label>
          <select name="totalTickets" className={adminInput} defaultValue="100" required>
            {RAFFLE_TICKET_QUANTITY_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} cotas
              </option>
            ))}
          </select>
        </div>
        <Field label="Valor da cota (R$)" name="ticketPriceBrl" placeholder="10.00" required />
        <Field label="Data prevista do sorteio" name="drawScheduledAt" type="datetime-local" />
        <div>
          <label className="mb-1 block text-sm font-medium">Status inicial</label>
          <select name="status" className={adminInput} defaultValue="DRAFT">
            <option value="DRAFT">Rascunho</option>
            <option value="ACTIVE">Ativa</option>
          </select>
        </div>
        <button type="submit" className={adminBtn}>
          Criar rifa e gerar cotas
        </button>
      </form>
    </div>
  );
}

function Field(props: React.ComponentProps<"input"> & { label: string }) {
  const { label, className, ...rest } = props;
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
