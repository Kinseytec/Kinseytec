# Registro de versões

## v2.13 — 2026-11-15 · Pré-due diligence pelos pronunciamentos do CPC e equipe Kinsey
- Pré-ajustes automáticos para avaliação do auditor: gastos com natureza de imobilizado lançados no resultado (CPC 27, itens 7, 12, 16 e 17; CPC 23), com estimativa de ativação e alerta para manutenção que pode ser reforma; gastos de implantação de nova unidade (CPC 27, item 19; CPC 04, item 69: não ativáveis, mas fora do EBITDA normalizado); despesas que cresceram acima da receita frente ao exercício anterior (revisão analítica)
- Projeto de expansão na Due Diligence (ex.: nova distribuidora): o consultor informa a parte ativável e a pré-operacional e o sistema gera os dois pré-ajustes (ativação e depreciação, normalização do EBITDA), que seguem para o OK do auditor
- Terceirização e pejotização: serviços tomados, comissões e ajudas de custo comparados com a folha
- Itens não recorrentes passam a ajustar também o lucro (líquido de 34%), o que corrige o método P/L
- Classificação do balancete: pró-labore com hífen ou espaços, "capital giro" sem "de", juros e multas ativas como receita financeira; "clientes diversos" e "fornecedores diversos" deixam de ser tratados como contas transitórias; perdas e ganhos na venda de imobilizado e mão de obra não são lidos como investimento
- Importador do mapa da Kinsey aceita a aba "Investidores" (no lugar de "Compradoras") e a coluna Econodata
- Equipe de M&A da Kinsey (Newton KA Oliveira, Juçara Haverot, Monica Flissak e Camilla Pazzini) como opções nos responsáveis pelas áreas da diligência, nos OKs dos ajustes e no advogado da diligência jurídica

## v2.12 — 2026-11-15 · Honorários pela condição própria do mandato
- Quando o mandato traz um percentual único sobre o valor da transação (ex.: 6%, dividido entre parceiro e Kinsey), a estimativa de honorários usa essa condição, sem retainer e sem mínimo quando o mandato diz, e reparte o success fee com o parceiro (N2) pelo acordo dele
- Mandato não assinado aparece indicado na estimativa
- Sem valuation nem LOI, a estimativa usa o valor estimado do target (EBITDA ou faturamento × múltiplo do segmento)

## v2.11 — 2026-11-15 · Órbita: consulta no painel lateral
- O globo fica livre: no lugar dos seletores, um botão discreto "Consulta" no canto mostra o que está no mapa (ex.: "7 targets · que Alsco Uniformes compra") e quantos filtros estão ativos
- Ao tocar, abre um painel lateral com a consulta: tipo (targets N3, investidores N1, intermediadores e parceiros N2 ou todos), o que o investidor compra, segmento, CNAE cadastrado (divisão ou atividade), região, estado, cidade e temperatura do mapa, com a contagem de cada opção, o total e a lista das empresas encontradas (tocar leva ao ponto no mapa)
- "Limpar" volta ao padrão (só os targets); "Ver no mapa" fecha o painel

## v2.10 — 2026-11-15 · Pastas de análise recolhidas
- Due Diligence, Análises financeiras, Valuation, Apresentação, Pós-aquisição e Jurídico: a pasta de análise fica recolhida, mostrando só o target escolhido; a lista de targets abre ao tocar em "Trocar" (com filtro quando a lista é longa) e fecha ao escolher
- O conteúdo da análise passa a ocupar a largura toda, no computador e no celular
- No celular, o topo dessas telas fica curto: sem o texto descritivo e com as abas em uma linha com rolagem

## v2.9 — 2026-11-14 · Órbita por investidor: o mapa mostra só os targets (N3)
- O mapa mostra apenas os targets vendedores (N3); investidores e intermediadores não poluem mais o globo, e os nomes não se sobrepõem ao aproximar
- Escolha do investidor (N1) no topo da Órbita: o mapa passa a mostrar só os N3 que ele compra, ligados a ele por linhas, com o total e o critério ("7 targets que Alsco Uniformes compra · lavanderia")
- O que o investidor compra vem do cadastro: atividades (ex.: lavanderia industrial; soja, milho, fertilizantes), CNAEs, CNPJs de targets específicos, estados, cidades e regiões; também valem as ligações do mapa da Kinsey e o texto da tese importado da planilha
- Modo consulta (sem investidor escolhido): todos os targets, com filtro por segmento e por estado, para o N2 ou um investidor consultar N3
- "Ver na órbita" de um investidor abre o mapa já no modo dele; as condições de compra do dossiê do N1 usam os mesmos critérios

## v2.8 — 2026-11-14 · KinseyTec – M&A: Base inicial, consultas automáticas e dossiês do N1 e do N3
- Nome do sistema: KinseyTec – M&A, um sistema da KinseyTec, empresa do grupo KinseyBR (a Kinsey Capital segue como intermediador N2 e emissora dos relatórios)
- Base inicial como primeiro item do menu: cadastro geral de investidores e compradores (N1), intermediadores e parceiros (N2) e targets vendedores (N3); sem a análise prévia solta na Órbita, toda empresa entra pelo cadastro
- Com o CNPJ, consultas automáticas: Receita Federal (cadastro, atividade, capital e sócios, que preenchem o cadastro), listas oficiais (CEIS, CNEP, Cadastro de Empregadores e IBAMA), CVM (companhia aberta), B3 (código, cotação e valor de mercado), demonstrações da CVM, notícias e mercado (Ibovespa, Selic, IPCA e dólar); certidões que exigem verificação de segurança ficam como atalhos para o site de cada órgão
- Nova função na versão publicada (consultarEmpresa): roda sozinha ao gravar o CNPJ ou o nome de um N1 ou N3 e pelo botão "Atualizar agora"; comparáveis da CVM passam a guardar CNPJ, caixa e dívida; mercado passa a trazer o Ibovespa (também na barra de indicadores)
- Dossiê do investidor (N1): consultas, tese, condições de compra (ticket e capacidade financeira: capital disponível, ou até 3,0x o EBITDA menos a dívida líquida) com cada target ligado ou aderente marcado como "Tem condições", "No limite" ou "Acima da capacidade", e últimas aquisições e notícias
- Dossiê do target (N3), mais completo: consultas e certidões, números e valor estimado (valuation ou EBITDA × múltiplo do segmento), risco, situação da diligência, compradores ligados com as condições de compra de cada um e notícias
- Dossiês em PDF (uso interno); item Evidências e o botão "+ Evidência" retirados

