# Execução do plano de finalização

Implementado em 14/10/2026. Os fontes anteriores foram preservados em antes-do-plano.zip.

## Etapas executadas

- URL base padronizada nos dois clientes, com normalização de /api, /api/checkin e barras finais. Mantido localhost:8080 como padrão. CORS global para os frontends.
- Ciclo diário por estudante e data de Brasília: NA_FACULDADE, EMBARCADO_VOLTA e VOLTA_DISPENSADA. Horários enviados em UTC e exibidos no fuso de Brasília.
- Cooldown padrão de 10 segundos, bloqueio transacional contra scans simultâneos e câmera encerrada após uma leitura. A nova leitura exige iniciativa do estudante.
- Dispensa pelo aluno ou motorista, contadores consolidados e reset somente do dia atual/veículo no modo demo, com confirmação visual.
- Login real por perfil nos dois clientes. Senhas derivadas com PBKDF2 e salt; sessões aleatórias com expiração de 12 horas e logout. O backend valida o perfil e impede check-in em nome de outro aluno.
- Tela do aluno com status, scanner, simulação sem câmera, leitura NFC em build nativo e opção de carona.
- Painel mobile exclusivo do motorista e dashboard web, com GPS, lista de passageiros, horários, contadores, dispensa, reset e logout.
- GPS com validação de coordenadas, parada de transmissão e expiração de sinal após 30 segundos. O radar permanece sem biblioteca nativa de mapas.
- Seed Java idempotente; H2 em memória por padrão; suporte configurável a PostgreSQL.
- Dockerfile multi-stage Java 17, porta PORT, render.yaml, dois vercel.json e guia DEPLOY_NUVEM.md.
- Botões acessíveis, áreas de toque, foco visível, mensagens de estado e contraste das ações principais ajustados. Documentação anterior de produção atualizada para não recomendar a URL incorreta.

## Validação concluída

| Verificação | Resultado |
| --- | --- |
| Backend: mvnw.cmd -B -ntp clean verify | Aprovado; JAR gerado |
| Testes Java | 13 aprovados, sem falhas |
| Painel: npm run build | Aprovado |
| Painel: npm run lint | Aprovado |
| Mobile: npx tsc --noEmit | Aprovado |
| Mobile: npm run lint | Aprovado |
| Mobile: npx expo export --platform web | Aprovado; 8 rotas estáticas |
| Normalização da URL | 7 casos aprovados por cliente |
| Navegador: login, ida, volta e dispensa | Aprovado com comunicação real com a API local |
| Navegador: painel mobile do motorista | Mesmos dados do painel web |
| Console dos clientes durante o fluxo | Sem erros de aplicação capturados |

Os testes cobrem autenticação, permissões, identidade do estudante, cooldown, leituras simultâneas, terceiro scan, dispensa, reset preservando outro dia, virada de data em Brasília, aluno inativo, CORS, validade do GPS e expiração/logout de sessão.

Evidências visuais em validacao/painel-web.jpg, validacao/app-estudante.jpg e validacao/app-motorista.jpg. O cenário exibido no painel foi: 2 idas, 1 volta, 1 dispensa e nenhum estudante pendente.

## Limites e verificações externas pendentes

- Preparação para nuvem concluída; os serviços ainda não foram publicados em contas Render/Vercel. O diretório não possui repositório Git configurado.
- Docker não estava instalado; o Dockerfile foi preparado, mas a imagem não foi construída neste computador. O JAR foi compilado e executado diretamente em Java 17.
- PostgreSQL não foi usado na validação; os testes e a execução local usaram H2.
- GPS real, câmera e NFC em aparelho físico ainda precisam de teste. Não foram solicitadas permissões de câmera/localização do usuário durante os testes de navegador.
- H2, sessões e GPS são voláteis. O modo padrão é adequado à demonstração; reinícios limpam as viagens em memória e exigem novo login.
- A instalação do mobile reportou 30 alertas de dependências (12 moderados e 18 altos). Não foi aplicado upgrade amplo nem npm audit fix --force, preservando as versões do Expo exigidas pelo plano. Uma revisão específica das dependências continua necessária antes de uso operacional com dados reais.
- O Expo já estava no SDK 57. Foi preservado; adicionado apenas expo-location compatível. A documentação v54 pedida pelo AGENTS.md foi consultada, juntamente com a documentação compatível com a instalação atual.
- A pasta node_modules do mobile tinha arquivos incompletos; foi restaurada com npm ci usando o arquivo de versões fixadas.

## Acesso local de demonstração

- API: http://localhost:8080/api/health
- Painel iniciado para revisão: http://localhost:5174
- App iniciado para revisão: http://localhost:8081

Esses processos são locais, dependem de permanecerem em execução e não representam publicação na nuvem. O guia DEPLOY_NUVEM.md contém os comandos para iniciar novamente, as credenciais de teste e as instruções de publicação.
