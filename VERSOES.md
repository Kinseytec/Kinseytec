# Registro de versões

## v2.86 — 2026-11-18 · "Cliente da Órbita?" também no Valuation e na Due Diligence
- Avaliação de ativos, Valuation e Due Diligence: quadro "Trabalho" com "Cliente da Órbita?" e o "Sim" já marcado; com Sim, cadastro, Receita, balancetes e análises vêm do cadastro inicial
- "Não, trabalho novo": só então aparece o cadastro do cliente novo (CNPJ digitado ou lido do cartão CNPJ, razão social, data-base, finalidade da área, local e contratante) e a importação do balanço do ano e demais documentos (reconhecidos automaticamente) ou dos balancetes mensais do ano (abre a importação por ano); o trabalho fica marcado como avulso e fora do globo da Órbita
- "Dados do trabalho" revisa data-base, finalidade, local e contratante de cada área

## v2.85 — 2026-11-18 · Indicadores de mercado e barra do topo em movimento
- Análises financeiras: quadro "Mercado e indicadores macroeconômicos" com Ibovespa, small caps, IFIX, dólar, euro, S&P 500, Nasdaq, petróleo Brent, ouro e bitcoin (com a variação do dia), Selic, CDI, IPCA 12 meses e Treasury de 10 anos; expectativas do Focus (Selic, IPCA e PIB); as 5 maiores empresas listadas do setor da empresa consultada (ação, preço, variação e valor de mercado); maiores altas e baixas do dia entre as maiores da B3
- Servidor: nova rotina "bolsa" a cada 30 minutos no pregão (9h às 18h, dias úteis), com cotações do Yahoo Finance (atraso de até 15 minutos) e as empresas da CVM/B3
- Relatórios: a seção "Indicadores macroeconômicos e mercado" entra no relatório de análises financeiras e no teaser e na apresentação (prospecção)
- Barra de mercado do topo corre em movimento contínuo com os indicadores (pausa ao passar o dedo ou o mouse; parada para quem prefere menos movimento)

## v2.84 — 2026-11-18 · Valuation: apuração da dívida líquida no lugar de "Outras"
- Abas: Síntese, Base, FCD, Múltiplos e outras (as outras avaliações passam para dentro de Múltiplos), Dívida líquida, Relatório
- Dívida líquida apurada pelo balancete: empréstimos de curto e longo prazo, (−) caixa e equivalentes, parcelamentos tributários, partes relacionadas pelo líquido (mútuos no passivo menos mútuos no ativo), provisões para contingências, contingências prováveis da diligência jurídica não provisionadas (sem contar em dobro com a Due Diligence) e, para o consultor marcar, contingências possíveis e fornecedores acima do prazo usual (prazo médio de pagamento acima de 90 dias)
- Na Síntese, o quadro sintético mostra enterprise value − dívida líquida = equity value; "+ Composição da dívida líquida" abre a apuração

## v2.83 — 2026-11-18 · Valuation: perpetuidade pelo PIB do setor e beta usado em destaque
- Abas do Valuation: "Base" logo depois da "Síntese"
- Crescimento real na perpetuidade: média do PIB projetado do setor para os próximos 5 anos, pelo Focus do Banco Central (agropecuária, indústria ou serviços, conforme o segmento); sem o setor, PIB total; sem Focus, o valor da base de apuração. O consultor pode alterar por empresa em FCD › Premissas
- Base: tabela do PIB projetado (total e por setor, com a média) e a perpetuidade usada na empresa em consulta; o servidor passa a buscar o PIB no Focus todo dia
- Base: quadro em destaque com o beta usado no WACC da empresa em consulta (setor, beta desalavancado, dívida/patrimônio, beta realavancado, custo do capital próprio e WACC) e a linha do segmento marcada "usado no WACC" na tabela de betas
- Planilha de valuation usa a mesma perpetuidade

## v2.82 — 2026-11-18 · Importação de documentos: busca da empresa, tipo de documento e identificação manual
- Empresa: em vez da lista com todas as empresas, busca pelo nome ou pelo CNPJ (em branco, o sistema acha a empresa pelo CNPJ de cada documento)
- "Como importar": vários documentos (o sistema identifica cada um) ou um tipo de documento (contrato social, balanço, CND, posição financeira etc.: todos os arquivos entram com o tipo escolhido)
- Documento não reconhecido: "Identificar documento" com o botão Ver, que mostra o arquivo (PDF ou foto), o texto lido e o link para abrir; depois é só escolher o tipo na lista

## v2.81 — 2026-11-18 · Avaliação de ativos: cliente da Órbita ou trabalho novo
- Avaliação de ativos: quadro "Trabalho" no topo com a pergunta "Cliente da Órbita?"
- Sim: usa a empresa em consulta; razão social, CNPJ, endereço e data-base vêm sozinhos do cadastro, da Receita Federal e do valuation (ou do último balancete)
- Não, trabalho novo: cadastro básico do laudo (CNPJ obrigatório com consulta à Receita, razão social, data-base, finalidade do laudo, local dos bens e contratante); o trabalho fica marcado como avulso e não aparece no globo da Órbita
- "Dados do laudo" permite revisar data-base, finalidade, local e contratante; finalidade e local entram no laudo em Word

## v2.80 — 2026-11-18 · Apresentação por último, com todos os relatórios e o mercado
- Menu: Apresentação passa a ser a última área, depois de Jurídico e Pós-aquisição, porque consolida o trabalho das outras
- Apresentação: quadro "Todos os relatórios" (prospecção antes e depois do NDA, valuation, due diligence, papéis de trabalho, análises financeiras, avaliação de ativos, laudos de imóveis e jurídico) num só lugar
- Novo quadro "Mercado e setor" da empresa consultada: EV/EBITDA das companhias abertas do setor (faixa e mediana), margem EBITDA do setor contra a da empresa, múltiplos de transações, beta do setor e WACC, Selic, IPCA, dólar e Ibovespa, leitura de mercado, notícias do segmento e notícias da empresa

## v2.79 — 2026-11-18 · Crescimento no fluxo de caixa: moderado justificado e otimista com motivos e estudo de viabilidade
- Valuation · FCD: quadro "Crescimento" com o histórico (nominal e real, total e por linha), o último ano e o crescimento projetado nos cenários moderado e otimista, com a diferença sobre o histórico
- Moderado: segue o histórico; o consultor pode informar outro crescimento por linha, mas acima do histórico em mais que a tolerância da base de apuração (3 p.p.) a emissão exige a explicação do motivo
- Otimista: cada crescimento extra tem um motivo (novo negócio, nova unidade ou filial, nova fábrica ou ampliação, novo contrato, novo mercado ou exportação, aquisição) e exige justificativa; nunca fica abaixo do moderado
- "Importar estudo de viabilidade" (Excel, CSV ou PDF): o sistema lê receita, EBITDA e investimento por ano (R$, R$ mil ou R$ mi), calcula o ano de início, o crescimento real e a margem, guarda o estudo no dossiê e inclui no otimista, só para comparação

## v2.78 — 2026-11-18 · Valuation: EV, dívida líquida e equity no topo, com os relatórios à vista
- Valuation: quadro no topo com enterprise value (FCD e múltiplos de mercado), (−) dívida líquida pelo balancete e = equity value; "+ Composição da dívida líquida" abre os itens (empréstimos de curto e longo prazo, caixa e aplicações, parcelamentos, mútuos, ajustes da Due Diligence e complementos do consultor), com o que está dentro ou fora do cálculo
- Botões "Relatório de valuation (PDF)" e "(PowerPoint)" no topo de todas as abas; se houver pontos a justificar, o sistema mostra quantos e leva até eles
- Sem balanços: o Valuation explica que o valuation completo e o relatório saem sozinhos com os balanços e traz o botão "Importar balanços"; documentos já guardados no dossiê são lidos automaticamente

## v2.77 — 2026-11-18 · Pré-diligência e diligência completa, com relatórios em PDF e PowerPoint
- Due Diligence: quadro "Balanços, balancetes e relatórios" no topo. Mostra os balanços já importados no cadastro (com "Alterar o balanço importado"), os balancetes do ano e se o workbook do auditor já foi importado
- "Importar balancetes do ano": o consultor informa o ano e seleciona todos os balancetes de uma vez (Excel, CSV ou PDF); o sistema identifica o mês de cada arquivo (conteúdo, nome ou ordem), reconhece se são acumulados e monta a revisão analítica
- Pré-diligência = tudo o que vem do cadastro inicial: consultas públicas (Receita, listas oficiais, notícias da empresa e dos sócios), certidões e documentos (CND federal, CNDT, CRF, estaduais e municipais: positivas, vencidas ou com ressalva viram ponto tributário, trabalhista ou previdenciário; as não apresentadas ficam pendentes), procedimentos automáticos, revisão analítica e jurídico
- Diligência completa: depois que o auditor ou consultor importa o workbook analisado (botões "Workbook preenchido" e "Importar workbook analisado" no mesmo quadro)
- Relatórios: pré-diligência em PDF e PowerPoint; diligência completa em PDF e PowerPoint

