# App único — publicação e homologação

A mesma base Expo SDK 57 atende estudante e motorista. As configurações completas estão em [DEPLOY_NUVEM.md](../DEPLOY_NUVEM.md).

## Endereço da API

~~~text
EXPO_PUBLIC_API_URL=https://SUA_API.onrender.com
~~~

Informe somente a origem, sem /api. No navegador local, use http://localhost:8080; no celular, use o IP acessível do computador ou uma API HTTPS. A URL é incorporada ao build.

## Web

~~~text
npm ci
npx expo export --platform web
npx expo serve --port 8081
~~~

Publique mobile/dist. O vercel.json usa páginas estáticas com cleanUrls. A API valida a sessão, o perfil e o veículo em cada operação restrita.

## Aplicativo instalado e Expo Go

Use os perfis de eas.json e configure a URL da API no ambiente do build. Expo Go precisa ser compatível com o SDK instalado. Não há bibliotecas de mapas nativos. O rastreio usa expo-location, cálculo local e link para Google Maps.

A transmissão usa Accuracy.BestForNavigation em primeiro plano. Leituras com precisão pior que 100 m, antigas ou saltos impossíveis são descartadas. Oscilações pequenas são filtradas. O servidor expira a posição após 30 segundos.

O aluno pode autorizar o cálculo de distância. Sua coordenada não é enviada à API. A estimativa em linha reta não considera ruas, trânsito nem direção do veículo.

## Acessibilidade

Temas, escala de fonte, toque facilitado, voz e vibração ficam no AsyncStorage. A voz usa Web Speech no navegador e expo-speech no aplicativo. A vibração usa expo-haptics somente em dispositivos nativos. A linha do tempo respeita a preferência do sistema por redução de movimento.

## NFC e permissões

Em aplicativo compilado, services/nfc.ts lê uma tag NDEF de texto contendo a placa ou identificação do aluno autenticado. No navegador e no Expo Go, informa a indisponibilidade. QR e a simulação demo continuam utilizáveis.

Homologue em aparelho real: QR/câmera, permissões negadas e concedidas, GPS parado e em deslocamento, perda de sinal, voz, vibração, menu de compartilhamento e NFC. Compilar ou exportar o app não comprova funcionamento do hardware.
