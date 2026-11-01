import Link from "next/link";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import { PageContainer } from "@/components/PageContainer";
import { PAROCHIAL } from "@/lib/parish-social";
import { sanitizeWpHtml } from "@/lib/sanitize-wp-html";
import { getSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Pároco" };

export default async function ParocoPage() {
  const [settings, page] = await Promise.all([
    getSiteSettings(),
    prisma.page.findUnique({ where: { slug: "paroco" } }),
  ]);

  return (
    <PageContainer className="py-12 md:py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-gold-600">
        {settings.diocese}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold text-parish-900">
        {PAROCHIAL.priestName}
      </h1>
      <p className="mt-2 text-lg text-parish-700">Pároco — {settings.parishName}</p>

      {page?.featuredImage ? (
        <ContentCoverImage src={page.featuredImage} alt="" className="mt-6 max-w-3xl" />
      ) : null}

      {page ? (
        <article
          className="prose-parish mt-8 max-w-3xl"
          dangerouslySetInnerHTML={{ __html: sanitizeWpHtml(page.body, { slug: "paroco" }) }}
        />
      ) : (
        <p className="prose-parish mt-8 max-w-3xl">
          Pároco da comunidade paroquial, ao serviço da evangelização e da caridade.
        </p>
      )}

      <Link
        href={PAROCHIAL.priestInstagram}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex rounded-full bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-md"
      >
        Instagram {PAROCHIAL.priestInstagramHandle}
      </Link>
    </PageContainer>
  );
}
