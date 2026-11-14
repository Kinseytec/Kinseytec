/* ================= KinseyTec – Gado · CONTEÚDO DA DILIGÊNCIA ================= */
/* Cliente contratante: ponto de partida do mapa (frigorífico, varejista ou banco). */
const CLIENTE_PADRAO = {nome:"Cliente contratante", local:"Frigorífico · Goiânia/GO", lat:-16.686, lng:-49.264};

/* Cotações: arroba do boi gordo (R$ por arroba de 15 kg), referências internacionais, histórico e fontes */
const PRACAS_BR = [["SP","São Paulo · Indicador do boi gordo"],["GO","Goiás"],["MT","Mato Grosso"],["MS","Mato Grosso do Sul"],["PA","Pará"],["MG","Minas Gerais"],["TO","Tocantins"],["RO","Rondônia"]];
const INTL = [["B3","B3 · boi gordo futuro","R$/@"],["CME","CME · Live Cattle","US¢/lb"],["CHN","Carne bovina · exportação China","US$/t"]];
const PRECO = {bar:["SP","GO","MT"], barLabel:{SP:"SP",GO:"GO",MT:"MT"}, fonteEx:"Indicador CEPEA/B3 ou IMEA",
  hist:[["SP","SP"],["GO","GO"],["MT","MT"],["PA","PA"],["B3","B3"]],
  links:[["Indicador do Boi Gordo CEPEA/B3","https://www.cepea.esalq.usp.br/br/indicador/boi-gordo.aspx"],["Notícias Agrícolas","https://www.noticiasagricolas.com.br/cotacoes/boi-gordo"],["IMEA (Mato Grosso)","https://www.imea.com.br/imea-site/indicador-boi"],["B3 · boi gordo","https://www.b3.com.br"],["CME Live Cattle","https://www.cmegroup.com/markets/agriculture/livestock/live-cattle.html"]]};

/* Investigação (fontes públicas): id, rótulo, tipo, pontos, critério */
const INV = [
 ["divida","Dívida ativa (PGFN / estado / município)","sn",2,"Regularidade fiscal"],
 ["protestos","Protestos em cartório","sn",1,"Regularidade fiscal"],
 ["proc_trab","Processos trabalhistas relevantes","sn",2,"Condições de trabalho"],
 ["proc_crim","Processos criminais da empresa ou dos sócios","sn",3,"Integridade"],
 ["pep","Sócio ou administrador politicamente exposto (PEP / envolvimento político)","sn",2,"Integridade"],
 ["prisao","Sócio preso, denunciado ou sob investigação","sn",4,"Integridade"],
 ["rotat","Sócios abrem e fecham empresas rapidamente (CNPJs baixados ou inaptos nos últimos 3 anos)","num",3,"Perfil societário"],
 ["midia","Mídia negativa (desmatamento, trabalho escravo, grilagem, lavagem de gado)","sn",2,"Integridade"],
 ["mte","Cadastro de Empregadores do MTE (lista suja)","sn",6,"Condições de trabalho"],
 ["ibama","Embargo ambiental (IBAMA / órgão estadual)","sn",5,"Desmatamento e EUDR"],
 ["desmat","Desmatamento após 31/12/2020 na fazenda (PRODES / MapBiomas Alerta) — critério EUDR","sn",6,"Desmatamento e EUDR"],
 ["ti_uc","Sobreposição com Terra Indígena, quilombola ou Unidade de Conservação","sn",6,"Direitos territoriais"],
 ["gta","Animais recebidos de fazendas embargadas ou com desmatamento (cruzamento de GTAs) — lavagem de gado","sn",5,"Fornecedores indiretos"],
 ["sanit","Irregularidade sanitária (vacinação, trânsito animal, interdição pela defesa agropecuária)","sn",3,"Sanidade e rastreabilidade"]
];
const UF_CENTER = {AC:[-9.0,-70.5],AL:[-9.6,-36.6],AP:[1.4,-51.8],AM:[-4.2,-62.5],BA:[-13.5,-40.5],CE:[-5.2,-39.5],DF:[-15.8,-47.9],ES:[-19.5,-40.6],GO:[-16.0,-49.6],MA:[-5.0,-45.3],MT:[-12.6,-55.9],MS:[-20.5,-54.8],MG:[-18.5,-44.6],PA:[-3.8,-52.5],PB:[-7.1,-36.8],PR:[-24.6,-51.6],PE:[-8.4,-37.9],PI:[-7.4,-42.7],RJ:[-22.2,-42.7],RN:[-5.8,-36.6],RS:[-29.7,-53.3],RO:[-10.9,-62.8],RR:[2.0,-61.4],SC:[-27.3,-50.4],SP:[-22.3,-48.6],SE:[-10.6,-37.4],TO:[-10.2,-48.3]};

