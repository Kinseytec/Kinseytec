/* ================= KinseyTec – Café · CONTEÚDO DA DILIGÊNCIA ================= */
/* Cliente contratante: ponto de partida do mapa (exportadora, torrefadora ou trading). */
const CLIENTE_PADRAO = {nome:"Cliente contratante", local:"Armazém e exportação · Varginha/MG", lat:-21.551, lng:-45.430};

/* Cotações: R$ por saca de 60 kg, bolsas internacionais, histórico e fontes */
const PRACAS_BR = [["MG","Sul de Minas · arábica"],["CER","Cerrado Mineiro · arábica"],["SP","Mogiana/SP · arábica"],["ES","Espírito Santo · conilon"],["RO","Rondônia · robusta amazônico"],["BA","Bahia · arábica e conilon"],["PR","Paraná · arábica"]];
const INTL = [["NY","ICE Nova York · arábica","US¢/lb"],["LDN","ICE Londres · robusta","US$/t"],["OIC","OIC · preço indicativo composto","US¢/lb"]];
const PRECO = {bar:["MG","CER","ES"], barLabel:{MG:"Sul de Minas",CER:"Cerrado",ES:"Conilon ES"}, fonteEx:"CEPEA/ESALQ ou cooperativa",
  hist:[["MG","Sul MG"],["CER","Cerrado"],["ES","Conilon"],["NY","NY"],["LDN","Londres"]],
  links:[["Indicador CEPEA/ESALQ Café","https://www.cepea.esalq.usp.br/br/indicador/cafe.aspx"],["Notícias Agrícolas","https://www.noticiasagricolas.com.br/cotacoes/cafe"],["ICE Coffee C (NY)","https://www.ice.com/products/15/Coffee-C-Futures"],["ICE Robusta (Londres)","https://www.ice.com/products/37089076/Robusta-Coffee-Futures"],["OIC · Organização Internacional do Café","https://www.ico.org"]]};

/* Investigação (fontes públicas): id, rótulo, tipo, pontos, critério */
const INV = [
 ["divida","Dívida ativa (PGFN / estado / município)","sn",2,"Regularidade fiscal"],
 ["protestos","Protestos em cartório","sn",1,"Regularidade fiscal"],
 ["proc_trab","Processos trabalhistas relevantes","sn",2,"Condições de trabalho"],
 ["proc_crim","Processos criminais da empresa ou dos sócios","sn",3,"Integridade"],
 ["pep","Sócio ou administrador politicamente exposto (PEP / envolvimento político)","sn",2,"Integridade"],
 ["prisao","Sócio preso, denunciado ou sob investigação","sn",4,"Integridade"],
 ["rotat","Sócios abrem e fecham empresas rapidamente (CNPJs baixados ou inaptos nos últimos 3 anos)","num",3,"Perfil societário"],
 ["midia","Mídia negativa (trabalho escravo na colheita, aliciamento, desmatamento, fraude)","sn",2,"Integridade"],
 ["mte","Cadastro de Empregadores do MTE (lista suja)","sn",6,"Condições de trabalho"],
 ["resgate","Resgate de trabalhadores em fiscalização (MTE / MPT), mesmo antes da lista suja","sn",5,"Condições de trabalho"],
 ["ibama","Embargo ambiental (IBAMA / órgão estadual)","sn",4,"Desmatamento e EUDR"],
 ["desmat","Desmatamento após 31/12/2020 na lavoura (PRODES / MapBiomas Alerta) — critério EUDR","sn",6,"Desmatamento e EUDR"],
 ["ti_uc","Sobreposição com Terra Indígena, quilombola ou Unidade de Conservação","sn",5,"Direitos territoriais"],
 ["agrot","Autuação por agrotóxico proibido ou sem receituário (MAPA / órgão estadual)","sn",3,"Produção e insumos"]
];
const UF_CENTER = {AC:[-9.0,-70.5],AL:[-9.6,-36.6],AP:[1.4,-51.8],AM:[-4.2,-62.5],BA:[-13.5,-40.5],CE:[-5.2,-39.5],DF:[-15.8,-47.9],ES:[-19.5,-40.6],GO:[-16.0,-49.6],MA:[-5.0,-45.3],MT:[-12.6,-55.9],MS:[-20.5,-54.8],MG:[-18.5,-44.6],PA:[-3.8,-52.5],PB:[-7.1,-36.8],PR:[-24.6,-51.6],PE:[-8.4,-37.9],PI:[-7.4,-42.7],RJ:[-22.2,-42.7],RN:[-5.8,-36.6],RS:[-29.7,-53.3],RO:[-10.9,-62.8],RR:[2.0,-61.4],SC:[-27.3,-50.4],SP:[-22.3,-48.6],SE:[-10.6,-37.4],TO:[-10.2,-48.3]};

