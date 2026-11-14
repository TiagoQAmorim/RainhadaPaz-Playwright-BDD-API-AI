import { upsertNotice } from "@/app/admin/actions";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { AdminRichTextField } from "@/components/admin/AdminRichTextField";
import { adminBtn, adminFormEncType, adminInput } from "@/components/admin/AdminFormStyles";
import { toDatetimeLocalValue } from "@/lib/datetime-local";

export type NoticeFormValues = {
  id?: string;
  title: string;
  body: string;
  coverImage?: string | null;
  published: boolean;
  expiresAt?: Date | null;
};

type Props = {
  notice?: NoticeFormValues;
  submitLabel: string;
};

export function AdminNoticeForm({ notice, submitLabel }: Props) {
  return (
    <form action={upsertNotice} encType={adminFormEncType} className="space-y-3">
      {notice?.id ? <input type="hidden" name="id" value={notice.id} /> : null}
      <p className="text-sm text-parish-600">Avisos curtos em /avisos e destaques na home.</p>
      <Field label="Título" name="title" defaultValue={notice?.title} required />
      <AdminImageField
        label="Imagem (opcional)"
        name="coverImage"
        fileFieldName="coverImageFile"
        defaultValue={notice?.coverImage}
      />
      <AdminRichTextField
        label="Texto do aviso"
        name="body"
        defaultValue={notice?.body ?? ""}
        required
      />
      <label className="block text-sm">
        <span className="font-medium">Ocultar após (opcional)</span>
        <input
          name="expiresAt"
          type="datetime-local"
          defaultValue={toDatetimeLocalValue(notice?.expiresAt ?? null)}
          className={`${adminInput} mt-1`}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="published" value="off" />
        <input
          type="checkbox"
          name="published"
          value="on"
          defaultChecked={notice?.published ?? true}
        />{" "}
        Publicar no site
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
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={adminInput}
      />
    </div>
  );
}