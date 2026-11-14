# KinseyTec – M&A

Um sistema KinseyTec, empresa do grupo KinseyBR. Usado pela Kinsey Capital (N2) na originação e execução de M&A.

Sistema de originação e execução de M&A sobre o núcleo comum da plataforma
(órbita N1–N2–N3, dossiê, risco, relatórios em PDF, Portal, vários clientes com isolamento de dados).

- N1 · **Investidores** (com tese de investimento)
- N2 · **Intermediadores** (Kinsey Capital e parceiros)
- N3 · **Targets** (empresas-alvo e mandatos)

Segmento: `segmentos/capital/` (seg.json, data.js, seed.js). Construção: `python3 ferramentas/construir.py ma capital`.

Escopo, modelo de dados, sigilo, matching, valuation, relatórios e ordem das versões:
ver [IDEIAS_E_ROADMAP.md](IDEIAS_E_ROADMAP.md) e [INICIO_PROJETO_MA.md](../../INICIO_PROJETO_MA.md).


## Base inicial (v2.8)

Ponto de partida do sistema: cadastro de investidores e compradores (N1), intermediadores e parceiros (N2) e targets
vendedores (N3). Com o CNPJ, as consultas são automáticas:

- Receita Federal e listas oficiais (CEIS, CNEP, Cadastro de Empregadores, IBAMA): núcleo, no navegador e no Firebase.
- CVM, B3, demonstrações (DFP), cotação e notícias (do N1, também as aquisições): função `consultarEmpresa`
  (gatilho `consultaEmpresaAuto` ao gravar o CNPJ ou o nome, e chamada pelo botão "Atualizar agora").
- Mercado (Ibovespa, Selic, IPCA, dólar): função `mercado`.

O gatilho do Firestore usa a região `southamerica-east1`; o banco Firestore do projeto precisa estar na mesma região.
O dossiê do N1 traz a tese, as condições de compra (ticket e capacidade financeira) e as últimas aquisições; o do N3,
consultas e certidões, números e valor estimado, risco, diligência, compradores ligados e notícias. Ambos em PDF.
