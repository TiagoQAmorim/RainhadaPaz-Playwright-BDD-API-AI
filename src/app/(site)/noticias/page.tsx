import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";
import { PostCard } from "@/components/PostCard";
import { SectionHeading } from "@/components/SectionHeading";
import { VaticanNewsCard } from "@/components/VaticanNewsCard";
import { prisma } from "@/lib/prisma";
import { listVaticanNews, VATICAN_NEWS_HOME_URL } from "@/lib/vatican-news";

export const metadata = { title: "Notícias" };

export default async function NoticiasPage() {
  const [posts, vaticanNews] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    }),
    listVaticanNews(9),
  ]);

  return (
    <PageContainer wide className="bg-parish-50 py-12 md:py-16">
      <SectionHeading
        eyebrow="Paróquia"
        title="Notícias da comunidade"
        description="Comunicados publicados pela paróquia."
      />
      {posts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-parish-200 bg-white p-8 text-center text-parish-600">
          Nenhuma notícia paroquial publicada no momento.
        </p>
      )}

      <section className="mt-16 md:mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Santa Sé"
            title="Notícias do Vaticano"
            description="Atualizações em português via Vatican News (RSS oficial)."
          />
          <Link
            href={VATICAN_NEWS_HOME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-parish-600 hover:text-gold-600"
          >
            Abrir Vatican News →
          </Link>
        </div>
        {vaticanNews.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vaticanNews.map((item) => (
              <VaticanNewsCard key={item.link} item={item} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-parish-200 bg-white p-6 text-sm text-parish-700">
            Não foi possível carregar o feed agora. Acesse{" "}
            <a
              href={VATICAN_NEWS_HOME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-parish-600 underline"
            >
              Vatican News em português
            </a>
            .
          </p>
        )}
      </section>
    </PageContainer>
  );
}
