import { PageContainer } from "@/components/PageContainer";
import { sanitizeWpHtml } from "@/lib/sanitize-wp-html";
import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Institucional" };

export default async function InstitucionalPage() {
  const s = await getSiteSettings();

  return (
    <>
      <div className="border-b border-parish-200 bg-parish-50 py-12 md:py-16">
        <PageContainer>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-parish-600">{s.diocese}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-parish-900 md:text-5xl">
            {s.parishName}
          </h1>
        </PageContainer>
      </div>
      <PageContainer className="py-12 md:py-16">
        <article
          className="prose-parish mx-auto max-w-3xl"
          dangerouslySetInnerHTML={{ __html: sanitizeWpHtml(s.aboutHtml) }}
        />
      </PageContainer>
    </>
  );
}
