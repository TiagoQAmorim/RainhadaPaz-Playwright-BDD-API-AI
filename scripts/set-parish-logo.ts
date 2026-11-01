import { PARISH_LOGO_PATH } from "../src/lib/parish-brand";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.siteSettings.update({
    where: { id: 1 },
    data: { logoUrl: PARISH_LOGO_PATH },
  });
  console.log("Logo:", PARISH_LOGO_PATH);
}

main()
  .finally(() => prisma.$disconnect());
