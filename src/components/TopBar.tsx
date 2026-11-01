type Props = {
  address: string;
  phone: string;
};

export function TopBar({ address, phone }: Props) {
  const tel = phone.replace(/\D/g, "");
  return (
    <div className="border-b border-white/15 bg-parish-600 text-[13px] text-white/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <p className="truncate">{address}</p>
        <p className="flex items-center gap-4">
          {phone ? (
            <a href={`tel:${tel}`} className="font-medium hover:text-gold-300">
              {phone}
            </a>
          ) : null}
          <span className="hidden text-white/50 sm:inline">Diocese de Santo Amaro</span>
        </p>
      </div>
    </div>
  );
}
