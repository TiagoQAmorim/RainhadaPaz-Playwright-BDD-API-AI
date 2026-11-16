import { redirect } from "next/navigation";
import { updateMaintenanceSettings } from "@/app/admin/actions";
import { adminBtn, adminCard, adminInput, adminTextarea } from "@/components/admin/AdminFormStyles";
import { getSessionAdmin } from "@/lib/auth";
import { formatMaintenanceReturnDate, resolveMaintenance } from "@/lib/maintenance";
import { toDatetimeLocalValue } from "@/lib/datetime-local";
import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Manutenção do site" };

export default async function AdminManutencaoPage() {
  if (!(await getSessionAdmin())) redirect("/admin/login");
  const [settings, status] = await Promise.all([getSiteSettings(), resolveMaintenance()]);

  const endsLabel = formatMaintenanceReturnDate(settings.maintenanceEndsAt);

  return (
    <div className="space-y-6">
      <section className={adminCard}>
        <h1 className="text-lg font-semibold text-parish-900">Manutenção do site</h1>
        <p className="mt-1 text-sm text-parish-600">
          Visitantes veem uma página com o logo e aviso de manutenção. O painel{" "}
          <strong>/admin</strong> continua acessível. Se você estiver <strong>logado como admin</strong>,
          também vê o site público normal (home, rifas, etc.) para conferir antes de reabrir. O site volta
          para todos quando você desmarcar ou quando chegar a data de término.
        </p>
        <p className="mt-3 text-sm">
          Status agora:{" "}
          <strong className={status.active ? "text-amber-800" : "text-emerald-800"}>
            {status.active ? "Site público em manutenção" : "Site público normal"}
          </strong>
          {status.active && endsLabel ? (
            <span className="text-parish-600"> — previsão: {endsLabel}</span>
          ) : null}
        </p>
        <form action={updateMaintenanceSettings} className="mt-6 space-y-4">
          <input type="hidden" name="maintenanceEnabled" value="off" />
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-parish-200 bg-parish-50/60 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="maintenanceEnabled"
              value="on"
              defaultChecked={settings.maintenanceEnabled}
              className="mt-1"
            />
            <span>
              <strong className="text-parish-900">Exibir página de manutenção</strong>
              <span className="mt-1 block text-parish-600">
                Redireciona todas as páginas (exceto este painel) para a tela de manutenção.
              </span>
            </span>
          </label>
          <div>
            <label className="mb-1 block text-sm font-medium">Mensagem (opcional)</label>
            <textarea
              name="maintenanceMessage"
              rows={4}
              defaultValue={settings.maintenanceMessage ?? ""}
              placeholder="Estamos em manutenção e voltamos em breve…"
              className={adminTextarea}
            />
          </div>
          <div className="space-y-3 rounded-xl border border-parish-200 bg-parish-50/40 p-4">
            <input type="hidden" name="maintenanceShowReturnDate" value="off" />
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="maintenanceShowReturnDate"
                value="on"
                defaultChecked={settings.maintenanceEndsAt != null}
                className="mt-1"
              />
              <span>
                <strong className="text-parish-900">Informar quando o site volta</strong>
                <span className="mt-1 block text-parish-600">
                  Desmarcado: a tela de manutenção mostra só a mensagem (sem dia/hora prevista).
                </span>
              </span>
            </label>
            <div>
              <label className="mb-1 block text-sm font-medium text-parish-800">
                Data e hora (visitantes e reabertura automática)
              </label>
              <input
                type="datetime-local"
                name="maintenanceEndsAt"
                defaultValue={toDatetimeLocalValue(settings.maintenanceEndsAt)}
                className={adminInput}
              />
              <p className="mt-1 text-xs text-parish-500">
                Só vale com a opção acima marcada. Depois desse horário, a manutenção desliga sozinha.
                Para voltar sem data, desmarque &quot;Informar quando o site volta&quot; e salve.
              </p>
            </div>
          </div>
          <button type="submit" className={adminBtn}>
            Salvar manutenção
          </button>
        </form>
        <p className="mt-4 text-xs text-parish-500">
          Para testar como visitante: use aba anônima em{" "}
          <a href="/" target="_blank" rel="noreferrer" className="text-parish-700 underline">
            a página inicial
          </a>
          . Na mesma sessão logada em /admin, abra o site em outra aba para pré-visualizar o conteúdo
          real.
        </p>
      </section>
    </div>
  );
}