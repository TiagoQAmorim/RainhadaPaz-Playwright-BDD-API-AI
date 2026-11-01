import catalog from "@/data/saints-catalog.json";
import { prisma } from "@/lib/prisma";

export type SaintCatalogEntry = {
  name: string;
  feastDay: number;
  feastMonth: number;
  celebration: string;
  description: string;
};

export function getSaintCatalog(): SaintCatalogEntry[] {
  return catalog.saints as SaintCatalogEntry[];
}

export function getSaintCatalogCount() {
  return catalog.count as number;
}

/** Garante que o banco reflete o JSON (importado do PDF/amostra). */
export async function ensureSaintCatalogInDb() {
  const expected = getSaintCatalogCount();
  if (expected === 0) {
    throw new Error(
      "Catálogo vazio. Rode npm run import:saints (src/data/santos_e_personagens_cristaos_ampliado.json).",
    );
  }
  await syncSaintCatalogToDb();
  return expected;
}

/** Sincroniza JSON → tabela Saint (upsert por nome+data). */
export async function syncSaintCatalogToDb() {
  const saints = getSaintCatalog();
  for (const s of saints) {
    await prisma.saint.upsert({
      where: {
        name_feastDay_feastMonth: {
          name: s.name,
          feastDay: s.feastDay,
          feastMonth: s.feastMonth,
        },
      },
      update: {
        celebration: s.celebration,
        description: s.description,
      },
      create: {
        name: s.name,
        feastDay: s.feastDay,
        feastMonth: s.feastMonth,
        celebration: s.celebration,
        description: s.description,
      },
    });
  }
  return saints.length;
}