## v2.7 — 2026-11-14 · M&A no celular: Órbita livre e dossiê compacto
- Órbita no celular: o globo aparece inteiro, sem empresa aberta por cima; busca no topo, filtros por nível em uma linha, sem textos técnicos sobre o globo; o menu fica em uma linha com rolagem lateral
- Faixa de empresas com os targets (N3) primeiro; ao tocar, cartão curto (local, nível, risco, etapa, mandato) com "Abrir dossiê" sempre visível
- Dossiê compacto: título curto, resumo do target logo abaixo (risco, segmento, temperatura, etapa, mandato e próximo passo) e abas em uma linha com rolagem; no computador também ganha o resumo
- A Órbita deixa de abrir automaticamente uma empresa ao carregar (também no computador)
- Teste local com ajuste de tela para celular

## v2.6 — 2026-11-14 · Valuation: EBITDA apurado × múltiplos de mercado, sempre
- Comparativo fixo no Valuation (Síntese e Múltiplos de mercado), no relatório em PDF e no PowerPoint: EBITDA do target pela base contábil (balancete, sem ajustes) e pela base financeira (ajustes da Due Diligence com OK no valuation; também com OK só nas análises e a média ajustada dos exercícios) frente ao EV/EBITDA de companhias do mesmo segmento e de segmentos semelhantes, e às transações comparáveis
- Para cada EBITDA: enterprise value pela mediana do mesmo segmento e dos semelhantes, faixa p25 a p75 e equity, com desconto de liquidez de empresa fechada
- Múltiplo implícito do FCD moderado, do FCD otimista, do meio da faixa moderada e da proposta (LOI, MOU ou SPA, quando houver) sobre o EBITDA contábil e o ajustado, com a posição frente ao mercado
- Novos avisos: sem comparável do mesmo segmento (usa semelhantes), EBITDA ajustado mais de 20% diferente do contábil e proposta fora da faixa de mercado

## v2.5 — 2026-11-14 · M&A: base simplificada, mapa da Kinsey e risco só do target (N3)
- Importador do mapa de M&A da Kinsey em Excel com várias abas: vendedoras viram targets (N3), compradoras viram investidores (N1), assessorias e parcerias viram intermediadores (N2); blocos comprador × vendedor viram as ligações da Órbita; temperatura, mandato, faturamento, contato, site, observações e fichas ficam na "Situação no mapa" de cada empresa
- CNPJs das ligações conferidos na Receita pela semelhança do nome: CNPJ deslocado para a empresa vizinha é reatribuído à empresa certa, e CNPJ de outra empresa é rejeitado com aviso
- Risco sempre do vendedor: só os targets (N3) têm matriz de risco, investigação, NDA, questionário, documentos e diligência; investidores (N1) e intermediadores (N2) ficam com cadastro simples (Dados e M&A); o target fica "Em avaliação" até haver dado real
- Base M&A enxuta: abas Targets, Investidores, Intermediadores e Pipeline, com busca, filtros por temperatura e segmento, etapa, mandato, compradores ligados, último contato e próximo passo
- Menu simplificado: Órbita, Base M&A, Due Diligence, Análises financeiras, Valuation, Apresentação, Jurídico e Pós-aquisição; sem Evidências e Relatório soltos no menu
- Exemplo de demonstração reduzido ao Projeto Ipê; os dados reais do mapa não ficam no repositório nem na publicação, só no teste local entregue à Kinsey

## v2.4 — 2026-11-14 · M&A: diligência jurídica no Jurídico, globo só na tela principal
- Diligência jurídica dentro do Jurídico (sai da Due Diligence): o Jurídico passa a ter abas — Diligência jurídica (targets, questionário numerado, contratos dos últimos 3 a 5 anos, processos e contingências, evidências, relatório, procedimentos automáticos J-01 a J-04 e ajustes jurídicos), NDAs, mandatos e modelos, Honorários, e Contratos e pareceres
- Os ajustes jurídicos (ex.: contingências prováveis não provisionadas) continuam no fluxo de OK do consultor nas Análises financeiras e no Valuation
- Globo só na tela principal (Órbita), para ligar os pontos da rede: investidor (N1) → intermediador ou Kinsey Capital (N2) → target (N3); ao selecionar um ponto, a cadeia inteira fica em destaque; sem o ponto de "cliente contratante"
- Pastas de análise (Análises financeiras, Valuation, Apresentação, Pós-aquisição, Jurídico) sem globo: o mini globo virou o emblema que identifica cada pasta, com a lista dos targets
- Exemplo da cadeia informada pela Kinsey no teste local: Elis / Lavevras (N1) → Kinsey Capital (N2) → ServBrasil (N3), com local provisório até o CNPJ

## v2.3.1 — 2026-11-14 · Valuation: dívida líquida automática e equity value em todos os métodos
- Dívida líquida automática pelo balancete da data-base: empréstimos e financiamentos de curto e longo prazo, caixa e aplicações, parcelamentos tributários, mútuos com sócios e provisões para contingências; cada valor editável pelo consultor (com volta ao valor do balancete) e cada item pode ser excluído
- Ajustes de dívida da Due Diligence entram com o OK no valuation (pendentes aparecem, sem somar); complementos do consultor com tipo, valor base, ponderação e justificativa (contingências prováveis e possíveis, passivos trabalhistas e tributários, earn-out, dividendos e JCP, arrendamentos, mútuos, vencidos); botão para trazer as contingências possíveis da diligência jurídica; caixa mínimo operacional opcional
- Nova aba "Dívida líquida · EV → Equity" com a ponte do enterprise value ao equity value; síntese com enterprise value e equity value (líquido de dívidas) por método, em tabela e em dois gráficos de faixas; múltiplos, transações e P/L com EV e equity; relatório de valuation (PDF e PowerPoint) e apresentação pós-NDA com a ponte e o equity
- A mesma dívida líquida ajustada alimenta FCD, múltiplos, outras avaliações, PPA, matching e honorários