/* Questionário por nível: N1 exportadora/torrefadora · N2 cooperativa, armazém ou corretor · N3 produtor */
const Q = {
 N1:[
  {g:"Identificação e societário", items:[
   ["n1_01","A empresa está ativa na Receita Federal e tem inscrição estadual regular em todos os estados onde opera?","nao"],
   ["n1_02","Algum sócio ou administrador participa, ou participou nos últimos 5 anos, de outra empresa de café hoje baixada ou inapta?","sim"],
   ["n1_03","Possui certidões negativas válidas (federal, estadual, municipal, FGTS e trabalhista)?","nao"],
   ["n1_04","Houve troca de CNPJ, cisão ou sucessão de empresas do grupo nos últimos 3 anos?","sim"]]},
  {g:"Originação e rastreabilidade", items:[
   ["n1_05","Mantém cadastro georreferenciado (polígono) de todas as lavouras de origem, exigido pela EUDR?","nao",3],
   ["n1_06","Consegue rastrear cada lote exportado até as fazendas de origem, mesmo nos blends?","nao",3],
   ["n1_07","Faz monitoramento socioambiental dos fornecedores diretos e indiretos (lista suja, resgates, embargos, desmatamento)?","nao",3],
   ["n1_08","Separa os lotes certificados (Rainforest, 4C, Fairtrade, orgânico) com controle de balanço de massa?","nao"],
   ["n1_09","Classifica cada lote (tipo, peneira, bebida, umidade) com laudo e identificação da origem?","nao"],
   ["n1_10","Compra café de corretores ou armazéns que não informam as fazendas de origem?","sim",3]]},
  {g:"Fornecedores N2 e N3", items:[
   ["n1_11","Entregou a lista de fornecedores N2/N3 da última safra (nome, CPF/CNPJ, município, CAR, sacas)?","nao"],
   ["n1_12","Tem contratos com cláusulas de trabalho decente na colheita, desmatamento zero e direito de auditoria?","nao"],
   ["n1_13","Bloqueia fornecedores com resgate de trabalhadores, lista suja, embargo ou desmatamento após 2020?","nao",3],
   ["n1_14","Paga fornecedores somente por meio bancário, em nome do emitente da nota fiscal?","nao"],
   ["n1_15","Há notas de produtor “emprestadas” ou café de uma fazenda vendido em nome de outra?","sim",5]]},
  {g:"Trabalho, ESG e integridade", items:[
   ["n1_16","A empresa ou seus sócios constam, ou já constaram, no Cadastro de Empregadores do MTE (trabalho análogo ao de escravo)?","sim",5],
   ["n1_17","Tem programa para a colheita: contratação formal, alojamentos, transporte seguro e combate ao aliciamento (“gatos”)?","nao",3],
   ["n1_18","Possui código de ética, política de direitos humanos e canal de denúncia em funcionamento?","nao"],
   ["n1_19","Publica relatório de sustentabilidade com metas sociais, de emissões e de desmatamento?","nao",1],
   ["n1_20","Assinou o NDA e o termo LGPD autorizando o repasse das informações ao cliente contratante?","nao"]]}],
 N2:[
  {g:"Armazenagem e comercialização", items:[
   ["n2_01","Emite nota fiscal de entrada para todo o café recebido dos produtores?","nao"],
   ["n2_02","As saídas têm entradas correspondentes (balanço de massa fecha)?","nao",3],
   ["n2_03","A capacidade do armazém é compatível com as sacas movimentadas?","nao"],
   ["n2_04","Identifica cada lote por produtor e fazenda até a venda?","nao"],
   ["n2_05","Possui balança aferida (IPEM/INMETRO) e laudo de classificação por lote?","nao"]]},
  {g:"Origem e pagamentos", items:[
   ["n2_06","Entregou a lista de produtores (N3) com CPF/CNPJ, município, CAR e sacas por safra?","nao"],
   ["n2_07","Mistura café de várias origens sem registro (impede a rastreabilidade)?","sim",2],
   ["n2_08","Verifica se os produtores constam na lista suja ou tiveram resgates de trabalhadores?","nao",3],
   ["n2_09","Compra de áreas com desmatamento após 2020, embargo ou sobreposição com Terra Indígena?","sim",5],
   ["n2_10","Paga produtores em espécie ou em nome de terceiros?","sim"]]},
  {g:"Trabalho e conformidade", items:[
   ["n2_11","Todos os trabalhadores estão formalmente contratados?","nao"],
   ["n2_12","Sofreu fiscalização trabalhista ou ambiental com autuação nos últimos 5 anos?","sim"],
   ["n2_13","Assinou o NDA e o termo LGPD?","nao"]]}],
 N3:[
  {g:"Propriedade e território", items:[
   ["n3_01","Possui inscrição estadual de produtor rural ativa e emite nota fiscal de produtor?","nao"],
   ["n3_02","A propriedade tem CAR ativo e Reserva Legal e APP conforme o Código Florestal?","nao"],
   ["n3_03","Existe embargo ambiental sobre a área?","sim",4],
   ["n3_04","Houve abertura de área (desmatamento) para lavoura após 31/12/2020?","sim",5],
   ["n3_05","Usa somente agrotóxicos registrados, com receituário e destinação correta das embalagens?","nao"]]},
  {g:"Colheita e trabalho", items:[
   ["n3_06","Os trabalhadores da colheita são registrados (CLT ou contrato de safra) e recebem por produção com controle?","nao",3],
   ["n3_07","Os alojamentos têm camas, água potável, sanitários e local para refeições?","nao",4],
   ["n3_08","Há trabalho infantil, retenção de documentos, dívida com o empregador ou “gato” intermediando a contratação?","sim",5],
   ["n3_09","O transporte dos trabalhadores é feito em veículo seguro e regular?","nao"]]},
  {g:"Venda e certificação", items:[
   ["n3_10","Recebe o pagamento em seu nome, por transferência bancária?","nao"],
   ["n3_11","Possui certificação (Rainforest, 4C, Fairtrade, orgânico) ou indicação geográfica?","nao",1],
   ["n3_12","Assinou o termo de consentimento LGPD?","nao"]]}]
};

