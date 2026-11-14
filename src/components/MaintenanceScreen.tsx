import { ParishLogo } from "@/components/ParishLogo";
import { formatMaintenanceReturnDate } from "@/lib/maintenance";
import { PARISH_LOGO_PATH } from "@/lib/parish-brand";

type Props = {
  parishName: string;
  logoUrl: string | null;
  message: string;
  endsAt: Date | null;
};

export function MaintenanceScreen({ parishName, logoUrl, message, endsAt }: Props) {
  const returnLabel = formatMaintenanceReturnDate(endsAt);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-parish-700 via-parish-600 to-parish-800 px-4 py-16 text-center">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-md md:p-10">
        <div className="mx-auto mb-6 flex justify-center">
          <ParishLogo
            src={logoUrl ?? PARISH_LOGO_PATH}
            alt={parishName}
            variant="hero"
            priority
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-300">Manutenção</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold text-white md:text-3xl">
          {parishName}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-white/90 md:text-lg">{message}</p>
        {returnLabel ? (
          <p className="mt-5 text-sm text-gold-200">
            Previsão de volta: <strong className="font-semibold text-white">{returnLabel}</strong>
          </p>
        ) : null}
      </div>
    </div>
  );
}