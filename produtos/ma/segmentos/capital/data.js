/* ================= KinseyTec – M&A · CONTEÚDO DO SEGMENTO ================= */
/* N1 Investidores · N2 Intermediadores e parceiros · N3 Targets (empresas-alvo, potenciais clientes de venda) */

/* Centro da rede: a Kinsey Capital (ponto de partida das rotas na órbita) */
const CLIENTE_PADRAO = {nome:"Kinsey Capital", local:"Sede · São Paulo/SP", lat:-23.5869, lng:-46.6822};

/* Órbita: visão inicial mundial (Américas e Europa) e cores por nível */
window.ORB_HOME = [-38, 8, .82];
/* sem os exemplos de notas fiscais e pagamentos das cadeias */
window.OPS_SEM_DEMO = true;
/* órbita: sem o ponto do "cliente contratante"; a rede é N1 investidor → N2 intermediador/Kinsey → N3 target */
window.ORB_SEM_CLIENTE = true;

/* Indicadores de mercado (barra do topo, registro manual) */
const PRACAS_BR = [["SELIC","Selic (% a.a.)"],["IPCA","IPCA 12 meses (%)"],["CDI","CDI (% a.a.)"],["DOLAR","Dólar PTAX (R$)"],["EURO","Euro (R$)"],["IBOV","Ibovespa (pontos)"]];
const INTL = [["SP500","S&P 500","pontos"],["UST10","Treasury 10 anos","% a.a."],["FED","Fed funds","% a.a."]];
const PRECO = {bar:["SELIC","IPCA","DOLAR","IBOV"], barLabel:{SELIC:"Selic",IPCA:"IPCA 12m",DOLAR:"Dólar",IBOV:"Ibovespa"}, fonteEx:"Banco Central, B3 ou terminal de mercado",
  hist:[["SELIC","Selic"],["DOLAR","Dólar"],["IBOV","Ibovespa"]],
  links:[["Banco Central · Selic","https://www.bcb.gov.br/controleinflacao/historicotaxasjuros"],["Banco Central · câmbio PTAX","https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes"],["IBGE · IPCA","https://www.ibge.gov.br/explica/inflacao.php"],["B3 · Ibovespa","https://www.b3.com.br"]]};

/* Investigação (fontes públicas): id, rótulo, tipo, pontos, critério */
const INV = [
 ["divida","Dívida ativa (PGFN / estado / município)","sn",2,"Regularidade fiscal"],
 ["protestos","Protestos em cartório","sn",1,"Regularidade fiscal"],
 ["proc_trab","Passivo trabalhista relevante (processos, autos de infração)","sn",2,"Contingências"],
 ["proc_civ","Processos cíveis relevantes (consumidor, contratos, indenizações)","sn",2,"Contingências"],
 ["proc_trib","Autuações ou execuções fiscais relevantes (contingência tributária)","sn",3,"Contingências"],
 ["proc_crim","Processos criminais da empresa ou dos sócios","sn",4,"Integridade"],
 ["pep","Sócio, administrador ou cotista politicamente exposto (PEP)","sn",2,"Integridade"],
 ["prisao","Sócio preso, denunciado ou sob investigação","sn",4,"Integridade"],
 ["anticorr","Cadastros de empresas punidas (CEIS / CNEP) ou acordo de leniência","sn",5,"Integridade"],
 ["sancoes","Listas de sanções internacionais (ONU, OFAC, UE)","sn",6,"Integridade"],
 ["rj","Recuperação judicial, extrajudicial ou falência (empresa ou grupo)","sn",4,"Saúde financeira"],
 ["rotat","Sócios abrem e fecham empresas rapidamente (CNPJs baixados ou inaptos nos últimos 3 anos)","num",3,"Perfil societário"],
 ["midia","Mídia negativa (fraude, corrupção, litígio societário, desastre ambiental)","sn",3,"Integridade"],
 ["mte","Cadastro de Empregadores do MTE (lista suja)","sn",6,"Trabalhista"],
 ["lic","Atividade sem licença ambiental ou alvará exigidos","sn",3,"Ambiental e regulatório"],
 ["nfria","Notas fiscais frias, de terceiros ou empresa “noteira” (SEFAZ)","sn",4,"Regularidade fiscal"],
 ["especie","Movimentação em espécie incompatível com o porte (indício de lavagem de dinheiro)","sn",3,"Integridade"]
];
const UF_CENTER = {AC:[-9.0,-70.5],AL:[-9.6,-36.6],AP:[1.4,-51.8],AM:[-4.2,-62.5],BA:[-13.5,-40.5],CE:[-5.2,-39.5],DF:[-15.8,-47.9],ES:[-19.5,-40.6],GO:[-16.0,-49.6],MA:[-5.0,-45.3],MT:[-12.6,-55.9],MS:[-20.5,-54.8],MG:[-18.5,-44.6],PA:[-3.8,-52.5],PB:[-7.1,-36.8],PR:[-24.6,-51.6],PE:[-8.4,-37.9],PI:[-7.4,-42.7],RJ:[-22.2,-42.7],RN:[-5.8,-36.6],RS:[-29.7,-53.3],RO:[-10.9,-62.8],RR:[2.0,-61.4],SC:[-27.3,-50.4],SP:[-22.3,-48.6],SE:[-10.6,-37.4],TO:[-10.2,-48.3]};

