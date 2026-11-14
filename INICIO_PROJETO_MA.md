# Kinsey Capital – M&A · instruções de início do projeto

> Cole este arquivo (ou peça para lê-lo) na primeira mensagem do novo projeto.
> O código em `kinsey-ma/` já é a plataforma KinseyTec completa (versão v1.9.11). Reaproveite tudo; adapte, não reescreva.

## 1. Objetivo

Sistema de originação e execução de M&A da **Kinsey Capital**, com a mesma lógica dos sistemas de monitoramento
de cadeias (órbita/globo, níveis N1–N2–N3, dossiê por empresa, pontuação de risco, relatórios em PDF, portal externo,
vários clientes com isolamento de dados).

| Nível | Na plataforma de cadeias | No M&A |
|---|---|---|
| **N1** | fornecedor que vende ao cliente | **Investidor** (estratégico, private equity, family office, fundo, VC, pessoa física qualificada) |
| **N2** | subfornecedor | **Intermediador**: a própria Kinsey Capital ou parceiro de negócios (originador, assessor, escritório) |
| **N3** | origem | **Empresa-alvo (target)** abordada para mandato, ou empresa de um mandato já assinado |

Ligações: um **target** (N3) é trazido por um **intermediador** (N2) e apresentado a um ou mais **investidores** (N1).

## 2. Funções principais

1. **Base de investidores (N1) com tese de investimento**
   - Segmentos/CNAEs de interesse, faixa de faturamento e EBITDA do alvo, ticket (mín./máx.), participação buscada
     (minoritária, controle, 100%), regiões, estágio, restrições (ex.: não investe em agro), contato e NDA assinado.
   - Importação por planilha (reaproveitar `nucleo/app/importar.js`).
2. **Intermediadores (N2)**: Kinsey Capital e parceiros, com acordo de originação, comissão/fee e NDA.
3. **Targets (N3)**
   - Consulta por CNPJ (reaproveitar a consulta e pré-cadastro automático da Receita, `consultaCnpj` em `visao.js`):
     razão social, CNAE, abertura, sócios, endereço, capital, situação; listas oficiais e notícias (`orgaos.js`).
   - Dados financeiros: faturamento, EBITDA, dívida líquida, margem, crescimento; documentos via Portal.
   - **Funil**: mapeada → abordada → reunião → NDA → mandato assinado → teaser → CIM/data room → propostas (IOI) →
     LOI → diligência → SPA/fechamento (ou descartada, com motivo).
4. **Mandatos**: target com mandato assinado vira um **mandato** com nome-código; ao investidor aparece só o
   **teaser anônimo** até ele assinar o NDA daquele mandato; depois, acesso ao data room (Portal).
5. **Cruzamento investidor × target (matching)**: pontuação de aderência pela tese (segmento, faturamento, ticket,
   região, participação). Lista "investidores indicados" no dossiê do target e "oportunidades indicadas" no do investidor.
6. **Serviços Kinsey por target/mandato**: diligência (frentes societária, contábil, fiscal, trabalhista, ambiental,
   contratos, compliance/anticorrupção, TI/LGPD), **valuation** (múltiplos EV/EBITDA, EV/Receita e fluxo de caixa
   descontado, com faixa mín.–máx.) e **estruturação societária** (organograma antes/depois, holding, cisão, incorporação).
7. **Riscos (red flags)** com a mesma pontuação baixo/médio/alto: processos, dívidas fiscais, listas restritivas,
   concentração de clientes, sócio PEP, passivo trabalhista/ambiental. Matriz provável/possível/remota com valores.
8. **Relatórios**: teaser (1 página, anônimo), dossiê completo do target, relatório de diligência (red flags e
   recomendações para o contrato: garantias, ajuste de preço, condições precedentes), relatório de pipeline para a
   Kinsey e relatório de oportunidades por investidor. Resumido (1 página) e completo, como nas cadeias.

## 3. Reaproveitar (onde está no código)

- **Órbita/globo** (`nucleo/app/app.js`, `body.html`): investidores no anel N1, intermediadores no N2, targets no N3;
  filtros por segmento, faturamento, etapa do funil e risco; mapa/satélite do endereço do target.
- **Dossiê da empresa** (abas Dados, Documentos, Investigação, Jurídico): vira o dossiê do target/investidor.
- **Documentos e leitura automática** (`documentos.js`): cartão CNPJ, contrato social, certidões, balanços.
- **Órgãos e listas** (`orgaos.js`), **notícias**, **consulta rápida/WhatsApp** (`visao.js`).
- **Relatórios PDF** (`report.js`, `KTPdf`), **gráficos** (`grafBarras`).
- **Portal** (`nucleo/portal`): o target envia documentos do data room; o investidor assina NDA e vê o teaser.
- **Firebase** (`nucleo/fb`): login, perfis, regras de segurança; publicação (`ferramentas/`, `.github/workflows`).

O produto fica em `produtos/ma/segmentos/capital/` (seg.json, data.js, seed.js), no mesmo formato das cadeias.
O script de início copiou o segmento Cobre e Metal como ponto de partida; substitua textos, perguntas e exemplos.

## 4. Regras que continuam valendo

- **Sigilo/LGPD**: um investidor nunca vê outro investidor, nem targets sem NDA; o target nunca vê os investidores
  até a Kinsey liberar; um cliente nunca vê dados de outro. Nome-código em tudo que for mostrado antes do NDA.
- Nada no sistema, nos arquivos, nos commits ou nos materiais pode indicar a ferramenta usada para desenvolvê-lo.
  Commits com autor `Kinsey BR`, sem linhas de coautoria. A construção já bloqueia termos proibidos.
- Bibliotecas ou código externo só com autorização expressa.
- Não usar credenciais Google da Kinsey; a publicação é feita pela Kinsey (Cloud Shell ou GitHub Actions).
- Contatos só na apresentação final: contato@kinsey.com.br · newton.kao@kinsey.com.br · (11) 96635-0424.
- Testar no navegador (computador e celular) antes de cada versão; registrar em `VERSOES.md` e marcar `git tag`.

## 5. Ordem sugerida de trabalho

1. Renomear níveis e textos (N1 Investidores, N2 Intermediadores, N3 Targets) em `seg.json` e criar exemplos fictícios
   em `seed.js` (5 investidores, 2 intermediadores, 8 targets, 2 mandatos).
2. Campos de tese do investidor e financeiros do target; importação por planilha.
3. Funil do target e mandatos com teaser anônimo e NDA por mandato.
4. Matching investidor × target com pontuação explicada.
5. Valuation e estruturação societária no dossiê.
6. Relatórios (teaser, dossiê, diligência, pipeline, oportunidades).
7. Portal (data room e NDA) e regras do Firebase para o sigilo entre investidores.
8. Publicação no projeto Firebase `kinsey-capital-ma` (criar no console antes).
