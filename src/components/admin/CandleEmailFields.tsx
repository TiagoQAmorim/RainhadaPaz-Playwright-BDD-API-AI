"use client";

import { useRef } from "react";
import { adminInput, adminTextarea } from "@/components/admin/AdminFormStyles";

type Tag = readonly [string, string];

function insertTag(field: HTMLTextAreaElement | HTMLInputElement | null, tag: string) {
  if (!field) return;
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? start;
  field.value = field.value.slice(0, start) + tag + field.value.slice(end);
  const caret = start + tag.length;
  field.focus();
  field.setSelectionRange(caret, caret);
}

function TagButtons({ tags, onInsert }: { tags: readonly Tag[]; onInsert: (tag: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(([tag, label]) => (
        <button
          key={tag}
          type="button"
          title={label}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onInsert(tag)}
          className="rounded-full border border-parish-200 bg-parish-50 px-2 py-0.5 font-mono text-xs text-parish-800 hover:bg-parish-100"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

function EmailTemplate({
  title,
  hint,
  subjectName,
  bodyName,
  subject,
  body,
  tags,
  rows,
}: {
  title: string;
  hint: string;
  subjectName: string;
  bodyName: string;
  subject: string;
  body: string;
  tags: readonly Tag[];
  rows: number;
}) {
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  function remember(field: HTMLInputElement | HTMLTextAreaElement) {
    lastRef.current = field;
  }

  return (
    <fieldset className="space-y-2 border-t border-parish-100 pt-4">
      <legend className="text-sm font-semibold text-parish-900">{title}</legend>
      <p className="text-xs text-parish-500">{hint}</p>
      <TagButtons
        tags={tags}
        onInsert={(tag) => insertTag(lastRef.current ?? bodyRef.current, tag)}
      />
      <label className="block text-sm font-medium">
        Assunto
        <input
          ref={subjectRef}
          onFocus={(event) => remember(event.currentTarget)}
          name={subjectName}
          defaultValue={subject}
          className={`${adminInput} mt-1`}
        />
      </label>
      <label className="block text-sm font-medium">
        Texto
        <textarea
          ref={bodyRef}
          onFocus={(event) => remember(event.currentTarget)}
          name={bodyName}
          defaultValue={body}
          rows={rows}
          className={`${adminTextarea} mt-1`}
        />
      </label>
    </fieldset>
  );
}

export function CandleEmailFields({
  litSubject,
  litBody,
  expirySubject,
  expiryBody,
  weekSubject,
  weekIntro,
  weekItem,
  personTags,
  weekIntroTags,
  weekItemTags,
}: {
  litSubject: string;
  litBody: string;
  expirySubject: string;
  expiryBody: string;
  weekSubject: string;
  weekIntro: string;
  weekItem: string;
  personTags: readonly Tag[];
  weekIntroTags: readonly Tag[];
  weekItemTags: readonly Tag[];
}) {
  const itemRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-parish-900">Textos dos e-mails</h2>
      <p className="text-xs text-parish-500">
        Clique numa tag para colocá-la onde o cursor estiver. Apague o texto de um campo para voltar
        ao modelo original.
      </p>
      <EmailTemplate
        title="Quando a vela acende, para a paróquia"
        hint="Chega no e-mail de receber velas e orações."
        subjectName="candleLitEmailSubject"
        bodyName="candleLitEmailBody"
        subject={litSubject}
        body={litBody}
        tags={personTags}
        rows={12}
      />
      <EmailTemplate
        title="Uma hora antes de apagar, para quem acendeu"
        hint="Só é enviado se a pessoa deixou e-mail e a vela dura mais de uma hora."
        subjectName="candleExpiryEmailSubject"
        bodyName="candleExpiryEmailBody"
        subject={expirySubject}
        body={expiryBody}
        tags={personTags}
        rows={10}
      />
      <EmailTemplate
        title="Sexta-feira, lista da semana"
        hint="Use <velas> no lugar em que a lista de velas deve aparecer."
        subjectName="candleWeekEmailSubject"
        bodyName="candleWeekEmailIntro"
        subject={weekSubject}
        body={weekIntro}
        tags={weekIntroTags}
        rows={10}
      />
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-parish-900">Modelo de cada vela na lista</legend>
        <TagButtons tags={weekItemTags} onInsert={(tag) => insertTag(itemRef.current, tag)} />
        <textarea
          ref={itemRef}
          name="candleWeekEmailItem"
          defaultValue={weekItem}
          rows={10}
          className={adminTextarea}
        />
      </fieldset>
    </div>
  );
}
