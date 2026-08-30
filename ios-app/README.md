# Marcato PDV — casca iOS (Capacitor)

Esse projeto não duplica o app — ele só embrulha o site que já existe
(`pdv.marcatoapp.com.br`) numa casca nativa, pra poder publicar na App Store.
O app abre direto a URL de produção (ver `capacitor.config.json` → `server.url`),
então **qualquer atualização feita no site aparece pro usuário sem precisar
mandar uma nova versão pra Apple** — só muda de versão quando mexer em algo
nessa pasta (ícone, splash, permissões, plugins nativos).

## O que já está pronto aqui

- Projeto Xcode gerado em `ios/App/App.xcodeproj`
- Ícone da App Store (1024×1024, sem cantos arredondados, sem transparência) e
  splash screen já aplicados em todos os tamanhos
- Permissões de câmera e galeria já declaradas no `Info.plist` (o PDV usa a
  câmera pra ler código de barras e tirar foto de produto/boleto)
- `appId` provisório: `com.identidadevision.marcatopdv` — **troque no
  `capacitor.config.json` e no Xcode (Signing & Capabilities) se vocês já
  usam outro padrão de Bundle ID** pros apps da Identidade Vision

## O que só dá pra fazer no Mac (com Xcode)

Não tenho como rodar Xcode/compilar/assinar daqui — só até aqui eu consigo ir.
No seu Mac:

```bash
cd ios-app
npm install
npx cap sync ios      # garante que tudo (config, plugins) está atualizado
npx cap open ios       # abre o Xcode
```

Dentro do Xcode:

1. Selecione o projeto **App** → aba **Signing & Capabilities**
2. Escolha seu **Team** (a conta de desenvolvedor que vocês já têm)
3. Confira o **Bundle Identifier** (troque se precisar)
4. Xcode vai baixar sozinho as dependências via Swift Package Manager na
   primeira vez que abrir (não precisa de CocoaPods aqui — esse setup usa SPM)
5. Rode num simulador ou aparelho físico pra conferir se tudo carrega certo
6. **Product → Archive** → depois **Distribute App** → **App Store Connect**
7. Cria o registro do app em appstoreconnect.apple.com (nome, categoria,
   screenshots, política de privacidade) e envia pra revisão

## Sobre a assinatura (Mercado Pago)

Como combinado: a cobrança da assinatura continua só pela versão web (navegador).
Dentro do app da App Store não deve aparecer nenhum botão de "assinar" ou
"pagar" apontando pro Mercado Pago — só login de quem já é assinante. Se
existir algum fluxo de assinatura visível na tela de onboarding/paywall,
vale revisar antes de mandar pra revisão da Apple.

## Ícone e splash — arquivos-fonte

Ficam em `assets/` (`icon-only.png`, `icon-foreground.png`, `splash.png`,
`splash-dark.png`). Se um dia quiser trocar a logo, é só substituir esses
arquivos e rodar de novo:

```bash
npx capacitor-assets generate --ios
```

## Atualizando depois de mudanças no `capacitor.config.json` ou plugins

```bash
npx cap sync ios
```
