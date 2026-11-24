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
  title: "Dízimo e doações online",
  description: "Dízimo e doações online para a Paróquia Rainha da Paz, com PIX na conta da paróquia.",
};

export default function DizimoPage() {
  return (
    <PageContainer className="py-10 md:py-14">
      <nav className="mb-6 text-sm text-parish-600">
        <Link href="/sacramentos" className="hover:text-parish-800">
          Sacramentos e serviços
        </Link>
        <span className="mx-2 text-parish-400">/</span>
        <span className="font-medium text-parish-900">Dízimo</span>
      </nav>

      <SectionHeading
        eyebrow="Stewardship"
        title="Dízimo e doações online"
        description="Oferta regular que sustenta a vida da paróquia. Escolha um valor mensal e contribua com segurança online."
        className="max-w-3xl"
      />

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