/* Questionário por nível: N1 fornecedor direto (engorda/confinamento) · N2 indireto (recria, leilão) · N3 indireto (cria) */
const Q = {
 N1:[
  {g:"Identificação e societário", items:[
   ["n1_01","O produtor ou a empresa está ativo na Receita Federal e tem inscrição estadual de produtor regular?","nao"],
   ["n1_02","Algum sócio ou titular participa, ou participou nos últimos 5 anos, de outra fazenda ou empresa hoje baixada, inapta ou embargada?","sim"],
   ["n1_03","Possui certidões negativas válidas (federal, estadual, municipal, FGTS e trabalhista)?","nao"],
   ["n1_04","Houve troca de titular, arrendamento ou divisão da fazenda nos últimos 3 anos?","sim"]]},
  {g:"Fazenda e desmatamento", items:[
   ["n1_05","Todas as fazendas do grupo têm CAR ativo, com polígono georreferenciado (exigido pela EUDR)?","nao",3],
   ["n1_06","Houve abertura de área (desmatamento) após 31/12/2020, mesmo com autorização?","sim",5],
   ["n1_07","Alguma fazenda tem embargo do IBAMA ou do órgão estadual, ou sobreposição com Terra Indígena ou UC?","sim",5],
   ["n1_08","Cumpre o Termo de Ajustamento de Conduta da Carne Legal / protocolos de monitoramento dos frigoríficos?","nao"],
   ["n1_09","A área de pastagem e a lotação declaradas conferem com o CAR e as imagens de satélite?","nao"],
   ["n1_10","Compra animais de outras fazendas para engorda (fornecedores indiretos)?",null]]},
  {g:"Fornecedores indiretos (recria e cria)", items:[
   ["n1_11","Entregou as GTAs de entrada dos últimos 12 meses, com as fazendas de origem dos animais?","nao",3],
   ["n1_12","Verifica se as fazendas de origem (recria e cria) têm CAR, sem embargo e sem desmatamento?","nao",3],
   ["n1_13","Recebe animais de fazendas embargadas ou de áreas desmatadas, mesmo por intermediários ou leilões?","sim",5],
   ["n1_14","Usa fazendas “limpas” para emitir GTA de animais criados em outra área (lavagem de gado)?","sim",6],
   ["n1_15","Paga as compras de animais por meio bancário, em nome do vendedor da GTA e da nota?","nao"]]},
  {g:"Trabalho, sanidade e ESG", items:[
   ["n1_16","O produtor ou seus sócios constam, ou já constaram, no Cadastro de Empregadores do MTE (trabalho análogo ao de escravo)?","sim",5],
   ["n1_17","Os vaqueiros e trabalhadores têm registro, alojamento adequado, água potável e EPIs?","nao",3],
   ["n1_18","Mantém vacinação, trânsito animal (GTA) e rastreabilidade individual em dia (SISBOV ou programa estadual)?","nao",2],
   ["n1_19","Adota boas práticas de bem-estar animal, recuperação de pastagens ou mede emissões do rebanho?","nao",1],
   ["n1_20","Assinou o NDA e o termo LGPD autorizando o repasse das informações ao cliente contratante?","nao"]]}],
 N2:[
  {g:"Recria e comercialização", items:[
   ["n2_01","Emite GTA e nota fiscal em todas as vendas e compras de animais?","nao",3],
   ["n2_02","As saídas de animais têm entradas ou nascimentos correspondentes (balanço do rebanho fecha)?","nao",3],
   ["n2_03","A lotação da fazenda (cabeças por hectare) é compatível com a área de pastagem?","nao"],
   ["n2_04","Compra animais em leilões ou de intermediários sem identificar a fazenda de origem?","sim",3],
   ["n2_05","Mantém o cadastro dos animais na defesa agropecuária atualizado?","nao"]]},
  {g:"Origem e território", items:[
   ["n2_06","Entregou as GTAs de entrada com as fazendas de cria (N3)?","nao"],
   ["n2_07","A fazenda tem CAR ativo, sem embargo e sem desmatamento após 2020?","nao",4],
   ["n2_08","Recebe animais de fazendas em Terra Indígena, UC ou com conflito fundiário?","sim",5],
   ["n2_09","Arrenda pastos de terceiros ou “aluga” CAR de outras áreas?","sim",3],
   ["n2_10","Paga em espécie ou em nome de terceiros?","sim"]]},
  {g:"Trabalho e conformidade", items:[
   ["n2_11","Todos os trabalhadores estão formalmente contratados?","nao"],
   ["n2_12","Sofreu fiscalização trabalhista ou ambiental com autuação nos últimos 5 anos?","sim"],
   ["n2_13","Assinou o NDA e o termo LGPD?","nao"]]}],
 N3:[
  {g:"Propriedade e território", items:[
   ["n3_01","Possui inscrição estadual de produtor rural e cadastro na defesa agropecuária?","nao"],
   ["n3_02","A propriedade tem CAR ativo e título ou georreferenciamento no SIGEF/INCRA?","nao"],
   ["n3_03","Existe embargo ambiental sobre a área?","sim",4],
   ["n3_04","Houve abertura de área para pasto após 31/12/2020?","sim",5],
   ["n3_05","A área se sobrepõe a Terra Indígena, quilombola ou Unidade de Conservação?","sim",5]]},
  {g:"Rebanho e sanidade", items:[
   ["n3_06","Vacina o rebanho e emite GTA na venda dos bezerros?","nao"],
   ["n3_07","O número de bezerros vendidos é compatível com as matrizes e a área?","nao"],
   ["n3_08","Vende bezerros a intermediários sem GTA ou com GTA de outra fazenda?","sim",4]]},
  {g:"Trabalho e comunidades", items:[
   ["n3_09","Há trabalho infantil, retenção de documentos, dívida com o patrão ou alojamento degradante?","sim",5],
   ["n3_10","Os trabalhadores são registrados ou da família, com condições dignas?","nao"],
   ["n3_11","Existe conflito com comunidades indígenas, quilombolas ou posseiros na área?","sim",4],
   ["n3_12","Assinou o termo de consentimento LGPD?","nao"]]}]
};

/* Checklist documental */
const DOCS = {
 N1:["Documento do produtor ou contrato social","Inscrição estadual de produtor rural","Certidões negativas (RFB/PGFN, SEFAZ, município, FGTS, CNDT)","Recibo do CAR e polígonos das fazendas (KML/geojson)","GTAs de entrada e de saída (12 meses)","Notas fiscais de venda ao frigorífico","Contratos com o cliente contratante","Comprovantes de vacinação e cadastro na defesa agropecuária","Registro de empregados (eSocial) e alojamentos","Licença ambiental e outorga de água, se houver","Certificações ou protocolos de bem-estar e carbono, se houver"],
 N2:["Documento do produtor ou CNPJ","Inscrição estadual","Recibo do CAR","GTAs de entrada e saída","Notas fiscais","Cadastro na defesa agropecuária","Contratos de arrendamento","Comprovantes de pagamento","Registro de empregados (eSocial)"],
 N3:["Documento do produtor (CPF ou CNPJ)","Inscrição estadual de produtor rural","Recibo do CAR e demonstrativo","Matrícula do imóvel / certificação SIGEF","GTAs de venda dos bezerros","Comprovante de vacinação","Termo de consentimento LGPD"]
};