/* Checklist documental */
const DOCS = {
 N1:["Contrato social e alterações","Cartão CNPJ e inscrições estaduais","Certidões negativas (RFB/PGFN, SEFAZ, município, FGTS, CNDT)","Política de compra responsável e de direitos humanos","Relatório de monitoramento socioambiental de fornecedores","Lista de fazendas de origem com polígonos (KML/geojson)","Contratos com o cliente contratante","Contratos com cooperativas, armazéns e produtores","Notas fiscais de entrada (amostra) e laudos de classificação","Registros de exportação e certificados de origem","Certificações (Rainforest, 4C, Fairtrade, orgânico) e auditorias"],
 N2:["Cartão CNPJ e inscrição estadual","Certidões negativas","Notas fiscais de entrada dos produtores","Notas fiscais de saída","Tickets de pesagem e laudos de classificação","Cadastro de produtores com CAR","Contratos com produtores","Comprovantes de pagamento","Registro de empregados (eSocial)"],
 N3:["Documento do produtor (CPF ou CNPJ)","Inscrição estadual de produtor rural","Nota fiscal de produtor","Recibo do CAR","Matrícula do imóvel","Contratos de safra e registro dos trabalhadores da colheita","Receituários agronômicos","Certificados de certificação, se houver","Termo de consentimento LGPD"]
};

/* Inspeção física */
const INSP = {
 N1:[["i_est","Estoque físico de sacas conciliado ao estoque declarado"],["i_bal","Balança com certificado IPEM/INMETRO e pesagem-teste realizada"],["i_lote","Rastreio de lote: exportação → blend → armazém → fazenda (polígono)"],["i_cert","Segregação e balanço de massa dos lotes certificados"],["i_trab","Condições de trabalho e segurança no armazém"]],
 N2:[["i_ctrl","Recebimento, classificação e identificação dos lotes"],["i_cap","Sacas movimentadas compatíveis com a capacidade do armazém"],["i_arm","Armazenagem, secagem e segurança adequadas"],["i_lote","Lotes rastreáveis até o produtor"],["i_trab","Condições de trabalho dos empregados"]],
 N3:[["i_prop","Existência da propriedade e da lavoura confirmadas no local"],["i_area","Área de café compatível com o CAR e com imagens de satélite"],["i_aloj","Alojamentos, água, sanitários e refeitório dos colhedores"],["i_reg","Registro e pagamento dos trabalhadores da colheita"],["i_men","Ausência de menores trabalhando"],["i_agro","Armazenamento de agrotóxicos e EPIs"]]
};

const EV_TYPES = ["Foto da mercadoria / sacas","Foto do armazém / terreiro","Foto da balança","Foto da lavoura / alojamento","Nota fiscal","Pedido de compra","Contrato","Ticket de pesagem","Laudo de classificação","Romaneio / CT-e","Recibo do CAR","Certificado de certificação","Comprovante de pagamento","Registro de empregados","Outro"];
const PHOTO_TYPES = ["Foto da mercadoria / sacas","Foto do armazém / terreiro","Foto da balança","Foto da lavoura / alojamento"];

const SUP_TYPES = {N1:["Exportadora","Torrefadora (indústria)","Trading de café"],N2:["Cooperativa","Armazém geral","Corretor / maquinista"],N3:["Produtor pessoa física","Produtor pessoa jurídica","Agricultor familiar"]};
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
/* Produtividade média de referência (kg/ha de café beneficiado) — valores iniciais a calibrar com o cliente */
const PROD_REF = {MG:1800, SP:1700, ES:2400, RO:2400, BA:2100, PR:1600, GO:2000, MT:2000, RJ:1500};

/* Municípios produtores e portos — coordenadas aproximadas da sede */
const MUNI = [
 ["Varginha","MG",-21.551,-45.430],["Três Pontas","MG",-21.366,-45.512],["Guaxupé","MG",-21.305,-46.712],["Machado","MG",-21.675,-45.922],["Campos Gerais","MG",-21.235,-45.758],["Patrocínio","MG",-18.944,-46.993],["Araguari","MG",-18.648,-48.187],["Carmo do Paranaíba","MG",-18.991,-46.316],["Monte Carmelo","MG",-18.725,-47.499],["Manhuaçu","MG",-20.258,-42.034],["Caratinga","MG",-19.790,-42.139],
 ["Franca","SP",-20.539,-47.401],["Garça","SP",-22.213,-49.656],["Espírito Santo do Pinhal","SP",-22.191,-46.741],
 ["Colatina","ES",-19.539,-40.630],["São Gabriel da Palha","ES",-19.018,-40.536],["Venda Nova do Imigrante","ES",-20.339,-41.135],["Linhares","ES",-19.391,-40.072],["Jaguaré","ES",-18.906,-40.076],
 ["Vitória da Conquista","BA",-14.866,-40.839],["Barreiras","BA",-12.152,-44.990],["Itabela","BA",-16.573,-39.559],
 ["Cacoal","RO",-11.438,-61.447],["Rolim de Moura","RO",-11.725,-61.776],["Alta Floresta d'Oeste","RO",-11.928,-61.995],
 ["Londrina","PR",-23.310,-51.162],["Santos","SP",-23.961,-46.333],["Vitória","ES",-20.315,-40.312],["Rio de Janeiro","RJ",-22.907,-43.173],["São Paulo","SP",-23.550,-46.633]
];

const CLAUSES = [
 ["c_origem","Origem e rastreabilidade de cada lote até a fazenda, com polígono georreferenciado (EUDR)"],
 ["c_trab","Proibição de trabalho análogo ao escravo, trabalho infantil e aliciamento na colheita"],
 ["c_aloj","Contratação formal, alojamentos e transporte dignos para os trabalhadores da colheita"],
 ["c_desmat","Desmatamento zero após 31/12/2020, CAR ativo e ausência de embargos"],
 ["c_cert","Integridade das certificações e segregação dos lotes certificados"],
 ["c_aud","Direito de auditoria e inspeção pelo cliente contratante ou terceiro independente"],
 ["c_preco","Preço, pesagem e classificação definidos de forma objetiva"],
 ["c_lgpd","Confidencialidade, LGPD, anticorrupção (Lei 12.846/2013) e rescisão por não conformidade grave"]
];

