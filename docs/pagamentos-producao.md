# Pagamentos — PIX paroquial (Itaú)

**Mercado Pago foi removido.** Dízimo, velas e rifas usam a conta oficial da paróquia (`src/lib/parish-payments.ts`).

## Fluxo atual

| Produto | Usuário | Confirmação |
|---------|---------|-------------|
| **Dízimo** | PIX manual (copia chave no site) | Secretaria |
| **Vela** | Conforme modo no admin (grátis, grátis+oferta, paga); PIX em `/velas/pagamento` + `VELA-…` | Admin → Velas → **Confirmar pagamento recebido** |
| **Rifa** | Tela `/rifas/[slug]/pagamento` com `RIFA-…` | Admin → Rifa → **Confirmar pagamento** (já existia) |

## Dados bancários

Edite `src/lib/parish-payments.ts` se a chave ou conta mudar.

## Modo teste (só E2E / dev)

```env
CANDLE_FREE_MODE=true
RAFFLE_FREE_MODE=true
```

## Cartão — Sicredi

Decisão da paróquia: **cartão online pelo Sicredi**; PIX continua no Itaú. Credenciais e webhook: [`pagamentos-sicredi.md`](pagamentos-sicredi.md).

## PIX automático (opcional)

Se no futuro o Itaú ou o Sicredi liberar **PIX com QR dinâmico via API**, pode automatizar a confirmação (hoje é manual no admin).

## Hospedagem

Não é necessário `MERCADOPAGO_*` no `.env`. Mantenha `AUTH_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, preços (`CANDLE_PRICE_BRL`).