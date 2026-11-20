# Mapa de estratégias M&A Kinsey · tutorial para o sistema de SDR

Este tutorial explica o **Mapa M&A Kinsey** (a planilha de estratégia de originação) e como levar as ideias dele para o sistema de SDR que está sendo criado em outra base do Claude Code. Traz as regras que o KinseyTec – M&A já usa na Prospecção, o modelo de dados sugerido, o funil, as cadências e um roteiro pronto para colar no Claude Code da outra base.

Nada neste documento contém nomes, telefones ou e-mails reais: os exemplos são fictícios.

---

## 1. O que é o mapa de estratégias

O mapa organiza a originação de negócios de M&A em **dois lados** e no **cruzamento** entre eles:

| Aba da planilha | O que representa | Ideia para o SDR |
|---|---|---|
| **Vendedoras** (sell-side) | Empresas que podem ser vendidas: segmento, local, nível (temperatura), faturamento anual, situação do mandato, contato, último contato, observações | Lista de **targets** a abordar para mandato de venda |
| **Investidores** (buy-side) | Compradores: tipo (empresa estratégica, fundo, advisory, joint venture), segmento, tese de investimento, status, localização, contato | Lista de **investidores** a abordar para apresentar targets |
| **M&A** (blocos) | Pares investidor × target: tese do comprador, target, sede, mandato, faturamento | **Matching**: para cada investidor, os targets aderentes à tese (e vice-versa) |
| **Fichas** | Inteligência sobre cada investidor: faturamento, número de aquisições, foco, pessoas-chave | Argumentos de abordagem e prioridade (quem compra mais) |
| **Tipos de fundos** | Glossário: FIP, FIDC, FIM, FII, FIC, FIRF, FIA, ETF, cambiais, previdência | Classificar investidores financeiros (FIP = private equity, o mais relevante para M&A) |
| **To Do** | Tarefas soltas ("entrar em contato com X e oferecer Y") | **Tarefas com dono e prazo** no SDR |
| Listas exportadas (Econodata e similares) | Empresas com CNAE, faixa de faturamento, contato, link da base | **Importação** de listas para prospecção |
| DRE de exemplo | Números de um target | Dado financeiro que qualifica o lead (faturamento) |

Retrato do mapa atual (só contagens): cerca de 60 investidores (2/3 empresas estratégicas, 1/3 fundos) e cerca de 50 vendedoras, com temperaturas Quente, Morno, Frio e Declinada, e situações de mandato como Ok, Pendente, Enviada, Vencido, Sem interesse e "retomar em <data>".

## 2. As ideias de estratégia que o SDR deve carregar

1. **Dois públicos, duas mensagens.** O SDR aborda o **target** (oferecer assessoria de venda) e o **investidor** (apresentar targets que cabem na tese). São cadências e scripts diferentes.
2. **Temperatura em toda empresa.** Frio, Morno, Quente; e **Declinada** (com motivo). Quente = reunião realizada, proposta de serviços enviada ou mandato em negociação.
3. **Mandato como estado do target.** Sem mandato · enviado/em análise · pendente · assinado (ok) · vencido · declinado · sem interesse da Kinsey · retomar em <data>. "Retomar em" vira **tarefa agendada**.
4. **Tese do investidor estruturada**, não texto solto: segmentos, atividades/CNAEs, UFs/regiões, faixa de faturamento do alvo, ticket mínimo e máximo, participação (minoritária/majoritária/100%).
5. **Matching automático** tese × target: segmento/CNAE + região + faixa de faturamento. Cada target mostra os investidores aderentes; cada investidor mostra os targets para apresentar.
6. **Consolidadores primeiro.** Na ficha, número de aquisições e faturamento indicam quem compra mais: prioridade de abordagem.
7. **Política Kinsey de abordagem:** faturamento anual de **R$ 15 milhões a R$ 10 bilhões**. Abaixo de R$ 15 mi a empresa **não entra** na prospecção: vai para **standby (fora da política)** e só volta com **autorização de um sócio** cadastrado, com o motivo registrado.
8. **Sigilo antes do NDA.** Para investidores, o target é apresentado com **codinome**, região e números arredondados; o nome só depois do NDA.
9. **Tudo vira tarefa.** Cada "To Do" do mapa vira tarefa com responsável, prazo e empresa ligada.

