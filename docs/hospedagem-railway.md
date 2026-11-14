# Hospedagem na Railway

Guia para colocar o site Next.js no ar com **SQLite em volume persistente** (sem migrar para Postgres agora).

## 1. Conta e projeto

1. Acesse [railway.com](https://railway.com) e entre com GitHub.
2. **New Project** → **Deploy from GitHub repo** → escolha este repositório.
3. Railway detecta Node/Next e usa o `railway.toml` da raiz (build + `prisma db push` antes de subir).

## 2. Volume para o banco (obrigatório)

O SQLite precisa de disco que **não some** a cada deploy.

1. No serviço do app → **Volumes** → **Add volume**.
2. Monte em **`/data`** (caminho sugerido).
3. Em **Variables**, defina:
   ```env
   DATABASE_URL=file:/data/rainhadapaz.db
   ```

## 3. Variáveis de ambiente

No painel **Variables** do serviço (**no mesmo service do app**, não só no projeto):

> Se `DATABASE_URL` não estiver definida, o build falha com `Environment variable not found: DATABASE_URL` ao gerar páginas.

No painel **Variables** do serviço (produção):

| Variável | Exemplo / notas |
|----------|-----------------|
| `DATABASE_URL` | `file:/data/rainhadapaz.db` |
| `NEXT_PUBLIC_SITE_URL` | `https://paroquiarainhadapaz.com.br` (sem `/` no final) |
| `AUTH_SECRET` | string longa aleatória (≥ 32 caracteres) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin inicial (seed) |
| `CANDLE_FREE_MODE` | `false` para cobrar velas |
| `RAFFLE_FREE_MODE` | `false` para cobrar rifas |
| `CANDLE_PRICE_BRL` | ex. `10` |
| SMTP (`SMTP_*`) | opcional, e-mails de vela |

`NODE_ENV` → Railway costuma definir `production` automaticamente.

## 4. Primeiro deploy e seed

1. Faça o deploy (push no GitHub ou **Deploy** manual).
2. Abra **Settings** → confira que o **domínio** `*.up.railway.app` está ativo (para testes).
3. **Uma vez**, popular o banco:
   - **Console** do serviço (pasta `/app`). Se `npx` não existir, use `npm` ou o binário direto:
     ```bash
     cd /app
     npm run db:push
     npm run db:seed
     ```
     Alternativa:
     ```bash
     ./node_modules/.bin/prisma db push
     ./node_modules/.bin/prisma db seed
     ```
   - Do seu PC (com [Railway CLI](https://docs.railway.com/guides/cli) linkado ao projeto): `railway run npm run db:seed`
   O `preDeployCommand` no `railway.toml` já roda `db push` em deploys seguintes.

4. Teste `/admin/login` com `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Mais sobre pagamentos: [`pagamentos-producao.md`](pagamentos-producao.md).

## 5. Domínio `paroquiarainhadapaz.com.br`

1. No serviço → **Settings** → **Networking** → **Custom Domain** → adicione:
   - `paroquiarainhadapaz.com.br`
   - `www.paroquiarainhadapaz.com.br` (recomendado)
2. Railway mostra um destino DNS (geralmente **CNAME**).
3. No [Registro.br](https://registro.br): **DNS do domínio** → crie os registros **iguais** ao que a Railway indicar (modo avançado / zona DNS). **Não mexa nos MX** — as caixas `contato@` e `assistente@` permanecem na hospedagem antiga; ver [`dns-e-email.md`](dns-e-email.md).
4. Aguarde propagação (minutos a algumas horas).
5. Atualize `NEXT_PUBLIC_SITE_URL` para `https://paroquiarainhadapaz.com.br` e **redeploy**.
6. Pagamentos PIX: secretaria confirma no admin (ver `docs/pagamentos-producao.md`).

## 6. Custo

Plano por uso (~**US$ 5–10/mês** típico para site paroquial pequeno, conforme tráfego). Acompanhe **Usage** no painel.

## 7. Atualizar o site

Push na branch conectada → Railway faz build, `prisma db push` e sobe de novo. O arquivo em `/data/rainhadapaz.db` permanece no volume.

## Troubleshooting

| Problema | O que verificar |
|----------|-----------------|
| Admin não loga | Rodou `prisma db seed`? `AUTH_SECRET` definido? |
| Dados sumiram | `DATABASE_URL` aponta para `/data/...` e volume montado em `/data` |
| PIX não libera vela/rifa | Admin confirma pagamento recebido (ver `pagamentos-producao.md`) |
| Build falha | Logs no Railway; Node 20+ (`engines` no `package.json`) |
| `DATABASE_URL` not found no build | Adicione `DATABASE_URL=file:/data/rainhadapaz.db` nas Variables **e** volume em `/data`. |
| `SiteSettings` does not exist no build | O script `scripts/next-build.mjs` cria SQLite temporário na Railway; **faça push** deste commit no GitHub e redeploy. |
| Página Railway “Not Found” / “train has not arrived” | Veja seção **Site não abre (404 Railway)** abaixo. |

## Site não abre (404 Railway)

Mensagem *“The train has not arrived at the station”* em `*.up.railway.app` **não é** o site Next — é a borda da Railway sem app saudável atrás.

1. **Serviço certo** — Clique no **card do repositório** (não só no projeto). Em **Settings → Networking → Public Networking**, gere/copie o domínio **`xxxx.up.railway.app`** deste serviço. O nome `paroquiarainhadapaz.up.railway.app` só funciona se foi **criado neste** serviço.
2. **Deploy ativo** — **Deployments**: o último deve estar **Success** / Active (verde). Se falhou no build ou no **Pre-deploy** (`prisma db push`), não há app rodando.
3. **Volume + `DATABASE_URL`** — Volume em `/data` e `DATABASE_URL=file:/data/rainhadapaz.db`. Sem isso, o pre-deploy pode falhar.
4. **Logs em runtime** — Aba **Deploy logs** / **HTTP logs**: erro ao subir (`npm run start`), Prisma, etc.
5. **Porta** — O `npm run start` usa `next start --hostname 0.0.0.0`; a Railway injeta `PORT` automaticamente.

Depois de corrigir, abra de novo o domínio que aparece em **Networking** do serviço.

## Home “antiga” mas `/admin` dá erro

- A **home** pode mostrar conteúdo do **build** (banco temporário) enquanto o **volume** `/data` ainda está vazio — parece desatualizada.
- **`/admin/login` com erro 500** quase sempre é **banco em runtime** sem tabelas ou sem **seed** (Prisma não acha `SiteSettings` / `Admin`).

O **Console** da Railway às vezes não tem `npm`/`npx`. O app já roda `db push` + **seed automático** (só se não houver admin) em cada boot via `scripts/ensure-db.mjs`.

Se precisar rodar seed manualmente, use o binário do Node no container (com o app em `/app`):

```bash
cd /app
node node_modules/prisma/build/index.js db push
node --import tsx prisma/seed.ts
```

Confira também:

- **Volume** montado em `/data`
- `DATABASE_URL=file:/data/rainhadapaz.db`
- `AUTH_SECRET` com **≥ 32 caracteres** (senão o login quebra em produção)

Depois do seed, teste `/admin/login` e recarregue a home (ou aguarde redeploy com `force-dynamic` no site).
