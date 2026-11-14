# Cartão online — Sicredi

A paróquia usará **Sicredi** para **cartão** (crédito/débito). O **PIX** do site continua na conta **Itaú** (`src/lib/parish-payments.ts`), como hoje.

## O que pedir à cooperativa

Fale com o **gerente de Cash** da Sicredi e solicite habilitação de **e-commerce / recebimento com cartão** com API para site próprio. Nomenclaturas comuns no banco: *Registro de Cobrança Online*, *E-commerce* ou gateway de cartão para loja virtual.

1. Contrato de recebimento com cartão (CNPJ da Mitra / paróquia).
2. Acesso ao [Portal do Desenvolvedor Sicredi](https://developer.sicredi.com.br/pt) (app + **Client ID** e **Client Secret**).
3. Certificado **mTLS**, se a API exigir (várias APIs Sicredi usam OAuth2 + mTLS).
4. Documentação da API de **transação / link de pagamento** e do **webhook** de confirmação.
5. Ambiente de **homologação** antes de produção.

## Variáveis no Railway (quando a cooperativa liberar)

```env
SICREDI_ENABLED=true
SICREDI_CLIENT_ID=
SICREDI_CLIENT_SECRET=
# Preencher conforme o manual Sicredi (ex. cooperativa + beneficiário):
# SICREDI_COOPERATIVE=
# SICREDI_BENEFICIARY_CODE=
# Caminhos dos certificados mTLS no servidor, se aplicável:
# SICREDI_MTLS_CERT_PATH=
# SICREDI_MTLS_KEY_PATH=
```

`NEXT_PUBLIC_SITE_URL` deve ser o domínio final, ex. `https://paroquiarainhadapaz.com.br`.

**Webhook** (cadastrar no painel Sicredi após implementação):

```text
https://paroquiarainhadapaz.com.br/api/webhooks/sicredi
```

Helper no código: `sicrediWebhookUrl()` em `src/lib/sicredi-payments.ts`.

## Estado no código

| Meio | Status |
|------|--------|
| PIX (velas, rifas, dízimo) | Ativo — confirmação manual no admin |
| Cartão Sicredi | Aguardando credenciais + documentação da cooperativa |

Com `SICREDI_ENABLED` e segredos configurados, o próximo passo de desenvolvimento é implementar checkout e webhook conforme o manual que o Sicredi entregar (não há SDK único público igual ao antigo Mercado Pago).

## Fluxo alvo (cartão)

1. Fiél escolhe **PIX** ou **cartão** no checkout (vela / rifa / dízimo).
2. **Cartão:** redirecionamento ou iframe/checkout Sicredi → pagamento aprovado.
3. **Webhook** marca pedido como pago (vela ativa, rifa confirmada, etc.), como fazia o Mercado Pago antes.

## PIX não muda

Não altere a chave PIX no site ao contratar Sicredi para cartão, a menos que a paróquia decida **unificar** recebimentos em uma única conta (decisão pastoral/contábil, não técnica).