const NDA_VERSION = "minuta v0.1 — para avaliação jurídica";
const NDA_TEXT = [
 ["1. Partes e objeto","Este termo é celebrado entre a Kinsey Allen Brasil Auditoria e Consultoria Ltda. (\"Kinsey BR\") e o fornecedor identificado abaixo, no âmbito da due diligence da cadeia do café contratada pelo cliente contratante da Kinsey BR."],
 ["2. Confidencialidade","A Kinsey BR manterá sigilo sobre as informações comerciais, fiscais e operacionais recebidas e as usará somente para a diligência. O fornecedor autoriza o repasse dos resultados e das evidências ao cliente contratante, que se obriga ao mesmo sigilo."],
 ["3. Dados pessoais tratados (LGPD, Lei 13.709/2018)","Nome, CPF, cargo, contato e assinatura de responsáveis e produtores; endereços, coordenadas e polígonos das lavouras e armazéns; fotografias com data e geolocalização; dados de contratação de trabalhadores da colheita, sem dados sensíveis."],
 ["4. Finalidade e base legal","Verificar a existência das mercadorias, a realidade das transações e a origem lícita do café, sem trabalho escravo ou infantil e sem desmatamento, inclusive para atender exigências como a regulamentação europeia de produtos livres de desmatamento (EUDR). Bases legais: cumprimento de obrigação legal ou regulatória (art. 7º, II), exercício regular de direitos em contrato (art. 7º, VI) e legítimo interesse (art. 7º, IX)."],
 ["5. Compartilhamento","O cliente contratante (controlador destinatário dos resultados), advogados e auditores da Kinsey BR e provedores de hospedagem do aplicativo, sob contrato de confidencialidade. Consultas a bases públicas (Receita Federal, SEFAZ, SICAR, IBAMA, MTE, MAPA, PRODES/MapBiomas, tribunais)."],
 ["6. Retenção e segurança","Os dados ficam guardados pelo prazo da diligência e pelo período exigido pelas normas de auditoria e pela regulamentação aplicável (mínimo de 5 anos), com acesso restrito e registro de quem consultou."],
 ["7. Direitos do titular","Confirmação, acesso, correção, anonimização, portabilidade, informação sobre compartilhamento e revogação do consentimento (art. 18), pelo canal do Encarregado (DPO) da Kinsey BR."],
 ["8. Declaração de veracidade","O fornecedor declara que as informações, documentos, polígonos e fotos enviados são verdadeiros e correspondem à realidade da operação, ciente de que divergências serão registradas como achado de risco."]
];

