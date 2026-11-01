import { getCandlesNotifyEmail } from "@/lib/settings";

type CandleEmailPayload = {
  donorName: string;
  intention: string;
  prayer: string | null;
  intentionPublic: boolean;
  prayerPublic: boolean;
  email: string | null;
};

async function sendViaSmtp(params: { to: string; subject: string; text: string }) {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || user;
  if (!host || !from) return false;

  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
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

  const subject = `Vela de Oração — ${candle.donorName}`;
  const lines = [
    "Nova vela virtual acesa",
    "",
    `Nome: ${candle.donorName}`,
    `Intenção: ${candle.intention}`,
    candle.prayer ? `Oração:\n${candle.prayer}` : "Oração: (não informada)",
    "",
    `Exibir no mural: intenção ${candle.intentionPublic ? "sim" : "não (sigilo)"}, oração ${candle.prayerPublic ? "sim" : "não (sigilo)"}.`,
    candle.email ? `E-mail do(a) devoto(a): ${candle.email}` : "E-mail do(a) devoto(a): não informado",
    "",
    "— Sistema de velas virtuais, Paróquia Rainha da Paz",
  ];

  const text = lines.join("\n");
  const sent = await sendViaSmtp({ to, subject, text });
  if (!sent) {
    console.info("[vela-email] SMTP não configurado. Conteúdo que seria enviado:\n", text);
  }
}
