# E-mails de autenticação (confirmar cadastro / redefinir senha)

Esses e-mails (confirmação de cadastro, "esqueci minha senha") são enviados
pelo **Supabase**, não pelo nosso Worker — por isso não tem como configurar
isso no código, só no painel do Supabase. Os arquivos aqui são só o
HTML pronto pra colar lá.

## Passo 1 — Corrigir o link que ia pro localhost

Painel do Supabase → **Authentication → URL Configuration**:

- **Site URL**: trocar para `https://pdv.marcatoapp.com.br`
- **Redirect URLs**: adicionar `https://pdv.marcatoapp.com.br/**`

Sem isso, o link do e-mail sempre volta pro endereço padrão (localhost),
não importa o que a gente configure em outro lugar.

## Passo 2 — Deixar os e-mails com a cara do Marcato PDV

Painel do Supabase → **Authentication → Emails → Templates**:

- Aba **Confirm signup** → cole o conteúdo de `confirmar-cadastro.html`
  no campo "Message body (as HTML)"
- Aba **Reset Password** → cole o conteúdo de `redefinir-senha.html`

Os dois já usam a logo, as cores (roxo/verde) e o botão no estilo do
app — e o Supabase troca sozinho o `{{ .ConfirmationURL }}` pelo link
de verdade.

## Passo 3 — Mandar os e-mails de contato@marcatoapp.com.br (opcional, mas recomendado)

Por padrão o Supabase manda esses e-mails de um endereço genérico deles
(tipo `noreply@mail.app.supabase.io`), com limite baixo de envios por hora.
Pra usar `contato@marcatoapp.com.br` de verdade, dá pra plugar o Resend
(que a gente já usa no Worker) como SMTP customizado:

1. No painel do **Resend** → Domains → adicionar `marcatoapp.com.br` e
   adicionar os registros de DNS (SPF/DKIM) que ele mostrar — normalmente
   na mesma zona DNS do Cloudflare onde o domínio já está apontado
2. Depois de verificado, pegar a API key do Resend
3. No Supabase → **Authentication → Emails → SMTP Settings** → ativar
   "Enable Custom SMTP" e preencher:
   - Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: a API key do Resend
   - Sender email: `contato@marcatoapp.com.br`
   - Sender name: `Marcato PDV`

**Isso eu não consigo fazer por aqui** — precisa da sua conta logada nos
dois painéis (Resend e Supabase). Me avisa quando o domínio estiver
verificado no Resend que eu atualizo o `from:` dos e-mails que o Worker
já manda hoje (avisos de trial/assinatura), que hoje estão saindo de
`onboarding@resend.dev` em vez do endereço de vocês.