## 3. Regras do KinseyTec – M&A (Prospecção) que o SDR deve repetir

- **Situações do lead:** Novo · Em abordagem · Reunião marcada · Aguardando aprovação M&A (reunião realizada) · Aprovado (vai para o cadastro M&A) · Arquivado · Fora da política (standby).
- **Toque (abordagem):** data e hora, canal (Ligação, E-mail, WhatsApp, LinkedIn, Reunião, Outro), resultado (Sem resposta, Respondeu, Pediu retorno, Sem interesse, Reunião marcada, Reunião realizada, Proposta de serviços enviada, Mandato em negociação), quem fez, quem conduz a reunião, nota.
- **Exclusividade:** quem abordou tem a empresa por **90 dias sem contato**; depois ela fica **livre** para outra pessoa.
- **Metas semanais (parâmetro):** 15 abordagens e 1 reunião por pessoa; semana zerada aparece em vermelho.
- **Papéis:** Sócio · Time de M&A · Novos negócios · SDR. Só **sócio ou time de M&A** aprova o lead quente para o cadastro M&A. Só **sócio** libera empresa fora da política.
- **Mérito (parâmetros provisórios, configuráveis):** originação de mandato 10%, de investidor 5%, SDR em serviços 5%, sócio em serviços 15%; elegíveis ao mérito de mandato e investidor: sócio, time de M&A e novos negócios.
- **Origens:** Econodata, Lemitti, Ramper, SDR, Novos negócios, Indicação, Manual.
- **Segmento empresarial:** Agro, Alimentos, Construção, Educação, Industrial, Logística, Saúde, Serviços, Tecnologia, Varejo, Outros (sugerido pela atividade/CNAE, confirmado pela equipe).
- **Filtros essenciais:** segmento, região, UF, tipo (target/investidor), origem, investidor, responsável, situação; busca por nome e CNPJ.

## 4. Modelo de dados sugerido para o SDR

```
Empresa (lead)        id, nome, cnpj, segmento, cnae, uf, municipio, faturamento_texto, faturamento_mi,
                      alvo: "target" | "investidor", temperatura, situacao, origem, lista, responsavel,
                      exclusivo_ate, mandato {status, enviado_em, retomar_em}, politica {dentro|fora, autorizado_por, motivo}
Contato               empresa_id, nome, cargo, email, celular, fonte, consentimento (LGPD: legítimo interesse)
Toque                 empresa_id, em, canal, resultado, por, conduz, nota, reuniao_em
Tese (investidor)     empresa_id, segmentos[], cnaes[], ufs[], regioes[], fat_min_mi, fat_max_mi, ticket_min, ticket_max, participacao[]
Ficha (investidor)    empresa_id, faturamento, aquisicoes_qtd, foco, pessoas_chave[], links
Bloco (par)           investidor_id, target_id, motivo_aderencia, situacao (sugerido|apresentado|interessado|NDA|descartado)
Tarefa                empresa_id, descricao, responsavel, prazo, origem ("To Do", "retomar mandato", "cadência")
Equipe                nome, cargo, papel (socio|mna|novos|sdr), email
Regras                meta_abordagens, meta_reunioes, exclusividade_dias, percentuais de mérito, politica_min_mi, politica_max_mi
```

## 5. Funil e cadências

**Funil:** Importado → (política) → Novo → Em abordagem → Reunião marcada → Reunião realizada → Aguardando aprovação → Aprovado → **passa para o KinseyTec – M&A** (cadastro do target ou do investidor, com histórico).

**Cadência sugerida para target (venda):** D0 ligação · D+2 WhatsApp · D+5 e-mail com proposta de conversa · D+10 LinkedIn · D+15 ligação · D+30 retomada; resposta positiva → reunião; "retomar em" → tarefa na data.