## v2.3 — 2026-11-14 · M&A: diligência jurídica, honorários, matching, buy-side e mapa da Kinsey
- Termos do M&A em todas as telas, PDFs e PowerPoints: sem "fornecedores"; N1 investidores, N2 intermediadores e parceiros, N3 targets (vendedores), Kinsey Capital no lugar de "cliente contratante", Base M&A no lugar de "cadeia"
- Diligência jurídica como área da Due Diligence: questionário inicial de 40 pontos (societário, contratos, endividamento, trabalhista, tributário, cível e consumidor, imobiliário, ambiental e regulatório, propriedade intelectual, compliance, LGPD e seguros) com documento esperado e evidência por resposta; inventário de contratos dos últimos 3 ou 5 anos e vigentes, com leitura automática de mudança de controle, exclusividade, não concorrência, multa, garantias, cessão vedada e renovação automática; processos e matriz de contingências (provável, possível, remota); evidências jurídicas; recomendações para o contrato conforme o lado da Kinsey; relatório em PDF com o advogado responsável
- Procedimentos jurídicos automáticos (J-01 a J-04): provisões × processos prováveis (gera ajuste de dívida sujeito ao OK do consultor), depósitos judiciais, contratos com mudança de controle e questionário; respostas de risco entram na matriz de risco do target; painel da diligência jurídica dos targets no Jurídico
- Modelo de honorários Kinsey no Jurídico: retainer mensal, success fee escalonado por faixa do valor da operação, mínimo, abatimento do retainer, cauda e parceiro originador, para venda e para compra, com simulador; preenche os modelos de mandato e mostra os honorários estimados de cada mandato (faixa do valuation ou LOI/SPA)
- Lado da Kinsey em cada target: vendedor (sell-side) ou comprador (buy-side, com o investidor cliente); análise de contratos pró-vendedor ou pró-comprador com redação sugerida para cada lado
- Matching investidor × target com pontuação explicada (segmento ou CNAE, faturamento, EBITDA, ticket frente ao valor, região, participação e restrições eliminatórias): investidores sugeridos no target e targets aderentes (ou busca buy-side) no investidor
- Interações e próximos passos por empresa; pipeline dos targets por etapa do funil e próximos passos na Base M&A
- Importação do mapa de M&A da Kinsey (Excel, LibreOffice, CSV ou colado) com modelo de planilha: nível, CNPJ, segmento, linhas de negócio, local, valores, intermediador e investidores de interesse; ligações automáticas, posição no globo e consulta dos CNPJs na Receita Federal (razão social, CNAE, endereço, sócios e situação)

## v2.2 — 2026-11-14 · M&A: Valuation comparativo, apresentação, pós-aquisição, relatórios e mercado
- Cadastro para valuation no dossiê do target: local, segmento e semelhantes, linhas de negócio (com % da receita), data-base, regime tributário, atuação, fundação, funcionários, clientes, sazonalidade e descrição; o valuation não é emitido com o cadastro incompleto
- Valuation · fluxo de caixa descontado: histórico de 2 a 3 exercícios (bloqueia com menos de 2) e períodos comparativos quebrados (ex.: 9 meses até setembro × mesmo período do ano anterior), receita por linha de negócio com crescimento nominal e real (IPCA de cada ano), WACC pelo CAPM com a base de apuração Kinsey (fonte, data e metodologia de cada parâmetro), cenário moderado (crescimento histórico e margem média) e otimista (premissas do consultor e novos negócios)
- Alertas que exigem justificativa do consultor (fundamento, documento de suporte e motivos reais): crescimento acima do histórico além da tolerância, margem acima da maior histórica, novos negócios e FCD com múltiplo implícito fora da faixa dos comparáveis; avisos de margem fora do setor, ajustes pendentes e Selic de mercado diferente da base; relatório sempre com os dois cenários e a faixa moderada como recomendada
- Valuation · múltiplos de mercado (EV/EBITDA, EV/Receita, P/L, margem do setor) com companhias do segmento e semelhantes, inclusão e exclusão por companhia, desconto de liquidez de empresa fechada; base Kinsey por cadastro ou planilha e atualização automática pela CVM (cadastro, FCA e DFP) com cotação pública
- Valuation · outras avaliações: transações comparáveis e patrimônio líquido ajustado; síntese comparativa com faixas por método
- Base de apuração e mercado: Selic, CDI, IPCA, PTAX, Focus (Selic e IPCA esperados) e IPCA anual do Banco Central, US Treasury 10 anos e notícias de juros, inflação e câmbio; aviso quando o mercado se afasta da base
- Apresentação: teaser antes do NDA (nome-código, região, números arredondados, gráficos de receita e EBITDA e de linhas de negócio, destaques automáticos, mercado e notícias positivas do segmento) e apresentação depois do NDA (empresa identificada, Due Diligence, materiais do vendedor, pesquisa da empresa, setor e região, faixa indicativa opcional); PDF e PowerPoint; reaproveitada no relatório de valuation
- Jurídico: análise inicial pró-vendedor de MOU, LOI e SPA (arquivo PDF/Word ou texto colado) em 17 pontos — teto e franquia de indenização, prazo das declarações, escrow, earn-out, ajuste de preço, MAC, sandbagging, solidariedade, garantias pessoais, pagamento a prazo, não concorrência, exclusividade, condições precedentes, rescisão, encargos e foro — com redação sugerida; validação do advogado
- Pós-aquisição: PPA (CPC 15 / IFRS 3) com preço do SPA ou do valuation, PL ajustado pela Due Diligence, mais-valias, carteira de clientes (MPEEM), marca (relief-from-royalty), tecnologia, contingências, IR diferido, não controladores e ágio; PDF; base de modelos (SPA, PPA e outros) com minuta SPA pró-vendedor e montagem de minutas com os dados do target
- Due Diligence: papéis de trabalho (código, objetivo, procedimento, resultado, evidência, preparado e revisado por) e relatório de alto nível em PDF (versão preliminar enquanto houver pendências); textos-padrão dos relatórios editáveis
- Firebase: funções "mercado" (diária) e "comparaveis" (mensal) do produto M&A, carregadas pelo núcleo quando o segmento traz functions/extra.js; "Atualizar agora" também para mercado e comparáveis
- Exemplos: Projeto Ipê com 3 exercícios, comparativo de 9 meses, linhas de negócio, premissas otimistas justificadas, comparáveis e transações de exemplo