/* Questionário por nível: [id, pergunta, resposta que indica risco, pontos] */
const Q = {
 N1:[
  {g:"Tese e capacidade", items:[
   ["n1_01","A tese de investimento está formalizada (segmentos, faturamento e EBITDA do alvo, ticket, participação, regiões)?","nao",1],
   ["n1_02","Comprovou capacidade financeira para o ticket (fundo com capital comprometido, carta de conforto ou balanço)?","nao",3],
   ["n1_03","Já concluiu aquisições ou investimentos no Brasil nos últimos 5 anos?",""],
   ["n1_04","Tem comitê de investimento com prazo conhecido para decidir (IOI, LOI, proposta vinculante)?","nao",1]]},
  {g:"KYC e prevenção à lavagem de dinheiro", items:[
   ["n1_05","Identificou o beneficiário final (pessoas físicas por trás do veículo de investimento)?","nao",4],
   ["n1_06","A origem dos recursos está documentada?","nao",4],
   ["n1_07","Algum sócio, cotista relevante ou administrador é pessoa politicamente exposta (PEP)?","sim",2],
   ["n1_08","O investidor ou o grupo aparece em listas de sanções (ONU, OFAC, UE) ou de empresas punidas?","sim",6]]},
  {g:"Relacionamento com a Kinsey", items:[
   ["n1_09","Assinou o NDA padrão Kinsey (acordo de confidencialidade geral)?","nao",1],
   ["n1_10","Aceita a regra de não abordar o target diretamente (non-circumvention)?","nao",2]]}
 ],
 N2:[
  {g:"Acordo e remuneração", items:[
   ["n2_01","Assinou o acordo de originação e parceria Kinsey?","nao",2],
   ["n2_02","A remuneração (fee de originação, divisão do success fee) está definida por escrito?","nao",2],
   ["n2_03","Declarou conflitos de interesse (relação com o target ou com investidores)?","nao",2]]},
  {g:"Compliance", items:[
   ["n2_04","Assinou o NDA padrão Kinsey?","nao",1],
   ["n2_05","Tem registro exigido para a atividade (CVM, ANBIMA, OAB, CRC), quando aplicável?","nao",1],
   ["n2_06","Aderiu à política anticorrupção da Kinsey (Lei 12.846/2013)?","nao",3]]}
 ],
 N3:[
  {g:"Societário e intenção de venda", items:[
   ["n3_01","Os sócios estão alinhados com a venda (participação, preço e prazo)?","nao",2],
   ["n3_02","Existe acordo de sócios com direito de preferência, tag along ou drag along?",""],
   ["n3_03","Há disputa entre sócios ou herdeiros (inventário, litígio societário)?","sim",4],
   ["n3_04","A empresa depende de um fundador ou de um único gestor-chave?","sim",2]]},
  {g:"Financeiro", items:[
   ["n3_05","Tem demonstrações financeiras auditadas dos últimos 3 anos?","nao",2],
   ["n3_06","O EBITDA informado é recorrente (sem receitas ou ajustes extraordinários)?","nao",3],
   ["n3_07","Algum cliente representa mais de 30% do faturamento?","sim",3],
   ["n3_08","A dívida líquida e as garantias dadas estão informadas por completo?","nao",3]]},
  {g:"Fiscal, trabalhista e ambiental", items:[
   ["n3_09","Tem parcelamentos fiscais, autuações ou teses tributárias agressivas?","sim",3],
   ["n3_10","Usa terceirização ou pejotização relevante (risco de vínculo trabalhista)?","sim",2],
   ["n3_11","As licenças ambientais e alvarás estão vigentes para todas as unidades?","nao",3]]},
  {g:"Contratos e compliance", items:[
   ["n3_12","Contratos relevantes têm cláusula de mudança de controle (change of control)?","sim",2],
   ["n3_13","Tem programa de integridade e adequação à LGPD?","nao",1],
   ["n3_14","Assinou NDA e mandato com a Kinsey?","nao",1]]}
 ]
};

/* Checklist documental (data room) */
const DOCS = {
 N1:["Apresentação institucional e tese de investimento","Documentos societários do veículo de investimento","Identificação do beneficiário final (KYC)","Comprovação de capacidade financeira","NDA padrão Kinsey assinado","Política de investimentos e governança"],
 N2:["Cartão CNPJ e contrato social","Acordo de originação e parceria assinado","NDA padrão Kinsey assinado","Registros profissionais (CVM, ANBIMA, OAB, CRC), se aplicável","Declaração de conflito de interesses","Termo de adesão à política anticorrupção"],
 N3:["Contrato social, alterações e acordo de sócios","Cartão CNPJ e inscrições","Demonstrações financeiras (3 anos) e balancete do ano","Relatório de auditoria independente","Endividamento: contratos, garantias e cronograma","Certidões negativas (RFB/PGFN, SEFAZ, município, FGTS, CNDT)","Relação de processos (cível, trabalhista, tributário) com prognóstico","Contratos relevantes com clientes e fornecedores","Licenças ambientais, alvarás e AVCB","Folha de pagamento e eSocial","Programa de integridade e LGPD","NDA e mandato Kinsey assinados"]
};

/* Visitas e reuniões (in loco) */
const INSP = {
 N1:[["i_comite","Reunião com o time ou o comitê de investimento"],["i_tese","Tese conferida com investimentos anteriores (portfólio)"],["i_cap","Capacidade financeira conferida (fundo, carta, balanço)"]],
 N2:[["i_reu","Reunião de alinhamento sobre originação e conflitos"],["i_ref","Referências de operações anteriores conferidas"]],
 N3:[["i_sede","Visita à sede e às unidades operacionais"],["i_gestao","Reunião com sócios e gestão (management presentation)"],["i_ativos","Ativos relevantes conferidos (imóveis, máquinas, estoques)"],["i_sist","Sistemas de gestão e controles financeiros conferidos"]]
};

const EV_TYPES = ["Apresentação / teaser","Apresentação institucional","Pre-release / comunicado","Contrato social","Demonstração financeira","Relatório de auditoria","Certidão","Contrato","NDA assinado","Mandato assinado","Proposta (IOI / LOI)","Laudo / valuation","Ata de reunião","Foto de visita","Outro"];
const PHOTO_TYPES = ["Foto de visita"];

const SUP_TYPES = {N1:["Investidor estratégico","Private equity","Family office","Fundo de investimento","Venture capital","Pessoa física qualificada"],N2:["Kinsey Capital","Parceiro originador","Assessor financeiro","Escritório de advocacia","Consultoria contábil"],N3:["Target · prospecção","Target · mandato de venda","Target · buy-side (procurada para investidor)"]};
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const PROD_REF = Object.fromEntries(UFS.map(u => [u, 0]));

/* Capitais e polos econômicos — coordenadas aproximadas */
const MUNI = [
 ["São Paulo","SP",-23.550,-46.633],["Campinas","SP",-22.906,-47.061],["Ribeirão Preto","SP",-21.177,-47.810],["Sorocaba","SP",-23.501,-47.458],["São José dos Campos","SP",-23.179,-45.887],["Jundiaí","SP",-23.186,-46.884],
 ["Rio de Janeiro","RJ",-22.907,-43.173],["Niterói","RJ",-22.883,-43.103],["Belo Horizonte","MG",-19.917,-43.934],["Uberlândia","MG",-18.918,-48.277],["Juiz de Fora","MG",-21.762,-43.350],
 ["Curitiba","PR",-25.429,-49.271],["Londrina","PR",-23.304,-51.169],["Maringá","PR",-23.420,-51.933],["Florianópolis","SC",-27.595,-48.548],["Joinville","SC",-26.304,-48.846],["Blumenau","SC",-26.919,-49.066],
 ["Porto Alegre","RS",-30.034,-51.217],["Caxias do Sul","RS",-29.168,-51.179],["Salvador","BA",-12.971,-38.501],["Recife","PE",-8.047,-34.877],["Fortaleza","CE",-3.731,-38.526],["Natal","RN",-5.795,-35.209],
 ["Manaus","AM",-3.119,-60.022],["Belém","PA",-1.456,-48.490],["Goiânia","GO",-16.686,-49.264],["Brasília","DF",-15.794,-47.882],["Cuiabá","MT",-15.601,-56.097],["Campo Grande","MS",-20.469,-54.620],["Vitória","ES",-20.315,-40.312]
];

