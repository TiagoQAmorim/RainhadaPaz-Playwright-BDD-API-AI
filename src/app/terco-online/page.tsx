import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";
import { TercoOnlineSlots } from "@/components/TercoOnlineSlots";
import { prisma } from "@/lib/prisma";
import { getTercoOnlineSlots } from "@/lib/terco-online";
import { WP_IMAGES } from "@/lib/wordpress-assets";

export const metadata = { title: "Terço online" };

export default async function TercoOnlinePage() {
  const [page, slots] = await Promise.all([
    prisma.page.findUnique({ where: { slug: "terco-online" } }),
    getTercoOnlineSlots(),
  ]);

  const hero =
    page?.featuredImage ??
    page?.body.match(/src="([^"]+)"/)?.[1] ??
    WP_IMAGES.tercoOnline;

  return (
    <>
      <div className="relative h-56 md:h-72">
        <Image
          src={hero.startsWith("http") ? hero : WP_IMAGES.tercoOnline}
          alt="Terço online"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          unoptimized={hero.startsWith("http")}
        />
        <div className="absolute inset-0 bg-parish-600/45" />
        <div className="absolute inset-0 flex items-end">
          <PageContainer className="pb-8">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-white md:text-5xl">
              Terço online
            </h1>
          </PageContainer>
        </div>
      </div>
      <PageContainer className="py-12">
        <div className="mb-10 max-w-4xl">
          <TercoOnlineSlots slots={slots} variant="page" />
        </div>

        {page ? (
          <article
            className="prose-parish max-w-3xl"
            dangerouslySetInnerHTML={{ __html: page.body }}
          />
        ) : (
          <article className="prose-parish max-w-3xl">
            <p>
              Dúvidas? <Link href="/contato">Contato</Link>.
            </p>
          </article>
        )}
      </PageContainer>
    </>
  );
}