/* Traduções (EN) do conteúdo do segmento */
const EN_SEG = {
"Identificação e societário":"Identification and ownership","Originação e rastreabilidade":"Sourcing and traceability","Fornecedores N2 e N3":"N2 and N3 suppliers","Trabalho, ESG e integridade":"Labor, ESG and integrity","Armazenagem e comercialização":"Storage and trading","Origem e pagamentos":"Origin and payments","Trabalho e conformidade":"Labor and compliance","Propriedade e território":"Property and land","Colheita e trabalho":"Harvest and labor","Venda e certificação":"Sale and certification",
"Desmatamento e EUDR":"Deforestation and EUDR","Direitos territoriais":"Land rights","Produção e insumos":"Production and inputs",
"A empresa está ativa na Receita Federal e tem inscrição estadual regular em todos os estados onde opera?":"Is the company active with the Federal Revenue Service and does it hold regular state registrations wherever it operates?",
"Algum sócio ou administrador participa, ou participou nos últimos 5 anos, de outra empresa de café hoje baixada ou inapta?":"Does any partner or officer hold, or has held in the last 5 years, a stake in another coffee company now closed or unfit?",
"Possui certidões negativas válidas (federal, estadual, municipal, FGTS e trabalhista)?":"Does it hold valid clearance certificates (federal, state, municipal, FGTS and labor)?",
"Houve troca de CNPJ, cisão ou sucessão de empresas do grupo nos últimos 3 anos?":"Has there been a change of tax ID, spin-off or succession of group companies in the last 3 years?",
"Mantém cadastro georreferenciado (polígono) de todas as lavouras de origem, exigido pela EUDR?":"Does it keep a geo-referenced register (polygon) of all origin plots, as required by the EUDR?",
"Consegue rastrear cada lote exportado até as fazendas de origem, mesmo nos blends?":"Can it trace each exported lot back to the origin farms, even in blends?",
"Faz monitoramento socioambiental dos fornecedores diretos e indiretos (lista suja, resgates, embargos, desmatamento)?":"Does it run social and environmental monitoring of direct and indirect suppliers (slave-labor list, rescues, embargoes, deforestation)?",
"Separa os lotes certificados (Rainforest, 4C, Fairtrade, orgânico) com controle de balanço de massa?":"Does it segregate certified lots (Rainforest, 4C, Fairtrade, organic) with mass balance control?",
"Classifica cada lote (tipo, peneira, bebida, umidade) com laudo e identificação da origem?":"Does it grade each lot (type, screen, cup, moisture) with a report and origin identification?",
"Compra café de corretores ou armazéns que não informam as fazendas de origem?":"Does it buy coffee from brokers or warehouses that do not disclose the origin farms?",
"Entregou a lista de fornecedores N2/N3 da última safra (nome, CPF/CNPJ, município, CAR, sacas)?":"Has it delivered the N2/N3 supplier list for the last crop (name, tax ID, municipality, CAR, bags)?",
"Tem contratos com cláusulas de trabalho decente na colheita, desmatamento zero e direito de auditoria?":"Does it have contracts with decent harvest work, zero deforestation and audit-right clauses?",
"Bloqueia fornecedores com resgate de trabalhadores, lista suja, embargo ou desmatamento após 2020?":"Does it block suppliers with worker rescues, slave-labor listing, embargoes or deforestation after 2020?",
"Paga fornecedores somente por meio bancário, em nome do emitente da nota fiscal?":"Does it pay suppliers only by bank transfer, to the invoice issuer?",
"Há notas de produtor “emprestadas” ou café de uma fazenda vendido em nome de outra?":"Are there “borrowed” producer invoices or coffee from one farm sold under another's name?",
"A empresa ou seus sócios constam, ou já constaram, no Cadastro de Empregadores do MTE (trabalho análogo ao de escravo)?":"Are the company or its partners, or have they ever been, on the Labor Ministry's Employers Register (slave-like labor)?",
"Tem programa para a colheita: contratação formal, alojamentos, transporte seguro e combate ao aliciamento (“gatos”)?":"Does it have a harvest program: formal hiring, housing, safe transport and fighting illegal recruiters?",
"Possui código de ética, política de direitos humanos e canal de denúncia em funcionamento?":"Does it have a code of ethics, a human rights policy and a working whistleblower channel?",
"Publica relatório de sustentabilidade com metas sociais, de emissões e de desmatamento?":"Does it publish a sustainability report with social, emissions and deforestation targets?",
"Assinou o NDA e o termo LGPD autorizando o repasse das informações ao cliente contratante?":"Has it signed the NDA and LGPD consent authorizing sharing with the contracting client?",
"Emite nota fiscal de entrada para todo o café recebido dos produtores?":"Does it issue an incoming invoice for all coffee received from producers?",
"As saídas têm entradas correspondentes (balanço de massa fecha)?":"Do outflows match inflows (does the mass balance close)?",
"A capacidade do armazém é compatível com as sacas movimentadas?":"Is the warehouse capacity consistent with the bags handled?",
"Identifica cada lote por produtor e fazenda até a venda?":"Does it identify each lot by producer and farm until sale?",
"Possui balança aferida (IPEM/INMETRO) e laudo de classificação por lote?":"Does it have a certified scale (IPEM/INMETRO) and a grading report per lot?",
"Entregou a lista de produtores (N3) com CPF/CNPJ, município, CAR e sacas por safra?":"Has it delivered the producer list (N3) with tax ID, municipality, CAR and bags per crop?",
"Mistura café de várias origens sem registro (impede a rastreabilidade)?":"Does it mix coffee from several origins without records (preventing traceability)?",
"Verifica se os produtores constam na lista suja ou tiveram resgates de trabalhadores?":"Does it check whether producers are on the slave-labor list or had worker rescues?",
"Compra de áreas com desmatamento após 2020, embargo ou sobreposição com Terra Indígena?":"Does it buy from areas with deforestation after 2020, embargoes or indigenous-land overlap?",
"Paga produtores em espécie ou em nome de terceiros?":"Does it pay producers in cash or to third parties?",
"Todos os trabalhadores estão formalmente contratados?":"Are all workers formally hired?",
"Sofreu fiscalização trabalhista ou ambiental com autuação nos últimos 5 anos?":"Has it been fined in a labor or environmental inspection in the last 5 years?",
"Assinou o NDA e o termo LGPD?":"Has it signed the NDA and LGPD consent?",
"Possui inscrição estadual de produtor rural ativa e emite nota fiscal de produtor?":"Does it hold an active rural producer state registration and issue producer invoices?",
"A propriedade tem CAR ativo e Reserva Legal e APP conforme o Código Florestal?":"Does the property have an active CAR and Legal Reserve and preservation areas under the Forest Code?",
"Existe embargo ambiental sobre a área?":"Is there an environmental embargo on the area?",
"Houve abertura de área (desmatamento) para lavoura após 31/12/2020?":"Was land cleared (deforestation) for planting after 31/12/2020?",
"Usa somente agrotóxicos registrados, com receituário e destinação correta das embalagens?":"Does it use only registered pesticides, with prescriptions and proper packaging disposal?",
"Os trabalhadores da colheita são registrados (CLT ou contrato de safra) e recebem por produção com controle?":"Are harvest workers registered (CLT or seasonal contract) and paid by output with proper records?",
"Os alojamentos têm camas, água potável, sanitários e local para refeições?":"Does worker housing have beds, drinking water, toilets and a place to eat?",
"Há trabalho infantil, retenção de documentos, dívida com o empregador ou “gato” intermediando a contratação?":"Is there child labor, document retention, debt bondage or an illegal recruiter in the hiring?",
"O transporte dos trabalhadores é feito em veículo seguro e regular?":"Are workers transported in safe, regular vehicles?",
"Recebe o pagamento em seu nome, por transferência bancária?":"Does it receive payment in its own name, by bank transfer?",
"Possui certificação (Rainforest, 4C, Fairtrade, orgânico) ou indicação geográfica?":"Does it hold certification (Rainforest, 4C, Fairtrade, organic) or a geographical indication?",
"Assinou o termo de consentimento LGPD?":"Has it signed the LGPD consent form?",
"Resgate de trabalhadores em fiscalização (MTE / MPT), mesmo antes da lista suja":"Worker rescue in a labor inspection (Labor Ministry / MPT), even before listing",
"Desmatamento após 31/12/2020 na lavoura (PRODES / MapBiomas Alerta) — critério EUDR":"Deforestation after 31/12/2020 on the plot (PRODES / MapBiomas Alerta) — EUDR criterion",
"Sobreposição com Terra Indígena, quilombola ou Unidade de Conservação":"Overlap with indigenous, quilombola land or protected area",
"Autuação por agrotóxico proibido ou sem receituário (MAPA / órgão estadual)":"Fine for banned pesticide or no prescription (Agriculture Ministry / state agency)",
"Mídia negativa (trabalho escravo na colheita, aliciamento, desmatamento, fraude)":"Negative media (slave labor in the harvest, illegal recruiting, deforestation, fraud)",
"Exportadora":"Exporter","Torrefadora (indústria)":"Roaster (industry)","Trading de café":"Coffee trader","Cooperativa":"Cooperative","Armazém geral":"General warehouse","Corretor / maquinista":"Broker / huller","Agricultor familiar":"Family farmer",
"Foto da mercadoria / sacas":"Photo of goods / bags","Foto do armazém / terreiro":"Photo of warehouse / drying yard","Foto da lavoura / alojamento":"Photo of plot / worker housing","Laudo de classificação":"Grading report","Certificado de certificação":"Certification certificate",
"Sul de Minas · arábica":"South Minas · arabica","Cerrado Mineiro · arábica":"Cerrado Mineiro · arabica","Mogiana/SP · arábica":"Mogiana/SP · arabica","Espírito Santo · conilon":"Espírito Santo · conilon","Rondônia · robusta amazônico":"Rondônia · Amazonian robusta","Bahia · arábica e conilon":"Bahia · arabica and conilon","Paraná · arábica":"Paraná · arabica","ICE Nova York · arábica":"ICE New York · arabica","ICE Londres · robusta":"ICE London · robusta","OIC · preço indicativo composto":"ICO · composite indicator price",
"Origem e rastreabilidade de cada lote até a fazenda, com polígono georreferenciado (EUDR)":"Origin and traceability of each lot to the farm, with geo-referenced polygon (EUDR)",
"Proibição de trabalho análogo ao escravo, trabalho infantil e aliciamento na colheita":"Ban on slave-like labor, child labor and illegal recruiting in the harvest",
"Contratação formal, alojamentos e transporte dignos para os trabalhadores da colheita":"Formal hiring, decent housing and transport for harvest workers",
"Desmatamento zero após 31/12/2020, CAR ativo e ausência de embargos":"Zero deforestation after 31/12/2020, active CAR and no embargoes",
"Integridade das certificações e segregação dos lotes certificados":"Certification integrity and segregation of certified lots",
"Direito de auditoria e inspeção pelo cliente contratante ou terceiro independente":"Audit and inspection rights for the contracting client or an independent third party",
"Preço, pesagem e classificação definidos de forma objetiva":"Objective price, weighing and grading",
"Confidencialidade, LGPD, anticorrupção (Lei 12.846/2013) e rescisão por não conformidade grave":"Confidentiality, LGPD, anti-corruption (Law 12,846/2013) and termination for serious non-compliance"
};

