# Publicação rápida — Rota Universitária

O backend usa H2 em memória por padrão e cria a rota, van ABC-1234, estudantes e motorista automaticamente. Não execute o seed.sql. São três serviços: uma API e dois sites. A configuração costuma levar cerca de 10 minutos; o primeiro build pode levar mais.

## 1. Preparar o repositório

Coloque esta pasta em um repositório GitHub acessível ao Render e à Vercel. Não inclua .env, node_modules, target, dist nem o backup antes-do-plano.zip. Este diretório local ainda não era um repositório Git durante a implementação.

## 2. Backend no Render

1. No [Render](https://dashboard.render.com/), escolha **New → Web Service** e conecte o repositório.
2. Use **Root Directory: backend**, **Language: Docker**, **Dockerfile Path: ./Dockerfile** e plano **Free**.
3. Configure **Health Check Path: /api/health**. Pode manter as variáveis padrão para a banca.
4. Publique e copie a URL HTTPS, por exemplo https://rota-universitaria-api.onrender.com.
5. Abra a URL seguida de /api/health e aguarde a resposta {"status":"UP"}.

Alternativa: **New → Blueprint** lê o render.yaml da raiz, já com a configuração acima.
A API respeita PORT automaticamente. Nenhum PostgreSQL é necessário para a demonstração.

## 3. Painel do motorista na Vercel

1. Em [Vercel](https://vercel.com/new), importe o mesmo repositório.
2. Selecione **Root Directory: painel-web**, framework **Vite**.
3. Cadastre **VITE_API_URL** com a URL HTTPS da API, sem /api e sem /api/checkin.
4. Use **npm run build** e saída **dist**. O vercel.json já configura as rotas.
5. Publique.

## 4. App para celular e navegador na Vercel

1. Importe novamente o repositório como outro projeto.
2. Selecione **Root Directory: mobile**, framework **Other**.
3. Cadastre **EXPO_PUBLIC_API_URL** com a mesma URL HTTPS da API.
4. Use **npx expo export --platform web**, saída **dist** e instalação **npm ci**.
5. Publique. As rotas são exportadas como páginas estáticas; o vercel.json habilita cleanUrls.

Use Node.js 22 ou posterior compatível com as dependências fixadas. Após alterar uma variável de frontend, faça novo deploy: ela é incorporada no build.

## 5. Teste para a banca

| Perfil | Usuário | Senha |
| --- | --- | --- |
| Estudante — Gabriel | 22009264 | demo-hash-22009264 |
| Estudante — Ana | 22009265 | demo-hash-22009265 |
| Motorista | motorista | motorista123 |

1. Entre no painel como motorista e abra o app em outra aba ou celular.
2. Entre como estudante. Toque **Simular leitura do QR Code (Demo)**: a ida aparece no painel.
3. Aguarde os 10 segundos de proteção. Faça nova leitura para registrar a volta.
4. Use Ana para demonstrar **Não voltarei no veículo hoje** ou **Dispensar Volta** no painel.
5. Confira a contagem de faltantes. **Todos prontos** aparece apenas após alguma ida e nenhuma pendência.
6. Ligue o GPS no painel web ou no painel mobile e permita a localização. No app do estudante, abra **Rastreio** e **Google Maps**.
7. Use **Reiniciar Ciclo do Dia (Demo)** e confirme para repetir. Só o dia atual e o veículo selecionado são limpos.

QR do veículo: conteúdo **ABC-1234**. Os QR antigos 22009264 e 22009265 continuam válidos para o respectivo aluno autenticado. NFC lê tags NDEF de texto em um aplicativo nativo compilado e aparelho compatível; não funciona no navegador ou Expo Go.

## Limites da demonstração

- O [Render Free](https://render.com/docs/free) suspende serviços após 15 minutos sem tráfego. A retomada pode levar cerca de um minuto. Abra /api/health antes da apresentação.
- O H2 em memória perde viagens ao reiniciar ou suspender a API; os cadastros de demonstração são recriados. Não use para guardar registros reais.
- Sessões e GPS são mantidos em memória: um reinício exige novo login. Rode uma única instância da API.
- Recarregar o site/app também exige login. As credenciais de sessão ficam só na memória do cliente.
- GPS e câmera no navegador precisam de HTTPS (localhost é permitido). A transmissão funciona em primeiro plano; mantenha a página/app aberta e a tela ligada. O sinal expira no servidor após 30 segundos sem atualização.
- O plano Free tem limites de uso; não há garantia de disponibilidade ou gratuidade ilimitada. O PostgreSQL gratuito do Render expira após 30 dias. Confira as condições vigentes antes da apresentação.
- A transmissão simultânea por dois aparelhos usa o último sinal recebido. Prefira ligar em apenas um dispositivo.

## PostgreSQL opcional

Configure no Render:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://HOST:5432/BANCO?sslmode=require
SPRING_DATASOURCE_USERNAME=USUARIO
SPRING_DATASOURCE_PASSWORD=SENHA
```

Use o formato JDBC, não a URL postgres:// diretamente. O Hibernate detecta o banco e mantém os registros. Para uso fora da banca, configure DEMO_ENABLED=false e DRIVER_PASSWORD com senha própria antes da primeira inicialização do banco. Isso desativa o reset e a criação de estudantes de exemplo. DRIVER_PASSWORD só cria a conta inicial; não troca a senha de uma conta já existente. As telas ainda exibem dicas fixas de demonstração.

CHECKIN_COOLDOWN_SECONDS controla o intervalo, com mínimo de 3 segundos. O padrão é 10. O dia de viagem segue America/Sao_Paulo, independentemente do fuso do servidor.

## Rodar localmente

Backend (Java 17):

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Em dois terminais adicionais:

```powershell
cd painel-web
npm ci
npm run dev
```

```powershell
cd mobile
npm ci
npx expo start --web
```

Copie .env.example para .env em cada frontend. No navegador do computador use http://localhost:8080; no celular físico use o IP local do computador ou a API HTTPS. A normalização remove barras finais e sufixos acidentais /api ou /api/checkin.

Referências: [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Exportação web do Expo](https://docs.expo.dev/guides/publishing-websites/).

