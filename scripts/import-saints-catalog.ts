/**
 * Importa santos do PDF calendario_santos_catolicos_amostra.pdf (ou .txt / .json).
 *
 * Uso: npm run import:saints
 *      npm run import:saints -- caminho/para/arquivo.pdf
 * Depois: npm run db:sync-saints
 */
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const MONTHS = [
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
];

type SaintRecord = {
  name: string;
  feastDay: number;
  feastMonth: number;
  celebration: string;
  description: string;
};

/** DD/MM — Nome (travessão, "?" ou U+FFFD quando o PDF perde encoding). */
const LINE_RE =
  /^(\d{1,2})\/(\d{1,2})\s*(?:[—–\-‐‑‒–—]|\?|\uFFFD)\s*(.+)$/;

function parseCatalog(text: string): SaintRecord[] {
  const normalized = text.replace(/\uFEFF/g, "").replace(/\r/g, "");
  const lines = normalized.split("\n");
  const out: SaintRecord[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!LINE_RE.test(line)) {
      const alt = line.replace(/\s+[–—-]\s+/, " — ");
      if (LINE_RE.test(alt)) line = alt;
    }
    const m = line.match(LINE_RE);
    if (!m) continue;
    const feastDay = Number(m[1]);
    const feastMonth = Number(m[2]);
    const name = m[3].trim();
    let description = "";
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (!next || LINE_RE.test(next) || next.startsWith("--")) break;
      if (next.startsWith("Fontes de referência")) break;
      description = description ? `${description} ${next}` : next;
    }
    if (!description) continue;
    const monthName = MONTHS[feastMonth - 1];
    if (!monthName) continue;
    out.push({
      name,
      feastDay,
      feastMonth,
      celebration: `${feastDay} de ${monthName}`,
      description: description.trim(),
    });
  }

  return out;
}

type PtBrJsonEntry = {
  nome: string;
  dia: number;
  mes: number;
  celebracao?: string;
  descricao: string;
};

type AmpliadoEntry = {
  id: number;
  nome: string;
  dia: number | null;
  mes: number | null;
  celebracao: string | null;
  descricao: string | null;
  categoria?: string;
};

function feastFromCatalogId(id: number) {
  return {
    feastMonth: ((id - 1) % 12) + 1,
    feastDay: ((Math.floor((id - 1) / 12)) % 28) + 1,
  };
}

function parseAmpliadoJson(rows: AmpliadoEntry[]): SaintRecord[] {
  return rows
    .filter((r) => r.nome?.trim())
    .map((r) => {
      const name = r.nome.trim();
      let feastDay = r.dia ?? 0;
      let feastMonth = r.mes ?? 0;
      if (!feastDay || !feastMonth) {
        const f = feastFromCatalogId(r.id);
        feastDay = f.feastDay;
        feastMonth = f.feastMonth;
      }
      const monthName = MONTHS[feastMonth - 1];
      const celebration =
        r.celebracao?.trim() ||
        (monthName ? `${feastDay} de ${monthName}` : "Catálogo ampliado");
      const description =
        r.descricao?.trim() ||
        `${name} — figura da tradição cristã (catálogo ampliado).`;
      return { name, feastDay, feastMonth, celebration, description };
    });
}

function parsePtBrJson(rows: PtBrJsonEntry[]): SaintRecord[] {
  return rows
    .filter((r) => r.nome && r.descricao && r.dia && r.mes)
    .map((r) => ({
      name: r.nome.trim(),
      feastDay: r.dia,
      feastMonth: r.mes,
      celebration: (r.celebracao ?? `${r.dia}/${r.mes}`).trim(),
      description: r.descricao.trim(),
    }));
}

function parseJsonFile(raw: string): SaintRecord[] {
  const rows = JSON.parse(raw) as unknown;
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const sample = rows[0] as Record<string, unknown>;
  if ("categoria" in sample || (sample.dia === null && sample.mes === null)) {
    return parseAmpliadoJson(rows as AmpliadoEntry[]);
  }
  return parsePtBrJson(rows as PtBrJsonEntry[]);
}

function extractPdfText(pdfPath: string): string {
  const script = path.join(process.cwd(), "scripts/extract-saints-from-pdf.py");
  return execFileSync("python", [script, pdfPath], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
}

function resolveInput(): { kind: "pdf" | "json" | "txt"; path: string } {
  if (process.argv[2]) {
    const p = path.resolve(process.argv[2]);
    if (p.endsWith(".pdf")) return { kind: "pdf", path: p };
    if (p.endsWith(".json")) return { kind: "json", path: p };
    return { kind: "txt", path: p };
  }
  const ampliado = path.join(process.cwd(), "src/data/santos_e_personagens_cristaos_ampliado.json");
  if (existsSync(ampliado)) return { kind: "json", path: ampliado };
  const pdf = path.join(process.cwd(), "src/data/calendario_santos_catolicos_amostra.pdf");
  if (existsSync(pdf)) return { kind: "pdf", path: pdf };
  const json = path.join(process.cwd(), "src/data/santos_ptbr_parcial.json");
  if (existsSync(json)) return { kind: "json", path: json };
  const txt = path.join(process.cwd(), "src/data/santos-amostra.txt");
  return { kind: "txt", path: txt };
}

function main() {
  const input = resolveInput();
  let raw: string;
  if (input.kind === "pdf") {
    raw = extractPdfText(input.path);
    const cachePath = path.join(process.cwd(), "src/data/calendario_santos_extracted.txt");
    writeFileSync(cachePath, raw, "utf8");
  } else {
    raw = readFileSync(input.path, "utf8");
  }

  const saints = input.kind === "json" ? parseJsonFile(raw) : parseCatalog(raw);
  if (saints.length === 0) {
    console.error("Nenhum santo parseado. Verifique o arquivo:", input.path);
    process.exit(1);
  }
  const outPath = path.join(process.cwd(), "src/data/saints-catalog.json");
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ count: saints.length, saints }, null, 2), "utf8");
  console.log(`Fonte: ${input.path}`);
  console.log(`Catálogo: ${saints.length} santos → ${outPath}`);
}

main();
