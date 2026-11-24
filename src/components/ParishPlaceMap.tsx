import { parishPlaceMapSrc } from "@/lib/parish-places";

type Props = {
  title: string;
  address: string;
  query: string;
};

export function ParishPlaceMap({ title, address, query }: Props) {
  const src = parishPlaceMapSrc(query);
  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-parish-800">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-parish-700">{address}</p>
      <iframe
        title={title}
        src={src}
        className="mt-3 h-72 w-full rounded-2xl border border-parish-200"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </section>
  );
}