## v2.76 — 2026-11-18 · Revisão analítica dos balancetes na Due Diligence
- Due Diligence: nova aba "Revisão analítica" com as contas de resultado ano a ano (3 a 5 exercícios; aviso quando há menos de 3) e período a período no ano (balancetes acumulados viram o movimento de cada mês ou trimestre)
- Alertas automáticos: picos e quedas fora do padrão nas contas que mexem no EBITDA (ex.: aluguel de 200 mil por mês que vira 500 mil em abril: alto risco de ajuste de EBITDA), variações acima de 30% (revisar) ou de 100% e contas novas (alto risco), saldo credor em conta de despesa, e contas de natureza sensível (gastos de sócios, pró-labore, despesas diversas, brindes, viagens, consultorias, multas, indenizações, não recorrentes); potencial de ajuste de EBITDA somado
- Workbook da Due Diligence já preenchido com a base dos balanços e três abas novas: "Revisão analítica anual", "Revisão analítica mensal" (células em amarelo para revisar e em vermelho para alto risco) e "Alertas para o consultor" (documentos a pedir, conclusão do consultor e ajuste proposto)

## v2.75 — 2026-11-18 · Análises financeiras com os documentos já importados, PPA estimado e pontos da diligência
- Balanços, DRE e balancetes que já estavam no dossiê (importados antes da leitura automática) são lidos de novo, sozinhos, ao abrir Análises financeiras, Due Diligence ou Valuation, e viram os balancetes de cada período (balanço e DRE do mesmo período juntos), sem duplicar os arquivos
- Análises financeiras: novo quadro "Valor, PPA estimado e pontos da diligência", com faixa de valuation, FCD com WACC e beta do setor, PPA estimado numa aquisição (marca, carteira de clientes, contratos e goodwill, pelos critérios do PPA Kinsey) e os principais pontos da diligência (achados automáticos, ajustes de EBITDA, exposições e contingências jurídicas)
- Relatório de análises financeiras (resumo e completo) e apresentação depois do NDA trazem as seções "Valor e PPA estimado" e "Principais pontos da diligência"

## v2.74 — 2026-11-18 · Central de relatórios do target e risco sem pendência de NDA
- Órbita: botão "Relatórios" no quadro do target, ao lado de Abrir dossiê e Resumo rápido (também no resumo do dossiê)
- Relatórios num só lugar: prospecção antes do NDA (teaser, one-pager e PowerPoint, sem o nome da empresa), prospecção depois do NDA (apresentação, resumo e PowerPoint), valuation (PDF e PowerPoint), due diligence (relatório, papéis de trabalho e análises financeiras), avaliação de ativos (laudo em Word e planilha Excel, e laudo de cada imóvel) e diligência jurídica; o que ainda não tem dados aparece desativado com o motivo
- Risco do target: NDA não assinado e questionário em aberto deixam de contar como risco (são pendências de documento acompanhadas pelo Jurídico)

## v2.73 — 2026-11-18 · Resumo para investidores por WhatsApp
- Consulta rápida do target: "Resumo para investidores (WhatsApp)" com até 30 linhas, sem identificar a empresa (nome-código), pronto para enviar antes do NDA
- Conteúdo: a empresa (segmento, região, tempo de operação, atividade, faturamento, EBITDA e margem, crescimento); valor esperado (faixa de valuation, fluxo de caixa descontado com WACC, múltiplos de mercado, comparação entre os dois, múltiplo implícito, operação mínima e transação); riscos da empresa e do setor (beta do setor) e endividamento; destaques e próximo passo (NDA)
- O texto completo aparece na tela antes de enviar ("Ver o resumo"); Compartilhar e Copiar usam o mesmo texto
- Teaser: caixa líquido (dívida líquida negativa) aparece como "a empresa tem mais caixa do que dívida"

## v2.72 — 2026-11-18 · Dossiê para o investidor e teaser anônimo de verdade
- Dossiê do target: "Resumo para o investidor" no topo, com risco e principais preocupações, faturamento, EBITDA e margem, faixa de valuation, comparabilidade entre o fluxo de caixa descontado e os múltiplos de mercado, WACC apurado, beta do setor (desalavancado) e beta usado no custo do capital próprio, success fee, operação mínima, sucesso mínimo e retainer sugerido
- Do dossiê saem o teaser antes do NDA (sem nome) e a apresentação depois do NDA (com o nome), além do atalho para o Valuation
- Teaser antes do NDA: nome, razão social, nome fantasia, CNPJ, site, sócios e e-mails da empresa são trocados pelo nome-código em todo o conteúdo (tela, PDF e PowerPoint), inclusive no nome do arquivo
- Valuation: o WACC mostra o beta do setor do cadastro (com o CNAE) e o beta realavancado usado no custo do capital próprio, com a fórmula
- O questionário (perguntas jurídicas e documentais) sai do dossiê e vai para o Jurídico, aba "Questionário", com a empresa em consulta; os atalhos antigos levam para lá

## v2.71 — 2026-11-18 · Modelos Kinsey emitidos pelo consultor, em Word
- Os modelos (NDA, NDA do mandato, mandato, MOU, SPA, acordo de originação) ficam no Jurídico e já são validados pelo Jurídico: o consultor emite e envia sem passar pela validação da advogada; sai o aviso de "modelo provisório"
- "Emitir em Word" já preenchido com os dados da empresa (Receita Federal e cadastro: razão social, CNPJ, endereço, representante e sócios); no mandato, também success fee de 6%, operação mínima (valuation ou múltiplo do faturamento, arredondada ao milhão), sucesso mínimo, retainer sugerido em parcelas e o sócio responsável do projeto
- O mandato emitido pelo consultor sai sem o cabeçalho de minuta para revisão; a emissão de minuta para revisão jurídica continua disponível em Jurídico · Mandatos
- Dossiê: o botão "Gerar documento" virou "Documentos no Jurídico" e abre o Jurídico já com a empresa e os modelos

## v2.70 — 2026-11-18 · CNPJ obrigatório no cadastro e sem duplicados
- Cadastro da empresa (Base inicial e Novo projeto): CNPJ obrigatório para empresa brasileira, digitado só com números ou com pontos; ao completar os 14 números o sistema consulta a Receita Federal sozinho e preenche razão social, cidade, UF e segmento, e mostra o tipo de negócio pelo CNAE (setor, atividade principal e secundárias) e os sócios
- Botão "Importar cartão CNPJ" no cadastro: lê o PDF, preenche CNPJ, razão social, cidade, UF e CNAE e consulta a Receita; sem Receita no momento, os dados do cartão ficam gravados e a consulta é refeita depois
- Sem duplicar: CNPJ já cadastrado abre o cadastro existente; empresa importada antes só com o nome (sem CNPJ) é completada no mesmo registro, mantendo investidores, observações e o nome antigo como apelido
- Ao salvar, as consultas automáticas começam sem clique (Receita, listas oficiais, CVM, B3, notícias da empresa e dos sócios) e alimentam investigação, risco, jurídico, mandato e as demais áreas
- Base inicial: aviso de empresas cadastradas duas vezes com "Unificar duplicados" (junta dados, investidores, documentos e ligações no registro com CNPJ) e filtro "Sem CNPJ" na consulta

## v2.69 — 2026-11-18 · NDA no Jurídico
- Jurídico: nova aba "NDA". O advogado emite o NDA em Word já preenchido com os dados da empresa consultada (razão social, CNPJ, endereço, representante e sócios da Receita Federal e do cadastro); o que faltar sai marcado no Word. Para investidores, escolhe o NDA geral ou o NDA do mandato (nome-código)
- NDA padrão: importar o modelo da Kinsey (Word, PDF ou TXT); o sistema reconhece as cláusulas, troca os dados da outra parte por campos automáticos (empresa, CNPJ, endereço, representante e data) e guarda como modelo oficial; até lá vale o modelo provisório
- NDA assinado (importado no Jurídico ou na Importação de documentos da Base inicial): comparação automática com o padrão, "conforme o padrão" ou a lista de cláusulas alteradas; prazo, multa e não abordagem lidos do texto; validação pelo advogado
- Painel "NDAs por empresa" com a situação (pendente, enviado, assinado, validado)
- Dossiê: a aba "NDA / LGPD" sai do dossiê; a aba M&A mostra a situação do NDA com atalho para o Jurídico, e os atalhos antigos levam ao Jurídico
- Órbita no computador: a legenda de cores (Target, Investidor, Intermediador) passa para o canto direito, acima da busca, e não fica mais em cima do quadro do dossiê nem dos botões; no celular continua igual