/* Inspeção física */
const INSP = {
 N1:[["i_reb","Contagem do rebanho conciliada às GTAs e ao cadastro da defesa agropecuária"],["i_bal","Balança e curral com pesagem-teste realizada"],["i_lote","Rastreio: abate no cliente → GTA → fazenda de engorda → recria → cria"],["i_area","Pastagens compatíveis com o CAR, sem abertura recente"],["i_trab","Alojamentos, água, EPIs e condições de trabalho"]],
 N2:[["i_reb","Rebanho compatível com GTAs de entrada e saída"],["i_cap","Lotação compatível com a área de pastagem"],["i_area","Reserva Legal e APP preservadas"],["i_lote","Animais rastreáveis até a fazenda de cria"],["i_trab","Condições de trabalho dos vaqueiros"]],
 N3:[["i_prop","Existência da propriedade e sede confirmadas no local"],["i_mat","Matrizes e bezerros compatíveis com as vendas declaradas"],["i_rl","Reserva Legal e APP preservadas, sem sinais de abertura recente"],["i_san","Vacinação e manejo sanitário"],["i_trab","Alojamentos e condições de trabalho adequadas"],["i_men","Ausência de menores trabalhando"]]
};

const EV_TYPES = ["Foto do rebanho","Foto do curral / confinamento","Foto da balança","Foto da pastagem / propriedade","Nota fiscal","GTA","Contrato","Ticket de pesagem","Comprovante de vacinação","Recibo do CAR","Mapa / polígono da área","Comprovante de pagamento","Registro de empregados","Outro"];
const PHOTO_TYPES = ["Foto do rebanho","Foto do curral / confinamento","Foto da balança","Foto da pastagem / propriedade"];

const SUP_TYPES = {N1:["Fornecedor direto · engorda","Confinamento","Pecuarista integrado"],N2:["Indireto · recria","Leilão / intermediário","Arrendatário de pasto"],N3:["Indireto · cria (bezerros)","Pequeno produtor","Assentamento"]};
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
/* Lotação de referência: animais vendidos por hectare/ano × 1000 (ex.: 600 = 0,6 cabeça/ha/ano) — a calibrar com o cliente */
const PROD_REF = {PA:500, MT:600, GO:700, MS:650, TO:500, RO:600, MG:700, SP:900, AC:500, MA:450, BA:500};

/* Municípios pecuários e polos frigoríficos — coordenadas aproximadas da sede */
const MUNI = [
 ["São Félix do Xingu","PA",-6.644,-51.995],["Marabá","PA",-5.381,-49.132],["Redenção","PA",-8.026,-50.031],["Novo Repartimento","PA",-4.247,-49.950],["Altamira","PA",-3.204,-52.206],["Paragominas","PA",-2.997,-47.353],["Xinguara","PA",-7.098,-49.943],
 ["Água Boa","MT",-14.051,-52.159],["Juína","MT",-11.378,-58.741],["Cáceres","MT",-16.071,-57.679],["Vila Bela da Santíssima Trindade","MT",-15.008,-59.951],["Alta Floresta","MT",-9.876,-56.086],["Barra do Garças","MT",-15.890,-52.257],["Cuiabá","MT",-15.601,-56.097],["Juara","MT",-11.255,-57.519],
 ["Porto Velho","RO",-8.761,-63.900],["Ji-Paraná","RO",-10.877,-61.951],["Ariquemes","RO",-9.913,-63.041],
 ["Corumbá","MS",-19.009,-57.651],["Campo Grande","MS",-20.469,-54.620],["Ribas do Rio Pardo","MS",-20.444,-53.759],["Três Lagoas","MS",-20.751,-51.678],
 ["Nova Crixás","GO",-14.096,-50.333],["Mozarlândia","GO",-14.745,-50.571],["Goiânia","GO",-16.686,-49.264],["Rio Verde","GO",-17.798,-50.928],["São Miguel do Araguaia","GO",-13.275,-50.163],
 ["Araguaína","TO",-7.191,-48.207],["Paraíso do Tocantins","TO",-10.175,-48.882],["Uberaba","MG",-19.748,-47.932],["Araçatuba","SP",-21.209,-50.433],["Presidente Prudente","SP",-22.125,-51.389],
 ["Rio Branco","AC",-9.975,-67.810],["Açailândia","MA",-4.947,-47.505],["Santos","SP",-23.961,-46.333],["São Paulo","SP",-23.550,-46.633]
];

const CLAUSES = [
 ["c_origem","Rastreabilidade dos animais até a fazenda de nascimento (GTAs, CAR e polígonos)"],
 ["c_desmat","Desmatamento zero após 31/12/2020 e ausência de embargos nas fazendas diretas e indiretas"],
 ["c_indir","Monitoramento dos fornecedores indiretos e proibição de lavagem de gado"],
 ["c_trab","Proibição de trabalho análogo ao escravo e de trabalho infantil (CLT, NR-31, ECA)"],
 ["c_terr","Respeito a Terras Indígenas, quilombolas e Unidades de Conservação"],
 ["c_san","Sanidade, vacinação, trânsito animal regular e bem-estar animal"],
 ["c_aud","Direito de auditoria e inspeção pelo cliente contratante ou terceiro independente"],
 ["c_lgpd","Confidencialidade, LGPD, anticorrupção (Lei 12.846/2013) e rescisão por não conformidade grave"]
];

