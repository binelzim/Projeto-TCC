# App Rota Universitária

Aplicativo único Expo SDK 57 para estudante e motorista, em Android, iOS e web.

~~~text
npm ci
npx expo start --web
~~~

Configure EXPO_PUBLIC_API_URL em .env usando .env.example. No celular físico, informe o IP do computador ou uma API HTTPS.

Acesso estudante: 22009264 / demo-hash-22009264.
Acesso motorista: motorista / motorista123.
Código de frota: FROTA-UNIPAM.
As dicas aparecem somente na demonstração.

O app oferece cadastro, ida/volta, gerenciamento de alunos, rotas, timeline, GPS, distância, avisos, carteirinha, histórico, relatório e configurações de acessibilidade persistentes.

~~~text
npm test
npx tsc --noEmit
npm run lint
npx expo export --platform web
~~~

O teste de cálculos e CSV usa o suporte de TypeScript do Node 22. Os tipos de navegação são gerados pelo Expo. Não é necessário instalar bibliotecas de mapas.

Veja [README geral](../README.md), [publicação](PRODUCAO.md) e [guia de nuvem](../DEPLOY_NUVEM.md).