## v2.1 — 2026-11-14 · M&A: Due Diligence, Análises financeiras e Valuation
- Due Diligence no lugar de Auditoria (a base de auditoria anterior continua numa aba): importação de balancete (Excel, LibreOffice, CSV ou colado), com leitura das colunas de conta, descrição e saldo (D/C ou sinal), só contas analíticas, classificação automática de cada conta (revisável na prévia) e anualização de balancetes parciais
- Procedimentos automáticos por área — contábil (fechamento, contas transitórias, saldos invertidos, depreciação CPC 27, perdas com clientes CPC 48, estoques CPC 16, arrendamentos CPC 06), financeira (não recorrentes, pró-labore, mútuos com sócios, liquidez, endividamento, capital de giro), trabalhista (férias e 13º CPC 33, INSS e FGTS em atraso, processos, pejotização) e tributária (parcelamentos, tributos em atraso, contingências, carga sobre a receita, regime) — e procedimentos mínimos de cada consultor especialista, com conclusão registrada; consultor responsável por área
- Ajustes propostos pelos procedimentos e ajustes do consultor vão para as Análises financeiras aguardando OK; o consultor pode revisar o valor, aprova ou recusa com fundamento, e só então os indicadores mudam
- Análises financeiras com mini globo dos targets: EBITDA reportado, ajustado e informado; ponte do EBITDA; resultado e balanço reportado × ajustes × ajustado; dívida líquida; capital de giro e prazos; liquidez, endividamento, margens e retorno
- Valuation com mini globo: ajustes com OK nas análises aguardam um segundo OK no valuation, com o impacto estimado no enterprise value e no equity antes da aprovação; múltiplos de EBITDA e de receita por segmento, fluxo de caixa descontado (5 anos e perpetuidade, com sensibilidade), faixas de valor por método, ponte do equity e premissas editáveis
- Exemplos: balancetes do Projeto Ipê e do Projeto Aroeira, consultores por área e ajustes em várias etapas de aprovação

## v2.0 — 2026-11-14 · Kinsey Capital – M&A (primeira versão do produto)
- Órbita mundial do M&A: investidores (N1, inclusive no exterior), intermediadores e parceiros (N2, com a Kinsey Capital) e targets (N3, empresas com potencial de venda); cores por nível (alternável para risco), targets descartados em cinza; ligações target → intermediador → Kinsey e target → investidores indicados (em destaque ao selecionar); país no cartão e na lista; visão inicial com Américas e Europa
- Cartão da órbita com o resumo M&A: etapa do funil, segmento, receita e EBITDA, mandato e investidores indicados (target); tese, ticket e oportunidades (investidor); acordo e targets originados (parceiro)
- Dossiê · aba M&A: tese do investidor e oportunidades (nome do target protegido até o NDA do mandato); acordo de originação do parceiro; funil do target com motivo de descarte, financeiros (margem e dívida líquida/EBITDA), intermediador, mandato (nome-código sugerido, exclusividade, prazo, retainer, success fee) e acesso de cada investidor ao mandato (teaser, NDA, data room, IOI, LOI, declinou)
- Jurídico · Modelos padronizados Kinsey: NDA geral, NDA do mandato, mandato de venda (sell-side), mandato de compra (buy-side) e acordo de originação; textos provisórios até o Jurídico incluir o oficial pelo próprio sistema (versão registrada, volta ao provisório quando quiser); o NDA oficial passa a valer no aceite do dossiê
- Jurídico · NDAs, mandatos e acordos por empresa, com "Gerar": documento preenchido com os dados do cadastro e do mandato, para copiar ou baixar em PDF (marcado como provisório enquanto não houver o oficial)
- Conteúdo M&A: questionário (tese e KYC do investidor, acordo do parceiro, societário, financeiro, fiscal, trabalhista, ambiental e contratos do target), checklist do data room, investigação (CEIS/CNEP, sanções, recuperação judicial, contingências), cláusulas de SPA, tipos de contrato (LOI, SPA, acordo de investimento e de sócios, mandato), indicadores de mercado (Selic, IPCA, dólar, Ibovespa) no lugar das cotações
- Exemplos fictícios: 6 investidores (São Paulo, Belo Horizonte, Porto Alegre, Nova York, Londres e Madri), 4 intermediadores e parceiros (Kinsey Capital, Recife, Curitiba e Lisboa), 8 targets e 2 mandatos (Projeto Ipê e Projeto Aroeira)
- Núcleo: pontos de extensão da órbita (ORB_HOME, ORB_COR, EXT_ORB, EXT_TARGET), país da empresa, órbita não trava a tela se as bibliotecas do globo não carregarem, segmento pode dispensar os exemplos de notas fiscais (OPS_SEM_DEMO) e construção inclui `app/ma.js` quando o segmento tiver

## v1.9.11 — 2026-11-13
- Botão "Relatório de pontos" do topo funciona com qualquer ficha aberta e abre um menu: relatório geral (PDF, todos os fornecedores), resumido e completo do fornecedor aberto ou selecionado, análise prévia/WhatsApp e tela Relatório
- Relatório por fornecedor em duas versões, com os mesmos pontos da base: resumido (1 página: risco, situação da análise, andamento, principais pontos com recomendação e revisões) e completo; disponíveis na consulta rápida (celular e computador), na tela Relatório, no dossiê e no menu do topo
- Tela Relatório: o quadro geral passa a se chamar "Relatório geral · todos os fornecedores"

## v1.9.10 — 2026-11-13
- Órbita: a busca leva o título "Análise prévia do fornecedor"; depois de escolher, o botão "Análise prévia" ao lado do nome reabre o resumo do fornecedor

## v1.9.9 — 2026-11-13
- Consulta por CNPJ (celular e computador): ao digitar um CNPJ que não está no sistema, o fornecedor é pré-cadastrado (N1, ajustável) e passa na hora por todas as análises automáticas (Receita Federal, listas oficiais da empresa e dos sócios, atividade/CNAE, investigação, questionário, mapeamento e risco); em seguida abre o resumo; perfis só de leitura veem a análise prévia sem gravar
- Situação da análise no resumo e no PDF: "Análise prévia, sujeita a auditoria, monitoramento e compliance jurídica" (sem auditoria ainda), "Fornecedor em inspeção de auditoria e investigação jurídica" (em andamento) ou "Análise concluída"
- Resumo de até 20 linhas (WhatsApp, compartilhar, copiar) e relatório completo em PDF na hora, mesmo prévio
- Correção: consulta avulsa às listas oficiais não grava registro na base

## v1.9.8 — 2026-11-13
- Notas fiscais confrontadas com a cotação da commodity na data de emissão (histórico diário da função agendada; sem histórico, cotação manual ou atual): abaixo do mercado (mais de 20% médio, mais de 40% alto: compra sem nota ou em dinheiro, subfaturamento, origem ilícita) e acima do mercado (mais de 30% médio, mais de 60% alto: superfaturamento, lavagem de dinheiro, vantagem a terceiros); preço por kg fora da média do próprio fornecedor; valores redondos; conferência "Preço × cotação do dia" no detalhe da nota e recomendação com Lei 9.613/1998 no relatório
- Consulta rápida do fornecedor (celular e computador): busca por nome ou CNPJ abre o resumo do risco, principais riscos para a compra, andamento e revisões (auditoria e Jurídico), com relatório prévio em PDF, envio por WhatsApp, compartilhar e copiar; também pelo botão "Resumo rápido" na Órbita e na tela Relatório
- Relatório por fornecedor identificado como "prévio" enquanto a análise não está concluída

