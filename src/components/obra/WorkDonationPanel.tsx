import Link from "next/link";
import { PixPaymentInstructions } from "@/components/payment/PixPaymentInstructions";
import { WORK_HELP_AMOUNTS_BRL } from "@/lib/parish-work";
import { formatBrl, type parishPixPayload } from "@/lib/parish-pix";

type Pix = ReturnType<typeof parishPixPayload>;

type Props = {
  pix: Pix | null;
  amountError: string | null;
  selectedCents: number | null;
};

export function WorkDonationPanel({ pix, amountError, selectedCents }: Props) {
  return (
    <section id="ajuda" className="scroll-mt-24 overflow-hidden rounded-3xl bg-parish-700 text-white shadow-xl">
      <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-300">Ajuda à obra</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold">
            Participe desta etapa
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85">
            O PIX cai na conta da paróquia, a mesma do dízimo. No comprovante fica o identificador da
            obra para a secretaria conferir.
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {WORK_HELP_AMOUNTS_BRL.map((amount) => {
              const active = selectedCents === amount * 100;
              return (
                <li key={amount}>
                  <Link
                    href={`/obra?ajuda=${amount}#ajuda`}
                    className={
                      active
                        ? "flex min-h-14 items-center justify-center rounded-2xl bg-gold-400 px-3 text-base font-bold text-parish-950"
                        : "flex min-h-14 items-center justify-center rounded-2xl bg-white/10 px-3 text-base font-bold text-white ring-1 ring-white/20 hover:bg-white/15"
                    }
                  >
                    {formatBrl(amount)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <form action="/obra#ajuda" method="get" className="mt-4 flex flex-wrap items-end gap-2">
            <label className="min-w-[10rem] flex-1 text-sm">
              <span className="mb-1 block text-white/80">Outro valor (R$)</span>
              <input
                name="ajuda"
                inputMode="decimal"
                placeholder="80"
                className="w-full rounded-xl border border-white/20 bg-white px-3 py-2 text-parish-900 outline-none"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-parish-800 hover:bg-gold-100"
            >
              Gerar PIX
            </button>
          </form>
          {amountError ? <p className="mt-3 text-sm text-gold-200">{amountError}</p> : null}
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4">
            <p className="text-sm font-semibold text-gold-200">Cartão</p>
            <p className="mt-1 text-sm leading-relaxed text-white/80">
              O cartão entra quando a Sicredi liberar o checkout. Até lá, a ajuda é pelo PIX.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-parish-50 p-1 text-parish-900">
          {pix?.pixCopiaECola ? (
            <PixPaymentInstructions
              legalName={pix.legalName}
              pixKey={pix.pixKey}
              pixKeyType={pix.pixKeyType}
              bank={pix.bank}
              amountLabel={pix.amountLabel}
              reference={pix.reference}
              messageSuggestion={pix.messageSuggestion}
              pixCopiaECola={pix.pixCopiaECola}
              title="Pague a ajuda com PIX"
              afterPayNote="Guarde o comprovante. A secretaria confere o identificador da obra no extrato."
              backHref="/obra"
              backLabel="Voltar ao topo da obra"
            />
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-parish-900">
                Escolha um valor
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-parish-600">
                O QR Code aparece aqui, com o valor já preenchido para o app do banco.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
