"use client";

import type { FormEvent, ReactNode } from "react";

type AdminConfirmDeleteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  className?: string;
  children: ReactNode;
};

export function AdminConfirmDeleteForm({
  action,
  confirmMessage,
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
        }
      }}
    >
      {children}
    </form>
  );
}
