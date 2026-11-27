export const CANDLE_EMAIL_TAGS = [
  ["<nome>", "Nome de quem acendeu"],
  ["<intencao>", "Intenção"],
  ["<oracao>", "Oração"],
  ["<email>", "E-mail"],
  ["<telefone>", "Telefone"],
  ["<valor>", "Valor"],
  ["<acesa>", "Quando acendeu"],
  ["<apaga>", "Quando apaga"],
  ["<link>", "Página para acender outra vela"],
  ["<antecedencia>", "Tempo do aviso, como 5 minutos ou 1 hora"],
  ["<mural-intencao>", "Se a intenção aparece no mural"],
  ["<mural-oracao>", "Se a oração aparece no mural"],
] as const;

export const CANDLE_WEEK_INTRO_TAGS = [
  ["<periodo>", "Domingo a sexta da semana"],
  ["<quantidade>", "Frase com quantas velas acenderam"],
  ["<velas>", "Tabela da semana, uma vela por linha"],
] as const;

export const CANDLE_WEEK_ITEM_TAGS = [["<numero>", "Número na lista"], ...CANDLE_EMAIL_TAGS] as const;

export const DEFAULT_CANDLE_LIT_EMAIL_SUBJECT = "Vela de Oração — <nome>";
export const DEFAULT_CANDLE_LIT_EMAIL_BODY = [
  "Nova vela virtual acesa",
  "",
  "Nome: <nome>",
  "Intenção: <intencao>",
  "Oração: <oracao>",
  "",
  "Exibir no mural: intenção <mural-intencao>, oração <mural-oracao>.",
  "E-mail do(a) devoto(a): <email>",
  "Telefone do(a) devoto(a): <telefone>",
  "Valor: <valor>",
  "Acendida: <acesa>",
  "Apaga: <apaga>",
  "",
  "— Sistema de velas virtuais, Paróquia Rainha da Paz",
].join("\n");

export const DEFAULT_CANDLE_EXPIRY_EMAIL_SUBJECT = "Sua vela apaga em cerca de <antecedencia>";
export const DEFAULT_CANDLE_EXPIRY_EMAIL_BODY = [
  "Olá, <nome>.",
  "",
  "Sua vela virtual na Paróquia Nossa Senhora Rainha da Paz apaga em cerca de <antecedencia>.",
  "",
  "Intenção: <intencao>",
  "",
  "Antes que ela se apague, você pode acender uma nova:",
  "<link>",
  "",
  "— Paróquia Nossa Senhora Rainha da Paz",
].join("\n");

export const DEFAULT_CANDLE_WEEK_EMAIL_SUBJECT = "Velas da semana — domingo a sexta";
export const DEFAULT_CANDLE_WEEK_EMAIL_INTRO = [
  "Velas acesas na semana",
  "<periodo>",
  "",
  "<quantidade>",
  "",
  "<velas>",
  "",
  "— Sistema de velas virtuais, Paróquia Rainha da Paz",
].join("\n");

export const DEFAULT_CANDLE_WEEK_EMAIL_ITEM = [
  "<numero>. <nome>",
  "Acendida: <acesa>",
  "Apaga: <apaga>",
  "Intenção: <intencao>",
  "Intenção no mural: <mural-intencao>",
  "Oração: <oracao>",
  "Oração no mural: <mural-oracao>",
  "E-mail: <email>",
  "Telefone: <telefone>",
  "Valor: <valor>",
].join("\n");

const PARISH_TIME_ZONE = "America/Sao_Paulo";

export type CandleEmailSource = {
  donorName: string;
  intention: string;
  prayer?: string | null;
  email?: string | null;
  phone?: string | null;
  intentionPublic?: boolean;
  prayerPublic?: boolean;
  litAt?: Date | null;
  expiresAt?: Date | null;
  amountCents?: number | null;
  link?: string | null;
  notice?: string | null;
};

