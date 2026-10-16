# Publicação — API no Render e aplicativo único na Vercel/Expo

A arquitetura possui dois serviços: a API Java e o aplicativo Expo, que atende estudante e motorista. A versão de navegador é exportada pelo mesmo projeto usado no celular.

## 1. Repositório

Disponibilize os fontes em um repositório acessível ao provedor escolhido. Este diretório local não contém um repositório Git inicializado. Exclua .env, node_modules, target, dist e arquivos de backup; o .gitignore já cobre esses arquivos.

## 2. Backend no Render

1. Crie um Web Service a partir do repositório.
2. Configure Root Directory **backend**, runtime **Docker** e Dockerfile **./Dockerfile**.
3. Use Health Check Path **/api/health**.
4. Para a banca, mantenha DEMO_ENABLED=true. O render.yaml da raiz oferece a configuração equivalente via Blueprint.
5. Após publicar, copie a origem HTTPS e confira a resposta {"status":"UP"} em /api/health.

A API respeita PORT. H2 é suficiente para demonstrar, mas perde os dados ao reiniciar. O serviço gratuito pode suspender por inatividade; abra a API antes da banca e confira os limites atuais na [documentação do Render](https://render.com/docs/free).

## 3. App único na Vercel

1. Importe o repositório em um projeto da Vercel.
2. Root Directory: **mobile**. Framework: **Other**.
3. Installation Command: **npm ci**.
4. Build Command: **npx expo export --platform web**.
5. Output Directory: **dist**.
6. Configure **EXPO_PUBLIC_API_URL** com a origem HTTPS da API, sem /api.
7. Publique e teste a página inicial, /ajuda e /configuracoes. Contas de estudante e motorista entram no mesmo endereço.

O mobile/vercel.json configura o build, a saída e cleanUrls. O aplicativo usa web.output=static; cada rota tem seu HTML. Não é necessário criar um segundo site por perfil. Consulte [publicação web do Expo](https://docs.expo.dev/guides/publishing-websites/).

Use Node.js 22.13 ou posterior compatível com as dependências fixadas. A URL da API é incorporada ao build; faça uma nova publicação se ela mudar. Não use localhost na publicação.

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

A integração local foi validada com H2. PostgreSQL, Docker, publicação nos provedores e hardware móvel não foram homologados nesta execução.
