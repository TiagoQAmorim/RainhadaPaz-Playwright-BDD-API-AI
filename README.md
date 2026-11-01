# Site Paróquia Nossa Senhora Rainha da Paz

Site moderno em **Next.js** com painel administrativo, notícias, eventos e **vela virtual** (PIX e cartão via Mercado Pago).

## Requisitos

- Node.js 20+
- npm

## Configuração rápida

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Admin

- URL: `/admin/login`
- Credenciais padrão (altere no `.env` antes de produção):
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`

## Pagamentos (vela virtual)

1. Crie uma aplicação em [Mercado Pago Developers](https://www.mercadopago.com.br/developers).
2. Coloque o **Access Token** em `MERCADOPAGO_ACCESS_TOKEN`.
3. Defina `NEXT_PUBLIC_SITE_URL` com a URL pública (obrigatório para webhook e retorno do checkout).
4. Valor da vela: `CANDLE_PRICE_BRL` (padrão 10).

Sem token configurado, o site funciona em **modo demonstração** (vela acende sem cobrança real).

## Produção

- Use PostgreSQL trocando `provider` e `DATABASE_URL` no `prisma/schema.prisma`.
- Gere `AUTH_SECRET` longo e aleatório.
- Hospede em Vercel, Railway, ou VPS com `npm run build && npm start`.

## Migração do WordPress

O conteúdo inicial foi baseado no site atual. Para migrar páginas antigas em massa, exporte do WordPress (WXR) ou copie textos pelo painel **Admin → Conteúdo / Notícias**.