const NDA_VERSION = "minuta v0.1 — para avaliação jurídica";
const NDA_TEXT = [
 ["1. Partes e objeto","Este termo é celebrado entre a Kinsey Allen Brasil Auditoria e Consultoria Ltda. (\"Kinsey BR\") e o fornecedor identificado abaixo, no âmbito da due diligence da cadeia da carne bovina contratada pelo cliente contratante da Kinsey BR."],
 ["2. Confidencialidade","A Kinsey BR manterá sigilo sobre as informações comerciais, fiscais e operacionais recebidas e as usará somente para a diligência. O fornecedor autoriza o repasse dos resultados e das evidências ao cliente contratante, que se obriga ao mesmo sigilo."],
 ["3. Dados pessoais tratados (LGPD, Lei 13.709/2018)","Nome, CPF, cargo, contato e assinatura de responsáveis e produtores; endereços, coordenadas e polígonos das fazendas; GTAs e dados do rebanho; fotografias com data e geolocalização; dados de contratação de trabalhadores, sem dados sensíveis."],
 ["4. Finalidade e base legal","Verificar a existência dos animais, a realidade das transações e a origem lícita e livre de desmatamento da carne, nos fornecedores diretos e indiretos, inclusive para atender exigências como a regulamentação europeia de produtos livres de desmatamento (EUDR). Bases legais: cumprimento de obrigação legal ou regulatória (art. 7º, II), exercício regular de direitos em contrato (art. 7º, VI) e legítimo interesse (art. 7º, IX)."],
 ["5. Compartilhamento","O cliente contratante (controlador destinatário dos resultados), advogados e auditores da Kinsey BR e provedores de hospedagem do aplicativo, sob contrato de confidencialidade. Consultas a bases públicas (Receita Federal, SEFAZ, SICAR, SIGEF, IBAMA, MTE, defesa agropecuária, PRODES/MapBiomas, tribunais)."],
 ["6. Retenção e segurança","Os dados ficam guardados pelo prazo da diligência e pelo período exigido pelas normas de auditoria e pela regulamentação aplicável (mínimo de 5 anos), com acesso restrito e registro de quem consultou."],
 ["7. Direitos do titular","Confirmação, acesso, correção, anonimização, portabilidade, informação sobre compartilhamento e revogação do consentimento (art. 18), pelo canal do Encarregado (DPO) da Kinsey BR."],
 ["8. Declaração de veracidade","O fornecedor declara que as informações, documentos, GTAs, polígonos e fotos enviados são verdadeiros e correspondem à realidade da operação, ciente de que divergências serão registradas como achado de risco."]
];

