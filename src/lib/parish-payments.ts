/** Dados bancários oficiais da paróquia (dízimo e transferências). */
export const PARISH_PAYMENT = {
  legalName:
    "Mitra Diocesana de Santo Amaro — Paróquia Nossa Senhora Rainha da Paz",
  pixKey: "60.909.843/0046-39",
  pixKeyType: "CNPJ" as const,
  bank: {
    name: "Itaú",
    agency: "7457",
    account: "99170-6",
  },
  /** Nome curto no QR PIX (máx. 25 caracteres — padrão BACEN). */
  pixQrMerchantName: "PAROQ RAINHA DA PAZ",
  pixQrCity: "SAO PAULO",
} as const;
