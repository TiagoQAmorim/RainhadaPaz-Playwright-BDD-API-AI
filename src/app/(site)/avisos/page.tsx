import { NoticePreviewCard } from "@/components/NoticePreviewCard";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { getPublishedNotices } from "@/lib/notices";

export const metadata = { title: "Avisos" };

export const dynamic = "force-dynamic";

export default async function AvisosPage() {
  const notices = await getPublishedNotices();

  return (
    <PageContainer className="py-12 md:py-16">
      <SectionHeading
        eyebrow="Paróquia"
        title="Avisos"
        description="Comunicados e avisos importantes para a comunidade."
      />
      {notices.length === 0 ? (
        <p className="text-parish-600">Nenhum aviso publicado no momento.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notices.map((n) => (
            <li key={n.id}>
              <NoticePreviewCard notice={n} />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
