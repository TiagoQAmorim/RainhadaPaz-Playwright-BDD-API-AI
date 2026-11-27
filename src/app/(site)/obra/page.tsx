import Image from "next/image";
import { BeforeAfterCarousel } from "@/components/obra/BeforeAfterCarousel";
import { WorkDonationPanel } from "@/components/obra/WorkDonationPanel";
import { WorkImageLightbox } from "@/components/obra/WorkImageLightbox";
import { PageContainer } from "@/components/PageContainer";
import { PhotoHeroBanner } from "@/components/PhotoHeroBanner";
import { hasValidAdminSession } from "@/lib/auth";
import { parishPixPayload } from "@/lib/parish-pix";
import { getParishWork, parseHelpAmountCents, workStatusLabel } from "@/lib/parish-work";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ ajuda?: string; meio?: string }>;
};

export async function generateMetadata() {
  const { project } = await getParishWork();
  return {
    title: project.title || "A obra",
    description:
      project.intro ||
      "Acompanhe a obra da Paróquia Rainha da Paz e ajude com PIX.",
  };
}

function upload(src: string) {
  return src.startsWith("/uploads/");
}

export default async function ObraPage({ searchParams }: Props) {
  const [{ project, comparisons, moments, photos }, { ajuda, meio }, admin] = await Promise.all([
    getParishWork(),
    searchParams,
    hasValidAdminSession(),
  ]);
  const method = meio === "cartao" ? "cartao" : "pix";

  if (!project.published && !admin) {
    return (
      <PageContainer className="py-16">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-parish-900">
          A obra
        </h1>
        <p className="mt-3 max-w-xl text-parish-700">
          Estamos organizando as fotos e as etapas. Em breve esta página mostra a reforma.
        </p>
      </PageContainer>
    );
  }

  const cents = parseHelpAmountCents(ajuda);
  const amountError = ajuda && cents == null ? "Informe um valor entre R$ 1 e R$ 100.000." : null;
  const pix =
    method !== "pix" || cents == null
      ? null
      : parishPixPayload({
          kind: "OBRA",
          referenceId: String(cents),
          amountCents: cents,
          extraMessage: "Ajuda à obra",
        });
  const heroImage = photos[0]?.imageUrl || "/images/parish/banner-principal.jpg";
  const progress = Math.min(100, Math.max(0, project.progressPercent));

  return (
    <>
      <PhotoHeroBanner
        imageSrc={heroImage}
        priority
        unoptimized={upload(heroImage)}
        wide
        minHeightClass="min-h-0"
        paddingClassName="py-4 md:py-5"
      >
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-white md:text-4xl">
            {project.title}
          </h1>
          {project.intro ? (
            <p className="mx-auto mt-2 max-w-5xl text-sm leading-snug text-white/90 md:text-base">{project.intro}</p>
          ) : null}
          {progress > 0 || project.progressLabel ? (
            <div className="mx-auto mt-3 max-w-3xl">
              <div className="flex items-center justify-center gap-3 text-sm text-white">
                <span className="font-semibold">{project.progressLabel || "Evolução da obra"}</span>
                <span className="text-lg font-bold tabular-nums text-gold-300">{progress}%</span>
              </div>
              <div className="mx-auto mt-2 h-4 w-full overflow-hidden rounded-full bg-white/25 md:h-5">
                <div className="h-full rounded-full bg-gold-400" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}
          <div className="mt-3 text-left">
            <WorkDonationPanel
              pix={pix}
              amountError={amountError}
              selectedCents={cents}
              method={method}
            />
          </div>
        </div>
      </PhotoHeroBanner>

      <PageContainer wide className="space-y-10 py-8 md:py-10">
        {moments.length > 0 ? (
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Evolução</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-parish-900">
              O caminho da reforma
            </h2>
            <ol className="mt-8 space-y-0">
              {moments.map((moment, index) => (
                <li key={moment.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={
                        moment.status === "done"
                          ? "mt-1.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"
                          : moment.status === "planned"
                            ? "mt-1.5 h-3.5 w-3.5 rounded-full bg-parish-300 ring-4 ring-parish-100"
                            : "mt-1.5 h-3.5 w-3.5 rounded-full bg-gold-500 ring-4 ring-gold-100"
                      }
                    />
                    {index < moments.length - 1 ? <span className="w-px flex-1 bg-parish-200" /> : null}
                  </div>
                  <article className="mb-8 overflow-hidden rounded-2xl border border-parish-100 bg-white shadow-sm">
                    <div className={moment.imageUrl ? "grid md:grid-cols-[16rem_minmax(0,1fr)]" : ""}>
                      {moment.imageUrl ? (
                        <WorkImageLightbox src={moment.imageUrl} alt={moment.title} className="h-full min-h-48">
                          <span className="relative block h-full min-h-48">
                            <Image
                              src={moment.imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="256px"
                              unoptimized={upload(moment.imageUrl)}
                            />
                          </span>
                        </WorkImageLightbox>
                      ) : null}
                      <div className="p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-parish-500">
                          {[moment.happenedOn, workStatusLabel(moment.status)].filter(Boolean).join(" · ")}
                        </p>
                        <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-parish-900">
                          {moment.title}
                        </h3>
                        {moment.body ? (
                          <p className="mt-2 text-sm leading-relaxed text-parish-700">{moment.body}</p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {comparisons.length > 0 ? (
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Antes e depois</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-parish-900">
              O que já mudou
            </h2>
            <BeforeAfterCarousel
              items={comparisons.map((item) => ({
                id: item.id,
                title: item.title,
                beforeUrl: item.beforeUrl,
                afterUrl: item.afterUrl,
                caption: item.caption,
              }))}
            />
          </section>
        ) : null}

        {photos.length > 0 ? (
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Galeria</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-parish-900">
              Fotos da obra
            </h2>
            <ul
              className={
                photos.length === 1
                  ? "mt-6 grid max-w-3xl gap-4"
                  : photos.length === 2
                    ? "mt-6 grid gap-4 sm:grid-cols-2"
                    : "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {photos.map((photo) => (
                <li key={photo.id} className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5">
                  <WorkImageLightbox src={photo.imageUrl} alt={photo.caption || "Foto da obra"}>
                    <span className="relative block aspect-[4/3]">
                      <Image
                        src={photo.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 33vw"
                        unoptimized={upload(photo.imageUrl)}
                      />
                    </span>
                  </WorkImageLightbox>
                  {photo.caption ? (
                    <p className="px-4 py-3 text-sm text-parish-700">{photo.caption}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </PageContainer>
    </>
  );
}
