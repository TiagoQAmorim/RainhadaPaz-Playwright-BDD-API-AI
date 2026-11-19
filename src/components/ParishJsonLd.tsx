import type { SiteSettings } from "@prisma/client";
import { publicSiteUrl } from "@/lib/site-url";
import { searchAppearance } from "@/lib/settings";

type Props = {
  settings: SiteSettings;
};

/** Dado da igreja para o Google: nome, endereço, telefone e o texto da busca. */
export function ParishJsonLd({ settings }: Props) {
  const sameAs = [settings.instagramUrl, settings.facebookUrl, settings.youtubeUrl, settings.youtubeChannelUrl]
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));
  const data = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: settings.parishName,
    description: searchAppearance(settings).description,
    url: publicSiteUrl(),
    telephone: settings.phone?.trim() || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressLocality: "São Paulo",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