/* Traduções (EN) do conteúdo do segmento */
const EN_SEG = {
"Identificação e societário":"Identification and ownership","Fazenda e desmatamento":"Farm and deforestation","Fornecedores indiretos (recria e cria)":"Indirect suppliers (rearing and breeding)","Trabalho, sanidade e ESG":"Labor, animal health and ESG","Recria e comercialização":"Rearing and trading","Origem e território":"Origin and land","Trabalho e conformidade":"Labor and compliance","Propriedade e território":"Property and land","Rebanho e sanidade":"Herd and animal health","Trabalho e comunidades":"Labor and communities",
"Desmatamento e EUDR":"Deforestation and EUDR","Direitos territoriais":"Land rights","Fornecedores indiretos":"Indirect suppliers","Sanidade e rastreabilidade":"Animal health and traceability",
"O produtor ou a empresa está ativo na Receita Federal e tem inscrição estadual de produtor regular?":"Is the producer or company active with the Federal Revenue Service with a regular state producer registration?",
"Algum sócio ou titular participa, ou participou nos últimos 5 anos, de outra fazenda ou empresa hoje baixada, inapta ou embargada?":"Does any partner or owner hold, or has held in the last 5 years, another farm or company now closed, unfit or embargoed?",
"Possui certidões negativas válidas (federal, estadual, municipal, FGTS e trabalhista)?":"Does it hold valid clearance certificates (federal, state, municipal, FGTS and labor)?",
"Houve troca de titular, arrendamento ou divisão da fazenda nos últimos 3 anos?":"Has there been a change of owner, lease or split of the farm in the last 3 years?",
"Todas as fazendas do grupo têm CAR ativo, com polígono georreferenciado (exigido pela EUDR)?":"Do all group farms have an active CAR with a geo-referenced polygon (required by the EUDR)?",
"Houve abertura de área (desmatamento) após 31/12/2020, mesmo com autorização?":"Was land cleared (deforestation) after 31/12/2020, even with authorization?",
"Alguma fazenda tem embargo do IBAMA ou do órgão estadual, ou sobreposição com Terra Indígena ou UC?":"Does any farm have an IBAMA or state embargo, or overlap with indigenous land or a protected area?",
"Cumpre o Termo de Ajustamento de Conduta da Carne Legal / protocolos de monitoramento dos frigoríficos?":"Does it comply with the Legal Beef conduct agreement / meatpacker monitoring protocols?",
"A área de pastagem e a lotação declaradas conferem com o CAR e as imagens de satélite?":"Do the declared pasture area and stocking rate match the CAR and satellite imagery?",
"Compra animais de outras fazendas para engorda (fornecedores indiretos)?":"Does it buy animals from other farms for fattening (indirect suppliers)?",
"Entregou as GTAs de entrada dos últimos 12 meses, com as fazendas de origem dos animais?":"Has it delivered the incoming animal transit permits (GTAs) for the last 12 months, with the farms of origin?",
"Verifica se as fazendas de origem (recria e cria) têm CAR, sem embargo e sem desmatamento?":"Does it check that farms of origin (rearing and breeding) have a CAR, no embargo and no deforestation?",
"Recebe animais de fazendas embargadas ou de áreas desmatadas, mesmo por intermediários ou leilões?":"Does it receive animals from embargoed farms or deforested areas, even through middlemen or auctions?",
"Usa fazendas “limpas” para emitir GTA de animais criados em outra área (lavagem de gado)?":"Does it use “clean” farms to issue permits for animals raised elsewhere (cattle laundering)?",
"Paga as compras de animais por meio bancário, em nome do vendedor da GTA e da nota?":"Does it pay for animals by bank transfer, to the seller named on the permit and invoice?",
"O produtor ou seus sócios constam, ou já constaram, no Cadastro de Empregadores do MTE (trabalho análogo ao de escravo)?":"Are the producer or partners, or have they ever been, on the Labor Ministry's Employers Register (slave-like labor)?",
"Os vaqueiros e trabalhadores têm registro, alojamento adequado, água potável e EPIs?":"Do cowhands and workers have registration, proper housing, drinking water and PPE?",
"Mantém vacinação, trânsito animal (GTA) e rastreabilidade individual em dia (SISBOV ou programa estadual)?":"Are vaccination, animal transit (GTA) and individual traceability up to date (SISBOV or state program)?",
"Adota boas práticas de bem-estar animal, recuperação de pastagens ou mede emissões do rebanho?":"Does it adopt animal welfare practices, pasture recovery or measure herd emissions?",
"Assinou o NDA e o termo LGPD autorizando o repasse das informações ao cliente contratante?":"Has it signed the NDA and LGPD consent authorizing sharing with the contracting client?",
"Emite GTA e nota fiscal em todas as vendas e compras de animais?":"Does it issue a permit and invoice for every animal sale and purchase?",
"As saídas de animais têm entradas ou nascimentos correspondentes (balanço do rebanho fecha)?":"Do animal exits match entries or births (does the herd balance close)?",
"A lotação da fazenda (cabeças por hectare) é compatível com a área de pastagem?":"Is the farm's stocking rate (head per hectare) consistent with the pasture area?",
"Compra animais em leilões ou de intermediários sem identificar a fazenda de origem?":"Does it buy animals at auctions or from middlemen without identifying the farm of origin?",
"Mantém o cadastro dos animais na defesa agropecuária atualizado?":"Is the herd registration with the animal health agency up to date?",
"Entregou as GTAs de entrada com as fazendas de cria (N3)?":"Has it delivered incoming permits with the breeding farms (N3)?",
"A fazenda tem CAR ativo, sem embargo e sem desmatamento após 2020?":"Does the farm have an active CAR, no embargo and no deforestation after 2020?",
"Recebe animais de fazendas em Terra Indígena, UC ou com conflito fundiário?":"Does it receive animals from farms in indigenous lands, protected areas or under land conflict?",
"Arrenda pastos de terceiros ou “aluga” CAR de outras áreas?":"Does it lease third-party pastures or “rent” the CAR of other areas?",
"Paga em espécie ou em nome de terceiros?":"Does it pay in cash or to third parties?",
"Todos os trabalhadores estão formalmente contratados?":"Are all workers formally hired?",
"Sofreu fiscalização trabalhista ou ambiental com autuação nos últimos 5 anos?":"Has it been fined in a labor or environmental inspection in the last 5 years?",
"Assinou o NDA e o termo LGPD?":"Has it signed the NDA and LGPD consent?",
"Possui inscrição estadual de produtor rural e cadastro na defesa agropecuária?":"Does it hold a rural producer state registration and animal health agency registration?",
"A propriedade tem CAR ativo e título ou georreferenciamento no SIGEF/INCRA?":"Does the property have an active CAR and title or geo-referencing in SIGEF/INCRA?",
"Existe embargo ambiental sobre a área?":"Is there an environmental embargo on the area?",
"Houve abertura de área para pasto após 31/12/2020?":"Was land cleared for pasture after 31/12/2020?",
"A área se sobrepõe a Terra Indígena, quilombola ou Unidade de Conservação?":"Does the area overlap indigenous, quilombola land or a protected area?",
"Vacina o rebanho e emite GTA na venda dos bezerros?":"Does it vaccinate the herd and issue permits when selling calves?",
"O número de bezerros vendidos é compatível com as matrizes e a área?":"Is the number of calves sold consistent with the cows and the area?",
"Vende bezerros a intermediários sem GTA ou com GTA de outra fazenda?":"Does it sell calves to middlemen without a permit or with another farm's permit?",
"Há trabalho infantil, retenção de documentos, dívida com o patrão ou alojamento degradante?":"Is there child labor, document retention, debt bondage or degrading housing?",
"Os trabalhadores são registrados ou da família, com condições dignas?":"Are workers registered or family members, with decent conditions?",
"Existe conflito com comunidades indígenas, quilombolas ou posseiros na área?":"Is there conflict with indigenous, quilombola or squatter communities in the area?",
"Assinou o termo de consentimento LGPD?":"Has it signed the LGPD consent form?",
"Desmatamento após 31/12/2020 na fazenda (PRODES / MapBiomas Alerta) — critério EUDR":"Deforestation after 31/12/2020 on the farm (PRODES / MapBiomas Alerta) — EUDR criterion",
"Sobreposição com Terra Indígena, quilombola ou Unidade de Conservação":"Overlap with indigenous, quilombola land or protected area",
"Animais recebidos de fazendas embargadas ou com desmatamento (cruzamento de GTAs) — lavagem de gado":"Animals received from embargoed or deforested farms (permit cross-check) — cattle laundering",
"Irregularidade sanitária (vacinação, trânsito animal, interdição pela defesa agropecuária)":"Animal health irregularity (vaccination, transit, ban by the animal health agency)",
"Mídia negativa (desmatamento, trabalho escravo, grilagem, lavagem de gado)":"Negative media (deforestation, slave labor, land grabbing, cattle laundering)",
"Fornecedor direto · engorda":"Direct supplier · fattening","Confinamento":"Feedlot","Pecuarista integrado":"Integrated rancher","Indireto · recria":"Indirect · rearing","Leilão / intermediário":"Auction / middleman","Arrendatário de pasto":"Pasture lessee","Indireto · cria (bezerros)":"Indirect · breeding (calves)","Pequeno produtor":"Smallholder","Assentamento":"Settlement",
"Foto do rebanho":"Photo of herd","Foto do curral / confinamento":"Photo of corral / feedlot","Foto da pastagem / propriedade":"Photo of pasture / property","GTA":"Animal transit permit (GTA)","Comprovante de vacinação":"Vaccination record","Mapa / polígono da área":"Map / plot polygon",
"São Paulo · Indicador do boi gordo":"São Paulo · fed cattle index","B3 · boi gordo futuro":"B3 · live cattle futures","CME · Live Cattle":"CME · Live Cattle","Carne bovina · exportação China":"Beef · exports to China",
"Rastreabilidade dos animais até a fazenda de nascimento (GTAs, CAR e polígonos)":"Animal traceability to the farm of birth (permits, CAR and polygons)",
"Desmatamento zero após 31/12/2020 e ausência de embargos nas fazendas diretas e indiretas":"Zero deforestation after 31/12/2020 and no embargoes on direct and indirect farms",
"Monitoramento dos fornecedores indiretos e proibição de lavagem de gado":"Monitoring of indirect suppliers and ban on cattle laundering",
"Proibição de trabalho análogo ao escravo e de trabalho infantil (CLT, NR-31, ECA)":"Ban on slave-like and child labor (CLT, NR-31, ECA)",
"Respeito a Terras Indígenas, quilombolas e Unidades de Conservação":"Respect for indigenous and quilombola lands and protected areas",
"Sanidade, vacinação, trânsito animal regular e bem-estar animal":"Animal health, vaccination, regular transit and animal welfare",
"Direito de auditoria e inspeção pelo cliente contratante ou terceiro independente":"Audit and inspection rights for the contracting client or an independent third party",
"Confidencialidade, LGPD, anticorrupção (Lei 12.846/2013) e rescisão por não conformidade grave":"Confidentiality, LGPD, anti-corruption (Law 12,846/2013) and termination for serious non-compliance"
};

