# Preparação para produção (App do Aluno)

## 1. Variáveis de ambiente

Copie `.env.example` para `.env` e aponte para o backend:

```
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:8080/api/checkin
```

A URL **deve terminar em `/api/checkin`**; o app deriva a raiz do servidor a partir dela para acessar `/api/rastreio`
(ver `services/api.ts`). Para o build de produção, defina a URL da nuvem no perfil do `eas.json`:

```json
"production": {
  "autoIncrement": true,
  "env": { "EXPO_PUBLIC_API_URL": "https://SEU_DOMINIO/api/checkin" }
}
```

O painel web usa `VITE_API_URL` (ver `painel-web/.env.example`), sem o `/api` no final.

## 2. Reativar o NFC

O Expo Go não carrega módulos nativos, por isso o NFC está desligado em `app/(tabs)/scanner.tsx`.
Faça isso **somente** quando for gerar o APK/AAB (development build ou produção):

1. Descomente o import no topo do arquivo:
   ```ts
   import NfcManager, { NfcTech } from 'react-native-nfc-manager';
   ```
2. Substitua o corpo de `iniciarLeituraNFC` por:
   ```ts
   const iniciarLeituraNFC = async () => {
     try {
       await NfcManager.start();
       await NfcManager.requestTechnology(NfcTech.Ndef);
       const tag = await NfcManager.getTag();
       if (tag?.id) await processarCheckIn(tag.id, 'NFC');
     } catch {
       mostrarToast('erro', 'Leitura cancelada', 'Aproxime a carteirinha novamente.');
     } finally {
       NfcManager.cancelTechnologyRequest();
     }
   };
   ```
3. O plugin `react-native-nfc-manager` e a permissão `android.permission.NFC` já estão no `app.json`.

## 3. Gerar o build

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview      # APK para instalar direto no celular
eas build -p android --profile production   # AAB para a Play Store
```

Para testar com NFC durante o desenvolvimento, use `eas build --profile development` e rode `npx expo start --dev-client`.
