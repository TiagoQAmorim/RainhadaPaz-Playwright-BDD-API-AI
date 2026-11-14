import { upsertMassLocation } from "@/app/admin/actions";
import { adminBtn, adminInput, adminTextarea } from "@/components/admin/AdminFormStyles";

export type MassLocationFormValues = {
  id?: string;
  name: string;
  address: string;
  scheduleText: string;
  sortOrder: number;
  published: boolean;
};

type Props = {
  location?: MassLocationFormValues;
  submitLabel: string;
};

export function AdminMassLocationForm({ location, submitLabel }: Props) {
  return (
    <form action={upsertMassLocation} className="space-y-3">
      {location?.id ? <input type="hidden" name="id" value={location.id} /> : null}
      <p className="text-sm text-parish-600">
        Locais exibidos em /horarios. Uma linha por horário no campo de agenda.
      </p>
      <Field label="Nome" name="name" defaultValue={location?.name} required />
      <Field label="Endereço" name="address" defaultValue={location?.address} required />
      <ScheduleTextarea
        label="Horários"
        name="scheduleText"
        defaultValue={location?.scheduleText}
        required
      />
      <Field
        label="Ordem"
        name="sortOrder"
        type="number"
        defaultValue={String(location?.sortOrder ?? 0)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="published" value="off" />
        <input
          type="checkbox"
          name="published"
          value="on"
          defaultChecked={location?.published ?? true}
        />{" "}
        Publicado
      </label>
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
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
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
        className={adminInput}
      />
    </div>
  );
}

function ScheduleTextarea({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <textarea
        name={name}
        rows={5}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={"Quinta-feira: 19h\nDomingo: 12h e 20h"}
        className={adminTextarea}
      />
    </div>
  );
}