/* Cláusulas verificadas em contratos de M&A (SPA, acordo de investimento, LOI) */
const CLAUSES = [
 ["c_preco","Preço, mecanismo de ajuste (capital de giro, dívida líquida) e earn-out"],
 ["c_decl","Declarações e garantias dos vendedores (societário, fiscal, trabalhista, ambiental, contratos)"],
 ["c_indeniz","Indenização: limites, franquia, prazo e contingências específicas"],
 ["c_escrow","Retenção de preço ou conta garantia (escrow)"],
 ["c_cp","Condições precedentes (CADE, anuências de terceiros, reorganização societária)"],
 ["c_nc","Não concorrência e não aliciamento dos vendedores"],
 ["c_conf","Confidencialidade, LGPD e anticorrupção (Lei 12.846/2013)"],
 ["c_lei","Lei aplicável, foro ou arbitragem"]
];
const CLAUSE_INFO = {
 "c_preco":["Código Civil, arts. 481 a 504 (compra e venda)","Fórmula do ajuste, data-base, quem calcula e como resolver divergências",true],
 "c_decl":["Código Civil, arts. 421, 422 e 443 (boa-fé e vícios)","Declarações cobrem os achados da diligência; ressalvas listadas no anexo de exceções",true],
 "c_indeniz":["Código Civil, arts. 389 a 405 e 927","Teto, franquia, prazo de sobrevivência e indenização específica para riscos prováveis",true],
 "c_escrow":["Contrato de depósito (Código Civil, art. 627)","Valor compatível com as contingências possíveis e prováveis apontadas",false],
 "c_cp":["Lei 12.529/2011 (CADE)","Notificação ao CADE quando atingir os limites; anuências de bancos e clientes com change of control",true],
 "c_nc":["Código Civil, art. 1.147 (trespasse) por analogia","Prazo e território razoáveis; contrapartida definida",false],
 "c_conf":["Lei 13.709/2018 (LGPD); Lei 12.846/2013","Tratamento dos dados do data room; declarações anticorrupção dos vendedores",true],
 "c_lei":["Lei 9.307/1996 (arbitragem)","Câmara arbitral, sede e idioma",false]
};

/* NDA geral (aceite no dossiê e no Portal). Modelo provisório: o Jurídico da Kinsey substitui pelo oficial em Jurídico · Modelos. */
var NDA_VERSION = "NDA Kinsey Capital · modelo provisório v0.1";
const NDA_TEXT = [
 ["1. Partes e objeto","Acordo de confidencialidade entre a Kinsey Capital (\"Kinsey\") e a parte identificada no aceite, para troca de informações sobre possíveis operações de fusão, aquisição, investimento ou venda de participação (\"Operação\")."],
 ["2. Informações confidenciais","São confidenciais todas as informações recebidas da Kinsey ou por meio dela: identidade das empresas, nomes-código, teasers, memorandos (CIM), data room, financeiros, propostas e a própria existência das negociações."],
 ["3. Uso restrito","As informações só podem ser usadas para avaliar a Operação. Não podem ser copiadas, divulgadas ou usadas para concorrer com a empresa avaliada."],
 ["4. Não abordagem (non-circumvention)","A parte não contatará diretamente a empresa avaliada, seus sócios, empregados, clientes ou fornecedores sem autorização escrita da Kinsey, durante a vigência e por 24 meses depois."],
 ["5. Não aliciamento","A parte não contratará empregados-chave da empresa avaliada por 24 meses, salvo por processo seletivo público não dirigido."],
 ["6. Dados pessoais (LGPD, Lei 13.709/2018)","Dados de sócios, administradores e empregados constantes do data room serão tratados só para a avaliação da Operação, com segurança e acesso restrito, e eliminados ao final."],
 ["7. Devolução e prazo","Ao fim das negociações, ou a pedido da Kinsey, a parte devolve ou destrói as informações. O sigilo vale por 3 anos após o término do acordo."],
 ["8. Penalidade e foro","O descumprimento sujeita a parte a perdas e danos e à multa definida na versão oficial. Foro da comarca de São Paulo/SP."]
];

/* Contratada nos mandatos (Kinsey BR) e condições padrão do mandato de venda: success fee de 6% do valor total da transação;
   valor mínimo da operação = valuation ou múltiplo (faturamento/EBITDA), arredondado ao milhão; sucesso mínimo = valor mínimo × 6%;
   retainer = 10% do sucesso mínimo, em 10 parcelas, a 1ª 15 dias após a apresentação do NDA assinado com o investidor. */
