# Aplicativo — publicação e teste

O app usa Expo SDK 57 e atende estudante e motorista. O guia completo está em [DEPLOY_NUVEM.md](../DEPLOY_NUVEM.md).

## Endereço da API

Copie .env.example para .env e use apenas a origem:

```text
EXPO_PUBLIC_API_URL=https://SUA_API.onrender.com
```

Em desenvolvimento no navegador, pode usar http://localhost:8080. No celular físico, use o IP do computador ou o endereço HTTPS da nuvem. Não acrescente /api/checkin. Sufixos antigos são removidos automaticamente por services/api.ts.

## Web

```text
npm ci
npx expo export --platform web
```

Publique a pasta dist. O vercel.json já configura o build e as URLs estáticas. A autenticação ocorre no cliente e a API protege cada operação por perfil.

## Aplicativo instalado

Configure EXPO_PUBLIC_API_URL no ambiente usado pelo EAS. Use o perfil preview de eas.json para uma distribuição interna e production para a loja. Não há novas bibliotecas de mapas; o rastreio mantém o radar e o link para Google Maps.

A localização usa o módulo oficial expo-location, na versão compatível com o Expo instalado. A transmissão funciona enquanto o painel estiver em primeiro plano. Negação de permissão é apresentada na tela.

## NFC

A implementação está em services/nfc.ts. No Expo Go e navegador, o botão explica a indisponibilidade. Em um build nativo com aparelho compatível, lê o primeiro registro de texto NDEF. Grave ABC-1234 na tag do veículo ou a matrícula/token na carteirinha do respectivo estudante. O backend sempre vincula o embarque ao aluno autenticado.

Não é necessário descomentar código para habilitar NFC. O plugin já está no app.json. GPS, câmera e NFC precisam de teste final em aparelho físico; a exportação web não confirma o funcionamento do hardware.