/* Fontes públicas específicas do setor */
const FONTES_EXTRA = [["Cecafé · Conselho dos Exportadores de Café", "https://www.cecafe.com.br"], ["Sistema Ipê · denúncia de trabalho escravo (MTE)", "https://ipe.sit.trabalho.gov.br"], ["Agrofit · agrotóxicos registrados (MAPA)", "https://agrofit.agricultura.gov.br"], ["INPE TerraBrasilis · PRODES/DETER (desmatamento)", "https://terrabrasilis.dpi.inpe.br"]];
/* Alertas do setor (notícias públicas) — [data, título, resumo, fonte] */
const SETOR_NEWS = [
[
"06/04/2026",
"Lista suja: 45 produtores de café, 36 em Minas Gerais",
"Levantamento da ADERE-MG sobre o Cadastro de Empregadores (conferir no cadastro oficial do MTE).",
"https://media.business-humanrights.org/media/documents/RESPOSTA_DA_ADERE_FINALIZADA.pdf"
],
[
"2017–2025",
"Mais de mil trabalhadores resgatados em cafezais, mais de 700 em MG",
"Estudo citado pela CUT sobre trabalho análogo ao de escravo na colheita.",
"https://www.cut.org.br/noticias/entidade-reafirma-estudo-sobre-trabalho-escravo-no-cafe-de-mg-f302"
],
[
"07/2024",
"Cooperados de grande cooperativa flagrados com trabalho escravo na colheita",
"Fornecedores da lista suja vendendo a cooperativa: risco para exportadoras e torrefadoras.",
"https://www.ihu.unisinos.br/641364-cooperados-da-cooxupe-sao-flagrados-com-trabalho-escravo-em-colheita-de-cafe"
],
[
"—",
"Cecafé e Serasa Experian: plataforma de rastreabilidade para a EUDR",
"Setor exportador estrutura rastreabilidade e devida diligência socioambiental.",
"https://www.noticiasagricolas.com.br/noticia/370654"
]
];

