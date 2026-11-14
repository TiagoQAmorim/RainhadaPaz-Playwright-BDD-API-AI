type Props = {
  address: string;
  phone: string;
};

export function TopBar({ address, phone }: Props) {
  const tel = phone.replace(/\D/g, "");
  return (
    <div className="border-b border-white/15 bg-parish-600 text-[13px] text-white/90 max-sm:text-[10px] max-sm:leading-tight">
      <div className="mx-auto flex max-w-7xl max-sm:flex-nowrap items-center justify-between gap-2 px-4 py-2 max-sm:gap-1.5 max-sm:py-1.5 sm:flex-wrap">
        <p className="min-w-0 flex-1 truncate whitespace-nowrap max-sm:pr-1">{address}</p>
        <p className="flex shrink-0 items-center gap-4 max-sm:gap-2">
          {phone ? (
            <a
              href={`tel:${tel}`}
              className="truncate whitespace-nowrap font-medium hover:text-gold-300 max-sm:max-w-[9.5rem]"
            >
              {phone}
            </a>
          ) : null}
          <span className="hidden text-white/50 sm:inline">Diocese de Santo Amaro</span>
        </p>
      </div>
    </div>
  );
}
