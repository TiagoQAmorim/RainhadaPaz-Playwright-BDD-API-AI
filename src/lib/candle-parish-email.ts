import { getCandlesNotifyEmail, getSiteSettings } from "@/lib/settings";
import { publicSiteUrl } from "@/lib/site-url";
import {
  DEFAULT_CANDLE_LIT_EMAIL_BODY,
  DEFAULT_CANDLE_LIT_EMAIL_SUBJECT,
  renderCandleEmail,
} from "@/lib/candle-email-template";

type CandleEmailPayload = {
  donorName: string;
  intention: string;
  prayer: string | null;
  intentionPublic: boolean;
  prayerPublic: boolean;
  email: string | null;
  phone: string | null;
  amountCents?: number | null;
  litAt?: Date | null;
  expiresAt?: Date | null;
};

function smtpEnv(name: string): string | undefined {
  const direct = process.env[name]?.trim();
  if (direct) return direct;
  for (const key of Object.keys(process.env)) {
    if (key !== name && key.trim() === name) {
      const value = process.env[key]?.trim();
      if (value) return value;
    }
  }
  return undefined;
}

export async function sendViaSmtp(params: { to: string; subject: string; text: string }) {
  const host = smtpEnv("SMTP_HOST");
  const port = Number(smtpEnv("SMTP_PORT") ?? "587");
  const user = smtpEnv("SMTP_USER");
  const pass = smtpEnv("SMTP_PASS");
  const from = smtpEnv("SMTP_FROM") || user;
  if (!host || !from) return false;

  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 10_000,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transport.sendMail({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
  });
  return true;
}

/** Envia oração/intenção ao e-mail da paróquia (SiteSettings.email). */
export async function sendCandlePrayerToParish(candle: CandleEmailPayload) {
  const to = await getCandlesNotifyEmail();
  if (!to) {
    console.warn(
      "[vela-email] Configure o e-mail em Admin → Velas (ou o e-mail geral em Informações).",
    );
    return;
  }

  const settings = await getSiteSettings();
  const source = {
    ...candle,
    link: `${publicSiteUrl()}/velas`,
  };
  const subject = renderCandleEmail(
    settings.candleLitEmailSubject,
    DEFAULT_CANDLE_LIT_EMAIL_SUBJECT,
    source,
  );
  const text = renderCandleEmail(settings.candleLitEmailBody, DEFAULT_CANDLE_LIT_EMAIL_BODY, source);
  const sent = await sendViaSmtp({ to, subject, text });
  if (!sent) {
    console.info("[vela-email] SMTP não configurado. Conteúdo que seria enviado:\n", text);
  }
}
