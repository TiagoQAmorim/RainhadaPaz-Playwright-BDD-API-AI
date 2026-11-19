import { payload as buildPixBrCode } from "pix-payload";
import { PARISH_PAYMENT, RAFFLE_SICREDI_PAYMENT } from "@/lib/parish-payments";

type PixAccount = typeof PARISH_PAYMENT | typeof RAFFLE_SICREDI_PAYMENT;

export type PixPaymentKind = "VELA" | "RIFA" | "DIZIMO";

/** Identificador para o fiél colar na mensagem do PIX (conferência na secretaria). */
export function buildPixReference(kind: PixPaymentKind, id: string): string {
  const short = id.replace(/\W/g, "").slice(-10).toUpperCase();
  return `${kind}-${short}`;
}

export function formatBrlFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatBrl(amount: number): string {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** txid no QR: 1–25 caracteres alfanuméricos (BACEN). */
export function sanitizePixTxid(reference: string): string {
  const clean = reference.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return (clean || "PAROQUIA").slice(0, 25);
}

/** PIX copia e cola (BR Code) com valor e identificador — app do banco lê o QR. */
export function buildParishPixCopiaECola(params: {
  amountCents: number;
  transactionId: string;
  account?: PixAccount;
}): string | null {
  if (params.amountCents <= 0) return null;
  const account = params.account ?? PARISH_PAYMENT;
  try {
    return buildPixBrCode({
      key: account.pixKey,
      name: account.pixQrMerchantName,
      city: account.pixQrCity,
      amount: params.amountCents / 100,
      transactionId: sanitizePixTxid(params.transactionId),
    });
  } catch (e) {
    console.error("[pix-brcode]", e);
    return null;
  }
}

export function parishPixPayload(params: {
  kind: PixPaymentKind;
  referenceId: string;
  amountCents: number;
  payerName?: string;
  extraMessage?: string;
}) {
  const account = params.kind === "RIFA" ? RAFFLE_SICREDI_PAYMENT : PARISH_PAYMENT;
  const reference = buildPixReference(params.kind, params.referenceId);
  const amountLabel = formatBrlFromCents(params.amountCents);
  const messageParts = [reference, params.kind, params.payerName?.trim(), params.extraMessage?.trim()]
    .filter(Boolean)
    .join(" — ");

  const pixCopiaECola =
    params.amountCents > 0
      ? buildParishPixCopiaECola({
          amountCents: params.amountCents,
          transactionId: reference,
          account,
        })
      : null;

  return {
    legalName: account.legalName,
    pixKey: account.pixKey,
    pixKeyType: account.pixKeyType,
    bank: account.bank,
    amountCents: params.amountCents,
    amountLabel,
    reference,
    messageSuggestion: messageParts,
    pixCopiaECola,
  };
}

/** PIX de velas e dízimo na conta Itaú. PIX da rifa na Sicredi. Cartão ainda não ligado. */
export const PARISH_PAYMENT_PROVIDER = "pix_parish" as const;