import Link from "next/link";
import { ParishBankDetails } from "@/components/parish/ParishBankDetails";
import { TITHE_AMOUNT_BRL_LIST, TITHE_DISCLAIMERS } from "@/lib/tithe-options";
import { formatBrl } from "@/lib/parish-pix";

export function TitheDonationPanel() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
      <div className="glass-card space-y-5 p-6 md:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-parish-900">
          Por que o dízimo?
        </h2>
        <p className="text-sm leading-relaxed text-parish-700">
          O dízimo é partilha da fé e sustento da missão da paróquia: liturgia, caridade, formação e
          manutenção dos espaços onde a comunidade se reúne.
        </p>
        <p className="text-sm leading-relaxed text-parish-700">
          Prefere outro valor? Fale com a{" "}
          <Link href="/contato" className="font-semibold text-parish-600 underline-offset-2 hover:underline">
            secretaria
          </Link>
          .
        </p>
        <ul className="space-y-2 border-t border-parish-100 pt-5 text-sm text-parish-700">
          {TITHE_DISCLAIMERS.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium text-parish-800">Deus abençoe.</p>
      </div>

      <div className="space-y-6">
        <ParishBankDetails />

        <div className="rounded-2xl border border-parish-200/80 bg-white p-6 shadow-sm md:p-8">
          <h3 className="text-lg font-semibold text-parish-900">Valores sugeridos (mensal)</h3>
          <p className="mt-2 text-sm text-parish-600">
            Faça o PIX pelo app do seu banco. Na mensagem, escreva <strong>DÍZIMO</strong>, seu nome e o
            valor. Cartão de crédito/débito online será via <strong>Sicredi</strong> (em breve, após contrato
            com a cooperativa).
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TITHE_AMOUNT_BRL_LIST.map((amountBrl) => (
              <li
                key={amountBrl}
                className="flex min-h-[3.25rem] flex-col items-center justify-center rounded-xl border border-parish-100 bg-parish-50/60 px-2 py-2 text-center"
              >
                <span className="text-base font-bold tabular-nums text-parish-900">
                  {formatBrl(amountBrl)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}