## v2.68 — 2026-11-18 · Importação de documentos na Base inicial e leitura de PDF corrigida
- Base inicial: "Importação de documentos" com vários arquivos de uma vez (PDF, Word, Excel, CSV, XML, fotos ou .zip); o sistema reconhece o tipo (balanço, DRE, balancete, auditoria, cartão CNPJ, contrato social, certidões, licenças, mandato, NDA, MOU, SPA, laudo, matrícula e IPTU), acha a empresa pelo CNPJ (e cadastra o target quando é novo) e leva cada documento ao lugar certo
- Balanço patrimonial e DRE em PDF do sistema contábil (sem código de conta) viram o balancete do período na Due Diligence, com a hierarquia lida pelo recuo; se o período já tem balancete detalhado, o balanço fica para conferência
- Contrato social vai para a diligência jurídica; mandato, MOU e SPA para o Jurídico; todos os arquivos ficam no dossiê e marcam o checklist documental; o cartão CNPJ é dispensado quando a Receita Federal já foi consultada
- Dossiê: a importação sai da aba Documentos (fica um atalho para a mesma importação da Base inicial)
- Leitor de PDF: usa o mapa de caracteres de cada fonte e só o conteúdo em uso da página (PDFs assinados digitalmente traziam a versão antiga embaralhada); números e letras de balanços, DRE e certidões agora saem corretos

## v2.67 — 2026-11-17 · Prospecção do Econodata e nova Base inicial
- Importação de listas: o nome da empresa vem da razão social ou do nome fantasia, nunca do link do Econodata (o link é descartado); sem nome, o sistema busca a razão social na Receita pelo CNPJ e corrige também os prospects já importados com o link
- Faturamento, funcionários, decisores e sócios (com cargo), telefones e e-mails; a mesma empresa em várias linhas do arquivo vira um só prospect; contatos repetidos entre Econodata, Lemitti e Ramper se juntam (o celular e o e-mail completam a pessoa já cadastrada)
- Base inicial: consulta logo no início (Todos, Cliente, Investidor, Target, Consultor, Parceiro) por nome, CNPJ, cidade ou segmento; botões "Cadastro da empresa" (novo projeto, target com o investidor indicado, investidor, parceiro ou consultor) e "Importação de dados" (mapa M&A, modelo, listas e exportação para cadências)

## v2.66 — 2026-11-17 · Tela de entrada: cliente, usuário e senha
- Entrada com Cliente (empresa), Usuário (e-mail) e Senha, botão para mostrar a senha e Enter para entrar; "Entrar com Google" passa a ser a alternativa abaixo
- Mensagens claras: primeiro acesso sem senha criada, login por e-mail e senha desativado no Firebase, muitas tentativas, domínio não autorizado, usuário desativado
- O administrador entra direto no espaço do cliente digitado; o usuário de outro cliente é avisado de que não pertence ao cliente informado
- Guia: passo a passo do primeiro acesso (criar senha, confirmar o e-mail) e confirmação de que não é preciso cadastrar usuários no console do Firebase

## v2.65 — 2026-11-17 · Avaliação de ativos, imóveis (NBR 14653) e marca por cliente
- Nova pasta "Avaliação de ativos" (depois do Valuation) sobre o controle individual de bens do cliente (importação com custo, depreciação, valor contábil, vida útil e remanescente contábil)
- Valor justo para o PPA: amostra por representatividade (80% do valor), inspeção com nota de 1 a 5, vida remanescente, cotações com fonte (Brasil e exterior, PTAX da data-base buscada no Banco Central), custo de reposição depreciado por Ross-Heidecke ou fator Kinsey, ociosidade e baixa; mais ou menos-valia levada ao PPA
- Inventário físico: leitura do código de barras ou QR Code pela câmera (ou digitação), foto do bem e da plaqueta, nota, vida remanescente e situação; conciliação com o CIB (localizados, não localizados, sobras)
- Nova depreciação (CPC 27): valor residual de venda por grupo, líquido das despesas de venda, e vida remanescente; planilha completa e laudo em Word com os responsáveis técnicos
- Imóveis: leitura de matrícula, escritura e IPTU (matrícula, cartório, inscrição, áreas, valor venal, ônus); método comparativo com tratamento por fatores (oferta, área, localização, padrão, conservação, vagas, andar), saneamento de Chauvenet, IC 80%, campo de arbítrio e graus de fundamentação e precisão (NBR 14653-2); método evolutivo; laudo e planilha de homogeneização; revisão de laudo de terceiro com memorando; mais ou menos-valia de imóveis no PPA
- Marca por cliente: logotipo e nome Kinsey só quando a empresa contratante cadastrada é da Kinsey; para outro cliente, só as cores, o nome do cliente e sem nomes de pessoas
- Nova coleção "ativos" no banco, com regras de acesso por cliente

## v2.64 — 2026-11-17 · Resumo da operação, SPA e MOU pró-vendedor, earn-out por Monte Carlo e fiscal do PPA
- Resumo da operação no painel do target e no Jurídico: valor da operação e como foi apurado (FCD, múltiplos de faturamento e EBITDA, P/L, transações), valor mínimo arredondado, success fee de 6%, retainer sugerido e início após o NDA
- Jurídico · SPA e MOU: termos da operação (comprador, preço, à vista, parcelas, earn-out, retenção, exclusividade, auditoria, permanência); emissão do MOU (resumo não vinculante) e do SPA pelos modelos Kinsey pró-vendedor, em Word
- Importação do MOU ou SPA do advogado do investidor (Word ou PDF): análise pró-vendedor e duas versões em Word, uma corrigida pelo sistema e outra com controle de alterações e as observações nas margens; versão revisada pelo nosso advogado importada de novo e comparada com a anterior
- PPA: importar o SPA (preço, à vista, parcelas, earn-out e retenção); earn-out a valor justo por Monte Carlo sobre o fluxo de caixa (metas, mínimo, teto, proporcional ou tudo ou nada, volatilidade, desconto); fluxo do valuation ou importado; PPA avulso pelo fluxo de caixa do cliente
- PPA: contratos e exclusividade como intangível, mais ou menos-valia do imobilizado, desdobramento fiscal do custo (Lei 12.973/2014, art. 20), prazo do laudo (13º mês) e novas abas na planilha (Fiscal, Earn-out Monte Carlo, Fluxo de caixa)

## v2.63 — 2026-11-17 · Mandato de venda automático no Jurídico
- Modelo Kinsey BR de mandato (sell-side) no sistema, com as correções da revisão: sócios como intervenientes anuentes, "Cliente" definido, contratadas que assinam iguais às do preâmbulo, cláusula do retainer completa, sucesso mínimo definido (base da multa), testemunhas e quadro de conferência
- Jurídico · Mandatos: escolhe o target e o sistema preenche razão social, CNPJ, endereço, atividade e sócios do cadastro (Receita e contrato social)
- Condições calculadas: success fee de 6% do valor total; valor mínimo da operação pelo valuation ou, sem ele, pelo múltiplo de mercado sobre o faturamento (ou EBITDA) do balancete, arredondado ao milhão; sucesso mínimo = valor mínimo × 6%; retainer = 10% do sucesso mínimo em 10 parcelas, a 1ª 15 dias após o primeiro NDA assinado com investidor, abatido do success fee; tudo ajustável por mandato
- Minuta em Word para revisão jurídica (campos a completar em amarelo), versões, aprovação ou pedido de ajustes, cronograma do retainer a partir do NDA e resumo no dossiê do target

## v2.62 — 2026-11-17 · Publicação automática do M&A
- Publicação automática pelo GitHub Actions ajustada para o M&A: a cada versão na branch main, constrói, testa e publica o projeto kinsey-capital-ma (antes apontava para os sistemas de cadeias e nunca tinha rodado)
- Script de configuração única no Cloud Shell (ferramentas/configurar_publicacao_automatica.sh): conta de serviço e federação de identidade, sem chave guardada, restrita à branch main deste repositório
- Guia de publicação: Parte H, publicação automática com aprovação antes de ir ao ar

## v2.61 — 2026-11-17 · Prospecção: investidores da Órbita, investidor novo e importação de qualquer planilha
- Espaço de trabalho padrão "Kinsey Capital · M&A" criado no primeiro acesso do administrador: sem ele a versão publicada abria sem cliente, a Órbita ficava vazia (nenhum investidor para escolher) e as listas importadas não apareciam; o que foi gravado sem cliente é recuperado automaticamente
- Importar listas: "Prospectado para o investidor" mostra os investidores ativos da Órbita (com o tipo) e a opção "+ Cadastrar novo investidor…", que cria o investidor na Órbita (N1) na própria importação
- Leitura de planilhas tolerante: cabeçalho achado em qualquer uma das 30 primeiras linhas (títulos acima são ignorados), nome da empresa reconhecido também por Corretora, Companhia, Cliente, Conta, Lead, Nome etc., planilha sem cabeçalho com colunas deduzidas pelo conteúdo, CNPJ sem zeros à esquerda corrigido; aceita .ods e orienta salvar .xls antigo como .xlsx ou CSV
- Resumo da importação: empresas lidas, novas, atualizadas, já no cadastro, linhas ignoradas e colunas reconhecidas

