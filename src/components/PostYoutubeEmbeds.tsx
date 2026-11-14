import { youtubeEmbedUrl } from "@/lib/youtube";

export type PostYoutubeItem = {
  youtubeVideoId: string;
  title?: string | null;
};

type Props = {
  items: PostYoutubeItem[];
};

export function PostYoutubeEmbeds({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="not-prose mt-8 space-y-6" aria-label="Vídeos">
      {items.map((v) => (
        <figure
          key={v.youtubeVideoId}
          className="overflow-hidden rounded-2xl border border-parish-200 bg-white shadow-sm"
        >
          {v.title ? (
            <figcaption className="border-b border-parish-100 px-4 py-2 text-sm font-medium text-parish-800">
              {v.title}
            </figcaption>
          ) : null}
          <div className="relative aspect-video w-full bg-parish-900">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={youtubeEmbedUrl(v.youtubeVideoId)}
              title={v.title?.trim() || "Vídeo do YouTube"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </figure>
      ))}
    </section>
  );
}