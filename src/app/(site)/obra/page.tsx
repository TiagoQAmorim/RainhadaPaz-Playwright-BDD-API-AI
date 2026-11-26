import Image from "next/image";
import Link from "next/link";
import { BeforeAfterCompare } from "@/components/obra/BeforeAfterCompare";
import { WorkDonationPanel } from "@/components/obra/WorkDonationPanel";
import { PageContainer } from "@/components/PageContainer";
import { PhotoHeroBanner } from "@/components/PhotoHeroBanner";
import { hasValidAdminSession } from "@/lib/auth";
import { parishPixPayload } from "@/lib/parish-pix";
import { getParishWork, parseHelpAmountCents, workStatusLabel } from "@/lib/parish-work";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ ajuda?: string }>;
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
  const [{ project, comparisons, moments, photos }, { ajuda }, admin] = await Promise.all([
    getParishWork(),
    searchParams,
    hasValidAdminSession(),
  ]);

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
    cents == null
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
        minHeightClass="min-h-[320px] sm:min-h-[380px]"
      >
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-300">Paróquia Rainha da Paz</p>
        <h1 className="mt-2 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-semibold text-white md:text-5xl">
          {project.title}
        </h1>
        {project.intro ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90">{project.intro}</p>
        ) : null}
        {progress > 0 || project.progressLabel ? (
          <div className="mt-6 max-w-md">
            <div className="flex items-end justify-between gap-3 text-sm text-white">
              <span className="font-semibold">{project.progressLabel || "Evolução da obra"}</span>
              <span className="text-lg font-bold tabular-nums text-gold-300">{progress}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-gold-400" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}
        <Link
          href="#ajuda"
          className="mt-6 inline-flex rounded-full bg-gold-500 px-6 py-3 text-sm font-bold text-parish-950 hover:bg-gold-400"
        >
          Ajudar esta obra
        </Link>
      </PhotoHeroBanner>

      <PageContainer wide className="space-y-16 py-14 md:py-16">
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
                        <div className="relative min-h-48">
                          <Image
                            src={moment.imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="256px"
                            unoptimized={upload(moment.imageUrl)}
                          />
                        </div>
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
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {comparisons.map((item) => (
                <BeforeAfterCompare
                  key={item.id}
                  title={item.title}
                  beforeUrl={item.beforeUrl}
                  afterUrl={item.afterUrl}
                  caption={item.caption}
                />
              ))}
            </div>
          </section>
        ) : null}

        {photos.length > 0 ? (
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Galeria</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-parish-900">
              Fotos da obra
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <li key={photo.id} className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={photo.imageUrl}
                      alt={photo.caption || "Foto da obra"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      unoptimized={upload(photo.imageUrl)}
                    />
                  </div>
                  {photo.caption ? (
                    <p className="px-4 py-3 text-sm text-parish-700">{photo.caption}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <WorkDonationPanel pix={pix} amountError={amountError} selectedCents={cents} />
      </PageContainer>
    </>
  );
}