const MA_KINSEY = "KINSEY ALLEN BRASIL CONSULTORIA ESPECIALIZADA E M&A LTDA., pessoa jurídica de direito privado, com sede na Avenida Brigadeiro Faria Lima, 1.811, cj. 1119, Jardim Paulistano, São Paulo/SP, CEP 01452-001, inscrita no CNPJ/MF sob o nº 22.618.991/0001-03, e KINSEY CAPITAL BRASIL CONSULTORIA E M&A LTDA., com sede na Rua Butantã, 468, Pinheiros, São Paulo/SP, CEP 05424-000, inscrita no CNPJ/MF sob o nº [CNPJ da Kinsey Capital Brasil], empresas representadas pelo Grupo Kinsey Allen International, neste ato por seu diretor Newton K. dos Anjos Oliveira";
const MA_MANDATO_PADRAO = {pct:6, retPct:10, parcelas:10, dias:15, prazo:24, resil:13, tail:12, trib:16};
const MA_MANDATO_VENDA = [["CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ASSESSORIA E NEGOCIAÇÃO – KINSEY BR","Pelo presente instrumento, as partes abaixo:\n{EMPRESA}, com sede em {ENDERECO}, inscrita no CNPJ/MF sob o nº {DOC}, neste ato por seus representantes legais infra-assinados (“Empresa” ou “Contratante”);\n{SOCIOS}, na qualidade de sócios da Empresa e intervenientes anuentes (“Sócios” e, em conjunto com a Empresa, “Cliente”); e\n{KINSEY} (em conjunto, “Contratada” ou “KINSEY BR”).\nTodas as partes acima, quando referidas isoladamente, são designadas “Parte” e, quando referidas em conjunto, “Partes”."],["CONSIDERANDO","QUE os Sócios são legítimos detentores de 100% (cem por cento) do capital social da Empresa, a qual {ATIVIDADE}; e\nQUE a KINSEY BR é empresa especializada na prestação de serviços de planejamento e assessoria para acionistas, investidores, empresas e executivos com relação às mais diversas modalidades de transações e negócios,\nAS PARTES RESOLVEM firmar o presente Contrato de Prestação de Serviços de Assessoria (“Contrato”), que se regerá pelas seguintes cláusulas e condições:"],["1. Definições","1.1. Conforme usados neste Contrato, os termos iniciados por letra maiúscula terão os significados previstos no corpo do presente e em seu Anexo 1.1."],["2. Objeto","2.1. Tendo em vista a potencial Transação pretendida, o Cliente neste ato contrata a KINSEY BR para prestar os seguintes serviços de consultoria, conforme estes venham a ser necessários, tendo em vista a dinâmica e o andamento da assessoria e da Transação em negociação (“Assessoria”):\nFase I:\n(a) Lista de Alvos e Tese de Investimento: (i) identificação e submissão ao Cliente da Lista de Alvos; (ii) definição da estratégia de condução do processo de abordagem das Empresas Alvo; e (iii) discussão dos principais aspectos da tese de investimento a ser apresentada às Empresas Alvo;\n(b) Avaliação econômico-financeira: elaboração ou atualização do laudo de avaliação (valuation) da Empresa para a data-base de {DATABASE};\nFase II:\n(c) Memorando de Informações: preparação de documento descrevendo a Empresa e o seu mercado de atuação, o qual, depois de discutido com o Cliente, será utilizado para apresentação da Empresa às Empresas Alvo interessadas;\n(d) Prospecção: checagem do interesse das Empresas Alvo na Transação apresentada;\n(e) Negociação: negociação dos termos e condições preliminares para a consumação da Transação;\n(f) Acompanhamento de Auditorias: quando requisitado pelo Cliente, acompanhamento e/ou coordenação dos trabalhos de advogados e auditores contratados pelo Cliente e/ou pela Empresa Alvo no decorrer do processo de auditoria; e\n(g) Consumação da Transação: conforme solicitado pelo Cliente, suporte nas negociações finais dos termos e condições da Transação, juntamente com advogados contratados pelo Cliente.\n2.2. A Assessoria aqui contratada não importa, de forma alguma, na outorga pelo Cliente de mandato, procuração ou quaisquer outros poderes para que a KINSEY BR, seus sócios, administradores ou empregados pratiquem qualquer ato em nome ou por conta do Cliente.\n2.3. Durante sua vigência, este Contrato é revestido do caráter de exclusividade, sendo certo que o Cliente: (i) assegura que a KINSEY BR será a única a prestar os serviços de Assessoria aqui descritos; (ii) não iniciará, por conta própria e sem o envolvimento da KINSEY BR, negociações com empresas e/ou investidores que, dado o escopo deste Contrato, caberiam à KINSEY BR iniciar e desenvolver; e (iii) deverá pagar a Remuneração de Sucesso abaixo prevista, mesmo que decida não envolver a KINSEY BR em parte das tratativas referentes à Transação eventualmente consumada.\n2.4. O Cliente fornecerá à KINSEY BR as informações relacionadas à Empresa e ao seu negócio, conforme estas venham a ser solicitadas, e reconhece e concorda que a KINSEY BR: (a) assumirá que as informações fornecidas são precisas e, sem qualquer verificação independente, as utilizará para fins da Assessoria; (b) não assumirá qualquer responsabilidade com relação à precisão, veracidade, completude, regularidade e razoabilidade de tais informações e dos materiais preparados com base nelas; e (c) não fará análise dos ativos ou passivos contingentes da Empresa, das Empresas Alvo ou de quaisquer outros terceiros envolvidos na Transação. Durante a vigência deste Contrato, o Cliente compromete-se, ainda, a informar imediatamente à KINSEY BR a ocorrência de fatos materiais relacionados à Empresa ou que possam afetar a Transação."],["3. Remuneração e Reembolso","3.1. Pelos serviços de Assessoria, a KINSEY BR fará jus a uma remuneração fixa (“Retainer” ou “Remuneração Fixa”) e a uma remuneração de sucesso, calculadas na forma abaixo.\n3.2. Remuneração de Sucesso. Na data da Consumação da Transação, será devida à KINSEY BR remuneração de {SUCPCT} do Valor Total da Transação, válida para pagamentos efetuados pelo investidor via cash-in e/ou cash-out, tanto para a operação quanto para eventuais negociações de imóveis e demais ativos da Empresa (“Remuneração de Sucesso”).\n3.3. Valor Mínimo da Operação e Remuneração de Sucesso Mínima. Para os fins deste Contrato, as Partes adotam como Valor Mínimo da Operação o montante de {VALORMIN}, correspondente ao valor estimado da Empresa apurado pela KINSEY BR com base em {BASEMIN}, arredondado para o milhão mais próximo. A Remuneração de Sucesso não será inferior a {SUCPCT} do Valor Mínimo da Operação, isto é, {SUCMIN} (“Remuneração de Sucesso Mínima”).\n3.4. Retainer. Pelos serviços das Fases I e II (Cláusula 2.1, itens (a) a (g)), o Cliente pagará à KINSEY BR Retainer equivalente a {RETPCT} da Remuneração de Sucesso Mínima, no total de {RETTOTAL}, em {PARCELAS} parcelas mensais, iguais e sucessivas de {PARCELA}. A primeira parcela vencerá {RETDIAS} dias após a apresentação, pela KINSEY BR ao Cliente, do primeiro acordo de confidencialidade (NDA) assinado por investidor interessado na Transação, e as demais a cada 30 (trinta) dias.\n3.5. Os valores efetivamente pagos a título de Retainer serão deduzidos da Remuneração de Sucesso na data da Consumação da Transação.\n3.6. Os tributos (impostos, taxas e contribuições) incidentes sobre a Remuneração Fixa não estão incluídos nos honorários e serão acrescidos ao valor de cada parcela, no percentual de {TRIBUTOS}, correspondente à alíquota do Simples Nacional da KINSEY BR.\n3.7. A Remuneração de Sucesso deverá ser paga na data da Consumação da Transação, independentemente de performances exigidas dos sócios ou administradores após o período de aquisição, diretamente pelo Cliente ou, com a concordância das Partes, diretamente pelo investidor, descontando-se do valor da operação.\n3.8. Ainda como parte da Remuneração de Sucesso, a exclusivo critério do Cliente, a KINSEY BR poderá receber bônus de desempenho adicional equivalente a até 20% (vinte por cento) da parcela do valor negociado que superar o Valor Total da avaliação econômico-financeira ou o valor alinhado com o Cliente, quando comprovado que a Transação foi negociada por valor superior (“Remuneração de Incentivo”).\n3.9. Exclusivamente na hipótese em que o Cliente consume uma primeira Transação envolvendo parcela minoritária do capital social da Empresa (“Transação Minoritária”), a KINSEY BR fará jus a Remuneração de Sucesso complementar caso seja consumada outra Transação, com a Empresa Alvo original, com investidores apresentados pela KINSEY BR ou com qualquer terceiro ligado aos investidores do networking da KINSEY BR, dentro do prazo de 12 (doze) meses contados da data da consumação da Transação Minoritária.\n3.10. Eventuais despesas necessárias à prestação dos serviços de Assessoria, tais como deslocamentos terrestres e viagens (transporte, hospedagem e alimentação), serão reembolsadas pelo Cliente, mediante sua autorização prévia, em até 5 (cinco) dias úteis contados da apresentação do respectivo relatório de despesas e dos comprovantes.\n3.11. A KINSEY BR possui parcerias nacionais e internacionais e, no decorrer da prestação dos serviços, poderá, mediante aprovação do Cliente, requisitar serviços de tais parceiros. Caso aplicável, a KINSEY BR indicará ao Cliente qual parcela das remunerações acima deverá ser paga à KINSEY BR e qual deverá ser paga diretamente aos parceiros envolvidos na Transação."],["4. Indenização","4.1. O Cliente reconhece e aceita que os serviços de Assessoria prestados pela KINSEY BR constituem obrigação de meio. Desta forma, em nenhum momento a KINSEY BR conferirá qualquer tipo de garantia em relação a possíveis resultados que poderão advir da Assessoria ou de qualquer decisão que o Cliente venha a tomar em relação aos trabalhos, análises ou relatórios apresentados pela KINSEY BR.\n4.2. O Cliente reconhece e concorda expressamente que a indenização devida pela KINSEY BR em decorrência de eventuais Perdas incorridas pelo Cliente será limitada, em conjunto, ao valor total do Retainer previsto na Cláusula 3.4."],["5. Prazo","5.1. Este Contrato entra em vigor nesta data e vigorará pelo prazo de {PRAZO} meses, podendo ser resilido a partir do {RESILICAO} mês de vigência, por qualquer das Partes, mediante notificação por escrito enviada com 30 (trinta) dias de antecedência à outra Parte, respeitado o disposto abaixo (“Data de Término”). As previsões deste Contrato que devam continuar a surtir efeitos após a sua resolução permanecerão em vigor pelos respectivos prazos ou enquanto puderem ser legalmente exigíveis.\n5.2. O Cliente deverá pagar, até a Data de Término, eventuais parcelas vencidas e não pagas da Remuneração Fixa ou variável, calculadas pro rata die até a resolução do Contrato, bem como as despesas incorridas até tal data.\n5.3. Em decorrência da exclusividade e mediante a resolução deste Contrato a qualquer título e sob qualquer forma, a Empresa e os Sócios serão solidariamente obrigados a pagar à KINSEY BR a Remuneração de Sucesso prevista na Cláusula 3, caso o Cliente consume uma Transação com qualquer terceiro dentro do prazo de {TAIL} meses contados da Data de Término, independentemente de a negociação ter se iniciado antes ou depois de tal data. Em nenhuma hipótese a operação poderá ser realizada com outro assessor para clientes ou parceiros anteriormente apresentados pela KINSEY BR, exceto se paga à KINSEY BR a Remuneração de Sucesso.\n5.4. Caso o Cliente consume a Transação, de forma direta ou indireta e independentemente da forma ou estrutura jurídica adotada, por meio de subsidiária, controladora ou outra pessoa física ou jurídica, ou com investidor apresentado pela KINSEY BR durante o período contratual, deverá pagar a Remuneração de Sucesso devida à KINSEY BR nos mesmos prazos e condições estabelecidos neste Contrato, como se a Transação estivesse sendo realizada diretamente pelo Cliente. Transação consumada entre as partes que compõem o Cliente, suas afiliadas e/ou subsidiárias, ou ainda com administradores ou executivos da Empresa, será considerada Transação para fins de pagamento da Remuneração de Sucesso."],["6. Disposições Gerais","6.1. Este Contrato será regido e interpretado de acordo com as leis da República Federativa do Brasil. As Partes elegem o Foro da Comarca da Capital do Estado de São Paulo para dirimir quaisquer dúvidas ou litígios oriundos do presente instrumento, com expressa renúncia a qualquer outro, por mais privilegiado que seja.\n6.2. O Cliente desde já autoriza a divulgação da Transação que venha a ser consumada, incluindo o fato de a KINSEY BR ter prestado os serviços de Assessoria, por meio de imprensa, tombstones, comunicações institucionais, comerciais e/ou informativos.\n6.3. Os documentos, opiniões, avaliações, estudos, recomendações, projeções e quaisquer outros documentos preparados pela KINSEY BR no âmbito da Transação ficarão restritos ao Cliente e não poderão ser disponibilizados a terceiros sem o prévio e expresso consentimento, por escrito, da KINSEY BR. Nenhuma disposição deste Contrato gerará responsabilidade ou dever da KINSEY BR perante credores do Cliente ou outros terceiros, e nenhum parecer ou assessoria fornecida pela KINSEY BR poderá ser interpretado como recomendação a essas pessoas acerca dos atos que devam praticar com relação à Transação.\n6.4. O Cliente reconhece e concorda que, no decorrer da Assessoria, a KINSEY BR utilizará softwares de terceiros, de forma que as informações e documentos trocados entre as Partes e/ou com Empresas Alvo, auditores e advogados serão armazenados em ambientes de nuvem, cujos provedores serão, entre outros, responsáveis pelo gerenciamento da segurança de tais informações; a KINSEY BR não terá responsabilidade com relação a tais softwares, incluindo seu funcionamento e a segurança da informação neles armazenada.\n6.5. O Cliente, direta ou indiretamente, compromete-se a não empregar, receber, requisitar ou aceitar o desempenho dos serviços previstos neste Contrato, nem solicitar a contratação de qualquer empregado, sócio, diretor ou administrador da KINSEY BR, enquanto vigorar este Contrato.\n6.6. As obrigações e direitos deste Contrato obrigam as Partes e seus sucessores a qualquer título. As Partes não poderão ceder ou transferir quaisquer obrigações deste instrumento a terceiros sem o prévio e expresso consentimento da outra Parte.\n6.7. O Cliente obriga-se solidariamente a indenizar e manter a KINSEY BR indene, da maneira mais abrangente possível, contra demandas de qualquer espécie iniciadas por terceiros contra a KINSEY BR, seus profissionais e/ou sócios, decorrentes da prestação dos serviços de meio ao Cliente ou da própria Transação. Exceto por danos decorrentes de atos praticados pela KINSEY BR com dolo, quaisquer outros danos ou perdas sofridos pela KINSEY BR, seus profissionais e/ou sócios em razão dessas demandas, inclusive honorários advocatícios e demais custos, serão imediatamente indenizados pelo Cliente. Esta obrigação permanecerá vigente após a resolução deste Contrato por qualquer motivo.\n6.8. A relação jurídica estabelecida por este Contrato refere-se única e exclusivamente ao Cliente, de um lado, e à KINSEY BR, de outro, de forma que os sócios, diretores e/ou empregados da KINSEY BR não terão qualquer responsabilidade perante o Cliente ou terceiros em decorrência da execução do objeto deste Contrato. A Empresa e os Sócios serão, para todos os fins, solidariamente responsáveis por quaisquer pagamentos ou obrigações devidas à KINSEY BR nos termos deste Contrato.\n6.9. As Partes obrigam-se a atuar em conformidade com a legislação vigente de proteção de Dados Pessoais e com as determinações dos órgãos reguladores sobre o tema, em especial a Lei 13.709/2018 – Lei Geral de Proteção de Dados Pessoais (“LGPD”). O Cliente poderá, a seu exclusivo critério, permitir acesso e/ou fornecer à KINSEY BR informações relacionadas a pessoa física identificada ou identificável, inclusive de seus empregados e clientes (“Dados Pessoais”), e declara que a KINSEY BR está autorizada a receber, armazenar, tratar e processar tais Dados Pessoais para as finalidades deste Contrato, e que possui os direitos, fundamentos legais e/ou consentimentos necessários, inclusive dos titulares, para seu uso, tratamento, armazenagem e compartilhamento com Empresas Alvo e/ou terceiros, como aqui previsto. Cada Parte cumprirá as obrigações que lhe forem impostas pela legislação de privacidade aplicável, sendo o Cliente responsável por eventuais perdas incorridas pela KINSEY BR.\n6.10. Nenhuma tolerância de qualquer das Partes com a violação de disposições deste Contrato significará renúncia ou precedente, e o presente só poderá ser alterado por acordo escrito entre as Partes. A eventual invalidade ou ineficácia de determinada disposição não afetará as demais; em substituição, as Partes negociarão de boa-fé disposição similar que reflita a intenção original. As Partes participaram conjuntamente da negociação e elaboração deste Contrato, que será interpretado como elaborado conjuntamente.\n6.11. As notificações e comunicações relativas a este Contrato serão enviadas por via postal registrada aos endereços e representantes indicados no preâmbulo, ou por e-mail a estes endereçado. A Parte que mudar de endereço deverá informar o novo endereço à outra em até 30 (trinta) dias, sob pena de ser considerada notificada pelas correspondências enviadas ao endereço anterior.\n6.12. O não pagamento de qualquer valor devido à KINSEY BR acarretará ao devedor o dever de pagar o principal acrescido de: (i) atualização monetária pela variação positiva do IGP-M/FGV; (ii) juros de 1% (um por cento) ao mês, ambos calculados da data do vencimento até o efetivo pagamento; e (iii) multa de 10% (dez por cento) do principal atualizado e acrescido dos juros, além do reembolso das despesas de cobrança, inclusive honorários advocatícios.\n6.13. O inadimplemento do Cliente quanto à Remuneração de Sucesso acarretará multa penal de caráter não indenizatório correspondente ao valor líquido da Remuneração de Sucesso Mínima prevista na Cláusula 3.3, sem prejuízo do pagamento do saldo remanescente da Remuneração de Sucesso e de indenização por perdas e danos.\n6.14. O presente instrumento constitui título executivo extrajudicial, nos termos do artigo 784, III, do Código de Processo Civil.\n6.15. Cada Parte declara e garante à outra que: (a) está devidamente constituída, com existência válida e situação regular, e possui os poderes e autorizações necessários para conduzir seus negócios; (b) tem plenos poderes para firmar e cumprir este Contrato, cuja assinatura foi devidamente autorizada, constituindo obrigação legal, válida, vinculante e exequível; (c) a assinatura e o cumprimento deste Contrato não violam seus atos constitutivos, contratos relevantes de que seja parte, nem legislação, sentença ou ordem a que esteja sujeita; (d) nenhum consentimento, aprovação ou registro adicional é necessário para a assinatura e o cumprimento deste Contrato; e (e) não há ação, litígio ou processo pendente que possa afetar adversamente sua capacidade de cumprir as obrigações aqui previstas.\n6.16. O Cliente reconhece que a KINSEY BR está sujeita às normas de prevenção à lavagem de dinheiro, em especial a Lei 9.613/1998, alterada pela Lei 12.683/2012, e obriga-se a fornecer à KINSEY BR, em todas as fases da contratação, informações e documentos corretos e completos, incluindo o formulário “Cadastro de Cliente”, a ser entregue preenchido na data da assinatura deste Contrato com os documentos ali solicitados.\n6.17. As Partes reconhecem como válida e eficaz a contratação por meios eletrônicos, digitais e informáticos, constituindo título executivo extrajudicial para todos os fins de direito, ainda que com assinatura eletrônica ou certificação fora dos padrões ICP-Brasil, conforme o art. 10, § 2º, da Medida Provisória nº 2.200-2/2001.\n6.18. Este Contrato constitui a integralidade do acordo das Partes quanto ao seu objeto e substitui todos os entendimentos e negociações anteriores.\nE, POR ESTAREM ASSIM JUSTAS E CONTRATADAS, as Partes assinam o presente Contrato em formato digital, por meio de seus representantes legais devidamente autorizados, na presença das testemunhas abaixo.\n{DATA}."],["ANEXO 1.1 – DEFINIÇÕES","“Consumação da Transação”: é a data em que o Cliente firmar os documentos definitivos e vinculantes da Transação.\n“Empresas Alvo”: são os investidores financeiros e/ou estratégicos, nacionais e/ou estrangeiros, pessoas físicas ou jurídicas, que podem ou não atuar na mesma área e mercado do Cliente e que podem se interessar em avaliar uma possível Transação, incluindo, mas não se limitando, àqueles previstos na Lista de Alvos.\n“Lista de Alvos”: é a lista das Empresas Alvo apresentada pela KINSEY BR ao Cliente, que poderá ser complementada pelo Cliente com o nome de todas as partes com quem teve contato ou tratativas antes da data deste Contrato e/ou daquelas que, a seu ver, possam se interessar pela Transação. A lista poderá ser atualizada pelas Partes a qualquer momento.\n“Perdas”: significam as perdas e danos diretos incorridos pelo Cliente decorrentes exclusivamente de atos dolosos praticados pela KINSEY BR, após comprovação e decisão judicial transitada em julgado, única hipótese em que a KINSEY BR terá a obrigação de indenizar o Cliente. Não serão consideradas Perdas quaisquer outras perdas e danos, diretos ou indiretos (inclusive lucros cessantes), ainda que decorrentes: (i) da não realização de resultado esperado pelo Cliente; (ii) de outros atos praticados pela KINSEY BR ou de atos e decisões do Cliente, inclusive a Consumação de Transação com base na Assessoria; (iii) da eventual perda de negócio pelo Cliente; e/ou (iv) da insolvência de qualquer das Partes.\n“Transação”: significa toda e qualquer operação que envolva: (i) venda total ou parcial, direta ou indireta, da participação societária detida pelos Sócios na Empresa, de seus direitos de subscrição e/ou preferência ou de ativos tangíveis ou intangíveis da Empresa (inclusive bens mobiliários e/ou imobiliários), a terceiros não relacionados, entre si e/ou a seus próprios administradores, afiliadas ou subsidiárias (“Venda”); (ii) fusão, combinação total ou parcial de negócios com terceiros, cisão total ou parcial, conferência de ativos, capitalização ou outra operação societária, comercial ou contábil que resulte em alteração da estrutura societária da Empresa e no ingresso de terceiros (“Reorganização Societária”); (iii) investimento em negócio mediante a criação de vínculo para exploração de atividades, como parcerias ou joint venture (“Parceria Estratégica”); e/ou (iv) captação de recursos com investidores financeiros ou estratégicos por meio de aumento de capital, oferta privada ou pública de ações, financiamento ou outras formas de endividamento, inclusive emissão de títulos e/ou valores mobiliários (“Captação”).\n“Valor Total da Transação”: é a soma do montante pago ou a ser pago ao Cliente: (i) pela participação negociada na Empresa, sob qualquer forma (inclusive aumento de capital, contribuição de ativos, cisão, fusão ou outras operações societárias ou comerciais que envolvam a participação de terceiros no negócio), à vista ou em decorrência de exercício futuro de opções ou da performance da Empresa, independentemente da natureza e da forma do pagamento (incluindo valores retidos, valores de consultoria, aluguéis negociados e outras formas, como ativos ou valores mobiliários); e (ii) do valor da dívida líquida da Empresa, sendo que, em Transações parciais, a parcela da dívida considerada será proporcional ao percentual societário transacionado."]];