## v2.60 — 2026-11-16 · Pacote de publicação do M&A com guia próprio
- Guia "como publicar e instalar" próprio do KinseyTec M&A (produtos/ma/segmentos/capital/fb/COMO_PUBLICAR.md): preparação do Firebase, publicação pelo Cloud Shell, chaves das integrações da Prospecção (Econodata, Ramper, Lemitti) no Secret Manager, perfis do time, instalação no iPhone, Android e computador, conferência pós-publicação e mensagens prontas
- Construtor usa o guia do segmento quando existir (os demais produtos seguem com o guia do núcleo)

## v2.59 — 2026-11-16 · KinseyTec SDR sai deste repositório
- O sistema de SDRs passa a ser desenvolvido à parte, como KinseyTec SDR (outra base e outro projeto), ligado ao M&A só pela ponte de prospects
- Desfeita a v2.58: produto `sdr` removido, motor da Prospecção do M&A sem o modo SDR, construtor sem módulos compartilhados; o M&A fica exatamente como na v2.57 (painel de novos negócios, frequência, consultas geral e rápida, importar listas)

## v2.57 — 2026-11-16 · Frequência no sistema, consulta geral e consulta rápida
- Frequência de uso: o sistema conta, minuto a minuto, o tempo em que cada pessoa está ativa (computador ou celular), por dia, hora, aparelho e tempo na Prospecção; a pessoa não vê, só os sócios (administradores)
- Aba "Frequência no sistema" no painel de novos negócios (só para sócios): horas hoje, na semana e no mês, média por dia, dias úteis sem acesso em vermelho, % no celular e na Prospecção, gráfico dos últimos 14 dias (computador e celular), horas por mês e tabela com entrada, saída e horas de cada dia
- Coleção nova "presenca" com regra própria: cada pessoa só soma os próprios minutos; só administradores leem
- Consulta geral: empresa, CNPJ, site, local e endereço, atividade e tipo de negócio, porte, faturamento, funcionários, sócios, diretores e decisores, e-mails e telefones e fontes
- Consulta rápida (pensada para o celular): cartões com empresa, local, faturamento, funcionários, sócios e botões de ligar, WhatsApp e e-mail; botão "Consulta rápida" no topo da Prospecção
- Ficha do prospect com "Sócios, diretores e decisores" e as ações de contato; leitura de listas com coluna de sócios, todos os e-mails, endereço, porte e tipo de negócio; o celular tem prioridade sobre o fixo no WhatsApp

## v2.56 — 2026-11-16 · Importar listas de qualquer origem, busca na plataforma e celulares sem duplicar
- "Importar listas" aceita qualquer origem (arquivo CSV ou Excel); Econodata, Lemitti e Ramper aparecem como sugestão, com a orientação de como filtrar e exportar; "Outra plataforma" com o nome da origem
- Aba "Buscar na plataforma": a pessoa descreve as empresas (ex.: indústrias têxteis do Sudeste, frigoríficos do Sul), CNAE, região, UFs, cidade, faixa de faturamento e de funcionários; na versão publicada o sistema busca pela API oficial com a chave da Kinsey guardada no servidor (ninguém digita senha); na versão local, copia os critérios para buscar na plataforma
- Aba "Celulares dos sócios": consulta o Lemitti pelos CNPJs dos prospects (sem celular ou todos) ou exporta os CNPJs e importa o arquivo devolvido
- Mesma empresa não duplica: contatos, celulares, e-mails, funcionários e dados vazios são somados ao prospect existente, com a fonte de cada contato; todos os telefones da linha e a coluna de funcionários são lidos

## v2.55 — 2026-11-16 · Evolução mês a mês, comparativo da equipe, horários e SDR
- Painel de novos negócios com abas: semana a semana, mês a mês (6 meses, gráfico e tabela com variação), comparativo da equipe (mês atual contra o anterior, por pessoa) e agenda e horários (atividades com data e hora e contatos por horário)
- Cada contato registra a hora; a reunião registra data, hora e quem conduz (padrão: novos negócios)
- SDRs (Giovana e Andressa) na equipe: painel de ligações e reuniões agendadas para o M&A; podem registrar contatos e agendar reuniões nos prospects de novos negócios sem tirar a exclusividade; quem conduz e fecha é o profissional de novos negócios

## v2.54 — 2026-11-16 · Controle de novos negócios na Prospecção
- Painel "Evolução" no topo da Prospecção, por pessoa (padrão: novos negócios): abordagens e reuniões por semana nas últimas 12 semanas, com meta semanal (15 abordagens e 1 reunião); semana fechada com zero fica em vermelho
- Alerta "Necessidade de prospecção" quando passam 7 dias sem abordagem ou sem reunião
- Indicadores do mês: abordagens, reuniões marcadas e realizadas, empresas que ela(e) levou à Órbita, NDAs assinados, mandatos e semanas zeradas
- Controle de reuniões: data da reunião, empresa, situação (agendada, realizada ou sem registro do resultado), possibilidade de negociação, Órbita e NDA
- Toque registra a possibilidade de negociação (alta, média, baixa ou sem possibilidade) e, em "Reunião marcada", a data da reunião (obrigatória)
- Reunião agendada: o target entra na hora na Órbita de M&A (pré-cadastro, morno), ligado aos investidores aderentes; a aprovação após a reunião aproveita o mesmo cadastro, sem duplicar; arquivar o prospect retira o pré-cadastro da Órbita

## v2.53 — 2026-11-16 · Prospecção de investidores (N1)
- Prospecção passa a ter dois tipos: target (empresa vendedora, N3) e investidor (comprador estratégico ou financeiro, N1), com filtro "Só targets / Só investidores"
- Cadastro manual e importação de listas com o tipo, o tipo de investidor, a tese (o que compra), o grupo e observações; a coluna "Tipo" do arquivo é detectada sozinha
- Para cada investidor prospectado, o sistema mostra os targets da base aderentes à tese ("targets para apresentar")
- Aprovação do consultor de M&A envia o investidor à Órbita como N1, com a tese, liga os targets escolhidos e registra a originação do investidor para o mérito (5%), que já aparece marcada no dossiê dos targets ligados

## v2.52 — 2026-11-16 · Administradores gerais e titularidade KinseyTec
- Dois administradores gerais (IA Kinsey e Newton Kao): ambos convidam, liberam e removem usuários e podem dar acesso completo ao time de M&A (regras do banco, arquivos, funções, login e Portal)
- Tela de acesso bloqueado mostra os dois administradores para pedir liberação
- Titularidade: "KinseyTec Inovação Tecnológica, empresa do grupo Kinsey BR" no sistema e no guia de publicação

## v2.51 — 2026-11-16 · Teaser com números e quadros maiores; Análises financeiras antes da Due Diligence
- Menu: Análises financeiras logo após a Órbita, antes da Due Diligence (desktop e celular)
- Teaser pré-NDA, one-pager e apresentação pós-NDA redesenhados: Visão geral com indicadores em quadros grandes (tamanho ajustado ao espaço), destaques ampliados, fichas da companhia (atividade, tempo de operação, sede, clientes, atuação, linhas de negócio, controle), destaques financeiros com indicadores, gráfico e tabela maiores, tese em cartões numerados e próximos passos em etapas
- Destaques mais completos: anos de operação, margem acima da referência do setor, lucro do último exercício e base de clientes; referência de múltiplos de mercado quando não há comparáveis
- Pré-NDA sem cidade (apenas região) e sem informação desconhecida nas fichas

## v2.50 — 2026-11-16 · Planilhas padronizadas Kinsey (valuation e PPA) com fórmulas
- Gerador de Excel passa a gravar fórmulas vivas, estilos da marca (entradas em azul sobre Fog, cabeçalhos Navy, histórico em cinza e projetado em Acent), painéis congelados e recálculo ao abrir
- Planilha padronizada de valuation (modelo dos trabalhos Kinsey): Resumo, Premissas (cadastro, macro, crescimento moderado e otimista, % operacionais, dias de capital de giro, tributação, ponte para o equity, ajuste de WACC ±3 p.p.), WACC pelo CAPM, Histórico (DRE e balanço dos balancetes), DRE projetada (lucro real ou presumido), Capital de giro em dias, FCD (meio do período, Gordon, sensibilidade WACC × g), Múltiplos, Conferências e Plano de contas
- Planilha padronizada de PPA (CPC 15 / IFRS 3): PPA Goodwill, Premissas PPA, CAC, carteira de clientes (MPEEM com churn e TAB), marca e tecnologia (relief-from-royalty), não concorrência (com e sem), força de trabalho (custo de reposição), contingências, earn-out por cenários ponderados e Monte Carlo (1.000 simulações, meta mínima/teto, correção pelo CDI), WARA, conferências e classes de intangíveis
- Já saem preenchidas com o cadastro e os números do sistema; "Importar planilha do consultor" lê os resultados da versão revisada e mostra a conferência sistema × consultor (Valuation > Relatório e Pós-aquisição)
- Motor de valuation alinhado aos modelos Kinsey: desconto no meio do período e perpetuidade de Gordon com o capital de giro crescendo à taxa g; PPA usa o capital de giro normalizado no encargo dos ativos contributivos
- Validação: planilhas recalculadas sem erro de fórmula; valuation da planilha a 2,3% do sistema e intangíveis do PPA a menos de 2%

