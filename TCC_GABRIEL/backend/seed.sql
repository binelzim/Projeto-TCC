-- Dados de demonstração do TCC.
-- Rode DEPOIS de iniciar o backend uma vez (o Hibernate cria as tabelas).
-- Pode rodar mais de uma vez sem duplicar nada.

INSERT INTO tb_rota (nome, destino, horario_saida)
SELECT 'Lagoa Formosa - Patos de Minas (Noturno)', 'UNIPAM', '18:00'
WHERE NOT EXISTS (SELECT 1 FROM tb_rota WHERE nome = 'Lagoa Formosa - Patos de Minas (Noturno)');

INSERT INTO tb_veiculo (placa, capacidade, modelo, rota_id)
SELECT 'ABC-1234', 15, 'Sprinter', (SELECT id FROM tb_rota WHERE nome = 'Lagoa Formosa - Patos de Minas (Noturno)' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM tb_veiculo WHERE placa = 'ABC-1234');

-- O QR Code de check-in deve conter o texto do token_identificador (22009264)
INSERT INTO tb_estudante (nome_completo, cpf_hash, matricula, token_identificador, ativo)
SELECT 'Gabriel Costa', 'demo-hash-22009264', '22009264', '22009264', true
WHERE NOT EXISTS (SELECT 1 FROM tb_estudante WHERE matricula = '22009264');

-- Segundo aluno de teste (QR Code com o texto 22009265)
INSERT INTO tb_estudante (nome_completo, cpf_hash, matricula, token_identificador, ativo)
SELECT 'Ana Souza', 'demo-hash-22009265', '22009265', '22009265', true
WHERE NOT EXISTS (SELECT 1 FROM tb_estudante WHERE matricula = '22009265');
