import { upsertHomeHeroCta } from "@/app/admin/actions";
import { adminBtn, adminInput } from "@/components/admin/AdminFormStyles";

export type HeroCtaFormValues = {
  id?: string;
  label: string;
  href: string;
  variant: string;
  sortOrder: number;
};

type Props = { cta?: HeroCtaFormValues; submitLabel: string };

export function AdminHomeHeroCtaForm({ cta, submitLabel }: Props) {
  return (
    <form action={upsertHomeHeroCta} className="space-y-3">
      {cta?.id ? <input type="hidden" name="id" value={cta.id} /> : null}
      <Field label="Texto do botão" name="label" defaultValue={cta?.label} required />
      <Field label="Link" name="href" defaultValue={cta?.href} placeholder="/horarios" required />
      <div>
        <label className="mb-1 block text-sm font-medium">Estilo</label>
        <select name="variant" defaultValue={cta?.variant ?? "primary"} className={adminInput}>
          <option value="primary">Destaque (dourado)</option>
          <option value="secondary">Secundário (transparente)</option>
        </select>
      </div>
      <Field label="Ordem" name="sortOrder" type="number" defaultValue={String(cta?.sortOrder ?? 0)} />
      <button type="submit" className={adminBtn}>
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className={adminInput}
      />
    </div>
  );
}