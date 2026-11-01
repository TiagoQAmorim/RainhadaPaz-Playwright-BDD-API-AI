import { ContentCoverImage } from "@/components/ContentCoverImage";
import { PageContainer } from "@/components/PageContainer";

import { ParishLogo } from "@/components/ParishLogo";

import { sanitizeWpHtml } from "@/lib/sanitize-wp-html";
import { prisma } from "@/lib/prisma";

import { WP_IMAGES } from "@/lib/wordpress-assets";



export const metadata = { title: "Padroeira" };



export default async function PadroeiraPage() {

  const page = await prisma.page.findUnique({ where: { slug: "padroeira" } });



  return (

    <PageContainer className="py-12 md:py-16">

      <div className="grid gap-10 lg:grid-cols-5">

        <div className="flex items-center justify-center rounded-3xl bg-parish-100/80 p-8 lg:col-span-2">

          <ParishLogo

            src="/logo-rainha-da-paz.png"

            alt="Nossa Senhora Rainha da Paz"

            variant="hero"

          />

        </div>

        {page ? (

          <div className="lg:col-span-3">

            {page.featuredImage ? (
              <ContentCoverImage src={page.featuredImage} alt="" className="mb-8" />
            ) : null}

            <article

              className="prose-parish"

              dangerouslySetInnerHTML={{ __html: sanitizeWpHtml(page.body, { slug: "padroeira" }) }}

            />

          </div>

        ) : (

          <article className="prose-parish lg:col-span-3">

            <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-parish-900">

              Nossa Senhora Rainha da Paz

            </h1>

            <p>Conteúdo em atualização.</p>

          </article>

        )}

      </div>

    </PageContainer>

  );

}

