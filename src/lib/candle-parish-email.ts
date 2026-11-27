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

export class SmtpSendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmtpSendError";
  }
}

type SmtpAttempt = { host: string; port: number; secure: boolean };

function zohoOrgHost(host: string): string | null {
  const match = host.match(/^smtp\.(zoho\..+)$/i);
  if (!match) return null;
  return `smtppro.${match[1]}`;
}

function attemptsFor(host: string, port: number): SmtpAttempt[] {
  const secure = port === 465;
  const list: SmtpAttempt[] = [{ host, port, secure }];
  if (port === 587) list.push({ host, port: 465, secure: true });
  const org = zohoOrgHost(host);
  if (org) {
    list.push({ host: org, port: 465, secure: true });
    list.push({ host: org, port: 587, secure: false });
  }
  const seen = new Set<string>();
  return list.filter((item) => {
    const key = `${item.host}:${item.port}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function smtpFailureMessage(error: unknown): string {
  const err = error as { code?: string; responseCode?: number };
  const code = err.code ?? "";
  const response = err.responseCode ?? 0;
  if (code === "EAUTH" || response === 535 || response === 534) {
    return "O Zoho recusou o usuário ou a senha. Use SMTP_HOST smtppro.zoho.com, porta 465, o e-mail completo em SMTP_USER e a senha de aplicativo da caixa.";
  }
  if (
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    code === "ECONNECTION" ||
    code === "ECONNREFUSED" ||
    code === "EDNS"
  ) {
    return "O site não conseguiu conectar ao servidor de e-mail. No Zoho, use smtppro.zoho.com na porta 465.";
  }
  if (response === 553 || response === 550 || response === 554) {
    return "O remetente foi recusado. SMTP_FROM precisa ser o mesmo e-mail de SMTP_USER.";
  }
  return "O envio do e-mail de teste falhou. Tente de novo em instantes.";
}

export async function sendViaSmtp(params: { to: string; subject: string; text: string }) {
  const host = smtpEnv("SMTP_HOST");
  const port = Number(smtpEnv("SMTP_PORT") ?? "587");
  const user = smtpEnv("SMTP_USER");
  const pass = smtpEnv("SMTP_PASS");
  const from = smtpEnv("SMTP_FROM") || user;
  if (!host || !from) return false;
  if (!user || !pass) {
    throw new SmtpSendError("Falta SMTP_USER ou SMTP_PASS nas variáveis do servidor.");
  }
  if (!Number.isFinite(port) || port <= 0) {
    throw new SmtpSendError("SMTP_PORT inválida. No Zoho, use 465.");
  }

  const nodemailer = await import("nodemailer");
  let lastError: unknown;
  for (const attempt of attemptsFor(host, port)) {
    const transport = nodemailer.createTransport({
      host: attempt.host,
      port: attempt.port,
      secure: attempt.secure,
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
      requireTLS: !attempt.secure,
      auth: { user, pass },
    });
    try {
      await transport.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        text: params.text,
      });
      return true;
    } catch (error) {
      lastError = error;
      const code = (error as { code?: string }).code ?? "";
      const response = (error as { responseCode?: number }).responseCode ?? 0;
      console.error("[smtp]", attempt.host, attempt.port, code || response || "erro");
    }
  }
  throw new SmtpSendError(smtpFailureMessage(lastError));
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
    console.info("[vela-email] SMTP não configurado.");
  }
}
