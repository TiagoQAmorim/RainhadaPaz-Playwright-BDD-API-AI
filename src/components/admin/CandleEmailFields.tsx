"use client";

import { useRef, type ReactNode } from "react";
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
          title={`Inserir ${tag}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onInsert(tag)}
          className="inline-flex items-baseline gap-1.5 rounded-lg border border-parish-200 bg-white px-2 py-1 text-left hover:border-parish-400"
        >
          <span className="font-mono text-[11px] text-parish-900">{tag}</span>
          <span className="text-[11px] text-parish-500">{label}</span>
        </button>
      ))}
    </div>
  );
}

function EmailLayout({
  enabledName,
  enabledDefault,
  kicker,
  title,
  hint,
  subjectName,
  bodyName,
  bodyLabel,
  subject,
  body,
  tags,
  rows,
  details,
  children,
}: {
  enabledName: string;
  enabledDefault: boolean;
  kicker: string;
  title: string;
  hint: string;
  subjectName: string;
  bodyName: string;
  bodyLabel: string;
  subject: string;
  body: string;
  tags: readonly Tag[];
  rows: number;
  details?: ReactNode;
  children?: ReactNode;
}) {
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  function remember(field: HTMLInputElement | HTMLTextAreaElement) {
    lastRef.current = field;
  }

  return (
    <article className="rounded-2xl border border-parish-200 bg-white p-4 shadow-sm">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-parish-900">
        <input type="checkbox" name={enabledName} defaultChecked={enabledDefault} />
        Enviar este e-mail
      </label>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-parish-500">{kicker}</p>
      <h3 className="mt-1 text-base font-semibold text-parish-900">{title}</h3>
      <p className="mt-1 text-sm text-parish-600">{hint}</p>
      {details}
      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium text-parish-700">
          Clique para inserir no campo que estiver selecionado
        </p>
        <TagButtons
          tags={tags}
          onInsert={(tag) => insertTag(lastRef.current ?? bodyRef.current, tag)}
        />
      </div>
      <label className="mt-4 block text-sm font-medium text-parish-900">
        Assunto
        <input
          ref={subjectRef}
          onFocus={(event) => remember(event.currentTarget)}
          name={subjectName}
          defaultValue={subject}
          className={`${adminInput} mt-1`}
        />
      </label>
      <label className="mt-3 block text-sm font-medium text-parish-900">
        {bodyLabel}
        <textarea
          ref={bodyRef}
          onFocus={(event) => remember(event.currentTarget)}
          name={bodyName}
          defaultValue={body}
          rows={rows}
          className={`${adminTextarea} mt-1`}
        />
      </label>
      {children}
    </article>
  );
}

export function CandleEmailFields({
  expiryEnabled,
  expiryMinutes,
  expirySubject,
  expiryBody,
  weekEnabled,
  notifyEmails,
  generalEmail,
  weekSubject,
  weekIntro,
  personTags,
  weekIntroTags,
}: {
  expiryEnabled: boolean;
  expiryMinutes: number;
  expirySubject: string;
  expiryBody: string;
  weekEnabled: boolean;
  notifyEmails: string;
  generalEmail: string | null;
  weekSubject: string;
  weekIntro: string;
  personTags: readonly Tag[];
  weekIntroTags: readonly Tag[];
}) {

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-parish-900">Os dois e-mails</h2>
        <p className="mt-1 text-sm text-parish-600">
          Cada cartão só sai se “Enviar este e-mail” estiver marcado. Apague um campo de texto e
          salve para voltar ao modelo original.
        </p>
      </div>
      <EmailLayout
        enabledName="candleExpiryEmailEnabled"
        enabledDefault={expiryEnabled}
        kicker="Para quem acendeu"
        title="Antes de apagar"
        hint="Vai para o e-mail que a pessoa informou ao acender a vela. Use <antecedencia> para citar o prazo."
        subjectName="candleExpiryEmailSubject"
        bodyName="candleExpiryEmailBody"
        bodyLabel="Texto"
        subject={expirySubject}
        body={expiryBody}
        tags={personTags}
        rows={8}
        details={
          <div className="mt-3 max-w-xs">
            <label className="mb-1 block text-sm font-medium text-parish-900">Avisar antes de apagar</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="candleExpiryNoticeMinutes"
                min={1}
                max={1440}
                step={1}
                defaultValue={expiryMinutes}
                className={adminInput}
                required
              />
              <span className="shrink-0 text-sm text-parish-600">minutos</span>
            </div>
            <p className="mt-1.5 text-xs text-parish-500">A vela precisa durar mais do que esse prazo.</p>
          </div>
        }
      />
      <EmailLayout
        enabledName="candleWeekEmailEnabled"
        enabledDefault={weekEnabled}
        kicker="Para a paróquia · sexta às 23h"
        title="Lista da semana"
        hint="Leva as velas e orações de domingo a sexta. Onde estiver <velas>, entra a tabela: uma linha por vela."
        subjectName="candleWeekEmailSubject"
        bodyName="candleWeekEmailIntro"
        bodyLabel="Texto do e-mail"
        subject={weekSubject}
        body={weekIntro}
        tags={weekIntroTags}
        rows={8}
        details={
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-parish-900">
              E-mails que recebem a lista
            </label>
            <textarea
              name="candlesNotifyEmail"
              defaultValue={notifyEmails}
              rows={4}
              placeholder={generalEmail ?? "contato@paroquia.exemplo"}
              className={adminTextarea}
            />
            <p className="mt-1.5 text-xs text-parish-500">
              Um e-mail por linha. Pode separar por vírgula. Se ficar vazio, usa o e-mail geral de
              Informações
              {generalEmail ? ` (${generalEmail})` : " (ainda não configurado)"}.
            </p>
          </div>
        }
      />
    </div>
  );
}
