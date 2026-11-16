"use client";

import type { FormEvent, ReactNode } from "react";

type AdminConfirmDeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  /** Exige digitar esta frase (ex.: EXCLUIR) após o confirm do navegador. */
  confirmPhrase?: string;
  className?: string;
  children: ReactNode;
};

export function AdminConfirmDeleteForm({
  action,
  confirmMessage,
  confirmPhrase,
  className,
  children,
}: AdminConfirmDeleteFormProps) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
          return;
        }
        if (confirmPhrase) {
          const typed = window.prompt(
            `Para confirmar, digite exatamente: ${confirmPhrase}`,
          );
          if (typed?.trim().toUpperCase() !== confirmPhrase.toUpperCase()) {
            e.preventDefault();
            window.alert("Exclusão cancelada — confirmação incorreta.");
            return;
          }
          const input = e.currentTarget.querySelector(
            'input[name="dangerConfirm"]',
          ) as HTMLInputElement | null;
          if (input) input.value = confirmPhrase;
        }
      }}
    >
      {confirmPhrase ? <input type="hidden" name="dangerConfirm" value="" /> : null}
      {children}
    </form>
  );
}