import Link from "next/link";
import { CandleVisual } from "@/components/CandleVisual";
import { PageContainer } from "@/components/PageContainer";

export const metadata = { title: "Vela acesa" };

export default function VelasSucessoPage() {
  const litAt = new Date();
  const expiresAt = new Date(litAt.getTime() + 8 * 60 * 60 * 1000);

  return (
    <PageContainer className="pb-20 pt-10 md:pt-14">
      <div className="mx-auto max-w-lg rounded-2xl border border-parish-100 bg-white p-8 text-center shadow-sm md:p-10">
        <div className="mx-auto mb-2 flex justify-center overflow-visible py-2">
          <CandleVisual
            size="lg"
            litAt={litAt.toISOString()}
            expiresAt={expiresAt.toISOString()}
          />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-parish-900">
          Sua vela foi registrada
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-parish-700">
          Obrigado por unir sua intenção à nossa comunidade de oração. Sua vela já deve
          aparecer no mural.
        </p>
        <Link
          href="/velas"
          className="mt-6 inline-block font-semibold text-parish-700 hover:text-parish-900"
        >
          Voltar ao mural →
        </Link>
      </div>
    </PageContainer>
  );
}
