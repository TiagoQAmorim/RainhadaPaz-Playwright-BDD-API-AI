import Image from "next/image";
import Link from "next/link";
import { WP_IMAGES } from "@/lib/wordpress-assets";

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string | null;
  publishedAt?: Date | null;
};

export function PostCard({ post }: { post: Post }) {
  const img = post.coverImage ?? WP_IMAGES.heroChurch;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-parish-100 transition hover:shadow-xl">
      <Link href={`/noticias/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden">
        <Image
          src={img}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 400px"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {post.publishedAt ? (
          <time className="text-xs font-medium uppercase tracking-wide text-parish-500">
            {post.publishedAt.toLocaleDateString("pt-BR", { dateStyle: "long" })}
          </time>
        ) : null}
        <Link href={`/noticias/${post.slug}`}>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-parish-900 group-hover:text-parish-600">
            {post.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-parish-700/85">
          {post.excerpt}
        </p>
        <Link
          href={`/noticias/${post.slug}`}
          className="mt-4 text-sm font-bold text-gold-600 hover:text-gold-500"
        >
          Ler mais →
        </Link>
      </div>
    </article>
  );
}
