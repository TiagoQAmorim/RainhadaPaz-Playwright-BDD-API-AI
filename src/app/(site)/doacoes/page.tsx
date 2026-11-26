import Image from "next/image";
import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";
import { SectionHeading } from "@/components/SectionHeading";
import { TitheDonationPanel } from "@/components/tithe/TitheDonationPanel";
import {
  DIZIMO_BANNER_HEIGHT,
  DIZIMO_BANNER_PATH,
  DIZIMO_BANNER_WIDTH,
} from "@/lib/parish-brand";

export const metadata = {
  title: "Doações",
  description: "Dízimo e doações para a Paróquia Rainha da Paz, com PIX na conta da paróquia.",
};

export default function DoacoesPage() {
  return (
    <PageContainer className="py-10 md:py-14">
      <SectionHeading
        eyebrow="Partilha"
        title="Doações"
        description="O dízimo sustenta a vida da paróquia. A obra tem uma página própria, com as fotos da reforma e o PIX da ajuda."
        className="max-w-3xl"
      />

      <Link
        href="/obra#ajuda"
        className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-parish-700 px-5 py-4 text-white shadow-md hover:bg-parish-600"
      >
        <span>
          <span className="block text-xs font-bold uppercase tracking-[0.16em] text-gold-300">Obra</span>
          <span className="mt-1 block font-[family-name:var(--font-display)] text-xl font-semibold">
            Ajudar a reforma da paróquia
          </span>
        </span>
        <span className="rounded-full bg-gold-500 px-4 py-2 text-sm font-bold text-parish-950">Ver a obra</span>
      </Link>

      <figure className="mx-auto mb-6 mt-8 w-full max-w-5xl overflow-hidden rounded-2xl shadow-md ring-1 ring-parish-200/70">
        <Image
          src={DIZIMO_BANNER_PATH}
          alt="Dízimo e doação — gesto de fé, gratidão e compromisso com a missão da Igreja"
          width={DIZIMO_BANNER_WIDTH}
          height={DIZIMO_BANNER_HEIGHT}
          priority
          className="block h-auto w-full"
          sizes="(max-width: 1024px) 100vw, 1024px"
        />
      </figure>

      <div className="mt-10">
        <TitheDonationPanel />
      </div>
    </PageContainer>
  );
}