export function applyCandleEmailTemplate(template: string, values: Record<string, string>) {
  return template.replace(/<([a-z0-9-]+)>/gi, (match, name: string) => {
    const key = name.toLowerCase();
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
  });
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: PARISH_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: PARISH_TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function reais(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function candleEmailValues(source: CandleEmailSource, extra: Record<string, string> = {}) {
  const mural = (flag?: boolean) => (flag ? "pública" : "não pública");
  return {
    nome: source.donorName,
    intencao: source.intention,
    oracao: source.prayer?.trim() || "(não informada)",
    email: source.email?.trim() || "não informado",
    telefone: source.phone?.trim() || "não informado",
    valor:
      source.amountCents == null
        ? ""
        : source.amountCents > 0
          ? reais(source.amountCents)
          : "sem cobrança",
    acesa: source.litAt ? formatWhen(source.litAt) : "(sem horário)",
    apaga: source.expiresAt ? formatWhen(source.expiresAt) : "(sem horário)",
    link: source.link?.trim() || "",
    antecedencia: source.notice?.trim() || "",
    "mural-intencao": mural(source.intentionPublic),
    "mural-oracao": mural(source.prayerPublic),
    ...extra,
  };
}

export function weekQuantitySentence(count: number) {
  return count === 0
    ? "Nenhuma vela foi acesa neste período."
    : `${count} vela(s), com intenção e oração completas, inclusive as que não aparecem no mural.`;
}

export function weekPeriodLabel(start: Date, end: Date) {
  return `${formatDay(start)} a ${formatDay(new Date(end.getTime() - 1))}`;
}

export function renderCandleEmail(template: string | null | undefined, fallback: string, source: CandleEmailSource) {
  return applyCandleEmailTemplate(template?.trim() || fallback, candleEmailValues(source));
}

const WEEK_TABLE_COLUMNS = [
  ["Nº", "numero"],
  ["Nome", "nome"],
  ["E-mail", "email"],
  ["Telefone", "telefone"],
  ["Intenção", "intencao"],
  ["Intenção no mural", "mural-intencao"],
  ["Oração", "oracao"],
  ["Oração no mural", "mural-oracao"],
  ["Valor", "valor"],
  ["Acendida", "acesa"],
  ["Apaga", "apaga"],
] as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function weekTableRows(candles: CandleEmailSource[]) {
  return candles.map((candle, index) => {
    const values: Record<string, string> = {
      ...candleEmailValues(candle),
      numero: String(index + 1),
    };
    return WEEK_TABLE_COLUMNS.map(([, key]) => (values[key] ?? "").replace(/\s+/g, " ").trim());
  });
}

function weekTableText(rows: string[][]) {
  const header = WEEK_TABLE_COLUMNS.map(([label]) => label).join("\t");
  const body = rows.map((row) => row.join("\t")).join("\n");
  return body ? `${header}\n${body}` : header;
}

function weekTableHtml(rows: string[][]) {
  const cell = "border:1px solid #d5d5d5;padding:6px 8px;text-align:left;vertical-align:top";
  const heads = WEEK_TABLE_COLUMNS.map(
    ([label]) => `<th style="${cell};background:#f3f4f6;font-weight:600">${escapeHtml(label)}</th>`,
  ).join("");
  const body = rows
    .map((row) => `<tr>${row.map((value) => `<td style="${cell}">${escapeHtml(value)}</td>`).join("")}</tr>`)
    .join("");
  return `<table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px"><thead><tr>${heads}</tr></thead><tbody>${body}</tbody></table>`;
}

function insertWeekList(template: string, list: string, asHtml: boolean) {
  if (!/<velas>/i.test(template)) {
    if (!asHtml) return `${template}\n\n${list}`;
    return `${escapeHtml(template).replace(/\n/g, "<br>")}<br>${list}`;
  }
  if (!asHtml) return template.replace(/<velas>/gi, list);
  return template
    .split(/<velas>/i)
    .map((part) => escapeHtml(part).replace(/\n/g, "<br>"))
    .join(list);
}

export function renderCandleWeekEmail(
  templates: { subject?: string | null; intro?: string | null },
  candles: CandleEmailSource[],
  window: { start: Date; end: Date },
) {
  const periodo = weekPeriodLabel(window.start, window.end);
  const quantidade = weekQuantitySentence(candles.length);
  const rows = weekTableRows(candles);
  const tableText = weekTableText(rows);
  const introTemplate = templates.intro?.trim() || DEFAULT_CANDLE_WEEK_EMAIL_INTRO;
  const text = insertWeekList(
    applyCandleEmailTemplate(introTemplate, { periodo, quantidade, velas: "<velas>" }),
    tableText,
    false,
  );
  const html = insertWeekList(
    applyCandleEmailTemplate(introTemplate, { periodo, quantidade, velas: "<velas>" }),
    weekTableHtml(rows),
    true,
  );
  const subject = applyCandleEmailTemplate(templates.subject?.trim() || DEFAULT_CANDLE_WEEK_EMAIL_SUBJECT, {
    periodo,
    quantidade,
    velas: candles.length ? `${candles.length} vela(s)` : "nenhuma vela",
  });
  return { subject, text, html };
}