/* Fontes públicas específicas do setor */
const FONTES_EXTRA = [["ABIEC · Boi na Linha (protocolo de monitoramento)", "https://www.boinalinha.org"], ["Adepará · defesa agropecuária e GTA (Pará)", "https://www.adepara.pa.gov.br"], ["MPF · Ministério Público Federal (TAC da Carne)", "https://www.mpf.mp.br"], ["INPE TerraBrasilis · PRODES/DETER (desmatamento)", "https://terrabrasilis.dpi.inpe.br"], ["INCRA SIGEF · imóveis georreferenciados", "https://sigef.incra.gov.br"]];
/* Alertas do setor (notícias públicas) — [data, título, resumo, fonte] */
const SETOR_NEWS = [
[
"2025",
"Auditoria do MPF: frigoríficos ainda têm problemas com fornecedores indiretos",
"Segundo o MPF, as inconformidades só serão resolvidas com rastreabilidade total da cadeia.",
"https://www.infomoney.com.br/?p=2279988"
],
[
"—",
"Justiça manda abrir dados de trânsito de gado (GTA) no Pará para Ibama e ICMBio",
"Dados de GTA passam a apoiar a fiscalização ambiental dos fornecedores indiretos.",
"https://comprerural.com/justica-manda-abrir-dados-de-transito-de-gado-no-para-para-ibama-e-icmbio-entenda-o-impacto-para-pecuaristas/"
],
[
"—",
"Pará quer rastrear 100% da produção bovina até dezembro de 2026",
"Programa estadual de rastreabilidade individual (confirmar prazos vigentes).",
"https://congressoemfoco.com.br/noticia/107373/para-quer-rastrear-100-da-producao-bovina-ate-dezembro-de-2026"
],
[
"04/11/2025",
"Primeiro lote de carne bovina com rastreabilidade individual do Pará",
"Rastreabilidade individual permite análise dos fornecedores indiretos.",
"https://istoedinheiro.com.br/jbs-entrega-no-para-primeiro-lote-de-carne-bovina-com-rastreabilidade-individual"
]
];

