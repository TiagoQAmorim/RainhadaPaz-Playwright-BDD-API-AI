import { ContentCoverImage } from "@/components/ContentCoverImage";
import { PageContainer } from "@/components/PageContainer";

import { SectionHeading } from "@/components/SectionHeading";

import { sanitizeWpHtml } from "@/lib/sanitize-wp-html";
import { prisma } from "@/lib/prisma";

import { getSiteSettings } from "@/lib/settings";



export const metadata = { title: "Contato" };



export default async function ContatoPage() {

  const [s, page] = await Promise.all([

    getSiteSettings(),

    prisma.page.findUnique({ where: { slug: "contato" } }),

  ]);



  return (

    <PageContainer className="py-12 md:py-16">

      <SectionHeading

        eyebrow="Fale conosco"

        title="Contato"

        description="Secretaria paroquial e WhatsApp no canto da tela."

      />

      {page?.featuredImage ? (
        <ContentCoverImage src={page.featuredImage} alt="" className="mt-8 max-w-3xl" />
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">

        <div className="glass-card p-8">

          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-parish-900">

            Endereço

          </h2>

          <p className="mt-3 text-parish-700">{s.address}</p>

        </div>

        <div className="glass-card p-8">

          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-parish-900">

            Telefone

          </h2>

          <p className="mt-3">

            <a

              href={`tel:${s.phone.replace(/\D/g, "")}`}

              className="text-lg font-semibold text-parish-700 hover:text-gold-600"

            >

              {s.phone}

            </a>

          </p>

          {s.email ? (

            <>

              <h2 className="mt-6 font-[family-name:var(--font-display)] text-xl font-semibold text-parish-900">

                E-mail

              </h2>

              <p className="mt-2">

                <a href={`mailto:${s.email}`} className="text-parish-700 hover:text-gold-600">

                  {s.email}

                </a>

              </p>

            </>

          ) : null}

        </div>

      </div>

      {page ? (

        <article

          className="prose-parish mt-10 max-w-3xl"

          dangerouslySetInnerHTML={{ __html: sanitizeWpHtml(page.body, { slug: "contato" }) }}

        />

      ) : null}

    </PageContainer>

  );

}

