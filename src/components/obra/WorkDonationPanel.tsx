import Link from "next/link";
import { WorkPixRow } from "@/components/obra/WorkPixRow";
import { WORK_HELP_AMOUNTS_BRL } from "@/lib/parish-work";
import { formatBrl, type parishPixPayload } from "@/lib/parish-pix";
import { isSicrediCardEnabled } from "@/lib/sicredi-payments";

type Pix = ReturnType<typeof parishPixPayload>;

type Props = {
  pix: Pix | null;
  amountError: string | null;
  selectedCents: number | null;
  method: "pix" | "cartao";
};

function ajudaHref(method: "pix" | "cartao", cents: number | null) {
  const params = new URLSearchParams({ meio: method });
  if (cents != null) params.set("ajuda", String(cents / 100));
  return `/obra?${params.toString()}#ajuda`;
}

export function WorkDonationPanel({ pix, amountError, selectedCents, method }: Props) {
  const cardLive = isSicrediCardEnabled();

  return (
    <section id="ajuda" className="scroll-mt-24 rounded-2xl bg-white px-4 py-3 text-parish-900 shadow-lg sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-parish-900">
              Ajude a obra
            </h2>
            <div className="flex rounded-full bg-parish-50 p-0.5 ring-1 ring-parish-200">
              <Link
                href={ajudaHref("pix", selectedCents)}
                className={
                  method === "pix"
                    ? "rounded-full bg-parish-700 px-4 py-1.5 text-sm font-bold text-white"
                    : "rounded-full px-4 py-1.5 text-sm font-bold text-parish-700 hover:bg-white"
                }
                aria-current={method === "pix" ? "true" : undefined}
              >
                PIX
              </Link>
              <Link
                href={ajudaHref("cartao", selectedCents)}
                className={
                  method === "cartao"
                    ? "rounded-full bg-parish-700 px-4 py-1.5 text-sm font-bold text-white"
                    : "rounded-full px-4 py-1.5 text-sm font-bold text-parish-700 hover:bg-white"
                }
                aria-current={method === "cartao" ? "true" : undefined}
              >
                Cartão
              </Link>
            </div>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {WORK_HELP_AMOUNTS_BRL.map((amount) => {
              const active = selectedCents === amount * 100;
              return (
                <li key={amount}>
                  <Link
                    href={`/obra?meio=${method}&ajuda=${amount}#ajuda`}
                    className={
                      active
                        ? "inline-flex min-h-9 items-center rounded-full bg-gold-400 px-3 text-sm font-bold text-parish-950"
                        : "inline-flex min-h-9 items-center rounded-full bg-parish-50 px-3 text-sm font-bold text-parish-800 ring-1 ring-parish-200 hover:bg-parish-100"
                    }
                  >
                    {formatBrl(amount)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <form action="/obra#ajuda" method="get" className="mt-2 flex flex-wrap items-center gap-2">
            <input type="hidden" name="meio" value={method} />
            <label className="text-xs text-parish-600">
              Outro valor
              <input
                name="ajuda"
                inputMode="decimal"
                placeholder="80"
                className="ml-2 w-24 rounded-full border border-parish-200 bg-white px-3 py-1.5 text-sm text-parish-900 outline-none"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-parish-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-parish-600"
            >
              {method === "cartao" ? "Usar valor" : "Gerar PIX"}
            </button>
            {amountError ? <p className="text-sm text-red-700">{amountError}</p> : null}
          </form>
        </div>

        <div className="shrink-0 lg:max-w-sm lg:border-l lg:border-parish-100 lg:pl-4">
          {method === "cartao" ? (
            <div>
              <p className="text-sm font-semibold text-parish-900">Cartão Sicredi</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-parish-600">
                {cardLive
                  ? "A cobrança no cartão usa este botão."
                  : "O botão já fica aqui. A cobrança entra quando a Sicredi liberar."}
              </p>
              <button
                type="button"
                disabled={!cardLive}
                className="mt-2 rounded-full bg-parish-800 px-4 py-1.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-parish-300"
              >
                Pagar com cartão
              </button>
            </div>
          ) : pix?.pixCopiaECola ? (
            <WorkPixRow amountLabel={pix.amountLabel} pixCopiaECola={pix.pixCopiaECola} />
          ) : (
            <p className="max-w-xs text-xs leading-relaxed text-parish-500">
              Escolha um valor para ver o QR Code. O PIX cai na conta da paróquia.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
