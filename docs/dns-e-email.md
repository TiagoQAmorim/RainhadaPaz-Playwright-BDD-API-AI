# Domínio, site novo e e-mail (sem perder caixas)

Use este roteiro ao apontar `paroquiarainhadapaz.com.br` para a **nova hospedagem** (ex. Railway) **mantendo o e-mail** onde ele já está (ex. AWS WorkMail, Google Workspace, Registro.br e-mail, etc.).

## Regra de ouro

- **Site** → registros **A** ou **CNAME** (`@`, `www`, talvez `preview`).
- **E-mail** → registros **MX**, **TXT** (SPF), **DKIM** e **DMARC** — **não apagar nem alterar** sem saber para onde o correio vai.

Antes de mudar qualquer coisa: **exporte ou anote a zona DNS completa** no Registro.br (imprimir PDF ou copiar cada registro).

## Passo a passo

1. **Descubra onde o e-mail mora hoje**  
   No Registro.br → DNS → veja os **MX**. O hostname do MX indica o provedor (ex. `*.amazonaws.com` = AWS, `google.com` = Google).

2. **Deploy do site na nova hospedagem**  
   Siga `docs/hospedagem-railway.md`. Teste primeiro no domínio `*.up.railway.app`.

3. **Aponte só o site**  
   Na zona DNS do Registro.br:
   - Ajuste **apenas** o que a Railway (ou outro host) pedir para `paroquiarainhadapaz.com.br` e `www`.
   - **Deixe intactos** MX, SPF (`TXT` com `v=spf1`), DKIM (`TXT` ou `CNAME` que o provedor de e-mail indicou) e DMARC (`_dmarc`).

4. **Propagação**  
   Aguarde alguns minutos a algumas horas. Teste:
   - Site: abra `https://paroquiarainhadapaz.com.br`.
   - E-mail: envie de um Gmail para `admin@...` e responda de volta.

5. **Só depois** desligue servidor antigo (ex. AWS) se o site já não depende dele. **Não cancele** o serviço de **e-mail** na AWS (ou outro) até confirmar que MX ainda apontam para o provedor correto e as caixas funcionam.

## Erros comuns

| Se você… | Acontece… |
|----------|-----------|
| Remove os MX ao criar CNAME do site | E-mails param de chegar |
| Troca SPF sem incluir o servidor de envio | Mensagens vão para spam ou são rejeitadas |
| Aponta `@` para IP antigo e só `www` para o novo | Metade dos visitantes vê site velho |

## Ajuda

Se não souber qual registro é qual, mande para quem cuida do DNS uma captura da **zona DNS completa** e o destino que a nova hospedagem forneceu — altere só A/CNAME do site.