# Rota Universitária — Lagoa Formosa ↔ UNIPAM

Controle de ida e volta do transporte universitário, com login por perfil, QR Code/NFC e rastreio GPS.

- **backend**: Spring Boot / Java 17, H2 automático ou PostgreSQL.
- **mobile**: Expo SDK 57, estudante e motorista, Android/iOS/web.
- **painel-web**: React / Vite, painel do motorista.

Consulte [DEPLOY_NUVEM.md](DEPLOY_NUVEM.md) para executar, publicar e demonstrar o sistema, incluindo as contas de teste.

O primeiro embarque do dia registra a ida. A segunda leitura, após 10 segundos de segurança, registra a volta. O aluno ou motorista pode dispensar o retorno. O painel mostra os estudantes que ainda faltam, e o reset de demonstração limpa apenas o dia atual.

Validação:

```text
cd backend && ./mvnw clean verify
cd painel-web && npm run build && npm run lint
cd mobile && npx expo export --platform web && npx tsc --noEmit && npm run lint
```

No Windows use mvnw.cmd. A primeira inicialização do Expo atualiza os tipos das rotas. O backup antes-do-plano.zip guarda os fontes anteriores à execução do plano.

