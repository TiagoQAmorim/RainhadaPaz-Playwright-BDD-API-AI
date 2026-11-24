import Image from "next/image";
import { PageContainer } from "@/components/PageContainer";
import { ParishPlaceMap } from "@/components/ParishPlaceMap";
import { INSTITUTIONAL_PLACES } from "@/lib/parish-places";
import { sanitizeWpHtml } from "@/lib/sanitize-wp-html";
import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Institucional" };

function withoutFirstFigure(html: string) {
  return html.replace(/<figure\b[\s\S]*?<\/figure>/i, "");
}

function withoutLegacyMap(html: string) {
  return html
    .replace(/<p>\s*<iframe\b[^>]*google\.com\/maps[\s\S]*?<\/iframe>\s*;?\s*<\/p>/gi, "")
    .replace(/<iframe\b[^>]*google\.com\/maps[\s\S]*?<\/iframe>\s*;?/gi, "");
}

export default async function InstitucionalPage() {
  const s = await getSiteSettings();
  const banner = s.aboutBannerUrl?.trim() || "";
  let aboutHtml = s.aboutHtml;
  if (banner) aboutHtml = withoutFirstFigure(aboutHtml);
  if (s.showMatrizMap) aboutHtml = withoutLegacyMap(aboutHtml);
  aboutHtml = sanitizeWpHtml(aboutHtml);
  const places = INSTITUTIONAL_PLACES.filter((place) =>
    place.key === "matriz" ? s.showMatrizMap : s.showCapelaMap,
  );

  return (
    <>
      <div className="border-b border-parish-200 bg-parish-50 py-12 md:py-16">
        <PageContainer>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-parish-600">{s.diocese}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-parish-900 md:text-5xl">
            {s.parishName}
          </h1>
        </PageContainer>
      </div>
      <PageContainer className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          {banner ? (
            <figure className="mb-8 overflow-hidden rounded-2xl">
              <div className="relative aspect-[960/350] w-full">
                <Image
                  src={banner}
                  alt={s.parishName}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 614px, 100vw"
                  unoptimized={banner.startsWith("/uploads/")}
                />
              </div>
            </figure>
          ) : null}
          <article
            className="prose-parish"
            dangerouslySetInnerHTML={{ __html: aboutHtml }}
          />
          {places.length > 0 ? (
            <div className="mt-12 space-y-10">
              {places.map((place) => (
                <ParishPlaceMap
                  key={place.key}
                  title={place.title}
                  address={place.address}
                  query={place.query}
                />
              ))}
            </div>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}