## v2.49 — 2026-11-16 · Relatórios no padrão do branding book Kinsey BR
- Cores oficiais do branding book: Navy #011F4B (capas, títulos e cabeçalhos de tabela), Acent #0473C3 (numeração de seções, filetes, destaques e demonstrações projetadas), Fog #E6E8EC (quadros de indicadores e linhas alternadas), Gray #7F7F7F (demonstrações históricas) e White; substitui o azul provisório #0070C0
- Logotipo oficial KINSEY BR (Audit / Consulting / M&A / BPO / ESG): versão branca nas capas sobre o navy e versão navy, pequena, no topo das páginas internas, respeitando a margem de segurança
- Motor de PDF passa a aceitar imagens JPEG (logotipo)
- Tipografia: textos dos PDFs em Helvetica, equivalente métrica da Arial (fonte secundária oficial para textos longos); a interface já usa Montserrat
- Gráficos mantêm as cores vivas

## v2.48 — 2026-11-16 · Histórico em cinza, projetado em azul
- Demonstrações históricas e realizadas (DRE, balanços, indicadores, EBITDA, capital de giro, endividamento, pro forma e contingências) com títulos em cinza-escuro e cabeçalhos de tabela em cinza
- Demonstrações projetadas do valuation (DRE, balanço e fluxo de caixa livre) com títulos e cabeçalhos em azul Kinsey; nas tabelas que juntam histórico e projeção, as colunas históricas (H e base) ficam em cinza e as projetadas (E) em azul, como no laudo de avaliação Kinsey
- Legenda no relatório: período histórico/realizado em cinza, projetado em azul

## v2.47 — 2026-11-16 · Cores da marca Kinsey BR nos relatórios
- Relatórios em PDF e PowerPoint com o azul Kinsey BR dos modelos oficiais: #0070C0 nas capas, títulos de seção e cabeçalhos de tabela; azul escuro #085090 nos títulos e valores; azul claro #DDEBF7 nos destaques e linhas alternadas; filete ciano #00B0F0
- Capas com a assinatura KINSEY BR · Audit | Consulting | M&A | BPO | ESG
- Gráficos mantêm as cores vivas da paleta

## v2.46 — 2026-11-16 · Demonstrações financeiras nos relatórios
- Novo bloco de demonstrações nos relatórios de Due Diligence, Análises financeiras e Valuation, depois dos sumários e gráficos (modelos Kinsey Mão Colorida e CPL Medicals):
  - DRE histórica por período com margens; balanço patrimonial (ativo e passivo) classificado em capital de giro, endividamento líquido, capex e outros; indicadores econômico-financeiros por período
  - Análise do EBITDA (reportado, ajustes e ajustado), do capital de giro líquido (reportado, potenciais ajustes, normalizado e prazos médios) e do endividamento líquido (reportado, itens equivalentes, ajustes e normalizado)
  - Ajustes da diligência com efeitos e situação; DRE e balanço pro forma (visão do capital investido) depois dos ajustes contábeis
  - Contingências à parte, fora do pro forma (mínimo, máximo e qualificado), para tratamento na negociação
- Valuation: demonstrações projetadas dos cenários moderado e otimista — DRE projetada com histórico, balanço projetado (capital investido, dívida líquida e PL) e fluxo de caixa livre com fator de desconto, valor presente, perpetuidade, EV e equity
- Resumos: quadro pro forma resumido
- Due Diligence usa os potenciais ajustes (propostos e aprovados); Análises e Valuation usam os ajustes com OK
- Linhas contábeis de "Fornecedores" mantidas nas demonstrações

## v2.45 — 2026-11-16 · Prospecção pelas intenções dos investidores
- "Prospectar para investidor": escolhe um investidor da Órbita e a tese dele (atividades, CNAEs, segmentos, UFs e regiões, faixa de faturamento dentro da política Kinsey) vira o filtro da busca no Econodata, no Lemitti e no Ramper
- Versão publicada: busca direta pelas APIs oficiais (função "prospeccao", tokens como segredos); sem token ou na versão local, critérios para filtrar na plataforma e importação do arquivo já ligada ao investidor
- Cada prospect mostra os investidores da Órbita com tese aderente (calculado sozinho) e os investidores para quem foi prospectado; filtro por investidor
- Exportar cadência para o Ramper com os prospects aderentes ao investidor e os contatos
- Listas importadas pelo dossiê do investidor também entram na Prospecção ligadas a ele

## v2.44 — 2026-11-15 · Prospecção como primeiro passo e equipe M&A/SDR
- Prospecção passa a ser o primeiro item do menu, antes da Base inicial (cadastro M&A)
- Lead quente (reunião concluída, proposta de serviços enviada ou mandato em negociação) fica "Aguardando aprovação M&A"; só um sócio ou consultor de M&A aprova, e a empresa vai sozinha para o cadastro M&A (Base inicial, Órbita, cadastro inicial e demais áreas), com a origem e o histórico
- Cadastro de prospecção com interesse (venda/mandato, serviços, captação), temperatura (frio, morno, quente) e observações; a temperatura sobe sozinha com reunião marcada ou lead quente
- Equipe M&A e SDR: cadastro de novos membros (time de M&A, sócio, novos negócios, SDR) com cargo e e-mail; os membros aparecem também nos consultores da Due Diligence, no sócio do projeto e nos relatórios
- Incluído Samuel Lima, sócio de M&A e finanças
- Regras de mérito em tela própria

## v2.43 — 2026-11-15 · Órbita com todos os níveis
- A consulta da Órbita abre com todos: targets (verde), investidores (losango azul) e parceiros/intermediadores (quadrado lilás); antes abria só com os targets
- O botão da consulta mostra a contagem por tipo (ex.: 40 targets · 62 investidores · 6 parceiros); ao escolher um investidor, a consulta passa a mostrar os targets aderentes a ele

## v2.42 — 2026-11-15 · Prospecção (contato frio) e mérito
- Nova área Prospecção no menu, depois da Base inicial: antessala do cadastro inicial para o SDR, a área de novos negócios e as listas do Econodata, do Lemitti e do Ramper; coleção própria, fora da Base inicial, da Órbita, das indicações e das análises
- Importação de listas (CSV ou Excel) com origem e responsável; prospect manual; duplicidade conferida por CNPJ e nome contra a prospecção e a base
- Histórico de abordagem (canal, resultado, quem abordou, anotação) e situação (novo, em abordagem, reunião marcada, reunião realizada, promovido, arquivado)
- Controle de quem abordou: um responsável por empresa, exclusivo por 90 dias sem contato (configurável); depois fica livre para outra pessoa assumir
- "Promover a target" só depois da reunião realizada e da confirmação da possibilidade de venda: cria o target com a origem e o histórico e abre o cadastro inicial
- Listas do Econodata/Lemitti e do Ramper importadas pelas integrações passam a entrar na Prospecção (empresas já na base continuam sendo enriquecidas)
- Origem e mérito no dossiê do target (regras provisórias até a política de M&A): originação do mandato 10% e do investidor 5% do success fee, só time de M&A, sócios e novos negócios, divididos entre os participantes; SDR 5% em serviços separados quando participa ativamente; sócios e novos negócios 15% em serviços separados ou retainers; success fee estimado pelo valuation e pelo modelo de honorários, ou informado; aprovação da divisão
- Equipe e regras de mérito editáveis (percentuais, prazo de exclusividade, pessoas e papéis: sócio, time de M&A, novos negócios, SDR)

## v2.41 — 2026-11-15 · Relatório de análises financeiras e ajustes nos relatórios
- Novo relatório de Análises financeiras (resumo e completo), com o botão "Emitir relatório" na tela: sumário executivo com leitura automática, evolução histórica, ponte do EBITDA, ajustes da Due Diligence e situação do OK, DRE reportada × ajustada, balanço e endividamento, capital de giro e prazos médios, indicadores e limitações
- Valuation completo: sem companhias comparáveis carregadas, traz a referência Kinsey de múltiplos do setor aplicada ao EBITDA ajustado e o confronto do FCD moderado e otimista com o mercado; títulos das projeções não ficam soltos no fim da página

## v2.40 — 2026-11-15 · Cores Kinsey nas telas de trabalho
- Fundo navy Kinsey (gradiente) em todas as telas de trabalho (Base inicial, Due Diligence, Análises, Valuation, Apresentação, Jurídico, Pós-aquisição); o fundo escuro do espaço fica só na Órbita
- Cartões, indicadores e campos em tons de azul Kinsey, com contraste para leitura, também no celular

