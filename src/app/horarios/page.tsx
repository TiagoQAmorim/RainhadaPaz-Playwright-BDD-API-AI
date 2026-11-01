import Image from "next/image";
import { PageContainer } from "@/components/PageContainer";
import { getPublishedMassLocations, scheduleTextToHtml } from "@/lib/mass-locations";
import { getSiteSettings } from "@/lib/settings";
import { WP_IMAGES } from "@/lib/wordpress-assets";

export const metadata = { title: "Horários" };

export default async function HorariosPage() {
  const [s, locations] = await Promise.all([
    getSiteSettings(),
    getPublishedMassLocations(),
  ]);
  const matriz = s.matrizImageUrl ?? WP_IMAGES.matriz;
  const capela = s.capelaImageUrl ?? WP_IMAGES.capela;

  return (
    <>
      <div className="relative h-48 bg-parish-600 md:h-56">
        <Image src={matriz} alt="" fill className="object-cover opacity-40" sizes="100vw" />
        <PageContainer className="relative flex h-full items-end pb-8">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-white">
            Horários de missa
          </h1>
        </PageContainer>
      </div>
      <PageContainer className="py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {locations.length > 0 ? (
              locations.map((loc) => (
                <article key={loc.id} className="glass-card p-8">
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
                </article>
              ))
            ) : (
              <div
                className="glass-card p-8 prose-parish"
                dangerouslySetInnerHTML={{ __html: s.massScheduleHtml }}
              />
            )}
          </div>
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl shadow-lg">
              <Image src={matriz} alt="Matriz" fill className="object-cover" sizes="500px" />
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl shadow-lg">
              <Image src={capela} alt="Capela" fill className="object-cover" sizes="500px" />
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