/* Auditoria reforçada com base nos alertas do setor */
Q.N1.push({g:"Alertas do setor", items:[["n1_a1", "Consulta o Cadastro de Empregadores (MTE) para todos os produtores e cooperados antes de cada safra e a cada atualização?", "nao", 4], ["n1_a2", "Bloqueia a compra de produtores incluídos na lista suja, inclusive via cooperativa ou corretor?", "nao", 4]]});
Q.N2.push({g:"Alertas do setor", items:[["n2_a1", "A cooperativa ou o armazém sabe quais produtores contratam turmas por intermediários (“gatos”)?", "nao", 3]]});
Q.N3.push({g:"Alertas do setor", items:[["n3_a1", "Os colhedores vieram de outros estados por meio de intermediário, pagando o próprio transporte ou alojamento?", "sim", 5], ["n3_a2", "Há descontos de alimentação, ferramentas ou transporte no pagamento dos colhedores?", "sim", 4]]});
INSP.N2.push(...[["i_coop", "Lista de produtores e cooperados conferida contra a lista suja na data da visita"]]);
INSP.N3.push(...[["i_turma", "Entrevista com colhedores: origem, forma de contratação, descontos e liberdade para sair"]]);
EV_TYPES.splice(Math.max(0, EV_TYPES.indexOf("Outro")), 0, ...["Consulta à lista suja (print com data)", "Entrevista com trabalhadores (registro)"]);
/* [id, níveis, padrão de risco, procedimento, evidências exigidas, índice em SETOR_NEWS] */
const AUDIT_TESTS = [["t_lista", ["N1", "N2", "N3"], "Produtores na lista suja (MG concentra a maior parte)", "Cruzar CPF/CNPJ de todos os produtores e cooperados com o Cadastro de Empregadores e arquivar o print com data.", ["Consulta à lista suja (print com data)"], 0], ["t_colh", ["N3"], "Resgates na colheita (aliciamento, alojamento precário, descontos)", "Visita durante a colheita: entrevistas, fotos dos alojamentos, registros e recibos de pagamento.", ["Foto da lavoura / alojamento", "Registro de empregados", "Entrevista com trabalhadores (registro)"], 1], ["t_coop", ["N2"], "Cooperados flagrados vendendo à cooperativa", "Verificar o procedimento de bloqueio e a segregação dos lotes de produtores autuados.", ["Contrato", "Nota fiscal"], 2], ["t_eudr", ["N1"], "Rastreabilidade para a EUDR", "Amostrar lotes exportados e verificar o polígono e a lista suja de cada fazenda.", ["Romaneio / CT-e", "Recibo do CAR"], 3]];
/* Cláusula → [base legal de referência, o que verificar, essencial] */
const CLAUSE_INFO = {"c_origem": ["Regulamento (UE) 2023/1115 (EUDR); Lei 12.651/2012", "Polígono de cada fazenda e vínculo lote → fazenda", true], "c_trab": ["CP arts. 149 e 207 (aliciamento); CF art. 7º, XXXIII; ECA", "Consulta ao Cadastro de Empregadores (MTE) de todos os produtores e cooperados", true], "c_aloj": ["CLT; NR-31 (áreas de vivência e transporte)", "Registro desde o primeiro dia, alojamento, água, transporte e ausência de descontos indevidos", true], "c_desmat": ["Lei 12.651/2012; Decreto 6.514/2008, art. 54", "Marco de 31/12/2020, CAR ativo e consulta de embargos", true], "c_cert": ["CC art. 422 (boa-fé); regras do esquema certificador", "Certificado válido, escopo e balanço de massa dos lotes certificados", false], "c_aud": ["CC arts. 421 e 422; Decreto 11.129/2022 (programa de integridade)", "Acesso a documentos, locais e trabalhadores, inclusive visitas sem aviso", false], "c_preco": ["Lei 9.972/2000 (classificação vegetal); Lei 9.933/1999 (metrologia)", "Preço vinculado a cotação pública, balança aferida e laudo de classificação", false], "c_lgpd": ["Lei 13.709/2018; Lei 12.846/2013; CC arts. 474 e 475", "Tratamento de dados, integridade e rescisão por não conformidade grave", true]};
Object.assign(EN_SEG, {"Alertas do setor": "Sector alerts", "Consulta à lista suja (print com data)": "Dirty list check (dated screenshot)", "Análise de satélite (PRODES/DETER)": "Satellite analysis (PRODES/DETER)", "Consulta de embargos (IBAMA/estado)": "Embargo check (IBAMA/state)", "Entrevista com trabalhadores (registro)": "Worker interview (record)", "Foto das áreas de vivência": "Photo of living quarters", "Consulta o Cadastro de Empregadores (MTE) para todos os produtores e cooperados antes de cada safra e a cada atualização?": "Does it check the MTE Employers Register for all producers and cooperative members before each harvest and at every update?", "Bloqueia a compra de produtores incluídos na lista suja, inclusive via cooperativa ou corretor?": "Does it block purchases from producers on the dirty list, including through cooperatives or brokers?", "A cooperativa ou o armazém sabe quais produtores contratam turmas por intermediários (“gatos”)?": "Does the cooperative or warehouse know which producers hire crews through labor brokers (“gatos”)?", "Os colhedores vieram de outros estados por meio de intermediário, pagando o próprio transporte ou alojamento?": "Did pickers come from other states through a broker, paying for their own transport or housing?", "Há descontos de alimentação, ferramentas ou transporte no pagamento dos colhedores?": "Are food, tools or transport deducted from pickers' pay?", "Lista de produtores e cooperados conferida contra a lista suja na data da visita": "List of producers and members checked against the dirty list on the visit date", "Entrevista com colhedores: origem, forma de contratação, descontos e liberdade para sair": "Interview with pickers: origin, hiring method, deductions and freedom to leave", "Produtores na lista suja (MG concentra a maior parte)": "Producers on the dirty list (most in Minas Gerais)", "Cruzar CPF/CNPJ de todos os produtores e cooperados com o Cadastro de Empregadores e arquivar o print com data.": "Cross-check the taxpayer IDs of all producers and members against the Employers Register and keep a dated screenshot.", "Resgates na colheita (aliciamento, alojamento precário, descontos)": "Rescues during harvest (recruitment, poor housing, deductions)", "Visita durante a colheita: entrevistas, fotos dos alojamentos, registros e recibos de pagamento.": "Visit during harvest: interviews, photos of housing, employee records and pay slips.", "Cooperados flagrados vendendo à cooperativa": "Members caught selling to the cooperative", "Verificar o procedimento de bloqueio e a segregação dos lotes de produtores autuados.": "Check the blocking procedure and segregation of lots from fined producers.", "Rastreabilidade para a EUDR": "Traceability for the EUDR", "Amostrar lotes exportados e verificar o polígono e a lista suja de cada fazenda.": "Sample exported lots and check the polygon and dirty-list status of each farm.", "Regulamento (UE) 2023/1115 (EUDR); Lei 12.651/2012": "Regulation (EU) 2023/1115 (EUDR); Law 12,651/2012 (Forest Code)", "Polígono de cada fazenda e vínculo lote → fazenda": "Polygon of each farm and lot → farm link", "CP arts. 149 e 207 (aliciamento); CF art. 7º, XXXIII; ECA": "Penal Code arts. 149 and 207 (illegal recruitment); Constitution art. 7, XXXIII; Child and Adolescent Statute", "Consulta ao Cadastro de Empregadores (MTE) de todos os produtores e cooperados": "Check of the MTE Employers Register for all producers and members", "CLT; NR-31 (áreas de vivência e transporte)": "Labor Code (CLT); NR-31 (living areas and transport)", "Registro desde o primeiro dia, alojamento, água, transporte e ausência de descontos indevidos": "Registration from day one, housing, water, transport and no improper deductions", "Lei 12.651/2012; Decreto 6.514/2008, art. 54": "Law 12,651/2012; Decree 6,514/2008, art. 54", "Marco de 31/12/2020, CAR ativo e consulta de embargos": "Cut-off date 31/12/2020, active CAR and embargo check", "CC art. 422 (boa-fé); regras do esquema certificador": "Civil Code art. 422 (good faith); certification scheme rules", "Certificado válido, escopo e balanço de massa dos lotes certificados": "Valid certificate, scope and mass balance of certified lots", "CC arts. 421 e 422; Decreto 11.129/2022 (programa de integridade)": "Civil Code arts. 421 and 422; Decree 11,129/2022 (integrity program)", "Acesso a documentos, locais e trabalhadores, inclusive visitas sem aviso": "Access to documents, sites and workers, including unannounced visits", "Lei 9.972/2000 (classificação vegetal); Lei 9.933/1999 (metrologia)": "Law 9,972/2000 (plant product grading); Law 9,933/1999 (metrology)", "Preço vinculado a cotação pública, balança aferida e laudo de classificação": "Price linked to a public quotation, calibrated scale and grading report", "Lei 13.709/2018; Lei 12.846/2013; CC arts. 474 e 475": "Law 13,709/2018 (LGPD); Law 12,846/2013; Civil Code arts. 474 and 475", "Tratamento de dados, integridade e rescisão por não conformidade grave": "Data processing, integrity and termination for serious non-compliance"});
/* EN complementar */
Object.assign(EN_SEG, {"Estoque físico de sacas conciliado ao estoque declarado":"Physical stock of bags reconciled with declared stock","Rastreio de lote: exportação → blend → armazém → fazenda (polígono)":"Lot tracing: export → blend → warehouse → farm (polygon)","Segregação e balanço de massa dos lotes certificados":"Segregation and mass balance of certified lots","Condições de trabalho e segurança no armazém":"Working conditions and safety at the warehouse","Cartão CNPJ e inscrições estaduais":"CNPJ card and state registrations","Política de compra responsável e de direitos humanos":"Responsible sourcing and human rights policy","Relatório de monitoramento socioambiental de fornecedores":"Supplier social and environmental monitoring report","Lista de fazendas de origem com polígonos (KML/geojson)":"List of origin farms with polygons (KML/geojson)","Contratos com cooperativas, armazéns e produtores":"Contracts with cooperatives, warehouses and producers","Notas fiscais de entrada (amostra) e laudos de classificação":"Incoming invoices (sample) and grading reports","Registros de exportação e certificados de origem":"Export records and certificates of origin","Certificações (Rainforest, 4C, Fairtrade, orgânico) e auditorias":"Certifications (Rainforest, 4C, Fairtrade, organic) and audits","Recebimento, classificação e identificação dos lotes":"Receipt, grading and identification of lots","Sacas movimentadas compatíveis com a capacidade do armazém":"Bags handled consistent with warehouse capacity","Armazenagem, secagem e segurança adequadas":"Adequate storage, drying and safety","Condições de trabalho dos empregados":"Employees' working conditions","Notas fiscais de saída":"Outgoing invoices","Tickets de pesagem e laudos de classificação":"Weighing tickets and grading reports","Existência da propriedade e da lavoura confirmadas no local":"Property and crop confirmed on site","Área de café compatível com o CAR e com imagens de satélite":"Coffee area consistent with CAR and satellite images","Alojamentos, água, sanitários e refeitório dos colhedores":"Pickers' housing, water, toilets and canteen","Registro e pagamento dos trabalhadores da colheita":"Registration and pay of harvest workers","Ausência de menores trabalhando":"No minors working","Armazenamento de agrotóxicos e EPIs":"Pesticide and PPE storage","Matrícula do imóvel":"Property title deed","Contratos de safra e registro dos trabalhadores da colheita":"Harvest contracts and registration of harvest workers","Receituários agronômicos":"Agronomic prescriptions","Certificados de certificação, se houver":"Certification certificates, if any"});

/* operações comerciais: produto negociado (NCM aceitos, palavras-chave da descrição e item de demonstração) */
const OPS_PROD = {prod: "café e derivados", ncm: ["0901", "2101"], kw: /caf[ée]|coffee/i, demo: ["Café cru em grão, não descafeinado", "09011110", "SC", 1450]};

/* cotações automáticas (função agendada do Firebase): o que aparece na barra, praças ligadas e referência */
const COT_AUTO = {un: "sc", kg: 60, ref: "cepea_cafe_arabica", bar: [["cepea_cafe_arabica", "Arábica", "/sc"], ["cepea_cafe_robusta", "Robusta", "/sc"], ["dolar", "Dólar", ""]], br: {SP: "cepea_cafe_arabica", ES: "cepea_cafe_robusta", RO: "cepea_cafe_robusta"}, intl: {}, nota: "Café: Indicadores CEPEA/ESALQ (R$ por saca de 60 kg)."};
