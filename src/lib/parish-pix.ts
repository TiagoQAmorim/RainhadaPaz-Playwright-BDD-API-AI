import { payload as buildPixBrCode } from "pix-payload";
import { PARISH_PAYMENT } from "@/lib/parish-payments";

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
}): string | null {
  if (params.amountCents <= 0) return null;
  try {
    return buildPixBrCode({
      key: PARISH_PAYMENT.pixKey,
      name: PARISH_PAYMENT.pixQrMerchantName,
      city: PARISH_PAYMENT.pixQrCity,
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
  const reference = buildPixReference(params.kind, params.referenceId);
  const amountLabel = formatBrlFromCents(params.amountCents);
  const messageParts = [reference, params.kind, params.payerName?.trim(), params.extraMessage?.trim()]
    .filter(Boolean)
    .join(" — ");

  const pixCopiaECola =
    params.amountCents > 0
      ? buildParishPixCopiaECola({ amountCents: params.amountCents, transactionId: reference })
      : null;

  return {
    legalName: PARISH_PAYMENT.legalName,
    pixKey: PARISH_PAYMENT.pixKey,
    pixKeyType: PARISH_PAYMENT.pixKeyType,
    bank: PARISH_PAYMENT.bank,
    amountCents: params.amountCents,
    amountLabel,
    reference,
    messageSuggestion: messageParts,
    pixCopiaECola,
  };
}

/** PIX manual na conta Itaú. Cartão: Sicredi (`src/lib/sicredi-payments.ts`). */
export const PARISH_PAYMENT_PROVIDER = "pix_parish" as const;