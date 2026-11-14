import { upsertTercoOnlineSlot } from "@/app/admin/actions";
import { adminBtn, adminInput } from "@/components/admin/AdminFormStyles";

export type TercoSlotFormValues = {
  id?: string;
  title: string;
  scheduleText: string;
  meetingUrl: string;
  sortOrder: number;
};

type Props = {
  slot?: TercoSlotFormValues;
  submitLabel: string;
};

export function AdminTercoSlotForm({ slot, submitLabel }: Props) {
  return (
    <form action={upsertTercoOnlineSlot} className="space-y-3">
      {slot?.id ? <input type="hidden" name="id" value={slot.id} /> : null}
      <Field label="Título" name="title" defaultValue={slot?.title ?? "Terço online"} required />
      <Field
        label="Dias e horário"
        name="scheduleText"
        defaultValue={slot?.scheduleText}
        placeholder="Ex.: Segunda, terça e quarta — 19h30"
        required
      />
      <Field
        label="Link da reunião"
        name="meetingUrl"
        defaultValue={slot?.meetingUrl}
        placeholder="https://…"
      />
      <Field
        label="Ordem"
        name="sortOrder"
        type="number"
        defaultValue={String(slot?.sortOrder ?? 0)}
      />
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
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
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
        placeholder={placeholder}
        required={required}
        className={adminInput}
      />
    </div>
  );
}