/* Modelos padronizados Kinsey (Jurídico). Provisórios: o Jurídico substitui pelo texto oficial no sistema, sem nova versão.
   Campos entre chaves são preenchidos com os dados da empresa e do mandato ao gerar o documento. */
const MA_MODELOS = [
 {id:"nda_geral", titulo:"NDA geral · confidencialidade", para:["N1","N2","N3"], uso:"Antes de qualquer informação: investidores, parceiros e targets.", versao:"provisório v0.1", texto: NDA_TEXT},
 {id:"nda_mandato", titulo:"NDA do mandato · investidor", para:["N1"], uso:"Por mandato. Libera o nome da empresa, o CIM e o data room ao investidor.", versao:"provisório v0.1", texto:[
  ["1. Partes","Kinsey Capital, em nome da empresa do mandato {CODINOME}, e {EMPRESA}, CNPJ/ID {DOC}, representada por {REPRESENTANTE}."],
  ["2. Objeto","Acesso às informações do mandato {CODINOME} (memorando, data room, gestão) para avaliar a aquisição de participação."],
  ["3. Confidencialidade e uso","As informações são confidenciais e só podem ser usadas para avaliar esta operação. A identidade da empresa do mandato não pode ser revelada a terceiros."],
  ["4. Não abordagem","Todo contato com a empresa, sócios, empregados, clientes e fornecedores passa pela Kinsey, durante o processo e por 24 meses."],
  ["5. Data room","Acesso pessoal e intransferível; downloads registrados e com marca d'água. A Kinsey pode encerrar o acesso a qualquer momento."],
  ["6. Sem obrigação de fechar","Este acordo não obriga nenhuma das partes a fazer ou aceitar proposta."],
  ["7. Prazo, penalidade e foro","Sigilo por 3 anos. Multa e foro conforme a versão oficial. Data: {DATA}."]]},
 {id:"mandato_venda", titulo:"Mandato de assessoria · venda (sell-side)", para:["N3"], uso:"Target que contrata a Kinsey para vender participação. Modelo Kinsey BR, preenchido com o cadastro do target e as condições calculadas (Jurídico · Mandatos).", versao:"Kinsey BR · modelo 2026", base:true, texto:MA_MANDATO_VENDA},
 {id:"mandato_compra", titulo:"Mandato de assessoria · compra (buy-side)", para:["N1"], uso:"Investidor que contrata a Kinsey para encontrar e adquirir empresas.", versao:"provisório v0.1", texto:[
  ["1. Partes","{EMPRESA}, CNPJ/ID {DOC}, representada por {REPRESENTANTE} (\"Contratante\"), e Kinsey Capital (\"Kinsey\")."],
  ["2. Objeto","Busca, triagem e abordagem de empresas-alvo aderentes à tese de investimento da Contratante, e assessoria na aquisição."],
  ["3. Tese","Segmentos, faixa de faturamento e EBITDA, ticket e participação conforme o cadastro do investidor na Kinsey, revisados por escrito."],
  ["4. Exclusividade e prazo","{EXCLUSIVIDADE}, por {PRAZO} meses."],
  ["5. Remuneração","Retainer mensal de {RETAINER}. Success fee: {SUCCESS}, sobre o valor de cada aquisição concluída. Cauda (tail) de {TAIL} meses."],
  ["6. Confidencialidade e foro","Sigilo sobre a tese e as empresas apresentadas. Foro de São Paulo/SP. Data: {DATA}."]]},
 {id:"acordo_originacao", titulo:"Acordo de originação e parceria", para:["N2"], uso:"Parceiros que trazem targets ou investidores à Kinsey.", versao:"provisório v0.1", texto:[
  ["1. Partes","Kinsey Capital e {EMPRESA}, CNPJ {DOC}, representada por {REPRESENTANTE} (\"Parceiro\")."],
  ["2. Objeto","Indicação de empresas-alvo ou investidores à Kinsey, que conduz a operação."],
  ["3. Registro da indicação","A indicação vale após registro no sistema da Kinsey e confirmação por escrito; indicações já conhecidas pela Kinsey não geram remuneração."],
  ["4. Remuneração","{SUCCESS} do success fee recebido pela Kinsey nas operações originadas pelo Parceiro, pago após o recebimento."],
  ["5. Conduta","O Parceiro não negocia em nome da Kinsey, declara conflitos de interesse e cumpre a Lei 12.846/2013 (anticorrupção)."],
  ["6. Confidencialidade e prazo","Sigilo conforme o NDA geral. Prazo de {PRAZO} meses. Data: {DATA}."]]}
];