## v2.39 — 2026-11-15 · WACC automático com ajuste limitado e justificado
- O WACC vem sempre calculado automaticamente pelo CAPM (beta e estrutura de capital do setor, prêmio de tamanho da base)
- O consultor pode ajustar os componentes (dívida/patrimônio, prêmio de tamanho) ou a taxa, com fundamento e justificativa obrigatória, até 3 p.p. acima ou abaixo do automático; fora disso o sistema não salva
- A tela mostra o WACC usado, o automático, a diferença em p.p., a faixa permitida e a justificativa; "Voltar ao automático" desfaz o ajuste
- WACC ajustado sem justificativa bloqueia a emissão do valuation; o relatório traz o WACC automático e o ajuste com a justificativa
- Campos de WACC saíram das premissas do otimista (o ajuste fica só na folha com justificativa)

## v2.38 — 2026-11-15 · Valuation prático: FCD e Múltiplos
- Abas curtas: Síntese, FCD, Múltiplos, Outras, Dívida líquida, Base, Relatório
- FCD e Múltiplos funcionam também sem balanços (prévia com o faturamento do cadastro e a margem de referência do setor)
- FCD abre com o resumo da apuração (data-base, exercícios, moderado e otimista), receita, EBITDA, margens bruta, EBITDA (e média histórica) e líquida, EV moderado e otimista, perpetuidade; WACC com "Alterar WACC", "Usar o calculado" e "Revisar cálculo do WACC" (componentes do CAPM, D/E, prêmio de tamanho)
- Múltiplos abre com os múltiplos apurados por grupo (mesmo segmento, semelhantes e todos): EV/EBITDA, EV/Receita, P/L e margem; EV pela mediana e pela faixa; sem as fontes na tela (as fontes saem nos relatórios); referência Kinsey do setor enquanto não há comparáveis carregados
- Confronto com o mercado: múltiplo implícito do FCD moderado, do otimista e da proposta frente à faixa de mercado, com alerta ao consultor quando o moderado está muito fora (revisar WACC, margem, crescimento, capex, giro e perpetuidade)
- Otimista: novos negócios com a origem da informação (sócios, administração, estudo de viabilidade, contrato, operação em funcionamento) e a comprovação; margem acima da histórica exige justificativa

## v2.37 — 2026-11-15 · Declinados fora da Órbita, com consulta e retomada
- Órbita: declinados não aparecem mais no globo nem na faixa de empresas (só se forem buscados e selecionados); a contagem da consulta considera apenas os ativos; legenda sem "Declinado"
- Base inicial > Mandatos e standby: botão "Declinados (n)" abre a consulta com busca por nome, CNPJ, segmento ou motivo, mostrando o tipo, o motivo do declínio e o histórico de retomadas
- Retomar: escolhe etapa (mapeada, abordada, reunião ou NDA), temperatura e o motivo da retomada; a empresa volta como target ativo e o declínio anterior fica no histórico
- Dossiê de empresa declinada mostra o aviso com o motivo e o botão Retomar

## v2.36 — 2026-11-15 · Due Diligence com base no cadastro e no workbook
- Due Diligence não importa mais balancete: os balancetes vêm do cadastro inicial; o botão do topo passa a ser "Cadastro do projeto" (proposta à parte, com informações adicionais)
- Visão geral mostra o quadro "Cadastro do projeto" com tudo o que veio do cadastro inicial (CNPJ, razão social, CNAE, cidade/UF, segmento, regime, due diligence e diligência jurídica contratadas, períodos, data-base, sócio, mandato e balancetes com a origem)
- Sem workbook: due diligence prévia automática sobre os balancetes do cadastro; sem balanços, aviso de aguardando e análise preliminar
- Workbook do auditor prevalece: abas "Balancete AAAA-MM" são lidas e substituem os balancetes do cadastro (que ficam guardados), mantendo os grupos de conta; o cartão indica a base da due diligence (workbook ou balancetes do cadastro)
- Planilha modelo já leva os balancetes do cadastro em abas próprias para o auditor revisar e devolver

## v2.35 — 2026-11-15 · Análise preliminar automática sem balanços
- Análises financeiras, Valuation e Pós-aquisição não pedem mais para importar balancete: target sem balanços abre com a análise preliminar calculada pelo sistema (faturamento do cadastro, mapa ou Econodata; margem EBITDA e múltiplo de referência do setor pelas companhias comparáveis ou pela referência Kinsey; EBITDA estimado; enterprise value indicativo com desconto de liquidez; política; situação do pedido de balanços)
- Botão para pedir ou reenviar os balanços ao target; a análise completa entra sozinha quando os balanços chegam pelo cadastro do projeto
- A Due Diligence segue com a importação da versão revisada durante os trabalhos

## v2.34 — 2026-11-15 · Planilha modelo do workbook de Due Diligence
- Due Diligence > Visão geral: "Exportar planilha modelo" ao lado de "Importar workbook"; o Excel já vem com o cadastro do cliente (razão social, CNPJ, CNAE, cidade, segmento, regime, data-base, períodos contratados, diligência jurídica, sócio, consultores e sócios da Receita), o resumo dos balancetes, os procedimentos do sistema com o resultado automático e as sugestões de ajustes e achados
- Abas de preenchimento (Ajustes, Contingências, Conferências, Pontos) com os cabeçalhos que a importação reconhece; abas informativas não são importadas, sem duplicar o que o sistema já tem
- Modelo provisório, a ser substituído pelo modelo de workbook da Kinsey
- Segmento: CNAE da Receita prevalece sobre o texto do mapa (ex.: terceirização de mão de obra em Serviços, administradoras de benefícios em Saúde); "folha de pagamento" e "recursos humanos" passam a ser Serviços

## v2.33 — 2026-11-15 · Órbita com nomes curtos e legenda por tipo
- Rótulos da Órbita e da faixa de empresas sem o nível (N1, N2, N3) e só com o nome fantasia ou o primeiro nome (ex.: Ruplast, Agrolave, Fiedler, All Care, Ivory Serviços); o nome completo fica no dossiê
- Tipo pela cor e pelo formato: target (círculo verde), investidor (losango azul), intermediador (quadrado roxo), declinado (cinza); legenda compacta visível também no celular
- Núcleo: gancho ORB_ROTULO para o rótulo dos pontos e da faixa; a faixa usa a cor do tipo (ORB_COR)

## v2.32 — 2026-11-15 · Cadastro do projeto preenchido automaticamente
- Ao informar o CNPJ, a Receita preenche razão social, cidade, UF e segmento (pelo CNAE da atividade principal); ao abrir um projeto com CNPJ ainda não consultado, a consulta roda sozinha
- Novo campo no topo do cadastro: anexar o cartão CNPJ, o contrato social ou a ficha da Junta; o sistema lê e preenche CNPJ, razão social, cidade, UF e segmento na hora, e leva sócios, quotas e cláusulas para a diligência jurídica
- Sem a Receita (prévia ou serviço fora do ar), os dados do cartão CNPJ ficam gravados no cadastro; a consulta à Receita é refeita depois
- Segmento pelo CNAE (agro, alimentos, industrial, energia, construção, varejo, logística, tecnologia, educação, saúde, serviços) no lugar do texto do mapa quando há CNAE

## v2.31 — 2026-11-15 · Ligação investidor × target só com mesma atividade e porte compatível
- Atividade: subsetores (plásticos e embalagens, planos de saúde e benefícios, medicamentos, hospitais, lavanderia, terceirização, química, metalurgia, papel, logística, tecnologia e outros) pelo texto do mapa, CNAE, descrição e linhas de negócio; estratégico precisa atuar no mesmo subsetor; fundo ou private equity precisa ter o subsetor, o CNAE ou o setor na tese; frases negativas da tese ("não é foco") são ignoradas
- Porte: estratégico com faturamento ≥ 3× o do target ou capacidade ≥ 1,5× o valuation; fundo com ticket ou capacidade ≥ valuation (ou patrimônio ≥ 5×); valuation pela expectativa da administração, pelo valuation do sistema ou estimado pelo faturamento
- Investidor sem porte informado não é ligado automaticamente: aparece em "a qualificar" no target; dossiê com os campos de porte (target: faturamento e valuation esperado pela administração; investidor: faturamento, patrimônio e ticket máximo)
- Vale para o cartão e o painel de indicações, os investidores sugeridos do dossiê e a consulta de investidores prováveis; indicação manual continua livre
- Correção do classificador de segmento do mapa ("laminados planos" era lido como planos de saúde) e ajuste automático dos registros já importados
- Desempenho: cálculos de matching e porte guardados por versão do registro (a Base inicial deixa de recalcular o valuation de cada par)

