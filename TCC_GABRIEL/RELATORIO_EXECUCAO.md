# Relatório do upgrade unificado — 15/10/2026

## Entrega

A experiência do estudante e do motorista foi consolidada no projeto mobile, mantendo uma API Java. Os fontes anteriores estão preservados em antes-upgrade-unificado.zip. O aplicativo separado foi retirado.

Implementados: autocadastro dos dois perfis, código de credenciamento, cadastro manual, vínculos entre alunos/veículos/motoristas/rotas, paradas ordenadas e marcador diário, GPS com velocidade e filtro, distância/estimativa local, avisos por rota, carteirinha, histórico individual, CSV/compartilhamento, temas, acessibilidade persistente e Central de Ajuda.

A chamada, o GPS, a dispensa e o reinício são limitados ao veículo vinculado. Alunos de uma mesma rota podem ser consultados pelos motoristas da rota, com identificação da placa. O cadastro manual cria aluno no veículo do motorista.

## Verificação automatizada

- Backend: 20 testes de integração aprovados, abrangendo ciclo diário, leituras concorrentes, virada do dia, autenticação, cadastros, isolamento entre linhas/veículos, paradas, avisos e GPS.
- App: 6 testes aprovados para Haversine, velocidade/filtro, estimativa, CSV e resumo de compartilhamento.
- TypeScript e lint aprovados.
- Exportação web estática concluída.
- Pacote Java gerado com compilação limpa.

## Conferência no navegador

Verificados com dados fictícios: login por perfil, cadastro manual, autocadastro de motorista com criação de segunda rota, autocadastro de aluno nessa rota e autenticação automática dos dois perfis. Também foram conferidos edição de parada, ida e volta, atualização automática da chamada, aviso recebido pelo estudante, marcador, carteirinha e histórico. O CSV baixado foi conferido com os campos e horários da viagem.

Em largura de celular de 390 px, foram conferidos modo escuro, alto contraste, texto em 140% e botões de 56 px. Tema e fonte persistiram ao recarregar. O FAQ expandiu as respostas e o suporte sem telefone configurado preparou a mensagem sem enviá-la.

A página inicial e a carteirinha também foram conferidas em 1280 px. A dispensa de volta do aluno da segunda linha atualizou a contagem do motorista. Registros visuais: [app no computador](validacao/app-unificado-desktop.png), [carteirinha](validacao/carteirinha-desktop.png), [motorista no celular](validacao/motorista-celular.png) e [acessibilidade](validacao/acessibilidade-celular.png). As imagens da versão anterior foram preservadas em validacao-anterior.zip.

## Limites

A conferência local utiliza H2 e a versão web. Não foi realizada publicação em nuvem, validação de PostgreSQL/Docker ou homologação física de GPS, câmera, NFC, voz, vibração e compartilhamento nativo.

Sessões e sinais GPS ficam em memória. H2 é temporário. A estimativa é em linha reta, sem trânsito ou roteiro viário. Há uma única mensagem ativa por rota, válida por até 12 horas. Não existe recebimento garantido de avisos com o app fechado.

A implementação manteve o SDK instalado e acrescentou apenas expo-speech e AsyncStorage para os recursos pedidos. Alertas de dependências devem ser tratados com atualizações compatíveis e nova homologação, sem forçar versões principais.

## Reprodução e publicação

Use [COMO_RODAR.txt](COMO_RODAR.txt) para iniciar, [README.md](README.md) para funcionalidades e testes e [DEPLOY_NUVEM.md](DEPLOY_NUVEM.md) para configuração dos provedores e roteiro da banca.
