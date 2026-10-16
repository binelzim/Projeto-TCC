# Publicação — API no Render e aplicativo único na Vercel/Expo

A arquitetura possui dois serviços: a API Java e o aplicativo Expo, que atende estudante e motorista. A versão de navegador é exportada pelo mesmo projeto usado no celular.

## Endereços publicados em 15/10/2026

- Aplicativo: **https://rota-universitaria-tcc.vercel.app** — projeto `rota-universitaria-tcc`, Vercel Hobby.
- API: **https://rota-universitaria-api-1.onrender.com** — serviço `rota-universitaria-api-1`, Render Free.
- Saúde da API: **https://rota-universitaria-api-1.onrender.com/api/health**.

O serviço Render existente foi reaproveitado e o render.yaml usa seu nome. Para atualizar esta publicação, use o serviço existente em vez de criar uma segunda API. EXPO_PUBLIC_API_URL já foi configurada na Vercel para Production e Preview.

A demonstração usa H2 em memória e dados fictícios. Reinícios recriam as contas iniciais e apagam cadastros, histórico e sessões temporários. Confira os [limites do Render Free](https://render.com/docs/free) antes da apresentação.

## 1. Repositório

Os fontes estão em [binelzim/Projeto-TCC](https://github.com/binelzim/Projeto-TCC), branch **main**. Nesse repositório, o projeto fica dentro de **TCC_GABRIEL/**. Os caminhos configurados nos provedores precisam incluir essa pasta, mesmo que o diretório local já seja o projeto.

O .gitignore exclui .env, node_modules, target, dist e arquivos de backup. As variáveis de publicação devem ser configuradas nos provedores.

## 2. Backend no Render

1. Crie um Web Service a partir de **https://github.com/binelzim/Projeto-TCC**, branch **main**.
2. Configure Root Directory **TCC_GABRIEL/backend**, runtime **Docker**, Dockerfile **./Dockerfile**, Docker Context **.** e plano **Free**.
3. Use Health Check Path **/api/health**.
4. Para a banca, mantenha DEMO_ENABLED=true e CHECKIN_COOLDOWN_SECONDS=10. Para usar Blueprint, informe o caminho **TCC_GABRIEL/render.yaml** na configuração; ele define o serviço gratuito equivalente.
5. Após publicar, copie a origem HTTPS e confira a resposta {"status":"UP"} em /api/health.

A API respeita PORT. H2 é suficiente para demonstrar, mas perde os dados ao reiniciar. O serviço gratuito pode suspender por inatividade; abra a API antes da banca e confira os limites atuais na [documentação do Render](https://render.com/docs/free).

## 3. App único na Vercel

1. Importe o repositório em um projeto da Vercel.
2. Root Directory: **TCC_GABRIEL/mobile**. Framework: **Other**. Use o plano pessoal **Hobby** para esta demonstração acadêmica.
3. Installation Command: **npm ci**.
4. Build Command: **node scripts/check-deploy-env.mjs && npx expo export --platform web** (já definido no vercel.json).
5. Output Directory: **dist**.
6. Configure **EXPO_PUBLIC_API_URL** no ambiente **Production** com a origem HTTPS real da API, sem /api. A API deve estar publicada e saudável antes deste passo. Configure também **Preview** se for usar publicações de teste.
7. Publique e teste a página inicial, /ajuda e /configuracoes. Contas de estudante e motorista entram no mesmo endereço.

O mobile/vercel.json configura a instalação, o build, a saída e cleanUrls. O build de publicação recusa uma URL de API ausente, HTTP ou localhost para evitar publicar uma tela que depende do computador local. O aplicativo usa web.output=static; cada rota tem seu HTML. Não é necessário criar um segundo site por perfil. Consulte [publicação web do Expo](https://docs.expo.dev/guides/publishing-websites/).

O package.json fixa a série Node.js **22.x** na Vercel; localmente use 22.13 ou posterior dessa série. A URL da API é incorporada ao build; faça uma nova publicação se ela mudar.

### Conferência após publicar

- A API precisa responder **200** e **{"status":"UP"}** em **/api/health**.
- O endereço público do app deve abrir e permitir atualizar diretamente **/ajuda** e **/configuracoes**.
- Valide o login de estudante e motorista, registro de ida/volta e atualização da chamada em duas abas.
- Confirme que as requisições do aplicativo vão para a API HTTPS publicada.
- Se a API estiver suspensa por inatividade, espere a inicialização em /api/health e tente novamente no app.

Configurar os arquivos ou concluir o build local não significa que o deploy foi realizado. A publicação depende do acesso autorizado às contas Render e Vercel; só considere concluída após conferir os endereços públicos.

## 4. Celular

Para Expo Go compatível com o SDK 57, execute npx expo start dentro de mobile e use uma API acessível ao telefone. Para instalação nativa, os perfis estão em mobile/eas.json; configure EXPO_PUBLIC_API_URL no ambiente do build.

NFC necessita do aplicativo compilado, permissões e hardware compatíveis. No navegador e no Expo Go, use QR Code ou simulação de demonstração. GPS, câmera, voz e vibração precisam de conferência em aparelho real.

## 5. Roteiro da banca

| Perfil | Login | Senha |
| --- | --- | --- |
| Gabriel | 22009264 | demo-hash-22009264 |
| Ana | 22009265 | demo-hash-22009265 |
| Motorista | motorista | motorista123 |

Código de credenciamento de demonstração: **FROTA-UNIPAM**. Veículo: **ABC-1234**.

1. Abra duas abas do mesmo aplicativo. Entre como motorista em uma e estudante em outra.
2. No estudante, simule a primeira leitura. No motorista, confira a ida e um passageiro aguardado.
3. Espere 10 segundos e simule novamente. Confira a volta e a carteirinha com histórico.
4. Use Ana para demonstrar a dispensa de retorno. O motorista pode dispensar um aluno que já registrou ida.
5. No motorista, marque uma parada e publique um aviso rápido. Na aba Minha linha do estudante, confira o marcador e o banner.
6. Ative o GPS em aparelho compatível e permita a localização. No aluno, autorize sua localização para calcular distância e estimativa; abra o Google Maps se houver sinal recente.
7. Exporte a chamada: download CSV no navegador, menu de compartilhamento no celular. No Excel, importe a coluna Matrícula como texto se precisar preservar zeros iniciais.
8. Em Passageiros, cadastre um aluno fictício; entre com essa nova conta em outra aba.
9. Na página inicial, use Criar conta para cadastrar outro motorista e uma nova rota. Cadastre um aluno nessa linha e confira que chamada e GPS não expõem outro veículo.
10. Em Rota, altere a ordem das paradas; em Ajustes, demonstre escuro, alto contraste, fonte ampliada e toque facilitado. Recarregue para verificar a persistência das preferências.
11. Use Reiniciar Ciclo do Dia (Demo) para repetir a apresentação. O histórico de outros dias fica preservado.

O QR do veículo contém sua placa, como ABC-1234. Os QR antigos com RA continuam válidos apenas para o aluno autenticado correspondente. A senha nunca deve ser impressa no código.

## 6. Variáveis do backend

| Variável | Padrão da demonstração | Uso |
| --- | --- | --- |
| DEMO_ENABLED | true | Seed dos alunos, simulação no app, dicas e reset diário |
| DRIVER_PASSWORD | motorista123 | Senha da conta inicial, apenas quando ela ainda não existe |
| FLEET_REGISTRATION_CODE | FROTA-UNIPAM | Código para novos motoristas |
| CHECKIN_COOLDOWN_SECONDS | 10 | Proteção contra leitura duplicada; mínimo 3 |
| PORT | 8080 | Porta HTTP |
| SPRING_DATASOURCE_URL | H2 em memória | Conexão JDBC |
| SPRING_DATASOURCE_USERNAME | sa | Usuário do banco |
| SPRING_DATASOURCE_PASSWORD | vazio | Senha do banco |

Fora da demonstração, configure DEMO_ENABLED=false, DRIVER_PASSWORD própria e FLEET_REGISTRATION_CODE privado antes de criar o banco. A aplicação recusa os códigos padrão de motorista/frota nesse modo. Nunca coloque essas duas credenciais em variáveis EXPO_PUBLIC_*.

DRIVER_PASSWORD não altera contas já existentes. Desativar o modo demo não remove exemplos já gravados em um banco persistente: use um banco limpo ao iniciar a operação real.

## 7. PostgreSQL e limites operacionais

~~~text
SPRING_DATASOURCE_URL=jdbc:postgresql://HOST:5432/BANCO?sslmode=require
SPRING_DATASOURCE_USERNAME=USUARIO
SPRING_DATASOURCE_PASSWORD=SENHA
~~~

Use JDBC, não a URL postgres:// diretamente. O Hibernate atualiza o esquema existente; faça backup de um banco com dados importantes antes do primeiro upgrade.

Sessões e GPS ainda ficam na memória da API, mesmo com PostgreSQL: use uma única instância. Sessões duram até 12 horas e são perdidas no reinício. A posição vence em 30 segundos. O app consulta dados a cada 5 segundos, sem execução garantida em segundo plano. Ao fechar uma página sem desligar GPS, a expiração evita mostrar indefinidamente o último sinal.

Avisos duram até 12 horas e pertencem à rota; paradas manuais expiram na virada do dia de Brasília. A distância usa linha reta e o tempo é apenas uma referência de deslocamento, sem previsão de trânsito ou sentido do ônibus.

H2 e a versão web foram validados localmente e na nuvem. O Dockerfile foi compilado e executado no Render; a exportação estática foi construída na Vercel. PostgreSQL e hardware móvel ainda não foram homologados.

O endpoint /api/health só responde UP após a inicialização completa, incluindo as contas iniciais; durante a preparação ou encerramento, responde 503/NOT_READY. Esse comportamento usa o [estado de prontidão do Spring Boot](https://docs.spring.io/spring-boot/reference/features/spring-application.html#features.spring-application.application-availability.readiness).