/* Auditoria reforçada com base nos alertas do setor */
Q.N1.push({g:"Alertas do setor", items:[["n1_a1", "Monitora os fornecedores indiretos (cria e recria) por GTA, e não apenas a fazenda de engorda?", "nao", 4], ["n1_a2", "Os animais comprados têm identificação individual (brinco/SISBOV ou programa estadual)?", "nao", 2]]});
Q.N2.push({g:"Alertas do setor", items:[["n2_a1", "Vende animais para engorda sem informar a fazenda de nascimento (risco de lavagem de gado)?", "sim", 4]]});
Q.N3.push({g:"Alertas do setor", items:[["n3_a1", "As GTAs de saída da fazenda são compatíveis com o rebanho declarado à defesa agropecuária?", "nao", 3]]});
INSP.N1.push(...[["i_gta", "Amostra de GTAs cruzada com CAR e embargos das fazendas de origem (diretas e indiretas)"]]);
INSP.N3.push(...[["i_brinco", "Identificação individual dos animais conferida por amostragem"]]);
EV_TYPES.splice(Math.max(0, EV_TYPES.indexOf("Outro")), 0, ...["Análise de satélite (PRODES/DETER)", "Consulta de embargos (IBAMA/estado)"]);
/* [id, níveis, padrão de risco, procedimento, evidências exigidas, índice em SETOR_NEWS] */
const AUDIT_TESTS = [["t_ind", ["N1", "N2"], "Fornecedores indiretos sem controle (auditoria do MPF)", "Para uma amostra de lotes, reconstruir a cadeia por GTA até a fazenda de nascimento e checar CAR, PRODES e embargos de cada elo.", ["GTA", "Análise de satélite (PRODES/DETER)"], 0], ["t_gta", ["N2", "N3"], "Lavagem de gado por fazenda “limpa”", "Comparar entradas e saídas de GTAs com o rebanho declarado e a capacidade da pastagem.", ["GTA", "Comprovante de vacinação"], 1], ["t_sat", ["N3"], "Desmatamento em fazendas de cria e recria", "Comparar o polígono com PRODES/DETER e embargos e arquivar o relatório.", ["Mapa / polígono da área", "Consulta de embargos (IBAMA/estado)"], 0], ["t_rast", ["N1"], "Rastreabilidade individual obrigatória no Pará", "Verificar a adesão ao programa estadual e o percentual de animais identificados.", ["Contrato"], 2]];
/* Cláusula → [base legal de referência, o que verificar, essencial] */
const CLAUSE_INFO = {"c_origem": ["TAC da Carne (MPF); normas de trânsito animal (GTA); Regulamento (UE) 2023/1115", "GTAs de toda a vida do animal, CAR e polígono das fazendas", true], "c_desmat": ["Lei 12.651/2012; Decreto 6.514/2008, art. 54", "Marco de 31/12/2020 e consulta de embargos do IBAMA e do estado", true], "c_indir": ["TAC da Carne (MPF); Protocolo Boi na Linha", "Obrigação de informar os fornecedores indiretos e aderir à rastreabilidade individual", true], "c_trab": ["CP art. 149; CF art. 7º, XXXIII; ECA; NR-31", "Consulta ao Cadastro de Empregadores (MTE)", true], "c_terr": ["CF art. 231; ADCT art. 68; Lei 9.985/2000 (SNUC); Convenção 169 da OIT", "Sobreposição com TI, territórios quilombolas e UCs (FUNAI, INCRA, ICMBio)", true], "c_san": ["Lei 9.605/1998, art. 32 (maus-tratos); normas estaduais de defesa sanitária animal", "Vacinação, GTA regular e condições de transporte", false], "c_aud": ["CC arts. 421 e 422; Decreto 11.129/2022 (programa de integridade)", "Acesso a documentos, locais e trabalhadores, inclusive visitas sem aviso", false], "c_lgpd": ["Lei 13.709/2018; Lei 12.846/2013; CC arts. 474 e 475", "Tratamento de dados, integridade e rescisão por não conformidade grave", true]};
Object.assign(EN_SEG, {"Alertas do setor": "Sector alerts", "Consulta à lista suja (print com data)": "Dirty list check (dated screenshot)", "Análise de satélite (PRODES/DETER)": "Satellite analysis (PRODES/DETER)", "Consulta de embargos (IBAMA/estado)": "Embargo check (IBAMA/state)", "Entrevista com trabalhadores (registro)": "Worker interview (record)", "Foto das áreas de vivência": "Photo of living quarters", "Monitora os fornecedores indiretos (cria e recria) por GTA, e não apenas a fazenda de engorda?": "Does it monitor indirect suppliers (breeding and rearing) through GTAs, not just the fattening farm?", "Os animais comprados têm identificação individual (brinco/SISBOV ou programa estadual)?": "Do purchased animals have individual identification (ear tag/SISBOV or state program)?", "Vende animais para engorda sem informar a fazenda de nascimento (risco de lavagem de gado)?": "Does it sell animals for fattening without disclosing the birth farm (cattle laundering risk)?", "As GTAs de saída da fazenda são compatíveis com o rebanho declarado à defesa agropecuária?": "Are the farm's outgoing GTAs consistent with the herd declared to the animal health agency?", "Amostra de GTAs cruzada com CAR e embargos das fazendas de origem (diretas e indiretas)": "Sample of GTAs cross-checked with CAR and embargoes of origin farms (direct and indirect)", "Identificação individual dos animais conferida por amostragem": "Individual animal identification checked by sampling", "Fornecedores indiretos sem controle (auditoria do MPF)": "Uncontrolled indirect suppliers (MPF audit)", "Para uma amostra de lotes, reconstruir a cadeia por GTA até a fazenda de nascimento e checar CAR, PRODES e embargos de cada elo.": "For a sample of lots, rebuild the chain through GTAs back to the birth farm and check CAR, PRODES and embargoes for each link.", "Lavagem de gado por fazenda “limpa”": "Cattle laundering through a “clean” farm", "Comparar entradas e saídas de GTAs com o rebanho declarado e a capacidade da pastagem.": "Compare incoming and outgoing GTAs with the declared herd and pasture capacity.", "Desmatamento em fazendas de cria e recria": "Deforestation on breeding and rearing farms", "Comparar o polígono com PRODES/DETER e embargos e arquivar o relatório.": "Compare the polygon with PRODES/DETER and embargoes and keep the report.", "Rastreabilidade individual obrigatória no Pará": "Mandatory individual traceability in Pará", "Verificar a adesão ao programa estadual e o percentual de animais identificados.": "Check enrollment in the state program and the share of identified animals.", "TAC da Carne (MPF); normas de trânsito animal (GTA); Regulamento (UE) 2023/1115": "Beef TAC (Federal Prosecutors); animal transit rules (GTA); Regulation (EU) 2023/1115", "GTAs de toda a vida do animal, CAR e polígono das fazendas": "GTAs for the animal's whole life, CAR and farm polygons", "Lei 12.651/2012; Decreto 6.514/2008, art. 54": "Law 12,651/2012; Decree 6,514/2008, art. 54", "Marco de 31/12/2020 e consulta de embargos do IBAMA e do estado": "Cut-off date 31/12/2020 and check of IBAMA and state embargoes", "TAC da Carne (MPF); Protocolo Boi na Linha": "Beef TAC (Federal Prosecutors); Boi na Linha Protocol", "Obrigação de informar os fornecedores indiretos e aderir à rastreabilidade individual": "Duty to disclose indirect suppliers and join individual traceability", "CP art. 149; CF art. 7º, XXXIII; ECA; NR-31": "Penal Code art. 149; Constitution art. 7, XXXIII; Child and Adolescent Statute; NR-31", "Consulta ao Cadastro de Empregadores (MTE)": "Check of the MTE Employers Register (dirty list)", "CF art. 231; ADCT art. 68; Lei 9.985/2000 (SNUC); Convenção 169 da OIT": "Constitution art. 231; ADCT art. 68; Law 9,985/2000 (SNUC); ILO Convention 169", "Sobreposição com TI, territórios quilombolas e UCs (FUNAI, INCRA, ICMBio)": "Overlap with Indigenous Lands, quilombola territories and protected areas (FUNAI, INCRA, ICMBio)", "Lei 9.605/1998, art. 32 (maus-tratos); normas estaduais de defesa sanitária animal": "Law 9,605/1998, art. 32 (animal cruelty); state animal health rules", "Vacinação, GTA regular e condições de transporte": "Vaccination, regular GTA and transport conditions", "CC arts. 421 e 422; Decreto 11.129/2022 (programa de integridade)": "Civil Code arts. 421 and 422; Decree 11,129/2022 (integrity program)", "Acesso a documentos, locais e trabalhadores, inclusive visitas sem aviso": "Access to documents, sites and workers, including unannounced visits", "Lei 13.709/2018; Lei 12.846/2013; CC arts. 474 e 475": "Law 13,709/2018 (LGPD); Law 12,846/2013; Civil Code arts. 474 and 475", "Tratamento de dados, integridade e rescisão por não conformidade grave": "Data processing, integrity and termination for serious non-compliance"});
/* EN complementar */
Object.assign(EN_SEG, {"Contagem do rebanho conciliada às GTAs e ao cadastro da defesa agropecuária":"Herd count reconciled with GTAs and the animal health agency register","Balança e curral com pesagem-teste realizada":"Scale and corral with test weighing performed","Rastreio: abate no cliente → GTA → fazenda de engorda → recria → cria":"Tracing: slaughter at client → GTA → fattening farm → rearing → breeding","Pastagens compatíveis com o CAR, sem abertura recente":"Pastures consistent with CAR, with no recent clearing","Alojamentos, água, EPIs e condições de trabalho":"Housing, water, PPE and working conditions","Documento do produtor ou contrato social":"Producer ID or articles of association","Recibo do CAR e polígonos das fazendas (KML/geojson)":"CAR receipt and farm polygons (KML/geojson)","GTAs de entrada e de saída (12 meses)":"Incoming and outgoing GTAs (12 months)","Notas fiscais de venda ao frigorífico":"Invoices for sales to the meatpacker","Comprovantes de vacinação e cadastro na defesa agropecuária":"Vaccination certificates and animal health agency registration","Registro de empregados (eSocial) e alojamentos":"Employee records (eSocial) and housing","Licença ambiental e outorga de água, se houver":"Environmental license and water use permit, if any","Certificações ou protocolos de bem-estar e carbono, se houver":"Animal welfare and carbon certifications or protocols, if any","Rebanho compatível com GTAs de entrada e saída":"Herd consistent with incoming and outgoing GTAs","Lotação compatível com a área de pastagem":"Stocking rate consistent with pasture area","Reserva Legal e APP preservadas":"Legal Reserve and permanent protection areas preserved","Animais rastreáveis até a fazenda de cria":"Animals traceable to the breeding farm","Condições de trabalho dos vaqueiros":"Cowhands' working conditions","Documento do produtor ou CNPJ":"Producer ID or CNPJ","GTAs de entrada e saída":"Incoming and outgoing GTAs","Notas fiscais":"Invoices","Cadastro na defesa agropecuária":"Animal health agency registration","Contratos de arrendamento":"Lease agreements","Existência da propriedade e sede confirmadas no local":"Property and headquarters confirmed on site","Matrizes e bezerros compatíveis com as vendas declaradas":"Breeding cows and calves consistent with declared sales","Reserva Legal e APP preservadas, sem sinais de abertura recente":"Legal Reserve and permanent protection areas preserved, with no signs of recent clearing","Vacinação e manejo sanitário":"Vaccination and herd health management","Alojamentos e condições de trabalho adequadas":"Adequate housing and working conditions","Ausência de menores trabalhando":"No minors working","Recibo do CAR e demonstrativo":"CAR receipt and statement","Matrícula do imóvel / certificação SIGEF":"Property title deed / SIGEF certification","GTAs de venda dos bezerros":"Calf sale GTAs"});

/* operações comerciais: produto negociado (NCM aceitos, palavras-chave da descrição e item de demonstração) */
const OPS_PROD = {prod: "bovinos, carne e couro", ncm: ["0102", "0201", "0202", "0206", "0504", "1502", "4101"], kw: /boi|bovin|gado|novilh|vaca|bezerr|garrote|carne|couro|sebo/i, demo: ["Bovinos vivos para abate", "01022990", "CAB", 3200]};

/* cotações automáticas (função agendada do Firebase): o que aparece na barra, praças ligadas e referência */
const COT_AUTO = {un: "@", kg: 15, ref: "cepea_boi", bar: [["cepea_boi", "Boi gordo SP", "/@"], ["dolar", "Dólar", ""]], br: {SP: "cepea_boi"}, intl: {}, nota: "Boi gordo: Indicador CEPEA/ESALQ (São Paulo, R$ por arroba)."};
