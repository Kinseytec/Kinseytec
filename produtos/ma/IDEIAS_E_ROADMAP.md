# Kinsey Capital – M&A · ideias, análise inicial e roadmap

Base: plataforma KinseyTec v1.9.11 (núcleo comum) + segmento `produtos/ma/segmentos/capital/`
(copiado do Cobre e Metal; só os níveis e o nome foram trocados até agora).

## 1. Situação encontrada na base (14/11/2026)

| Item | Situação |
|---|---|
| Construção `python3 ferramentas/construir.py ma capital` | Funciona; gera `dist/KinseyTec_MA_Firebase.zip` (≈650 KB) e passa na trava de termos proibidos |
| Nome e níveis | "Kinsey Capital – M&A", N1 Investidores · N2 Intermediadores · N3 Targets (apenas nos textos trocados) |
| Conteúdo do segmento | Ainda é Cobre e Metal: questionário, documentos, riscos, cotações (Cobre/Alumínio/Ferroso), 12 exemplos de recicladoras e ferros-velhos |
| Textos remanescentes | "KINSEYTEC – COBRE E METAL · ÓRBITA", "Análise prévia do fornecedor", "Origem e risco", aba Cotações, "Tour com a Kim" falando de cadeia |
| Órbita na versão local (`kinseytec.html`) | Funciona. O erro visto na análise inicial vinha só do ambiente de teste sem acesso ao CDN das bibliotecas; desde a v2.0 a tela não trava se o globo não carregar |
| Regras do Firebase | Isolamento por **cliente** (`clienteId`). Não existe isolamento por **investidor** nem por **mandato** — é a principal lacuna de sigilo |
| Projeto Firebase | `kinsey-capital-ma` (precisa ser criado no console pela Kinsey) |

## 2. Modelo de dados proposto

Reaproveita a coleção `suppliers` (com `nivel`) para não reescrever órbita, dossiê e relatórios, e acrescenta o que é
específico de M&A.

| Coleção | Uso | Campos principais |
|---|---|---|
| `suppliers` (nivel N1) | Investidor | tipo (estratégico, PE, family office, fundo, VC, PF qualificada), tese: `cnaes[]`, `segmentos[]`, `fatMin/fatMax`, `ebitdaMin/ebitdaMax`, `ticketMin/ticketMax`, `participacao[]` (minoritária, controle, 100%), `regioes[]`, `estagio[]`, `restricoes[]`, contato, `ndaGeral` |
| `suppliers` (nivel N2) | Intermediador | tipo (Kinsey Capital, originador, assessor, escritório), acordo de originação, `fee` (% e/ou fixo, retainer, success fee), NDA, vigência |
| `suppliers` (nivel N3) | Target | dados da Receita (CNPJ), `financeiro` por ano (receita, EBITDA, dívida líquida, margem, crescimento), `etapa` do funil, `motivoDescarte`, `intermediadorId`, `riscos` |
| `mandatos` (nova) | Target com mandato assinado | `targetId`, `codigo` (nome-código), tipo (sell-side / buy-side), data de assinatura, exclusividade, prazo, fee, `teaser` (texto anônimo), status |
| `mandato_acessos` (nova) | NDA por investidor × mandato | `mandatoId`, `investidorId`, status (convidado, teaser visto, NDA assinado, data room liberado, IOI, LOI, desistiu), datas, versão do NDA |
| `propostas` (nova) | IOI / LOI / proposta vinculante | `mandatoId`, `investidorId`, tipo, valor (EV e equity), estrutura, condições, validade |
| `valuations` (nova) | Valuation por target | múltiplos (EV/EBITDA, EV/Receita) com comparáveis, FCD (premissas, WACC, perpetuidade), faixa mín.–máx. |
| `diligencias` (nova ou dentro do target) | Frentes e pedidos de documentos | frente, item, responsável, prazo, status, achado, risco, valor (provável/possível/remota) |

## 3. Funil do target

