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

/** Garante santos no banco — só sincroniza o JSON se faltar registro (evita 800+ upserts a cada página). */
export async function ensureSaintCatalogInDb() {
  const expected = getSaintCatalogCount();
  if (expected === 0) {
    throw new Error(
      "Catálogo vazio. Rode npm run import:saints (src/data/santos_e_personagens_cristaos_ampliado.json).",
    );
  }
  const inDb = await prisma.saint.count();
  if (inDb >= expected) return inDb;
  await syncSaintCatalogToDb();
  return expected;
}

const SAINT_SYNC_BATCH = 40;

/** Sincroniza JSON → tabela Saint (upsert por nome+data). */
export async function syncSaintCatalogToDb() {
  const saints = getSaintCatalog();
  for (let i = 0; i < saints.length; i += SAINT_SYNC_BATCH) {
    const chunk = saints.slice(i, i + SAINT_SYNC_BATCH);
    await prisma.$transaction(
      chunk.map((s) =>
        prisma.saint.upsert({
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
        }),
      ),
    );
  }
  return saints.length;
}
