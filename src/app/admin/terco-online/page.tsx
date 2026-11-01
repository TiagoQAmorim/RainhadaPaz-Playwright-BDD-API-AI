import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createTercoOnlineSlot,
  deleteTercoOnlineSlot,
  updatePage,
  updateTercoOnlineSlot,
} from "@/app/admin/actions";
import {
  adminBtn,
  adminBtnDanger,
  adminCard,
  adminInput,
  adminTextarea,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminTercoOnlinePage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");

  const [slots, page] = await Promise.all([
    prisma.tercoOnlineSlot.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.page.findUnique({ where: { slug: "terco-online" } }),
  ]);

  const nextSort =
    slots.length === 0 ? 0 : Math.max(...slots.map((s) => s.sortOrder), 0) + 1;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-parish-900">Terço online</h1>
          <p className="mt-1 text-sm text-parish-600">
            Cadastre um ou mais blocos: título, dias/horário e link de cada reunião.
          </p>
        </div>
        <Link
          href="/terco-online"
          target="_blank"
          className="rounded-lg border border-parish-200 bg-white px-4 py-2 text-sm font-semibold text-parish-800 hover:bg-parish-50"
        >
          Ver página pública →
        </Link>
      </div>

      <section className={adminCard}>
        <h2 className="text-lg font-semibold text-parish-900">Horários e links</h2>
        <p className="mt-1 text-sm text-parish-600">
          Ex.: um bloco para seg/ter/qua com link Zoom e outro para qui/sex com Google Meet.
        </p>

        <ul className="mt-6 space-y-6">
          {slots.map((slot) => (
            <li key={slot.id} className="rounded-xl border border-parish-200 bg-parish-50/50 p-4">
              <form action={updateTercoOnlineSlot} className="space-y-3">
                <input type="hidden" name="id" value={slot.id} />
                <Field label="Título" name="title" defaultValue={slot.title} />
                <Field
                  label="Dias e horário"
                  name="scheduleText"
                  defaultValue={slot.scheduleText}
                  placeholder="Ex.: Segunda, terça e quarta — 19h30"
                  required
                />
                <Field
                  label="Link da reunião"
                  name="meetingUrl"
                  defaultValue={slot.meetingUrl}
                  placeholder="https://…"
                />
                <Field
                  label="Ordem (número menor aparece primeiro)"
                  name="sortOrder"
                  defaultValue={String(slot.sortOrder)}
                />
                <button type="submit" className={adminBtn}>
                  Salvar bloco
                </button>
              </form>
              <form action={deleteTercoOnlineSlot} className="mt-2">
                <input type="hidden" name="id" value={slot.id} />
                <button type="submit" className={adminBtnDanger}>
                  Excluir bloco
                </button>
              </form>
            </li>
          ))}
        </ul>

        <form action={createTercoOnlineSlot} className="mt-8 space-y-3 border-t border-parish-100 pt-6">
          <h3 className="font-medium text-parish-900">Novo bloco</h3>
          <Field label="Título" name="title" defaultValue="Terço online" />
          <Field
            label="Dias e horário"
            name="scheduleText"
            placeholder="Ex.: Quinta e sexta — 19h30"
            required
          />
          <Field label="Link da reunião" name="meetingUrl" placeholder="https://…" />
          <input type="hidden" name="sortOrder" value={String(nextSort)} />
          <button type="submit" className={adminBtn}>
            Adicionar bloco
          </button>
        </form>
      </section>

      <section className={adminCard}>
        <h2 className="text-lg font-semibold text-parish-900">Conteúdo extra da página</h2>
        <p className="mt-1 text-sm text-parish-600">
          HTML opcional abaixo dos blocos de horário em /terco-online.
        </p>
        {page ? (
          <form action={updatePage} className="mt-6 space-y-4">
            <input type="hidden" name="id" value={page.id} />
            <Field label="Título da página" name="title" defaultValue={page.title} />
            <input type="hidden" name="slug" value="terco-online" />
            <div>
              <label className="mb-1 block text-sm font-medium">Conteúdo (HTML)</label>
              <textarea
                name="body"
                rows={10}
                defaultValue={page.body}
                className={adminTextarea}
              />
            </div>
            <button type="submit" className={adminBtn}>
              Salvar conteúdo da página
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-parish-600">
            Rode <code className="text-xs">npm run db:seed</code> para importar a página ou cadastre em
            Informações.
          </p>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={adminInput}
      />
    </div>
  );
}