## v1.9.7 — 2026-11-13
- Rastreio da origem pelas notas fiscais (Auditoria · Operações comerciais e dossiê · Testes): liga as notas de venda e de compra pelo CNPJ/CPF e mostra, por fornecedor, de quem comprou (N2) e de quem esses compraram (N3), com toneladas, valor e notas; aponta venda maior que a compra com nota (origem sem nota), quem vende sem estar na cadeia, quem está cadastrado vendendo para outro e elos de risco alto; para o N3, pede a conferência do documento de origem; exportação para Excel
- Período padrão do ano em análise: de 1º de janeiro até o fim do último mês com nota emitida (rastreio e balanço de massa)
- Balanço de massa: compras identificadas também nas notas de entrada emitidas pelo próprio comprador

## v1.9.6 — 2026-11-13
- Importação de documentos de fornecedor não cadastrado: o sistema prepara o cadastro com os dados do cartão CNPJ ou do documento (razão social, CNPJ, município, UF, abertura, CNAE; nível e para quem vende ajustáveis na prévia); "+ Novo fornecedor" para cadastrar na hora; sem razão social legível, entra com nome provisório substituído pela Receita Federal
- Depois de cadastrar: Receita, listas oficiais, investigação, checklist, mapeamento (posição na cadeia pelo CNAE/objeto) e risco automáticos
- Questionário respondido automaticamente onde os dados permitem (empresa ativa na Receita, certidões negativas, licença e alvará, lista do MTE, embargos IBAMA, CAR, pagamentos bancários ou em espécie, NDA); marcado "respondido automaticamente" com a fonte; resposta da equipe nunca é sobrescrita
- Cartão CNPJ: leitura dos dois layouts da Receita (data de abertura ou data de inscrição/constituição, CNAE com "(*)", título em duas linhas); idade do cartão pela data de emissão
- Arquivos .rar, .7z e .tar recusados com aviso (usar .zip ou arquivos soltos)

## v1.9.5 — 2026-11-13
- Satélite e Google Earth 3D abrem com marcador no endereço do fornecedor (mapeamento, Receita Federal ou cartão CNPJ anexado) ou, sem endereço, na coordenada exata; satélite com aproximação de 600 m
- Cadeia: tabela compacta, cabe inteira na tela (andamento menor, motivo em até 3 linhas, classificação mais estreita)

## v1.9.4 — 2026-11-13
- Menu: Órbita volta a ser o primeiro item; Relatório passa a ser o último

## v1.9.3 — 2026-11-13
- Relatório de pontos geral com painel gráfico: fornecedores por nível de risco, risco alto por nível da cadeia, documentos pendentes por nível e andamento da análise por etapa
- Relatório de pontos por fornecedor (N1, N2 ou N3), na tela Relatório (busca e gerar) e no dossiê: risco e pontuação, gráficos dos pontos por critério, do andamento e dos documentos, todos os pontos com recomendação e norma, checklist com comentários, investigação, Jurídico (NDA, contratos, pareceres e ressalvas com OAB), cadeia abaixo do fornecedor e notícias do local

## v1.9.2 — 2026-11-13
- Andamento do projeto: percentual de conclusão por fornecedor e geral, por etapa (questionário, documentos, investigação, inspeção, pareceres do Jurídico e NDA, fotos) e por nível; painel "Andamento do projeto" na Cadeia e no Relatório; coluna "Andamento" na lista da Cadeia; quadro "Andamento da análise" com o que falta no dossiê (aba Dados)
- Evidências: escolha do fornecedor (mostra só os documentos dele) e busca por fornecedor, CNPJ ou documento; "Baixar documentos (.zip)" com pastas por nível, fornecedor e tipo e um índice em planilha (pré-análise e pareceres com advogado e OAB) para advogados e para o cliente contratante
- Publicação: o script libera no Storage o download dos documentos pelo próprio sistema (necessário para o .zip)

## v1.9.1 — 2026-11-13
- Balanço de massa: período (de/até, padrão últimos 12 meses) com a explicação de cada campo (estoque inicial no início do período, compras e vendas do período, estoque final contado na inspeção) e botão para calcular compras e vendas pelas notas fiscais importadas; aviso da cotação de referência aponta para Auditoria · Operações comerciais
- Cobre e Metal · Mapeamento:
  - endereço preenchido automaticamente pela Receita Federal ou pelo cartão CNPJ anexado (editável; avisa se o endereço informado for diferente)
  - posição na cadeia, produtos e mercados marcados automaticamente pelo objeto social e pelo CNAE; alerta (e +3 na matriz de risco) quando a atividade da empresa não confere com cobre e metais (ex.: restaurante)
  - bloco 6 renomeado para "Para quem o fornecedor vende" (opcional), com explicação e a primeira linha preenchida (cliente contratante ou comprador da cadeia, com o volume das notas)
- Cobre e Metal · Conformidade: cada requisito mostra o documento esperado, tem "+ Anexar" (com identificação automática do tipo e pré-análise) e lista os arquivos ligados; a evidência objetiva é preenchida com o documento anexado
- Cartão CNPJ: leitura do endereço (logradouro, número, bairro, CEP)

## v1.9 — 2026-11-13
- Investigação do fornecedor respondida automaticamente, sem clicar: Cadastro de Empregadores do MTE e embargos do IBAMA (listas oficiais); dívida ativa (CND federal, estadual e municipal anexadas); processos trabalhistas (CNDT); protestos (certidão de protestos); licenças e alvarás (documentos anexados e validade); notas frias (notas importadas: chave, sequência, datas, emitente); pagamento em espécie (pagamentos importados)
- O que o sistema não consegue concluir fica "Não consultado" com o motivo ao lado (ex.: falta a CND municipal; lista ainda não carregada; sem base pública unificada para processos criminais; PEP exige CPF completo)
- Respostas marcadas "AUTOMÁTICO" com a data; resposta ou observação manual da equipe nunca é sobrescrita; respostas já registradas antes também são preservadas
- Observação em linha inteira, para ler o motivo completo

## v1.8.9 — 2026-11-13
- Dossiê · Documentos: título e botões fixos no topo ao rolar; "Importar vários documentos ou .zip" no topo; botão "+ Anexar" ao lado de cada item do checklist (abre a evidência já com o fornecedor e o tipo do item) e os arquivos ligados a cada item aparecem nele; comentário só aparece quando há ressalva ou texto
- Importação de documentos aceita .zip (vários documentos dentro); depois da importação, os itens do checklist sem documento ficam "Pendente" com o comentário para solicitar ao fornecedor
- Alvará, AVCB, MTR, CDF, CTF e CNDs reconhecidos são encaixados no tipo de evidência de cada sistema (ex.: "Licença / alvará" no Cobre e Metal)