/* Etapas do funil do target */
const MA_FUNIL = [["mapeada","Mapeada"],["abordada","Abordada"],["reuniao","Reunião"],["nda","NDA"],["mandato","Mandato assinado"],["teaser","Teaser"],["cim","CIM / data room"],["ioi","Propostas (IOI)"],["loi","LOI"],["dd","Diligência"],["spa","SPA / fechamento"],["descartada","Descartada"]];

/* Traduções (EN) do conteúdo do segmento */
const EN_SEG = {
"Tese e capacidade":"Thesis and capacity","KYC e prevenção à lavagem de dinheiro":"KYC and anti-money laundering","Relacionamento com a Kinsey":"Relationship with Kinsey",
"Acordo e remuneração":"Agreement and fees","Compliance":"Compliance","Societário e intenção de venda":"Corporate and intention to sell","Financeiro":"Financial",
"Fiscal, trabalhista e ambiental":"Tax, labor and environmental","Contratos e compliance":"Contracts and compliance",
"Contingências":"Contingencies","Saúde financeira":"Financial health","Ambiental e regulatório":"Environmental and regulatory","Trabalhista":"Labor"
};

/* Fontes complementares */
const FONTES_EXTRA = [
 ["CVM · consulta de participantes e fundos","https://web.cvm.gov.br/app/fundosweb/#/consultaPublica"],
 ["Portal da Transparência · CEIS e CNEP","https://portaldatransparencia.gov.br/sancoes"],
 ["OFAC · lista de sanções (EUA)","https://sanctionssearch.ofac.treas.gov/"],
 ["CADE · atos de concentração","https://www.gov.br/cade/pt-br"]
];

