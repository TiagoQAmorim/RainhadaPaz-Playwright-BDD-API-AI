import { redirect } from "next/navigation";
import { deleteMassLocation, upsertMassLocation } from "@/app/admin/actions";
import {
  adminBtn,
  adminCard,
  adminInput,
  adminTextarea,
  adminBtnDanger,
} from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminHorariosPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const locations = await prisma.massLocation.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-8">
      <form action={upsertMassLocation} className={`${adminCard} space-y-3`}>
        <h1 className="text-lg font-semibold">Novo local de missa</h1>
        <p className="text-sm text-parish-600">
          Cadastre matriz, capelas etc. Uma linha por horário:{" "}
          <code className="text-xs">Domingo: 8h e 10h</code>
        </p>
        <input name="name" placeholder="Nome (ex.: Matriz Paroquial)" required className={adminInput} />
        <input
          name="address"
          placeholder="Endereço completo"
          required
          className={adminInput}
        />
        <textarea
          name="scheduleText"
          placeholder={"Quinta-feira: 19h\nDomingo: 12h e 20h"}
          rows={5}
          required
          className={adminTextarea}
        />
        <input name="sortOrder" type="number" defaultValue={0} className={adminInput} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" defaultChecked /> Publicado
        </label>
        <button type="submit" className={adminBtn}>
          Cadastrar local
        </button>
      </form>

      <ul className="space-y-4">
        {locations.map((loc) => (
          <li key={loc.id} className={adminCard}>
            <form action={upsertMassLocation} className="space-y-2">
              <input type="hidden" name="id" value={loc.id} />
              <input name="name" defaultValue={loc.name} className={adminInput} />
              <input name="address" defaultValue={loc.address} className={adminInput} />
              <textarea
                name="scheduleText"
                defaultValue={loc.scheduleText}
                rows={5}
                className={adminTextarea}
              />
              <input
                name="sortOrder"
                type="number"
                defaultValue={loc.sortOrder}
                className={adminInput}
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="published" defaultChecked={loc.published} /> Publicado
              </label>
              <button type="submit" className={adminBtn}>
                Salvar
              </button>
            </form>
            <form action={deleteMassLocation} className="mt-2">
              <input type="hidden" name="id" value={loc.id} />
              <button type="submit" className={adminBtnDanger}>
                Excluir local
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