## v1.8.8 — 2026-11-13
- Checklist documental: novo estado "Com ressalva" com comentário; ao anexar e analisar um documento, o sistema marca sozinho o item correspondente: "Conferido" quando a pré-análise não aponta problema, ou "Com ressalva" com o que não fecha (ex.: contrato social sem assinatura, certidão vencida, positiva, município diferente); documento em foto fica com ressalva para conferência manual; o parecer do advogado prevalece; a marcação manual do revisor não é sobrescrita
- Pré-análise: contrato social e contratos sem indício de assinatura passam a ser apontados

## v1.8.7 — 2026-11-13
- Evidências: "Importar vários documentos" (na tela e dentro de Nova evidência); o sistema lê cada arquivo, identifica o tipo pelo conteúdo (ou pelo nome do arquivo) e o fornecedor N1, N2 ou N3 pelo CNPJ/CPF do documento (ou o fornecedor escolhido), avisa quando o CNPJ é de outro fornecedor e já roda a pré-análise; o que não for identificado fica em "A classificar", com fila para o revisor em Evidências
- Pré-análise automática de mais documentos: CND IBAMA, CTF IBAMA (Certificado de Regularidade), CND estadual, CND municipal, AVCB (Corpo de Bombeiros), MTR nacional (SINIR), MTR INEA (RJ), CDF (destinação final) e alvará de funcionamento; aponta certidão positiva, documento vencido ou a vencer, situação irregular ou cancelada, município diferente do cadastro, fornecedor fora do manifesto, falta de confirmação de recebimento e atividade que não cobre o produto; os pontos entram na matriz de risco e na fila do Jurídico

## v1.8.6 — 2026-11-13
- Cadeia: busca corrigida; encontra fornecedores N1, N2 e N3 por nome (sem diferença de acentos e com acentos corrompidos), CNPJ/CPF com ou sem pontuação, município, tipo ou nível; a linha do cliente (N0) some enquanto há busca
- Auditoria e Jurídico: caixa de busca de fornecedor no topo; mostra os encontrados (nível, CNPJ/CPF, local e risco), abre o dossiê (Auditoria) ou a ficha jurídica (Jurídico) e filtra a tela (mini globos, alertas, cadeia, tabela de inspeções, fila do Jurídico, contratos, NDA e ressalvas)

## v1.8.5 — 2026-11-13
- Órbita: busca de fornecedor por nome, CNPJ/CPF ou município no topo do globo; mostra nível, documento, local e risco; ao escolher (clique ou Enter), o globo aproxima e seleciona o fornecedor, ligando o nível se estiver oculto
- Celular: o botão Relatório do topo fica só no menu de baixo, para não apertar o cabeçalho

## v1.8.4 — 2026-11-13
- Importar notas fiscais, pedidos ou pagamentos: escolha do fornecedor das operações (automático pelo CNPJ/CPF, ligando cada nota ao N1, N2 ou N3 já cadastrado; ou um fornecedor específico para as operações sem cadastro correspondente) e período de importação (de/até); a prévia mostra a qual fornecedor e nível cada registro será ligado e quantos ficam fora do período
- Lista de operações: filtros por fornecedor e por período, além de nível e alertas

## v1.8.3 — 2026-11-13
- Relatório de pontos virou o primeiro item do menu principal ("Relatório"): tela própria com download do PDF e do PowerPoint, distribuição de risco, cadeias com risco alto, ressalvas do Jurídico, principais pontos com fornecedores e recomendação, e fornecedores em risco alto; o botão do canto superior direito abre essa tela; saiu do meio da Auditoria
- Cotações automáticas de hora em hora, das 8h15 às 19h15 (antes 3 vezes ao dia); a barra mostra o horário da última atualização

## v1.8.2 — 2026-11-13
- Dossiê do fornecedor: a barra de abas (Dados, Investigação, NDA / LGPD, Questionário, Documentos, Inspeção…) era espremida pelo quadro "Por que ALTO risco" e os nomes ficavam cortados; agora a barra mantém a altura e só o conteúdo rola

## v1.8.1 — 2026-11-13
- Cobre e Metal, Açaí, Gado e Café: retirado o termo "trader", que é próprio das cadeias de cacau e soja. Cada sistema usa os termos da própria cadeia: Cobre e Metal com fornecedores (recicladoras, distribuidoras, fundições), subfornecedores (ferros-velhos, depósitos, sucateiros e intermediários) e origens do material. Importação da base, mensagens, Jurídico, guia, NDA, cadeia N1 → N2 → N3 e relatório
- Cobre e Metal: tipo "Trading de metais" passa a "Comercial / importadora de metais" (cadastros antigos continuam reconhecidos) e mapeamento "T4 · Importador / comercializador"

## v1.8 — 2026-11-13
Cotações automáticas
- Função agendada no Firebase grava as cotações públicas do dia: dólar PTAX (Banco Central), soja, café arábica e robusta e boi gordo (CEPEA/ESALQ), cacau (ICCO, convertido para R$/@) e cobre e alumínio (LME, convertidos para R$/kg); histórico diário e indicação de "última disponível" quando a fonte não publica
- Barra de cotações e janela "Cotações" mostram as automáticas quando não há valor manual; o valor manual continua com prioridade; administrador tem "Atualizar agora"
- Açaí, aço, sucata e praças locais do cacau não têm fonte pública diária: continuam manuais, com aviso na janela
- Cotação de referência saiu do Jurídico e foi para Auditoria · Operações comerciais (pesos, valores e transações); nota com preço por kg mais de 20% abaixo da referência vira alerta

Listas oficiais automáticas
- A mesma função baixa todo dia às 6h30 o Cadastro de Empregadores (MTE, Portaria Interministerial MTE/MDHC/MIR nº 18/2024), CEIS e CNEP (CGU) e embargos do IBAMA; só regrava quando a lista muda
- Listas gravadas em blocos (um documento por prefixo), lidas sob demanda; a tabela mostra "automática · fonte · conferida em"; administrador tem "Atualizar listas oficiais agora"
- Leitor de PDF corrigido para documentos com janela de compressão maior que a declarada (a lista do MTE passou de 134 para 496 documentos)

Relatório de pontos
- Botão fixo no canto superior direito, em todas as telas: resumo da distribuição de risco, principais pontos e download
- Novas seções: cadeia N1 → N2 → N3 e exposição; notícias públicas nos locais de operação; ressalvas e considerações do Jurídico com nome e OAB

