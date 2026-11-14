export function RaffleTicketGridSkeleton({ count = 24 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      aria-busy
      aria-label="Carregando cotas"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex min-h-[9.5rem] animate-pulse flex-col rounded-xl border-2 border-parish-200 bg-white p-3"
        >
          <div className="h-3 w-16 rounded bg-parish-200" />
          <div className="mt-3 h-4 w-full rounded bg-parish-200" />
          <div className="mt-1 h-4 w-[85%] rounded bg-parish-100" />
          <div className="mt-auto h-3 w-20 rounded bg-parish-100" />
        </div>
      ))}
    </div>
  );
}
