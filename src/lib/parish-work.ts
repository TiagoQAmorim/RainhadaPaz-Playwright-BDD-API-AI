import { prisma } from "@/lib/prisma";

export {
  WORK_HELP_AMOUNTS_BRL,
  WORK_STATUSES,
  clampProgress,
  parseHelpAmountCents,
  workStatusLabel,
} from "@/lib/parish-work-format";

const DEFAULT_TITLE = "A obra da paróquia";
const DEFAULT_INTRO =
  "Acompanhe a reforma da nossa casa e participe com a sua ajuda. Cada etapa fica registrada aqui, do começo ao que já ficou pronto.";

export async function getParishWork() {
  const project = await prisma.workProject.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: DEFAULT_TITLE,
      intro: DEFAULT_INTRO,
      progressPercent: 0,
      progressLabel: "",
      published: true,
      showHeroCta: false,
    },
  });
  const [comparisons, moments, photos] = await Promise.all([
    prisma.workComparison.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.workMoment.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.workPhoto.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);
  return { project, comparisons, moments, photos };
}
