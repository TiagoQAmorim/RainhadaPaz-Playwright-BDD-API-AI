import { upsertHomeQuickLink } from "@/app/admin/actions";
import { AdminImageField } from "@/components/admin/AdminImageField";
import {
  adminBtn,
  adminFormEncType,
  adminInput,
  adminTextarea,
} from "@/components/admin/AdminFormStyles";

export type QuickLinkFormValues = {
  id?: string;
  title: string;
  description: string;
  href: string;
  imageUrl?: string | null;
  sortOrder: number;
  published: boolean;
  external: boolean;
};

type Props = { link?: QuickLinkFormValues; submitLabel: string };

export function AdminHomeQuickLinkForm({ link, submitLabel }: Props) {
  return (
    <form action={upsertHomeQuickLink} encType={adminFormEncType} className="space-y-3">
      {link?.id ? <input type="hidden" name="id" value={link.id} /> : null}
      <Field label="Título" name="title" defaultValue={link?.title} required />
      <TextArea label="Descrição" name="description" defaultValue={link?.description} required />
      <Field label="Link" name="href" defaultValue={link?.href} placeholder="/velas" required />
      <AdminImageField
        label="Imagem"
        name="imageUrl"
        fileFieldName="imageUrlFile"
        defaultValue={link?.imageUrl}
      />
      <Field label="Ordem" name="sortOrder" type="number" defaultValue={String(link?.sortOrder ?? 0)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="published" value="off" />
        <input type="checkbox" name="published" value="on" defaultChecked={link?.published ?? true} />{" "}
        Publicado
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="external" value="off" />
        <input type="checkbox" name="external" value="on" defaultChecked={link?.external ?? false} />{" "}
        Link externo
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

function TextArea({
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
        rows={2}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={adminTextarea}
      />
    </div>
  );
}