Auditoria
- Alertas prioritários no início: fornecedores em risco alto (com motivos), quem tem risco alto abaixo na cadeia, listas restritivas, notas com alerta alto e notícias no local
- Cadeia N1 → N2 → N3: risco de cada elo, exposição herdada pela trader, notícias que citam o município ou o estado (com busca de notícias do local e da empresa) e exportação para Excel
- Tabela "Auditoria e inspeções": filtros por nível (N1, N2, N3) e por risco, ordenação (maior risco, nível, A–Z, UF), expandir/recolher e exportação para Excel

Jurídico
- Modos Síntese e Expandido
- "Importar contrato social, cartão CNPJ e outros": estatuto, procurações, certidões, licenças e contratos importantes com pré-análise automática (sócios cruzados com as listas oficiais e com a Receita)
- "Registrar consideração / ressalva": consideração, ressalva, aprovação com ressalvas ou reprovação, com nome e OAB; soma na matriz de risco e entra no relatório de pontos
- NDA "Sem aceite": ordem alfabética, filtros por nível e por risco e cor do risco em cada fornecedor

Correções
- Nomes com acentos corrompidos em importações antigas (ex.: "IMPORTAÃ‡ÃƒO") exibidos corretamente e corrigidos no cadastro

## v1.7.1 — 2026-11-13
- Correção: o quadro "Órgãos públicos e listas restritivas" aparecia no fim da página, fora da seção "Análise técnica completa"; agora fica dentro dela

## v1.7 — 2026-11-13
Auditoria
- Visão geral com mini globos por fornecedor (N1, N2 e N3 em colunas; cor do risco; ponto da localização), filtros por risco e contagem de alto risco por nível; clique abre a análise técnica do fornecedor (dossiê, aba Risco)
- Análise técnica completa (tabelas, alertas, testes, inspeções, órgãos públicos, critérios) recolhida em uma seção que abre ao clicar; relatório de pontos logo abaixo do painel

Jurídico
- Fila por prioridade: 1 alto risco, 2 médio, 3 baixo, em avaliação; ícones por nível (◆ N1, ■ N2, ● N3) e número de pendências (contratos sem parecer, documentos aguardando parecer, NDA a validar); filtro por nível
- Ficha jurídica do fornecedor com contratos, documentos e NDA; listas completas recolhidas

Questionários aos fornecedores
- "Enviar questionários" (Auditoria e dossiê): e-mail e WhatsApp de cada fornecedor, registro do convite ao Portal (perfil fornecedor, cadastro pré-preenchido), mensagem pronta e editável para WhatsApp, e-mail ou cópia, e situação (sem convite, convidado, respondido)
- A equipe do cliente (auditoria e jurídico) pode convidar fornecedores do próprio cliente; os demais perfis continuam só com o administrador
- No questionário, cada resposta mostra se foi dada pelo fornecedor (Portal) ou pela equipe

## v1.6 — 2026-11-13
Diligência automática (sem clicar no dossiê)
- Fornecedor cadastrado, importado, vindo do Portal ou do mapeamento pelas notas: Receita Federal consultada e listas restritivas cruzadas em segundo plano, logo após a inclusão (quem acabou de entrar vai para a frente da fila)
- Nota fiscal, pagamento ou pedido importado: CNPJs de emitentes e favorecidos ainda fora da cadeia também são consultados; a nota recebe alertas de CNPJ inapto, nota anterior à abertura do CNPJ, atividade sem o produto e emitente em lista restritiva; o mapeamento automático mostra a situação de cada um
- Documento anexado (contrato social etc.): sócios encontrados cruzados com as listas e risco recalculado
- Lista oficial atualizada: todos os fornecedores verificados de novo
- Receita renovada a cada 30 dias (nova tentativa em 6 horas se o serviço falhar); listas sempre que mudar o que deve ser verificado
- Riscos atualizados no globo, na cadeia, na auditoria e no relatório; aviso "Diligência automática: consultando…" enquanto há consultas
- Continuam manuais apenas consultas que exigem certificado digital ou autorização do cliente (situação da nota na SEFAZ, e-CAC)

## v1.5.1 — 2026-11-12
- Correção: links "Satélite" (Google Maps) e "Earth 3D" (Google Earth) dos fornecedores e o link do GPS das evidências não abriam nos sistemas Cobre e Metal, Soja, Café e Açaí (a troca da unidade de preço "/@" alterava o endereço do mapa). Os links agora são montados por função e a construção confere que estão corretos.

## v1.5 — 2026-11-12
Portal do Fornecedor (N1, N2 e N3)
- O Portal não recebe critérios de avaliação: a construção gera os dados do Portal só com o texto das perguntas e dos documentos (sem a resposta considerada risco, pesos, testes de auditoria, regras de análise, cláusulas, fontes e alertas) e para com erro se algum desses dados aparecer
- Telas sem sinal de risco: botões neutros (sem vermelho em "Não tenho"), sem classificação, pontuação ou matriz
- NDA e termo LGPD obrigatórios antes do questionário, documentos, fotos e envio; aceite só depois de abrir o termo completo; novo aceite quando a versão do termo muda; registro de data, versão, e-mail e navegador
- Quadro "Seus dados e a LGPD" na entrada: finalidade, quem acessa, o que o fornecedor vê e direitos do titular
- Questionamentos e documentos adicionais do cliente aparecem no Portal (cópia sem peso e sem critério, liberada pelas regras do banco só ao fornecedor do próprio cliente)
- "Não tenho" e "Não se aplica" exigem justificativa; seção "Outros documentos" com descrição e justificativa obrigatórias
- Situação do envio (enviado, recebido pela Kinsey BR) e reenvio para completar documentos

Sistema
- Dossiê → Documentos mostra as respostas do fornecedor pelo Portal: documentos que não tem ou não se aplicam, com justificativa, e outros documentos enviados
- Documentos do Portal entram na pré-análise do Jurídico com a justificativa do fornecedor

## v1.4 — 2026-11-12
Questionamentos e documentos adicionais
- Inclusão manual, por importação (Excel, ODS, Word, CSV, TXT, PDF; colunas Pergunta/Documento, Níveis, Tema, Risco quando, Peso, ou uma pergunta por linha) ou por sugestões automáticas
- Sugestões automáticas a partir dos alertas encontrados na cadeia (notas sequenciais, pagamentos a terceiros ou em espécie, objeto da nota, capacidade, CNAE, listas restritivas, certidões) e de um banco de boas práticas
- Aviso de duplicados: na inclusão manual, na pré-visualização da importação e das sugestões (duplicados já vêm desmarcados) e no quadro "Possíveis duplicados" da lista, com exclusão direta; compara com os obrigatórios do sistema e com os adicionais
- Planilha modelo para download