mapeada → abordada → reunião → NDA → **mandato assinado** → teaser → CIM/data room → propostas (IOI) → LOI →
diligência → SPA/fechamento — ou **descartada** (motivo obrigatório: sem interesse, valuation, risco, timing, perdeu para
concorrente, outro).

Ideias:
- Cada mudança de etapa grava data e usuário (histórico) e alimenta o tempo médio por etapa no relatório de pipeline.
- Ao chegar em "mandato assinado", o sistema cria o mandato e sugere um nome-código (ex.: "Projeto Ipê").
- Alertas de prazo: NDA vencendo, exclusividade do mandato acabando, LOI sem resposta há X dias.

## 4. Matching investidor × target (pontuação explicada)

Pontuação 0–100, com o motivo de cada ponto, mostrada nos dois dossiês:

| Critério | Peso sugerido | Regra |
|---|---|---|
| Segmento / CNAE | 30 | CNAE exato 30; mesma divisão (2 dígitos) 20; segmento afim 10 |
| Faturamento do alvo na faixa | 20 | dentro 20; até 20% fora 10 |
| EBITDA na faixa | 10 | idem |
| Ticket compatível com o valuation | 20 | faixa do valuation cruza o ticket 20; parcial 10 |
| Região | 10 | UF/região aceita 10 |
| Participação buscada | 10 | compatível com o que o target aceita vender |
| Restrição da tese | eliminatória | ex.: "não investe em agro" zera a pontuação e explica |

Saídas: "investidores indicados" no target/mandato, "oportunidades indicadas" no investidor (só teaser anônimo se não houver
NDA), e botão "convidar para o mandato" que cria o registro em `mandato_acessos`.

## 5. Sigilo e perfis (o ponto mais crítico)

Perfis novos ou ajustados:

| Perfil | Vê |
|---|---|
| admin (Kinsey) | Tudo |
| equipe Kinsey (`colaborador`) | Tudo do cliente/mandatos em que atua |
| intermediador (`parceiro`) | Só os targets que originou e o andamento deles |
| investidor (`investidor`, via Portal) | Teasers anônimos dos mandatos para os quais foi convidado; data room só após NDA daquele mandato; nunca outros investidores |
| target (`fornecedor` no núcleo → `target`, via Portal) | Seus próprios documentos e o checklist do data room; nunca os investidores até a Kinsey liberar |

Regras do Firestore a escrever: leitura de `mandatos` filtrada por `mandato_acessos` do investidor; o teaser em documento
separado (sem nome nem CNPJ); arquivos do data room no Storage com caminho por mandato e regra que exige NDA assinado.
Testar com o emulador antes de publicar.

## 6. Serviços Kinsey por target/mandato

- **Diligência** — frentes: societária, contábil-financeira, fiscal, trabalhista, ambiental, contratos,
  compliance/anticorrupção, TI/LGPD. Lista de pedidos (checklist) com prazo e status; reaproveita a aba Investigação,
  Jurídico (pareceres com OAB) e a leitura automática de documentos (`documentos.js`).
- **Valuation** — EV/EBITDA e EV/Receita com tabela de comparáveis; FCD simplificado (5 anos, WACC, perpetuidade);
  resultado em faixa mín.–máx. e ponte EV → equity (dívida líquida, ajustes).
- **Estruturação societária** — organograma antes/depois (holding, cisão, incorporação, drop down), desenhado no próprio
  sistema e exportado no PDF.

## 7. Riscos (red flags)

Mesma pontuação baixo/médio/alto da plataforma, com fatores de M&A: processos (cível, trabalhista, tributário), dívida ativa,
listas restritivas (empresa e sócios), concentração de clientes (> 30% em um cliente), sócio PEP, passivo
trabalhista/ambiental, dependência do fundador, contingências fiscais, contratos com cláusula de mudança de controle.
Matriz provável/possível/remota com valores → impacto no preço (ajuste, escrow/retenção, indenização, condição precedente).

## 8. Relatórios

