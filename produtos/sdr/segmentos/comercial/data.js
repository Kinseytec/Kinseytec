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
 {id:"mandato_venda", titulo:"Mandato de assessoria · venda (sell-side)", para:["N3"], uso:"Target que contrata a Kinsey para vender participação.", versao:"provisório v0.1", texto:[
  ["1. Partes","{EMPRESA}, CNPJ {DOC}, representada por {REPRESENTANTE} (\"Contratante\"), e Kinsey Capital (\"Kinsey\")."],
  ["2. Objeto","Assessoria financeira na venda de {PARTICIPACAO} da Contratante a investidores estratégicos ou financeiros, sob o nome-código {CODINOME}."],
  ["3. Serviços","Valuation, preparação do teaser e do memorando (CIM), organização do data room, seleção e abordagem de investidores, condução de propostas (IOI, LOI), apoio na diligência e na negociação dos contratos."],
  ["4. Exclusividade e prazo","{EXCLUSIVIDADE}, por {PRAZO} meses a partir da assinatura, renovável por acordo."],
  ["5. Remuneração","Retainer mensal de {RETAINER}. Success fee: {SUCCESS}, calculado sobre o valor da operação (enterprise value) e devido no fechamento. Despesas reembolsáveis mediante aprovação prévia."],
  ["6. Cauda (tail)","Success fee devido se a operação for fechada com investidor apresentado pela Kinsey em até {TAIL} meses após o término do mandato."],
  ["7. Confidencialidade","A Kinsey só revela a identidade da Contratante a investidores que assinarem o NDA do mandato."],
  ["8. Foro","Comarca de São Paulo/SP ou arbitragem, conforme a versão oficial. Data: {DATA}."]]},
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
const EQUIPE_KINSEY = [["Samuel Lima","Sócio de M&A e finanças"],["Newton KA Oliveira","Sócio de M&A e de auditoria de diligências"],["Juçara Haverot","Sócia de M&A, auditoria e diligências"],["Monica Flissak","Diretora de novos negócios e captação"],["Camilla Pazzini","Advogada · diligência jurídica"],["Giovana","SDR · pré-vendas"],["Andressa","SDR · pré-vendas"]];
/* KinseyTec – SDR: sócios e comercial conduzem as reuniões agendadas pelas SDRs; cadastre outros membros em "Equipe comercial e SDR" */
