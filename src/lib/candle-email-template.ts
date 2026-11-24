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
  ["<velas>", "Lista, uma vela depois da outra"],
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

export function renderCandleWeekEmail(
  templates: { subject?: string | null; intro?: string | null; item?: string | null },
  candles: CandleEmailSource[],
  window: { start: Date; end: Date },
) {
  const periodo = weekPeriodLabel(window.start, window.end);
  const quantidade = weekQuantitySentence(candles.length);
  const itemTemplate = templates.item?.trim() || DEFAULT_CANDLE_WEEK_EMAIL_ITEM;
  const velas = candles
    .map((candle, index) =>
      applyCandleEmailTemplate(
        itemTemplate,
        candleEmailValues(candle, { numero: String(index + 1), periodo, quantidade }),
      ),
    )
    .join("\n\n");
  const introTemplate = templates.intro?.trim() || DEFAULT_CANDLE_WEEK_EMAIL_INTRO;
  let text = applyCandleEmailTemplate(introTemplate, { periodo, quantidade, velas });
  if (!/<velas>/i.test(introTemplate) && velas) text = `${text}\n\n${velas}`;
  const subject = applyCandleEmailTemplate(
    templates.subject?.trim() || DEFAULT_CANDLE_WEEK_EMAIL_SUBJECT,
    { periodo, quantidade, velas },
  );
  return { subject, text };
}
