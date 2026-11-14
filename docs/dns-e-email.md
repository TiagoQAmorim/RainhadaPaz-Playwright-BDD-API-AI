# Domínio, site novo e e-mail (sem perder caixas)

Use este roteiro ao apontar `paroquiarainhadapaz.com.br` para a **nova hospedagem** (ex. Railway) **mantendo o e-mail** na **hospedagem antiga** (ou em outro provedor).

## Cenário atual — Paróquia Rainha da Paz

- **Site novo:** Railway (ver `hospedagem-railway.md`).
- **E-mail continua na hospedagem antiga**, incluindo caixas como:
  - `contato@paroquiarainhadapaz.com.br`
  - `assistente@paroquiarainhadapaz.com.br`
- Ao mudar DNS para o site novo, **não cancele** o plano de **e-mail** no host antigo até a paróquia decidir migrar correio para outro lugar.

O site e o e-mail usam o **mesmo domínio**, mas entradas DNS **diferentes**. Você pode apontar o **site** para a Railway **sem mover** as caixas, desde que **MX / SPF / DKIM / DMARC** continuem apontando para onde o e-mail funciona hoje.

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
   - **Site:** `https://paroquiarainhadapaz.com.br` e `https://www.paroquiarainhadapaz.com.br`.
   - **E-mail:** de um Gmail externo, envie para `contato@paroquiarainhadapaz.com.br` e `assistente@paroquiarainhadapaz.com.br`; abra as caixas na hospedagem antiga e confira recebimento e resposta.

5. **Hospedagem antiga**  
   - Pode **desligar só o site / WordPress** quando o domínio já abrir o site novo.
   - **Mantenha ativo** o serviço de **e-mail** (e o que ele precisa no DNS) enquanto essas caixas forem usadas.
   - Antes de cancelar qualquer coisa na hospedagem antiga, confira de novo os **MX** no Registro.br e repita o teste de envio/recebimento.

### Velas e SMTP no site novo

O portal pode **enviar** e-mails (ex. intenções de velas) via **SMTP** configurado no admin. Isso **não substitui** as caixas `contato@` / `assistente@` na hospedagem antiga:

- Para **receber** no site: configure em Admin → Velas / Informações o endereço de destino (pode ser `contato@...` ou `assistente@...`).
- Para **enviar** com SPF alinhado, use credenciais SMTP do **mesmo provedor de e-mail** da paróquia (a hospedagem antiga ou o painel de e-mail costuma informar host, porta, usuário e senha). Até lá, o sistema pode só registrar no servidor sem enviar — ver comentários em `.env.example` (`SMTP_*`).

## Erros comuns

| Se você… | Acontece… |
|----------|-----------|
| Remove os MX ao criar CNAME do site | E-mails param de chegar |
| Troca SPF sem incluir o servidor de envio | Mensagens vão para spam ou são rejeitadas |
| Aponta `@` para IP antigo e só `www` para o novo | Metade dos visitantes vê site velho |

## Ajuda

Se não souber qual registro é qual, mande para quem cuida do DNS uma captura da **zona DNS completa** e o destino que a nova hospedagem forneceu — altere só A/CNAME do site.