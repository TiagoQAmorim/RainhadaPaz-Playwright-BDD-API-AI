"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type Props = {
  src: string;
  alt: string;
  className?: string;
  children: ReactNode;
};

export function WorkImageLightbox({ src, alt, className, children }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={`Ampliar ${alt}`}
        onClick={() => setOpen(true)}
        className={cn("block w-full cursor-zoom-in text-left", className)}
      >
        {children}
      </button>
      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
              role="presentation"
              onClick={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={alt}
                className="relative flex max-h-[92vh] max-w-[1100px] items-center justify-center"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Fechar"
                  autoFocus
                  onClick={() => setOpen(false)}
                  className="absolute -top-1 right-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl leading-none font-bold text-parish-950 shadow-lg hover:bg-gold-100 sm:-right-2 sm:-top-2"
                >
                  ×
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl" />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
