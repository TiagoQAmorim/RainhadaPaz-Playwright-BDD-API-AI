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
   - **Shell** do serviço (ou CLI `railway run`):
     ```bash
     npx prisma db push
     npx prisma db seed
     ```
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
