import Image from "next/image";
import { PageContainer } from "@/components/PageContainer";
import { getPublishedMassLocations, scheduleTextToHtml } from "@/lib/mass-locations";
import { getSiteSettings } from "@/lib/settings";
import { resolveImageSrc } from "@/lib/local-image-url";
import { SITE_IMAGES } from "@/lib/wordpress-assets";
import { cn } from "@/lib/cn";

export const metadata = {
  title: "Horários das missas",
  description:
    "Horários das missas na Matriz da Vila Sofia, na Rua Sócrates, e na Capela Colégio Santa Maria.",
};

export default async function HorariosPage() {
  const [s, locations] = await Promise.all([
    getSiteSettings(),
    getPublishedMassLocations(),
  ]);
  const matriz = resolveImageSrc(s.matrizImageUrl, SITE_IMAGES.matriz);
  const capela = resolveImageSrc(s.capelaImageUrl, SITE_IMAGES.capela);

  return (
    <>
      <div className="relative h-48 bg-parish-600 md:h-56">
        <Image src={matriz} alt="Matriz da paróquia na Vila Sofia" fill className="object-cover opacity-40" sizes="100vw" />
        <PageContainer className="relative flex h-full items-end pb-8">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-white">
            Horários das missas
          </h1>
        </PageContainer>
      </div>
      {locations.length > 0 ? (
        <nav
          aria-label="Locais de missa"
          className="sticky top-14 z-40 border-b border-parish-200 bg-parish-50/95 backdrop-blur md:top-16"
        >
          <PageContainer className="flex gap-2 overflow-x-auto py-3">
            {locations.map((loc) => (
              <a
                key={loc.id}
                href={`#horario-${loc.id}`}
                className="shrink-0 rounded-full border border-parish-200 bg-white px-4 py-2 text-sm font-semibold text-parish-800 shadow-sm transition hover:border-gold-400 hover:text-parish-900"
              >
                {loc.name}
              </a>
            ))}
          </PageContainer>
        </nav>
      ) : null}
      <PageContainer className="py-12">
        {locations.length > 0 ? (
          <div className="space-y-8">
            {locations.map((loc, index) => {
              const imageOnRight = index % 2 === 0;
              const photo = resolveImageSrc(
                loc.imageUrl,
                index % 2 === 0 ? matriz : capela,
              );
              return (
                <article
                  key={loc.id}
                  id={`horario-${loc.id}`}
                  className="glass-card scroll-mt-36 overflow-hidden"
                >
                  <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(6.75rem,0.85fr)] items-stretch sm:grid-cols-2">
                    <div className={cn("p-5 sm:p-8", imageOnRight ? "order-1" : "order-2")}>
                      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-parish-900">
                        {loc.name}
                      </h2>
                      <p className="mt-2 text-sm text-parish-700">{loc.address}</p>
                      <div
                        className="prose-parish mt-4"
                        dangerouslySetInnerHTML={{
                          __html: scheduleTextToHtml(loc.scheduleText),
                        }}
                      />
                    </div>
                    <div
                      className={cn(
                        "relative min-h-48",
                        imageOnRight ? "order-2" : "order-1",
                      )}
                    >
                      <Image
                        src={photo}
                        alt={loc.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 40vw, 480px"
                        unoptimized={
                          photo.startsWith("/uploads/") || photo.startsWith("/images/")
                        }
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div
            className="glass-card p-8 prose-parish"
            dangerouslySetInnerHTML={{ __html: s.massScheduleHtml }}
          />
        )}
      </PageContainer>
    </>
  );
}