| Relatório | Para quem | Base no código |
|---|---|---|
| Teaser (1 página, anônimo) | Investidor antes do NDA | `report.js` / `KTPdf` |
| Dossiê do target (resumido e completo) | Kinsey / investidor com NDA | relatório por fornecedor |
| Relatório de diligência (red flags e recomendações para o contrato) | Investidor / assessores | relatório de pontos |
| Pipeline (funil, valores, tempo por etapa, por intermediador) | Kinsey | painel e relatório geral |
| Oportunidades por investidor | Investidor | novo, a partir do matching |

## 9. Ideias adicionais sugeridas na análise

1. **Painel de pipeline** em Kanban (colunas = etapas do funil), além da órbita.
2. **Comissões**: cálculo automático de fee do intermediador e success fee da Kinsey no fechamento.
3. **Registro de interações** (CRM leve): reuniões, ligações, e-mails com investidor e target, com próximo passo e data.
4. **Q&A do data room**: perguntas do investidor e respostas do target, mediadas pela Kinsey.
5. **Trilha de auditoria** de quem viu cada documento do data room (requisito comum de sigilo).
6. **Marca d'água** com nome do investidor nos PDFs baixados do data room.
7. **Comparáveis de mercado** cadastrados uma vez e reutilizados em todos os valuations.
8. **Importação de investidores** por planilha com colunas da tese (reaproveita `importar.js`).

## 10. Ordem de trabalho (versões)

| Versão | Entrega |
|---|---|
| v2.0 ✔ | Globo mundial (investidores, intermediadores/parceiros, targets); conteúdo M&A; indicadores de mercado; exemplos; Jurídico com modelos Kinsey provisórios (NDA, mandatos, originação), aba M&A no dossiê com funil e mandato. Falta: textos restantes "fornecedor" nas telas de Cadeia, Auditoria e consulta rápida |
| v2.1 | Tese do investidor, financeiros do target, importação por planilha |
| v2.2 | Funil do target e mandatos com teaser anônimo e NDA por mandato |
| v2.3 | Matching com pontuação explicada |
| v2.1 ✔ | Due Diligence (contábil, financeira, trabalhista, tributária), Análises financeiras e Valuation com mini globos e dupla aprovação dos ajustes pelo consultor |
| v2.2 ✔ | Valuation comparativo (FCD com histórico e cenários, múltiplos CVM/B3, transações), apresentação pré/pós-NDA, análise pró-vendedor de contratos, PPA e modelos, relatórios de DD, valuation e teaser, funções de mercado |
| v2.3 ✔ | Diligência jurídica, honorários dos mandatos, matching, buy-side, interações, pipeline e importação do mapa M&A com CNPJ |
| v2.4 ✔ | Diligência jurídica dentro do Jurídico; globo só na Órbita ligando N1 → N2 → N3; emblema nas pastas de análise |
| v2.5 ✔ | Base simplificada; importador do mapa Excel da Kinsey (vendedoras, compradoras, parcerias, ligações, fichas, CNPJs conferidos); risco e dossiê completo só do target (N3) |
| v2.6 | Estruturação societária no dossiê (organograma antes/depois), Q&A do data room e trilha de acesso |
| v2.7 | Portal (data room, NDA) e regras do Firebase para sigilo entre investidores e por mandato |
| v2.8 | Publicação no projeto `kinsey-capital-ma` |

## 11. Pontos para decidir com a Kinsey

1. A Kinsey atende vários **clientes** no M&A (ex.: outras assessorias usando o sistema) ou a Kinsey Capital é o único
   cliente? Isso define se `clienteId` continua sendo o nível de isolamento principal.
2. Mandatos sell-side apenas, ou também buy-side (investidor contrata a Kinsey para achar targets)?
3. Pesos do matching e faixas de risco: usar os sugeridos acima como ponto de partida?
4. Indicadores no lugar das cotações de metal: Selic, IPCA, dólar, Ibovespa — ou remover a barra?
5. Modelo de NDA e de teaser (texto jurídico) a usar como padrão.
