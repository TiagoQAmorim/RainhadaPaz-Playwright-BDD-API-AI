/** Valores de referência para doação mensal (PIX na paróquia). */
export const TITHE_AMOUNT_BRL_LIST = [
  30, 50, 80, 100, 130, 150, 180, 200, 250, 300, 400, 500,
] as const;

export type TitheAmountBrl = (typeof TITHE_AMOUNT_BRL_LIST)[number];

export const TITHE_DISCLAIMERS = [
  "Pagamento por PIX ou transferência na conta oficial da paróquia (chave CNPJ ao lado).",
  "Na mensagem do PIX, indique DÍZIMO e seu nome para a secretaria identificar.",
  "Guarde o comprovante.",
] as const;