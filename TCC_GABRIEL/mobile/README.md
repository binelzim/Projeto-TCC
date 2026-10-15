# App Rota Universitária

Aplicativo Expo SDK 57 com login real por perfil, check-in de ida/volta, dispensa de retorno, painel do motorista e rastreio GPS.

```text
npm ci
npx expo start
```

Veja [PRODUCAO.md](PRODUCAO.md) e o [guia de nuvem](../DEPLOY_NUVEM.md). A conta do estudante é 22009264 / demo-hash-22009264; motorista / motorista123. Há botões de preenchimento na tela de login.

Valide com npx tsc --noEmit, npm run lint e npx expo export --platform web. Ao adicionar uma rota, inicie o Expo para regenerar seus tipos locais.

