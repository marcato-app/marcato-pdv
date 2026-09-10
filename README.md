# Marcato PDV

Sistema de ponto de venda (PDV) da Identidade Vision. Site em `pdv.marcatoapp.com.br`,
publicado como um Cloudflare Worker (nome do script: `gabrielgomes`).

Este repositório foi criado puxando o código de produção direto da API do Cloudflare
(o projeto nunca tinha sido versionado em Git antes).

## Estrutura

- `marcato-pdv.html` — front-end inteiro (SPA de uma página só: sidebar, PDV/balcão,
  painel, estoque etc.), HTML+CSS+JS inline.
- `worker.js` — Worker que serve o `marcato-pdv.html` e expõe as rotas de API
  (`/api/iniciar-trial`, `/api/criar-assinatura`, `/api/webhook-mercadopago`,
  `/api/admin/overview`, `/api/admin/enviar-email`, `/api/admin/liberar-acesso`),
  além do cron `scheduled` que avisa trials acabando.
- `wrangler.toml` — config pra deploy via Wrangler CLI.
- `migracoes/` — SQL que precisa ser rodado no SQL Editor do Supabase pra
  liberar alguns recursos (metas financeiras, orçamento na Venda Fornecedor).
- `email-templates/` — modelos de e-mail de confirmação e redefinição de senha
  pra colar no painel do Supabase.

## Variáveis de ambiente / secrets (já configurados no Worker em produção)

- `RESEND_API_KEY` — envio de e-mail (Resend).
- `SUPABASE_SERVICE_ROLE_KEY` — acesso privilegiado ao Supabase.
- `MP_ACCESS_TOKEN` — Mercado Pago.

`SUPABASE_URL` e `SUPABASE_ANON_KEY` estão hardcoded no topo do `worker.js` (chave
pública, sem risco).

## Deploy

```
npx wrangler deploy
```

(precisa de `wrangler login` ou `CLOUDFLARE_API_TOKEN` configurado, e os secrets acima
já devem existir no Worker — `wrangler secret put NOME`).