## v2.30 — 2026-11-15 · Workbooks de diligência e relatório de DD com impacto na negociação
- Workbook de Due Diligence (Excel do auditor): leitura de todas as abas pelos cabeçalhos (ajustes de EBITDA, dívida, capital de giro, PL e lucro; exposições com mínimo, máximo e avaliação; conferências; pontos e recomendações); ajustes vão para as Análises, exposições para a aba Exposições; reimportar substitui a versão anterior
- Due diligence prévia (balancetes e informações do sistema) até o workbook; depois, relatório completo identificado com o arquivo do auditor
- Relatório completo de DD: painel executivo, mapa de risco por área, red flags por gravidade, impacto na negociação (equity pelo EBITDA reportado → ajuste × múltiplo, itens de dívida, retenção, indenização, capital de giro de referência) com gráfico, proteções recomendadas para o SPA e anexos de conferências e pontos do workbook; o resumo também traz o impacto na negociação
- Diligência jurídica por setor: biblioteca de riscos setoriais (saúde, terceirização de mão de obra, indústria, alimentos, varejo, tecnologia, logística, construção, agro, educação, energia, financeiro); perguntas do setor no questionário; workbook jurídico gerado pelo sistema (questionário, documentos, contratos, processos e matriz de riscos) e importado de volta; matriz de riscos do setor no relatório jurídico (resumo e completo)
- Gráficos: sinal negativo correto nos valores

## v2.29 — 2026-11-15 · Mandato com entrada única, substituição e aditivos
- O mandato entra pelo cadastro do projeto, pela aba M&A do dossiê ou pelo Jurídico: é sempre o mesmo registro, com leitura e análise automáticas
- Sem duplicidade: o mesmo documento importado de novo é ignorado; o target tem um só mandato no Jurídico
- Substituição: minuta não assinada → mandato assinado (ou minuta mais nova), com o histórico de versões; mandato assinado só é trocado depois do vencimento ou da rescisão; minuta não substitui mandato assinado
- Aditivo, aditamento ou renovação: anexado ao mandato, atualiza só as condições alteradas (success fee, prazo, prazo final na renovação) e encerra o pedido de renovação
- Jurídico mostra o mandato do target em consulta (situação, assinatura, prazo final, aditivos, versões anteriores e alerta de vencimento)

## v2.28 — 2026-11-15 · Vigência do mandato e standby de targets
- Prazo final do mandato no dossiê (assinatura + prazo, ou data informada), com os dias restantes; a 60 dias do fim, bandeira vermelha "Mandato prestes a vencer · necessidade de renovação"; vencido, pedido de renovação (registrado em Interações); alertas também no cartão do target e na Base inicial
- Standby: o target sai do globo, da faixa, das listas das áreas e das indicações, sem apagar nada; reativação a qualquer momento
- Regras: mandato assinado e vigente não vai para standby (só com a rescisão registrada, com data, motivo e documento, ou com o mandato vencido, conferido pelo sistema); frio vai direto, com motivo; morno só depois do questionário (contato recente, NDA, interesse em vender ou investidor em conversa impedem); quente só com o prazo do mandato perdido, e o sistema solicita a renovação
- Sugestões automáticas: frios sem mandato, sem NDA e com menor faturamento, com opção de colocar todos em standby

## v2.27 — 2026-11-15 · Versões dos relatórios e teaser pós-NDA completo
- Due diligence, diligência jurídica, valuation e PPA: sempre perguntam "Resumo para apresentação" ou "Relatório completo"
- Teaser com duas versões fixas: antes do NDA (destaques positivos, sem identificar a empresa) e depois do NDA (tudo); a escolha resumo/completo deixa de aparecer no teaser
- Pós-NDA ampliado: due diligence e ajustes validados (tabela e ponte do EBITDA), exposições fiscais, trabalhistas e previdenciárias, diligência jurídica (processos, pontos de atenção e encaminhamento no contrato), produtos e serviços, site e material institucional

## v2.26 — 2026-11-15 · Diligência jurídica automática
- Contrato social, última alteração, ficha da Junta ou cartão CNPJ anexados no cadastro do projeto ou no Jurídico são lidos: sócios e quotas, capital, administração, registro na Junta, cláusulas de preferência, tag/drag along, lock-up, ônus sobre quotas, procuradores, filiais, participações e espólio; o CNPJ lido completa o cadastro e dispara as consultas
- Questionário jurídico respondido pelo sistema com a fonte: documento societário, QSA da Receita (com aviso de divergência), contratos analisados (mudança de controle, exclusividade, não concorrência, multas, garantias, dívida), processos, CND e PJ da due diligence, investigação (CEIS/CNEP, PEP, IBAMA) e licenças exigidas pelo CNAE
- O advogado complementa: resposta ou observação à mão prevalece sobre a automática
- Consulta de notícias dos sócios do target (versão publicada) alimenta a mídia negativa da investigação

## v2.25 — 2026-11-15 · Target em consulta único em todas as áreas
- A empresa escolhida na busca da Órbita (ou na faixa, no globo, no dossiê) vira o target em consulta de Due Diligence, Análises financeiras, Valuation, Apresentação, Jurídico e Pós-aquisição
- Trocar em qualquer área (Pasta de análise · Trocar, ou a faixa "Em consulta" com busca por nome, codinome ou CNPJ) vale para todas; a escolha fica guardada no aparelho

## v2.24 — 2026-11-15 · Investidores prováveis do target e prospecção no mercado
- No dossiê do target (aba M&A): lista de investidores prováveis com a situação do contato (a contatar, contatado, interessado, NDA enviado, NDA assinado, sem interesse) e com quem falou
- "Você quer consultar prováveis investidores para este target?": consulta a base Kinsey (tese, aquisições recentes), o mercado (notícias de aquisições no setor por private equity, fundos e estratégicos, com o comprador extraído) e as bases Econodata, Ramper e Lemitti (empresas maiores do mesmo CNAE, com sócios e decisores)
- Resultado resumido com orientação de contato para o consultor ou o SDR, botão para incluir cada um como provável (cria o N1 quando não existe) e PDF interno com as informações e os contatos
- Função investidoresProvaveis no Firebase (notícias e APIs das bases); a versão local usa a base, as notícias guardadas e as listas importadas
- Indicações do sistema: cartão e painel legíveis no celular (linhas empilhadas) e motivos sem repetição

## v2.23 — 2026-11-15 · Investigação do target preenchida automaticamente
- A aba Investigação abre respondida pelo sistema, sem clique: situação na Receita, listas oficiais (CEIS/CNEP, MTE, IBAMA), mídia negativa nas notícias, CND e tributos ou encargos em atraso da due diligence, exposições registradas e processos da diligência jurídica, sempre com fonte e data
- As respostas entram pelo motor automático do núcleo (gancho EXT_RESPINV): só substituem o que estava inconclusivo e o que o analista marca à mão prevalece
- Target sem CNPJ (comum no mapa): campo na própria aba para informar e consultar na hora; itens sem fonte automática mostram o link da consulta manual (protestos, PEP, sanções, tribunais)

## v2.22 — 2026-11-15 · Política de abordagem: faturamento de R$ 15 milhões a R$ 10 bilhões
- Política Kinsey passa a ser uma faixa: faturamento anual de R$ 15 mi a R$ 10 bi (e valuation a partir de R$ 15 mi); acima de R$ 10 bi o target fica fora da política, com o motivo
- Vale para o cartão e o dossiê do target, o filtro da Órbita, as importações do Econodata, Lemitti e Ramper, as indicações e os critérios de prospecção

## v2.21 — 2026-11-15 · Relatórios com gráficos (resumo ou completo), teaser robusto, indicações e prospecção
- Todas as áreas emitem "Resumo para apresentação" ou "Relatório completo": due diligence, valuation, diligência jurídica, PPA e teaser (one-pager ou completo)
- Gráficos vetoriais nos PDFs, com todos os valores escritos: rosca (alocação do PPA, exposições por área, processos por prognóstico), cascata (ponte do EBITDA, EV → equity, dívida líquida, PL → consideração), barras horizontais (exposições, comparáveis com o múltiplo do target, WARA × WACC, custo de capital), colunas com linha de margem e mapa de calor da sensibilidade do EV ao WACC
- Teaser na estrutura Kinsey: capa, sumário executivo, companhia, operações, portfólio, destaques financeiros (evolução com margem), tese, setor e mercado (comparáveis), transação e próximos passos; nome-código automático e números arredondados antes do NDA
- Teaser: importação do release, apresentação institucional ou folder (PDF, PPTX, DOCX) com extração da descrição, números e destaques; leitura do site da empresa (página inicial e páginas internas) na versão publicada
- Indicações do sistema: principais targets para cada investidor e investidores para cada target (tese, o que compra, política, temperatura e capacidade), com aquisições recentes e, para investidores internacionais, notícias em inglês e movimentos no Brasil; indicar com um clique e lista para cadência no Ramper
- Prospecção pelas APIs oficiais do Econodata, Ramper e Lemitti (versão publicada, token no Secret Manager, endereço e campos em config/integracoes); sem API, critérios da tese para filtrar e importar o arquivo exportado
- Celular: tipografia padronizada (títulos, indicadores em 2 colunas, tabelas e botões menores), sem zoom nos campos