/* ================= VALUATION · base de apuração (metodologia e fontes) =================
   Valores do Banco Central (Selic, CDI, IPCA, PTAX e Focus) consultados em 14/11/2026 nas APIs públicas do BCB;
   a função "mercado" do Firebase atualiza todo dia. Parâmetros internacionais e setoriais são valores iniciais:
   a Kinsey confirma e registra a própria fonte em Valuation · Base de apuração. */
const SEGMENTOS = ["Alimentos","Agro","Tecnologia","Saúde","Educação","Industrial","Energia","Logística","Varejo","Construção","Serviços","Outros"];
const VAL_BASE = {
 params:[
  /* id, rótulo, valor, unidade, fonte, data, metodologia */
  ["rf","Taxa livre de risco (US Treasury 10 anos)",4.3,"% a.a.","U.S. Department of the Treasury · valor inicial a confirmar","2026-11","Média de 12 meses do rendimento do T-Note de 10 anos, em dólar"],
  ["erp","Prêmio de risco de mercado (ERP)",4.5,"%","Damodaran (NYU Stern) · valor inicial a confirmar","2026-01","Prêmio implícito do S&P 500 publicado no início do ano"],
  ["crp","Risco-país do Brasil",2.8,"%","EMBI+ (J.P. Morgan) ou Damodaran · valor inicial a confirmar","2026-11","Spread soberano médio de 12 meses"],
  ["infUS","Inflação de longo prazo dos EUA",2.4,"% a.a.","Federal Reserve / CBO · valor inicial a confirmar","2026-11","Expectativa de longo prazo para conversão do custo de capital em reais"],
  ["infBR","Inflação de longo prazo do Brasil (IPCA)",4.0,"% a.a.","Banco Central · Focus de 06/11/2026 (mediana 2028 a 2030)","2026-11-06","Mediana do Focus para os anos sem meta de curto prazo"],
  ["selic","Selic meta",13.75,"% a.a.","Banco Central · SGS 432","2026-11-14","Taxa vigente na data da base"],
  ["spread","Spread de crédito sobre a Selic (empresa de porte médio)",3.0,"p.p.","Kinsey · valor inicial a confirmar","2026-11","Spread médio de captação de empresas fechadas de porte médio"],
  ["ir","IRPJ e CSLL (lucro real)",34,"%","Lei 9.249/1995 e Lei 7.689/1988","2026-11","Alíquota combinada de 25% + 9%"],
  ["size","Prêmio de tamanho (receita até R$ 300 mi)",3.0,"%","Kroll Cost of Capital · valor inicial a confirmar","2026-11","Prêmio adicional para empresas de menor porte"],
  ["desc","Desconto de liquidez de empresa fechada sobre múltiplos de bolsa",25,"%","Kinsey · prática de mercado","2026-11","Aplicado aos múltiplos de companhias abertas"],
  ["gReal","Crescimento real na perpetuidade",1.0,"% a.a.","Kinsey","2026-11","Crescimento acima da inflação após o 5º ano"],
  ["desvio","Tolerância de crescimento acima do histórico sem justificativa",3,"p.p.","Kinsey","2026-11","Acima disso o consultor justifica com orçamento, estudo técnico ou novo negócio"]
 ],
 /* beta desalavancado e dívida/patrimônio setoriais (mercados emergentes) · valores iniciais a confirmar */
 betas:{Alimentos:[.62,.25], Agro:[.70,.45], Tecnologia:[1.15,.08], Saúde:[.80,.30], Educação:[.85,.25], Industrial:[.90,.35], Energia:[.55,.90], Logística:[.85,.60], Varejo:[.85,.40], Construção:[.95,.50], Serviços:[.85,.30], Outros:[.90,.40]},
 ipca:{2020:4.52, 2021:10.06, 2022:5.79, 2023:4.62, 2024:4.83, 2025:4.26},
 focus:{data:"2026-11-06", ipca:{2026:5.22, 2027:4.90, 2028:4.00, 2029:4.00, 2030:3.94}, selic:{2026:13.75, 2027:12.50, 2028:11.00, 2029:10.25, 2030:10.00}},
 mercado:{em:"2026-11-14", fonte:"Banco Central do Brasil (SGS)", selic:13.75, ipca12:4.63, ipca12ref:"outubro/2026", cdi:13.65, ptax:5.6518}
};
/* segmentos semelhantes para os múltiplos */
const SEG_SIM = {Alimentos:["Agro","Varejo"], Agro:["Alimentos"], Tecnologia:["Serviços","Educação"], Saúde:["Serviços","Educação"], Educação:["Serviços","Saúde"], Industrial:["Construção","Energia"], Energia:["Industrial"], Logística:["Industrial","Varejo"], Varejo:["Alimentos","Serviços"], Construção:["Industrial"], Serviços:["Tecnologia"], Outros:[]};

/* Equipe de M&A da Kinsey: responsáveis pelos OKs da diligência, do valuation e do jurídico */
/* versão publicada: base única da Kinsey (espaço criado no primeiro acesso do administrador) */
window.KT_CLIENTE_PADRAO = {id:"kinsey-capital-ma", nome:"Kinsey Capital · M&A", local:"São Paulo/SP"};
const EQUIPE_KINSEY = [["Samuel Lima","Sócio de M&A e finanças"],["Newton KA Oliveira","Sócio de M&A e de auditoria de diligências"],["Juçara Haverot","Sócia de M&A, auditoria e diligências"],["Monica Flissak","Diretora de novos negócios e captação"],["Camilla Pazzini","Advogada · diligência jurídica"],["Giovana","SDR · pré-vendas"],["Andressa","SDR · pré-vendas"]];
