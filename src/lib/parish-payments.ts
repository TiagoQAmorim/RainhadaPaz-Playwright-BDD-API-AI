/** Dados bancários oficiais da paróquia (dízimo, velas e transferências). */
export const PARISH_PAYMENT = {
  legalName:
    "Mitra Diocesana de Santo Amaro — Paróquia Nossa Senhora Rainha da Paz",
  pixKey: "60.909.843/0046-39",
  pixKeyType: "CNPJ" as const,
  bank: {
    name: "Itaú",
    code: "",
    branchLabel: "Ag.",
    agency: "7457",
    account: "99170-6",
  },
  /** Nome curto no QR PIX (máx. 25 caracteres — padrão BACEN). */
  pixQrMerchantName: "PAROQ RAINHA DA PAZ",
  pixQrCity: "SAO PAULO",
} as const;

/**
 * PIX e depósito da rifa. Chave lida do QR estático da Sicredi (EVP).
 * Cartão ainda não está ligado.
 */
export const RAFFLE_SICREDI_PAYMENT = {
  legalName:
    "Mitra Diocesana de Santo Amaro — Paróquia Nossa Senhora Rainha da Paz",
  pixKey: "efbe7b7c-a68a-4e49-bbc3-5d7c406b6f10",
  pixKeyType: "Chave aleatória" as const,
  bank: {
    name: "Sicredi",
    code: "748",
    branchLabel: "Cooperativa",
    agency: "0726",
    account: "50111-2",
  },
  pixQrMerchantName: "MITRA DIOCESANA DE SANTO",
  pixQrCity: "BRASILIA",
} as const;
