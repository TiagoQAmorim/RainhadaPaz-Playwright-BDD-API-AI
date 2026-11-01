import Image from "next/image";
import Link from "next/link";
import { stripHtml } from "@/lib/strip-html";

export type NoticePreview = {
  id: string;
  title: string;
  body: string;
  coverImage?: string | null;
  publishedAt?: Date | null;
};

export function NoticePreviewCard({ notice }: { notice: NoticePreview }) {
  const excerpt = stripHtml(notice.body).slice(0, 100);
  const href = `/avisos/${notice.id}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-parish-100 transition hover:shadow-lg hover:ring-parish-200">
      <Link href={href} className="relative block aspect-[5/3] shrink-0 overflow-hidden bg-parish-100">
        {notice.coverImage ? (
          <Image
            src={notice.coverImage}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width:640px) 100vw, 280px"
            unoptimized={notice.coverImage.startsWith("/uploads/")}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-parish-100 to-parish-200 px-3 text-center">
            <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-parish-700 line-clamp-2">
              {notice.title}
            </span>
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {notice.publishedAt ? (
          <time className="text-[10px] font-semibold uppercase tracking-wide text-parish-500">
            {notice.publishedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </time>
        ) : null}
        <Link href={href} className="mt-1 flex-1">
          <h3 className="font-[family-name:var(--font-display)] text-base font-semibold leading-snug text-parish-900 group-hover:text-parish-600 line-clamp-2">
            {notice.title}
          </h3>
          {excerpt ? (
            <p className="mt-1.5 text-xs leading-relaxed text-parish-600 line-clamp-2">{excerpt}</p>
          ) : null}
        </Link>
        <Link
          href={href}
          className="mt-3 text-xs font-bold text-gold-600 hover:text-gold-500"
        >
          Ler aviso →
        </Link>
      </div>
    </article>
  );
}
