# Aplicativos nativos e NFC — versão 1.1.0

O aplicativo lê uma tag NTAG com um registro NDEF de texto UTF-8 e envia a identificação à API publicada. O servidor exige login e valida se a identificação corresponde à matrícula do aluno conectado ou à placa do veículo de sua linha. O número de série físico (UID) da tag não é usado como matrícula.

## Arquivos gerados

- [Android: baixar APK 1.1.0](https://expo.dev/artifacts/eas/K3dQ_8ycOW9TjUmagD-4_CJEbdLV2GxY-tAVlirIsPI.apk), aproximadamente 129 MB.
- [iOS: baixar aplicativo para simulador](https://expo.dev/artifacts/eas/ZUbRsvVJR8ucoK3J2J8U2MtBRb3p-FVlB3hkKdqKnvQ.tar.gz), aproximadamente 30 MB. Não instala em iPhone físico.

Os arquivos também estão salvos em `dist-native/`. A Expo informa retenção até 30/10/2026; preserve as cópias locais. Os identificadores dos builds, hashes SHA-256 e verificações dos pacotes estão em [validacao/builds-nfc.json](validacao/builds-nfc.json). O código correspondente foi enviado no commit `c142bcc`.

## Preparar sua tag

1. No iPhone, instale [NFC Tools, da wakdev](https://apps.apple.com/app/nfc-tools/id1252962749).
2. Use **Ler / Read** para conferir o modelo, a capacidade e se a tag permite gravação.
3. Em uma tag sua reservada ao projeto, escolha **Escrever / Write → Adicionar registro → Texto**. A gravação substitui os registros existentes: confira o conteúdo antes.
4. Grave um único registro de texto UTF-8 com `22009264` para o aluno Gabriel da demonstração. Para uma tag compartilhada no ônibus da demonstração, grave `ABC-1234`. Não grave senha, URL, JSON, prefixo ou o UID.
5. Encoste a tag na parte superior do iPhone e mantenha-a parada até confirmar a gravação. Leia novamente no NFC Tools e confira o texto exato.

As NTAG213/215/216 oferecem respectivamente 144/504/888 bytes de memória de usuário; qualquer uma comporta esse registro curto ([NXP](https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf)). O modelo informado pelo usuário ainda não foi identificado fisicamente.

## Android

O perfil `preview` gera APK assinado para instalação direta. A API já está configurada como `https://rota-universitaria-api-1.onrender.com`.

Abra o APK em um Android com NFC, autorize a instalação por esse navegador/gerenciador quando solicitado e instale. Ative NFC nas configurações do sistema. Entre com sua conta, abra **Embarque → Ler tag NFC**, aproxime a tag da antena traseira e aguarde a confirmação do servidor.

## iPhone

O usuário possui um iPhone 17 e não possui Apple Developer ativo. O perfil `ios-simulator` permite verificar a compilação nativa na nuvem sem certificados Apple. Seu arquivo `.app` é destinado ao Simulador do Xcode em um Mac; não instala no iPhone e não testa a antena NFC.

Para distribuir uma versão nativa ao iPhone, é necessária uma equipe Apple Developer com a capacidade **NFC Tag Reading**, assinatura e perfil de provisionamento compatíveis. Para distribuição interna, registre o aparelho na equipe e gere o perfil `preview` para iOS. Outra opção, após configurar a equipe, é TestFlight com o perfil `production` e envio à Apple. Consulte [capacidades Apple](https://developer.apple.com/help/account/reference/supported-capabilities-ios) e [distribuição interna Expo](https://docs.expo.dev/build/internal-distribution/).

O site e o Expo Go não oferecem esta integração NFC nativa. Não há publicação deste projeto na App Store ou Google Play nesta entrega.

## Teste físico de aceitação — ainda pendente

- Logado como Gabriel, ler a tag `22009264`: deve confirmar ida uma única vez e atualizar o painel do motorista.
- Repetir imediatamente: deve bloquear a duplicação. Aguardar a contagem de proteção e ler novamente: deve confirmar volta. Uma terceira leitura não deve criar outro embarque.
- Ler uma tag com a matrícula de outro aluno: deve rejeitar sem registrar presença.
- Cancelar, trocar de aba ou colocar o app em segundo plano durante a espera: não deve registrar embarque nem abrir uma sessão tardia. Voltar e tentar de novo deve funcionar.
- Tag vazia, link ou dois registros de texto: deve informar como corrigir. Tag retirada cedo: deve permitir nova tentativa.
- Android com NFC desligado: deve orientar a ativação. Sem aproximar tag: deve encerrar a espera em até 45 segundos.
- iPhone: aproximar a parte superior do aparelho durante a janela nativa de leitura. O login e a confirmação de embarque precisam de internet.

Uma tag NDEF comum pode ser copiada. A matrícula na tag identifica o registro; a autorização é feita pela sessão autenticada no servidor. Este fluxo não comprova por si só a presença física nem fornece proteção criptográfica contra cópia da tag.

## Verificação automatizada

- 14 testes do aplicativo aprovados, incluindo oito casos de NFC: conteúdo NDEF, fluxo de leitura, erros, cancelamento, concorrência e tempo limite. O adaptador de rádio é simulado nesses testes.
- 23 testes da API aprovados, incluindo ida/volta com método NFC, rejeição de matrícula alheia e bloqueio de repetição.
- TypeScript e lint aprovados. Exportação web aprovada, com 12 rotas.
- Navegador: login na API pública aprovado após a inicialização do servidor. O botão NFC exibiu a orientação para instalar o aplicativo nativo e manteve a ida sem registro; evidência em `validacao/nfc-web-requer-app.png`. Houve aviso de hidratação React na carga inicial da exportação web, sem impedir esse fluxo; não é teste de execução nativa.
- iOS simulador: compilação nativa concluída na Expo; versão 1.1.0, bundle `com.tcc.transporte`, permissão NFC em português e endereço público da API confirmados dentro do arquivo gerado. [Build e logs](https://expo.dev/accounts/binel/projects/mobile/builds/239c2105-235e-4ccd-9490-40d6eef62546) · [Download para simulador](https://expo.dev/artifacts/eas/ZUbRsvVJR8ucoK3J2J8U2MtBRb3p-FVlB3hkKdqKnvQ.tar.gz).
- Android: APK assinado concluído na Expo; integridade do arquivo, permissão NFC, pacote `com.tcc.transporte`, módulo nativo NFC e endereço da API pública confirmados no APK baixado. [Build e logs](https://expo.dev/accounts/binel/projects/mobile/builds/356e6ca6-098a-442a-9283-ba696fb679a6).
- Os pacotes não foram executados em emulador ou simulador neste Windows. A compilação iOS foi executada na infraestrutura macOS da Expo.
- Nenhuma leitura física de NFC foi executada neste computador. Não confundir compilação bem-sucedida com validação da antena no aparelho.

## Reproduzir a compilação

Na pasta `mobile`, após `npm ci` e login na conta Expo:

```sh
npm test
npx tsc --noEmit
npm run lint
eas build --platform android --profile preview
eas build --platform ios --profile ios-simulator
# Exige conta Apple e provisionamento para o aparelho:
eas build --platform ios --profile preview
```

Os perfis usam a API pública. O arquivo `.easignore` exclui arquivos `.env`, dependências locais e credenciais do pacote enviado. A biblioteca NFC está fixada na versão 4.0.0, compatível com a nova arquitetura exigida pelo React Native atual do projeto.

A API usa o plano gratuito Render e pode demorar mais de dois minutos para iniciar após inatividade. Se aparecer uma mensagem de conexão durante esse período, aguarde e tente entrar novamente. O banco atual é H2 em memória: reiniciar a API remove os registros da demonstração.