## v1.3 — 2026-11-12
Pré-análise de documentos para o Jurídico (N1, N2 e N3)
- Documentos anexados em Evidências ou enviados pelo Portal do Fornecedor são lidos na entrada (PDF com texto, Word, TXT/XML) e classificados: contrato social/alteração, cartão CNPJ, certidões (federal, CNDT, FGTS), licença ambiental, CAR, procuração e contrato comercial
- Pontos a investigar com a providência sugerida: CNPJ e razão social diferentes do cadastro, registro na Junta, capital social baixo para o volume, objeto social sem o produto, CPF de sócio inválido, sócio também fornecedor, sócio em comum com outro fornecedor, sócio que recebe pagamentos, sócio em lista restritiva, quadro de sócios diferente da Receita, certidão positiva ou vencida, cartão CNPJ irregular, licença vencida, CAR cancelado/pendente, procuração vencida, contrato sem cláusulas de compliance
- Fila "Pré-análise de documentos" no Jurídico, com parecer do advogado (aprovar, ressalvas, reprovar), minuta automática, nome e OAB; o parecer prevalece sobre a pré-análise na matriz de risco

Órgãos públicos e listas restritivas
- Receita Federal consultada automaticamente pelo CNPJ ao abrir o dossiê (e em lote): situação, abertura, CNAE, capital, natureza, porte/MEI, endereço e sócios; situação e abertura preenchidas na Investigação; alertas de CNAE sem o produto, MEI ou capital incompatível com o volume, UF/município e razão social divergentes
- Listas oficiais carregadas pelo administrador (Cadastro de Empregadores do MTE, CEIS, CNEP, áreas embargadas do IBAMA, lista própria) cruzadas com fornecedor, sócios (contrato social e Receita) e favorecidos de pagamentos, sem enviar CPFs a terceiros

Mapeamento automático da cadeia
- Fornecedores identificados nas notas (XML, PDF, SPED, planilha e notas anexadas em Evidências) que vendem ao cliente, a um N1 ou a um N2 são sugeridos como N1, N2 ou N3 com o comprador, volume e local; inclusão individual ou em lote, com consulta à Receita e às listas e classificação de risco automática

Organização
- Operações comerciais passam para dentro da Auditoria (conferência pelos auditores do cliente); Jurídico concentra documentos societários, contratos e pareceres
- Notas fiscais anexadas como evidência entram automaticamente nas operações comerciais

## v1.2 — 2026-11-12
Questionamentos e documentos adicionais
- Além dos obrigatórios, o administrador e os editores do cliente incluem questionamentos de risco e compliance e documentos adicionais, por nível (N1/N2/N3) e tema
- Cada item tem peso na matriz de risco: Alto (6 pontos, leva o fornecedor a alto risco), Médio (3) ou Baixo (1); questionamento define se o risco é a resposta Sim ou Não; documento conta quando está Pendente
- Itens podem ser editados, desativados ou excluídos (com confirmação); ficam separados por cliente

Operações comerciais (nova tela "Operações" e aba no dossiê do fornecedor)
- Importação de notas fiscais: XML da NF-e (um, vários ou ZIP), evento de cancelamento, DANFE em PDF (cópia ou espelho), foto, planilha da base de notas e SPED Fiscal (EFD)
- Importação de pedidos de compra (planilha, Word, PDF, foto) e pagamentos (retorno CNAB 240, extrato OFX, planilha, comprovante em PDF ou foto)
- Pré-visualização, conferência dos dados lidos de PDF e foto, lançamento manual, substituição de registros já importados e desfazer importação
- Conferências automáticas: chave de acesso (dígito e coerência), situação (protocolo, cancelamento, SPED ou consulta registrada), emitente (CNPJ, cadastro, situação na Receita, abertura, UF), comprador da cadeia, produto (NCM do segmento) e CFOP, numeração repetida, fora de ordem ou sequencial (possível noteira), soma dos itens, preço por kg, volume × capacidade, pedido × nota (fornecedor, produto, preço, quantidade, data) e pagamento × nota (favorecido terceiro ou pessoa física, espécie, nota cancelada paga, valor acima, antecipação, fracionamento, pagamento sem nota)
- Alertas alto/médio/baixo entram na matriz de risco e no relatório de pontos (seção própria, recomendações e base legal)
- Produto de cada segmento (NCM aceitos) definido no data.js do segmento (OPS_PROD)

Outros
- Relatório do Cobre e Metal: títulos da tabela de conformidade não se sobrepõem mais

## v1.1 — 2026-11-12
- Parecer jurídico com advogado responsável: nome completo e OAB (UF e número) obrigatórios para aprovar, aprovar com ressalvas ou reprovar
- OAB conferida e padronizada (ex.: "sp 123456" vira "OAB/SP 123.456"); campos preenchidos com o último advogado usado
- Minuta do parecer termina com bloco de assinatura (local e data, nome, OAB)
- Lista de contratos e tela do contrato mostram o advogado responsável
- Validação jurídica do NDA/LGPD também registra o advogado e a OAB
- Relatório de pontos: coluna "Advogado responsável" nos contratos e linha de responsáveis técnicos (PDF e PowerPoint)

## v1.0-cadeias — 2026-11-12
Primeira versão da plataforma. Os sistemas gerados são idênticos aos pacotes entregues em 12/11/2026
(conferido arquivo por arquivo nos 6 sistemas).

Sistemas: Cacau, Soja, Açaí, Gado, Café, Cobre e Metal.

Inclui:
- Vários clientes por sistema ("Cliente – nome", CNPJ), usuários cadastrados pelo administrador, dados separados por cliente
- Importação de fornecedores N1/N2/N3 em Excel, ODS, CSV/TXT, Word e PDF; substituição pelo CNPJ; exclusão com confirmação
- Relatório de pontos (riscos, envolvidos, recomendações, normas e legislação) em PDF; PowerPoint para o administrador
- Cobre e Metal: mapeamento da cadeia e conformidade com requisitos (questionário setorial), com sugestões automáticas
- Cacau: N1 Traders, N2 Fornecedores, N3 Produtores
- Testes de auditoria, guia de evidências e análise de cláusulas

Pacote de referência anterior à plataforma: KinseyTec_v1.0_cadeias_2026-11-12.zip
(sha256 0b91094f1adcd1c18614cf6e9df52a2c06044115c23ce22d2065d07077378701)

## Próximas
- v1.1 — produto M&A (`produtos/ma`)
- v1.2 — produto Fraudes e Investigações (`produtos/fraudes`)
