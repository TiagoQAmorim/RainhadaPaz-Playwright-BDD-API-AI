/**
 * Gera planilha Excel com todo o catálogo de santos (src/data/saints-catalog.json).
 */
import { mkdir } from "fs/promises";
import path from "path";
import * as XLSX from "xlsx";
import catalog from "../src/data/saints-catalog.json";

const MONTH_NAMES = [
  "",
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

type SaintRow = (typeof catalog.saints)[number];

function saintRows(saints: SaintRow[]) {
  return [...saints]
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((s) => ({
      Nome: s.name,
      Dia: s.feastDay,
      Mês: s.feastMonth,
      "Nome do mês": MONTH_NAMES[s.feastMonth] ?? "",
      Celebração: s.celebration,
      Descrição: s.description,
    }));
}

async function main() {
  const saints = catalog.saints as SaintRow[];
  if (!saints.length) {
    console.error("Catálogo vazio. Rode npm run import:saints primeiro.");
    process.exit(1);
  }

  const rows = saintRows(saints);
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 42 },
    { wch: 6 },
    { wch: 6 },
    { wch: 12 },
    { wch: 22 },
    { wch: 80 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Santos");

  const dir = path.join(process.cwd(), "exports");
  await mkdir(dir, { recursive: true });
  const outPath = path.join(dir, "catalogo-santos.xlsx");
  XLSX.writeFile(wb, outPath);

  console.log(`${rows.length} santos → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});