## v2.20 — 2026-11-15 · Base dos cálculos em Excel, exposições e relatório de due diligence no padrão Kinsey
- PPA: "Base dos cálculos (Excel)" com 15 abas (resumo, premissas, consideração, carteira de clientes ano a ano, perda de clientes, encargos contributivos, marca, tecnologia, não concorrência, força de trabalho, WARA, amortização, sensibilidade, impairment e checagens), gerada sem bibliotecas externas
- PPA: perda de clientes calculada pela base de clientes (receita por cliente e ano), por faixa (10% maiores, 40% seguintes, 50% menores), com média ponderada pela receita usada no MPEEM
- PPA: sensibilidade do ágio e da carteira (prêmio × perda de clientes) e teste de recuperabilidade do ágio (CPC 01), na tela, no PDF e no Excel
- Cadastro do projeto: diligência jurídica (Kinsey, assessores do cliente ou não), período contratado contábil e financeiro (exercícios + LTM) e fiscal, trabalhista e previdenciário (padrão 5 anos); balanços dos últimos 5 exercícios importados uma única vez no cadastro
- Análises, valuation, apresentação e PPA não pedem mais balancete: apontam para o cadastro do projeto; só a due diligence importa a versão revisada durante os trabalhos, guardando a original
- Due diligence: aba Exposições com principal por ano do fato gerador, juros Selic, cenários mínimo (multa de 20%), máximo (75%) e qualificado (150%), avaliação de risco, decadência de 5 anos e sugestões a partir dos achados
- Relatório de due diligence na estrutura Kinsey: mensagem a pessoas não autorizadas, carta, objetivo e limitações, índice, sumário das exposições, decadência, grupo econômico e quadro societário, balanço reclassificado, EBITDA reportado e ajustado, capital de giro, dívida líquida, aspectos tributários e trabalhistas, pontos e recomendações e equipe
- Base de modelos aceita relatórios de due diligence, workbooks de diligência e propostas de serviços

## v2.19 — 2026-11-15 · PPA avançado, checagens Kinsey e revisão automática de laudos
- PPA (CPC 15 / IFRS 3) refeito com as técnicas de laudo: consideração transferida com parcelas diferidas a valor presente (Kd) e earn-out a valor justo (probabilidade × VP no WACC)
- Carteira de clientes pelo MPEEM com encargos de ativos contributivos: capital de giro (Selic LP + spread, líquido), imobilizado (Kd), força de trabalho (WACC), não concorrência e marca/tecnologia pelo royalty; vida útil calculada até 90% do valor
- Marca e tecnologia por relief-from-royalty (marca com vida definida ou indefinida; tecnologia com obsolescência), não concorrência pelo método com e sem (probabilidade de competir × receita exposta), força de trabalho pela abordagem de custo (fica no ágio)
- TAB calculado por fórmula para cada vida útil e alíquota, com opção de desligar; alíquota única em todo o laudo
- Reconciliação WARA × WACC com o retorno implícito do ágio, que precisa ser o maior; tabela de amortização dos intangíveis e IR diferido; compra vantajosa sinalizada
- Checagens automáticas a partir dos checklists Kinsey de valuation e PPA (data, controle, regime e alíquota, ágio, vidas úteis, royalty × margem, imobilizado, contingências, preço diferido, histórico)
- Revisão automática de laudos e modelos recebidos (PDF, DOCX, PPTX): datas divergentes, codinomes diferentes, anos projetados com rótulo errado, regime × alíquota, ágio com retorno menor que os intangíveis, nomes de outras empresas e marcações não preenchidas
- PDF do PPA na estrutura de laudo: sumário, escopo e normas, transação, tangíveis, intangíveis, fluxo do lucro excedente, WARA, amortização e checagens
- Leitura do mandato: retainer em parcelas mensais, prazo, cauda contada do término, bônus de desempenho, tributos por fora ou incluídos e situação (minuta, assinatura eletrônica ou fecho do contrato, com aviso para confirmar)

## v2.18 — 2026-11-15 · Política de abordagem e fontes de prospecção (Econodata, Lemitti, Ramper)
- Política Kinsey: empresas com faturamento anual ou valuation abaixo de R$ 15 milhões ficam fora da abordagem; o target mostra "dentro", "fora" ou "sem dado" no cartão e no dossiê, a consulta da Órbita filtra por política e as importações deixam os fora da política de fora, salvo escolha
- Leitura de faturamento em texto ("50MM", "R$ 500 milhões", "de 30 a 90 milhões", "R$ 1,2 bi")
- Importação de listas exportadas do Econodata (empresas, CNAE, faturamento, funcionários, sócios, decisores e e-mails), do Lemitti (celulares dos sócios) e do Ramper: enriquece quem já está na base pelo CNPJ e inclui os novos como prospecção, com consultas automáticas e opção de ligar a um investidor
- Dossiê do investidor: "Importar targets do Econodata para este investidor" e lista de critérios para a prospecção
- Dossiê do target: sócios, decisores, cargos, e-mails, celulares, funcionários e faturamento das fontes, para uso interno do M&A (não entram em materiais antes do NDA)
- Nenhuma senha de serviço externo é guardada no sistema; ligação direta só por token de API oficial, como segredo do Firebase

## v2.17 — 2026-11-15 · Cadastro principal do projeto, painéis e Ramper
- Cadastro principal do projeto na Base inicial ("+ Novo projeto"): target pelo CNPJ (consultas automáticas), nome-código, lado; equipe Kinsey (sócio do projeto, sócio que trouxe o mandato, sócio que trouxe o investidor), parceiro N2 e investidores (inclusive novo); mandato (situação e anexo em PDF ou Word, lido e enviado ao Jurídico); due diligence pela Kinsey ou self due, com 2, 3 ou 5 exercícios e os balanços ou balancetes anexados já importados (análise prévia automática); valuation pela Kinsey e data-base, que já preenche o Valuation; informações iniciais
- Política de honorários Kinsey como padrão: 6% de success fee e retainer negociável, usualmente devido após a apresentação do NDA com investidor
- Base de due diligence para envio: pedido de documentos dos exercícios definidos (demonstrações, balancetes e documentos da diligência) para copiar, com envio do questionário pelo portal e registro do envio
- Painel do projeto no dossiê do target (N3): equipe, mandato e fee, due diligence (exercícios recebidos, achados e ajustes sem OK), valuation prévio (FCD e múltiplos), Jurídico, investidores, próximos passos e atalhos para cada área
- Painel de novos negócios no dossiê do investidor (N1): o que compra, região, ticket, targets da base que ele compra e lista de prospecção para o Ramper
- Ramper: importar a lista exportada do Ramper (novos targets como prospecção, com consultas automáticas dos CNPJs) e exportar a base para as cadências; ligação direta pela API do Ramper quando houver token (segredo do Firebase, sem senha no sistema)
- Balancete em PDF com tabela de contas legível também é aceito na importação

## v2.16 — 2026-11-15 · Busca por empresa ou CNPJ na Órbita
- Campo de busca logo abaixo do cartão da empresa: encontra na base por nome, razão social, nome-código ou CNPJ (parcial), com os targets primeiro; ao escolher, o mapa vai até a empresa e abre o cartão (investidor abre no modo "o que ele compra")
- CNPJ completo fora da base: oferece cadastrar na Base inicial, já com a consulta à Receita iniciada

## v2.15 — 2026-11-15 · Preenchimento automático pelos documentos
- Balancetes preenchem sozinhos os dados do target: receita líquida, EBITDA normalizado (com os ajustes que já têm OK), dívida líquida e ano do último exercício, a data-base do valuation e o regime tributário (lucro real quando o IR e a CSLL ficam entre 20% e 45% do lucro antes dos impostos; Simples pela Receita)
- Consulta do CNPJ preenche cidade, UF, CNAE, segmento (pelo CNAE) e ano de fundação, quando vazios
- Mandato importado (PDF ou Word) na aba M&A do dossiê: o sistema lê situação (assinado, em negociação ou enviado), success fee (com a divisão entre co-contratados), retainer, exclusividade, prazo, cauda, mínimo, participação e data de assinatura, mostra o que leu para confirmar, preenche o mandato e registra o documento no Jurídico (Contratos e pareceres)
- Mandato já registrado no Jurídico com texto também preenche os campos vazios do mandato; mapa que dizia "assinado" sem data é corrigido pelo documento
- NDA importado: registra o documento, se há assinatura eletrônica, prazo, multa e cláusula de não abordagem, para validação do Jurídico
- O que o consultor salva à mão prevalece sobre o preenchimento automático

## v2.14 — 2026-11-15 · Cartão do target com valuation
- Cartão do target na Órbita mais compacto (menos espaço, botões menores e, no celular, só as linhas principais)
- O cartão mostra o valuation moderado pelo fluxo de caixa descontado e o valuation por múltiplos (EV/EBITDA), com o equity de cada um; "preliminar" quando o histórico ainda não atinge o mínimo; sem balancete, usa o EBITDA do cadastro × múltiplo do segmento

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
