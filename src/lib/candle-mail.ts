import {
  DEFAULT_CANDLE_EXPIRY_EMAIL_BODY,
  renderCandleEmail,
} from "./candle-email-template";

export const PARISH_TIME_ZONE = "America/Sao_Paulo";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type ParishWeekday = (typeof WEEKDAYS)[number];

export type ParishClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: ParishWeekday;
};

export type WeekCandle = {
  donorName: string;
  email: string | null;
  phone: string | null;
  intention: string;
  prayer: string | null;
  intentionPublic: boolean;
  prayerPublic: boolean;
  litAt: Date;
  expiresAt: Date | null;
  amountCents: number;
};

const HOUR_MS = 60 * 60 * 1000;
export const DEFAULT_EXPIRY_NOTICE_MINUTES = 60;

export function expiryNoticeMinutes(value: number | null | undefined) {
  const minutes = Math.round(Number(value));
  if (!Number.isFinite(minutes) || minutes < 1) return DEFAULT_EXPIRY_NOTICE_MINUTES;
  return Math.min(24 * 60, minutes);
}

export function expiryNoticeLabel(minutes: number) {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}

export function parishClock(date = new Date()): ParishClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PARISH_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  let hour = Number(read("hour"));
  if (hour === 24) hour = 0;
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour,
    minute: Number(read("minute")),
    weekday: read("weekday") as ParishWeekday,
  };
}

function shiftCivilDate(year: number, month: number, day: number, deltaDays: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function wallClockUtcMs(date: Date) {
  const clock = parishClock(date);
  return Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute, 0);
}

/** Horário de parede em São Paulo, convertido para o instante UTC. */
export function parishWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = wallClockUtcMs(guess) - guess.getTime();
  return new Date(guess.getTime() - offset);
}

export function sundayOfParishWeek(clock: ParishClock) {
  const index = WEEKDAYS.indexOf(clock.weekday);
  return shiftCivilDate(clock.year, clock.month, clock.day, -index);
}

export function weekKeyFromSunday(sunday: { year: number; month: number; day: number }) {
  const month = String(sunday.month).padStart(2, "0");
  const day = String(sunday.day).padStart(2, "0");
  return `${sunday.year}-${month}-${day}`;
}

export type WeeklyReportWindow = {
  weekKey: string;
  start: Date;
  end: Date;
};

/** Domingo 00h até sábado 00h em São Paulo: as velas de domingo a sexta. */
export function currentParishWeekWindow(now = new Date()): WeeklyReportWindow {
  const sunday = sundayOfParishWeek(parishClock(now));
  const weekKey = weekKeyFromSunday(sunday);
  const nextSunday = shiftCivilDate(sunday.year, sunday.month, sunday.day, 6);
  return {
    weekKey,
    start: parishWallTimeToUtc(sunday.year, sunday.month, sunday.day, 0, 0),
    end: parishWallTimeToUtc(nextSunday.year, nextSunday.month, nextSunday.day, 0, 0),
  };
}

/** Sexta às 23h, ou sábado de manhã se a sexta passou sem envio. */
export function weeklyReportWindow(now = new Date(), sentWeekKey: string | null = null): WeeklyReportWindow | null {
  const clock = parishClock(now);
  const fridayEvening = clock.weekday === "Fri" && clock.hour >= 23;
  const saturdayCatchUp = clock.weekday === "Sat" && clock.hour < 12;
  if (!fridayEvening && !saturdayCatchUp) return null;

  const window = currentParishWeekWindow(now);
  if (sentWeekKey === window.weekKey) return null;
  return window;
}

export function candleNeedsExpiryReminder(
  candle: {
    email: string | null;
    status: string;
    litAt: Date | null;
    expiresAt: Date | null;
    expiryReminderSentAt: Date | null;
  },
  now = new Date(),
  leadMs = HOUR_MS,
) {
  if (candle.expiryReminderSentAt) return false;
  if (candle.status !== "PAID") return false;
  if (!candle.email || !candle.email.includes("@")) return false;
  if (!candle.litAt || !candle.expiresAt) return false;
  const total = candle.expiresAt.getTime() - candle.litAt.getTime();
  if (total <= leadMs) return false;
  const remaining = candle.expiresAt.getTime() - now.getTime();
  return remaining > 0 && remaining <= leadMs;
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

export function weeklyCandleReportText(candles: WeekCandle[], window: WeeklyReportWindow) {
  const header = [
    "Velas acesas na semana",
    `${formatDay(window.start)} a ${formatDay(new Date(window.end.getTime() - 1))}`,
    "",
    candles.length === 0
      ? "Nenhuma vela foi acesa neste período."
      : `${candles.length} vela(s), com intenção e oração completas, inclusive as que não aparecem no mural.`,
    "",
  ];
  const blocks = candles.map((candle, index) =>
    [
      `${index + 1}. ${candle.donorName}`,
      `Acendida: ${formatWhen(candle.litAt)}`,
      candle.expiresAt ? `Apaga: ${formatWhen(candle.expiresAt)}` : "Apaga: (sem horário)",
      `Intenção: ${candle.intention}`,
      `Intenção no mural: ${candle.intentionPublic ? "pública" : "não pública"}`,
      candle.prayer?.trim() ? `Oração:\n${candle.prayer.trim()}` : "Oração: (não informada)",
      `Oração no mural: ${candle.prayerPublic ? "pública" : "não pública"}`,
      `E-mail: ${candle.email?.trim() || "não informado"}`,
      `Telefone: ${candle.phone?.trim() || "não informado"}`,
      `Valor: ${candle.amountCents > 0 ? reais(candle.amountCents) : "sem cobrança"}`,
    ].join("\n"),
  );
  return [...header, blocks.join("\n\n"), "", "— Sistema de velas virtuais, Paróquia Rainha da Paz"].join("\n");
}

export function expiryReminderText(params: {
  donorName: string;
  intention: string;
  velasUrl: string;
}) {
  return renderCandleEmail(null, DEFAULT_CANDLE_EXPIRY_EMAIL_BODY, {
    donorName: params.donorName,
    intention: params.intention,
    link: params.velasUrl,
    notice: "1 hora",
  });
}
