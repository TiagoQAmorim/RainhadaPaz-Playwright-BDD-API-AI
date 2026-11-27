import { prisma } from "@/lib/prisma";
import { publicSiteUrl } from "@/lib/site-url";
import { getCandlesNotifyEmail, getSiteSettings } from "@/lib/settings";
import { sendViaSmtp, SmtpSendError } from "@/lib/candle-parish-email";
import {
  DEFAULT_CANDLE_EXPIRY_EMAIL_BODY,
  DEFAULT_CANDLE_EXPIRY_EMAIL_SUBJECT,
  renderCandleEmail,
  renderCandleWeekEmail,
} from "@/lib/candle-email-template";
import {
  candleNeedsExpiryReminder,
  expiryNoticeLabel,
  expiryNoticeMinutes,
  currentParishWeekWindow,
  weeklyReportWindow,
} from "@/lib/candle-mail";
let running = false;

export async function runCandleMailCycle() {
  if (running) return { weekly: false, reminders: 0, skipped: true };
  running = true;
  try {
    const weekly = await sendWeeklyReport();
    const reminders = await sendExpiryReminders();
    return { weekly, reminders, skipped: false };
  } finally {
    running = false;
  }
}

let loopStarted = false;

export function startCandleMailLoop() {
  if (loopStarted) return;
  loopStarted = true;
  const tick = () => {
    void runCandleMailCycle().catch((error) => {
      console.error("[vela-mail]", error);
    });
  };
  setTimeout(tick, 20_000);
  setInterval(tick, 60 * 1000);
}

async function weekEmail(window: { start: Date; end: Date }) {
  const settings = await getSiteSettings();
  const candles = await prisma.virtualCandle.findMany({
    where: { litAt: { gte: window.start, lt: window.end } },
    orderBy: { litAt: "asc" },
  });
  const rendered = renderCandleWeekEmail(
    {
      subject: settings.candleWeekEmailSubject,
      intro: settings.candleWeekEmailIntro,
      item: settings.candleWeekEmailItem,
    },
    candles.flatMap((candle) =>
      candle.litAt
        ? [
            {
              donorName: candle.donorName,
              email: candle.email,
              phone: candle.phone,
              intention: candle.intention,
              prayer: candle.prayer,
              intentionPublic: candle.intentionPublic,
              prayerPublic: candle.prayerPublic,
              litAt: candle.litAt,
              expiresAt: candle.expiresAt,
              amountCents: candle.amountCents,
            },
          ]
        : [],
    ),
    window,
  );
  return { settings, rendered };
}

/** Envia a lista desta semana agora, sem marcar a sexta como já enviada. */
export async function sendWeeklyReportTest() {
  const to = await getCandlesNotifyEmail();
  if (!to) {
    return { ok: false as const, message: "Cadastre o e-mail em Admin → Velas antes de testar." };
  }
  const window = currentParishWeekWindow();
  const { rendered } = await weekEmail(window);
  try {
    const sent = await sendViaSmtp({
      to,
      subject: `[Teste] ${rendered.subject}`,
      text: rendered.text,
    });
    if (!sent) {
      return {
        ok: false as const,
        message: "O servidor não enviou o e-mail. Confira SMTP_HOST, SMTP_USER e SMTP_PASS nas variáveis.",
      };
    }
  } catch (error) {
    const message =
      error instanceof SmtpSendError
        ? error.message
        : "O envio do e-mail de teste falhou. Tente de novo em instantes.";
    console.error("[vela-mail] teste da semana", message);
    return { ok: false as const, message };
  }
  return { ok: true as const };
}

async function sendWeeklyReport() {
  const settings = await getSiteSettings();
  const window = weeklyReportWindow(new Date(), settings.candleWeekReportKey);
  if (!window) return false;

  const claimed = await prisma.siteSettings.updateMany({
    where: { id: 1, NOT: { candleWeekReportKey: window.weekKey } },
    data: { candleWeekReportKey: window.weekKey },
  });
  if (claimed.count !== 1) return false;

  const to = await getCandlesNotifyEmail();
  const { rendered } = await weekEmail(window);

  if (!to) {
    console.warn("[vela-mail] Relatório da semana sem e-mail cadastrado em Admin → Velas.");
    await prisma.siteSettings.update({
      where: { id: 1 },
      data: { candleWeekReportKey: settings.candleWeekReportKey },
    });
    return false;
  }

  try {
    const sent = await sendViaSmtp({
      to,
      subject: rendered.subject,
      text: rendered.text,
    });
    if (!sent) {
      console.info("[vela-mail] SMTP não configurado. Relatório da semana:\n", rendered.text);
      await prisma.siteSettings.update({
        where: { id: 1 },
        data: { candleWeekReportKey: settings.candleWeekReportKey },
      });
      return false;
    }
    return true;
  } catch (error) {
    await prisma.siteSettings.update({
      where: { id: 1 },
      data: { candleWeekReportKey: settings.candleWeekReportKey },
    });
    throw error;
  }
}

async function sendExpiryReminders() {
  const now = new Date();
  const settings = await getSiteSettings();
  const noticeMinutes = expiryNoticeMinutes(settings.candleExpiryNoticeMinutes);
  const leadMs = noticeMinutes * 60 * 1000;
  const rows = await prisma.virtualCandle.findMany({
    where: {
      status: "PAID",
      expiryReminderSentAt: null,
      email: { not: null },
      litAt: { not: null },
      expiresAt: { gt: now, lte: new Date(now.getTime() + leadMs) },
    },
  });
  const velasUrl = `${publicSiteUrl()}/velas`;
  let sentCount = 0;

  for (const candle of rows) {
    if (!candleNeedsExpiryReminder(candle, now, leadMs)) continue;
    const claimed = await prisma.virtualCandle.updateMany({
      where: { id: candle.id, expiryReminderSentAt: null },
      data: { expiryReminderSentAt: new Date() },
    });
    if (claimed.count !== 1 || !candle.email) continue;
    const source = {
      donorName: candle.donorName,
      intention: candle.intention,
      prayer: candle.prayer,
      email: candle.email,
      phone: candle.phone,
      intentionPublic: candle.intentionPublic,
      prayerPublic: candle.prayerPublic,
      litAt: candle.litAt,
      expiresAt: candle.expiresAt,
      amountCents: candle.amountCents,
      link: velasUrl,
      notice: expiryNoticeLabel(noticeMinutes),
    };
    try {
      const sent = await sendViaSmtp({
        to: candle.email,
        subject: renderCandleEmail(settings.candleExpiryEmailSubject, DEFAULT_CANDLE_EXPIRY_EMAIL_SUBJECT, source),
        text: renderCandleEmail(settings.candleExpiryEmailBody, DEFAULT_CANDLE_EXPIRY_EMAIL_BODY, source),
      });
      if (!sent) {
        await prisma.virtualCandle.update({
          where: { id: candle.id },
          data: { expiryReminderSentAt: null },
        });
        continue;
      }
      sentCount += 1;
    } catch (error) {
      await prisma.virtualCandle.update({
        where: { id: candle.id },
        data: { expiryReminderSentAt: null },
      });
      console.error("[vela-mail] aviso de 1 hora", error);
    }
  }

  return sentCount;
}
