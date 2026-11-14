import { upsertPost } from "@/app/admin/actions";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { AdminRichTextField } from "@/components/admin/AdminRichTextField";
import { PostGalleryFields, type PostGalleryRow } from "@/components/admin/PostGalleryFields";
import { PostYoutubeFields, type PostYoutubeRow } from "@/components/admin/PostYoutubeFields";
import {
  adminBtn,
  adminFormEncType,
  adminInput,
} from "@/components/admin/AdminFormStyles";
import { HOME_CAROUSEL_MAX } from "@/lib/home-carousel";

export type AdminPostFormValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage?: string | null;
  published: boolean;
  featuredOnHomeCarousel: boolean;
  galleryImages: PostGalleryRow[];
  youtubeVideos: PostYoutubeRow[];
};

type Props = {
  post?: AdminPostFormValues;
  submitLabel: string;
};

export function AdminPostForm({ post, submitLabel }: Props) {
  const isNew = !post?.id;

  return (
    <form action={upsertPost} encType={adminFormEncType} className="space-y-3">
      {post?.id ? <input type="hidden" name="id" value={post.id} /> : null}
      <div>
        <label className="mb-1 block text-sm font-medium">Título</label>
        <input
          name="title"
          required
          defaultValue={post?.title ?? ""}
          className={adminInput}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Slug (opcional)</label>
        <input
          name="slug"
          defaultValue={post?.slug ?? ""}
          placeholder="gerado pelo título se vazio"
          className={adminInput}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Resumo</label>
        <input
          name="excerpt"
          required
          defaultValue={post?.excerpt ?? ""}
          className={adminInput}
        />
      </div>
      <AdminImageField
        label="Imagem de capa (opcional)"
        name="coverImage"
        fileFieldName="coverImageFile"
        defaultValue={post?.coverImage}
      />
      <AdminRichTextField
        label="Conteúdo da notícia"
        name="body"
        defaultValue={post?.body ?? ""}
        required
        minHeightClass="min-h-[220px]"
      />
      <PostGalleryFields images={post?.galleryImages ?? []} />
      <PostYoutubeFields videos={post?.youtubeVideos ?? []} />
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="published" value="off" />
        <input
          type="checkbox"
          name="published"
          value="on"
          defaultChecked={isNew ? false : post?.published}
        />{" "}
        {isNew ? "Publicar ao salvar" : "Publicado"}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="featuredOnHomeCarousel" value="off" />
        <input
          type="checkbox"
          name="featuredOnHomeCarousel"
          value="on"
          defaultChecked={post?.featuredOnHomeCarousel ?? false}
        />{" "}
        Destacar no carrossel da home (máx. {HOME_CAROUSEL_MAX} com a rifa)
      </label>
      <button type="submit" className={adminBtn}>
        {submitLabel}
      </button>
    </form>
  );
}