**Cadência sugerida para investidor (compra):** D0 e-mail com 1 a 3 teasers anônimos aderentes à tese · D+3 ligação · D+7 WhatsApp · D+14 novo teaser · D+30 atualização do pipeline do setor.

(As cadências são sugestão inicial; o time ajusta os dias e canais.)

## 6. Importação de listas (Econodata, Lemitti, Ramper, planilhas)

- Reconhecer colunas pelo nome: razão social/empresa, CNPJ, CNAE/atividade, faturamento (texto ou faixa), UF, cidade, contato, cargo, e-mail, telefone, site.
- Faixa de faturamento ("De R$ 4,8 a R$ 10 milhões") → usar o meio da faixa.
- **Aplicar a política** na entrada: abaixo de R$ 15 mi → standby; sem faturamento → entra e o time confere.
- **Não duplicar:** mesma empresa por CNPJ (ou nome normalizado) atualiza contatos e dados, não cria outra.
- Exportar lista para cadência (CSV para Ramper) com os prospects aderentes a um investidor.

## 7. Passagem para o KinseyTec – M&A (aprovado)

Quando um lead é aprovado, o SDR envia ao M&A (mesmos nomes de campos ajudam):

```json
{
  "nivel": "N3 (target) ou N1 (investidor)",
  "nome": "EXEMPLO Serviços Ltda", "doc": "00.000.000/0001-00",
  "segmento": "Serviços", "uf": "SP", "municipio": "São Paulo",
  "mapa": {"temperatura": "Quente", "fat": "R$ 40 mi", "segmentoTxt": "terceirização", "contato": "Nome · cargo · e-mail"},
  "investidores": ["ids dos investidores aderentes"],
  "prospeccao": {"origem": "Econodata", "lista": "nome da lista", "responsavel": "quem originou", "toques": 7, "reuniao": "2026-11-20T15:00"},
  "merito": {"originacao": {"participantes": ["quem originou"]}}
}
```

## 8. Segurança e LGPD

- Contatos pessoais: uso interno do M&A (legítimo interesse); nunca em teaser ou material antes do NDA.
- Chaves das bases (Econodata, Ramper, Lemitti): só pela API oficial, guardadas no **Secret Manager**; nenhuma senha de usuário no sistema.
- Dados reais de clientes não vão para o repositório nem para pacotes de teste: use dados fictícios ("EXEMPLO").

## 9. Roteiro pronto para colar no Claude Code da base do SDR

> Leia este tutorial (TUTORIAL_MAPA_ESTRATEGIAS_SDR.md) e implemente no sistema de SDR:
> 1. As entidades da seção 4 (empresa/lead, contato, toque, tese, ficha, bloco, tarefa, equipe, regras).
> 2. O funil e as situações da seção 3, com exclusividade de 90 dias, metas semanais e papéis (sócio, M&A, novos negócios, SDR).
> 3. A política de faturamento (R$ 15 mi a R$ 10 bi) na importação, com standby e liberação só por sócio, registrando quem autorizou e o motivo.
> 4. O matching tese × target (segmento/CNAE, região, faixa de faturamento) com a lista de investidores aderentes em cada target e de targets em cada investidor.
> 5. As cadências da seção 5 como tarefas automáticas, e "retomar em <data>" do mandato como tarefa.
> 6. A importação de listas da seção 6 sem duplicar empresas, e a exportação CSV para cadência.
> 7. A passagem do lead aprovado para o KinseyTec – M&A no formato da seção 7.
> Use apenas dados fictícios nos testes e siga a seção 8 (LGPD e segredos).

## 10. Checklist de implantação

- [ ] Equipe cadastrada com papéis (sócios, M&A, novos negócios, SDR)
- [ ] Regras configuradas (metas, exclusividade, mérito, política de faturamento)
- [ ] Teses dos investidores estruturadas (segmentos, CNAEs, regiões, faixa, ticket)
- [ ] Listas importadas com a política aplicada (standby conferido)
- [ ] Cadências ativas para targets e investidores
- [ ] Tarefas do "To Do" migradas com responsável e prazo
- [ ] Passagem para o KinseyTec – M&A testada com um lead fictício
