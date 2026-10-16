# Rota Universitária — Lagoa Formosa ↔ UNIPAM

Aplicativo único para estudante e motorista, com cadastro, controle de ida e volta, rotas, avisos e acompanhamento do transporte.

## Estrutura

- **backend**: Java 17 / Spring Boot, autenticação por sessão, JPA e banco H2 automático ou PostgreSQL.
- **mobile**: Expo SDK 57 / React Native, com a mesma experiência em Android, iOS e navegador.
- **validacao**: registros visuais da conferência do aplicativo.

O navegador e o celular usam os mesmos perfis, telas e API. A página inicial encaminha cada conta para sua área.

## Executar no Windows

Pré-requisitos: Java 17 e Node.js 22.13 ou posterior compatível com o projeto.

Terminal 1:

~~~powershell
cd backend
.\mvnw.cmd spring-boot:run
~~~

Terminal 2:

~~~powershell
cd mobile
npm ci
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npx expo start --web --port 8081
~~~

Copie o arquivo de exemplo apenas na primeira configuração; preserve uma configuração local existente. Abra **http://localhost:8081**. A API responde em **http://localhost:8080/api/health**. Não execute seed.sql: o inicializador cria a linha, o veículo e os acessos de demonstração.

Para celular físico, configure EXPO_PUBLIC_API_URL com o IP do computador ou uma API HTTPS acessível ao aparelho. localhost aponta para o próprio celular. Veja [COMO_RODAR.txt](COMO_RODAR.txt) e [DEPLOY_NUVEM.md](DEPLOY_NUVEM.md).

## Contas de demonstração

| Perfil | Login | Senha |
| --- | --- | --- |
| Estudante — Gabriel | 22009264 | demo-hash-22009264 |
| Estudante — Ana | 22009265 | demo-hash-22009265 |
| Motorista | motorista | motorista123 |

Código padrão para cadastrar motorista: **FROTA-UNIPAM**. Veículo inicial: **ABC-1234**. As dicas e a simulação de leitura só aparecem com DEMO_ENABLED=true.

## Funcionalidades

- **Criar conta:** aluno informa nome, RA, curso/período, veículo e senha; motorista informa nome, login, placa, rota existente ou nova e código da frota. Ambos entram automaticamente após o cadastro.
- **Passageiros:** o motorista lista os alunos da sua rota com suas placas e cadastra novos alunos no próprio veículo. O motorista precisa estar conectado; o aluno pode acessar a conta depois.
- **Ciclo diário:** primeira leitura registra ida; segunda registra volta após 10 segundos de proteção. Há dispensa pelo aluno ou motorista e reinício do dia somente em demonstração. O dia segue America/Sao_Paulo.
- **Rotas:** múltiplas linhas e veículos, paradas ordenadas, edição e marcador manual com um toque. Alterar a lista reinicia os marcadores dos veículos da rota. O marcador também vence na virada do dia.
- **Rastreio:** GPS em primeiro plano com alta precisão, velocidade em km/h, filtro de oscilação, indicação de sinal recente e link para Google Maps. A posição do aluno, quando autorizada, fica no aparelho.
- **Distância e tempo:** Haversine calcula a distância em linha reta; o tempo usa velocidade atual a partir de 5 km/h ou referência de 30 km/h. Não considera ruas, direção, paradas ou trânsito e não promete horário de chegada.
- **Avisos:** mensagens rápidas ou livres por rota, com motorista e horário, atualizadas a cada 5 segundos e válidas por até 12 horas.
- **Carteirinha:** nome, RA, curso, linha, placa, identificação visual e últimos 30 dias com viagens registradas. Não substitui documento oficial.
- **Relatório:** CSV com BOM UTF-8 e separador ponto e vírgula no navegador; resumo via menu de compartilhamento no celular. Campos do CSV são protegidos contra interpretação como fórmulas.
- **Acessibilidade:** claro, escuro, alto contraste, fontes 100/120/140%, toque facilitado, vibração opcional e voz. Preferências persistem no aparelho. A animação respeita a redução de movimento do sistema.
- **Ajuda:** guia em três passos, FAQ e contato da coordenação configurado pelo motorista. Sem telefone cadastrado, prepara uma mensagem para o usuário copiar ou compartilhar.

A chamada e o GPS são restritos ao veículo vinculado. A configuração da rota, a lista de alunos e os avisos são compartilhados entre motoristas que usam a mesma rota. Um motorista não pode registrar embarque pelo aluno ou dispensar a volta de passageiro de outro veículo.

## Validação

~~~powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd clean package -DskipTests
~~~

~~~powershell
cd mobile
npm test
npx tsc --noEmit
npm run lint
npx expo export --platform web
~~~

A exportação cria páginas estáticas em mobile/dist. O vercel.json inclui a configuração de publicação. Os testes do backend cobrem o ciclo, concorrência de leituras, permissões, cadastros, múltiplas linhas, paradas, avisos e GPS. Os testes do app cobrem os cálculos, filtro e relatório. Veja [RELATORIO_EXECUCAO.md](RELATORIO_EXECUCAO.md).

## Limites e persistência

H2, sessões e GPS são mantidos em memória por padrão. Reiniciar a API apaga os cadastros e viagens do H2 e recria os exemplos. Para registros persistentes, configure PostgreSQL. Recarregar o app exige novo login; as preferências visuais permanecem.

GPS e câmera precisam de permissão e contexto seguro no navegador, como HTTPS ou localhost. GPS funciona enquanto o app está em primeiro plano; o servidor descarta sinais após 30 segundos. NFC exige aplicativo nativo compilado e aparelho compatível; não funciona no Expo Go ou navegador. No Expo Go compatível com o SDK instalado, use QR Code ou simulação.

A publicação em nuvem e os testes de câmera, GPS, voz, vibração, compartilhamento e NFC em aparelhos físicos são etapas de homologação. O backup **antes-upgrade-unificado.zip** preserva os fontes anteriores a este upgrade.
