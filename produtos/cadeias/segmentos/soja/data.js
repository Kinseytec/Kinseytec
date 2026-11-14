/* ================= KinseyTec – Soja · CONTEÚDO DA DILIGÊNCIA ================= */
/* Cliente contratante: ponto de partida do mapa (trading, esmagadora ou terminal portuário). */
const CLIENTE_PADRAO = {nome:"Cliente contratante", local:"Terminal portuário · Paranaguá/PR", lat:-25.52, lng:-48.51};

/* Cotações: praças no Brasil (R$ por saca de 60 kg), bolsas internacionais, histórico e fontes */
const PRACAS_BR = [["PR","Paranaguá/PR (porto)"],["MT","Sorriso/MT"],["GO","Rio Verde/GO"],["MS","Dourados/MS"],["BA","Luís Eduardo Magalhães/BA"],["RS","Passo Fundo/RS"],["MA","Balsas/MA"],["PA","Paragominas/PA"]];
const INTL = [["CBOT","CBOT Chicago · soja em grão","US¢/bushel"],["FARELO","CBOT · farelo de soja","US$/short ton"],["OLEO","CBOT · óleo de soja","US¢/lb"]];
const PRECO = {bar:["PR","MT","GO"], barLabel:{PR:"Paranaguá",MT:"Sorriso",GO:"Rio Verde"}, fonteEx:"CEPEA/ESALQ ou Notícias Agrícolas",
  hist:[["PR","Paranaguá"],["MT","MT"],["GO","GO"],["CBOT","CBOT"]],
  links:[["Indicador CEPEA/ESALQ Soja","https://www.cepea.esalq.usp.br/br/indicador/soja.aspx"],["Notícias Agrícolas","https://www.noticiasagricolas.com.br/cotacoes/soja"],["IMEA (Mato Grosso)","https://www.imea.com.br/imea-site/indicador-soja"],["Conab","https://www.conab.gov.br/info-agro/safras/graos"],["CME/CBOT Soybean","https://www.cmegroup.com/markets/agriculture/oilseeds/soybean.html"]]};

/* Investigação (fontes públicas): id, rótulo, tipo, pontos, critério */
const INV = [
 ["divida","Dívida ativa (PGFN / estado / município)","sn",2,"Regularidade fiscal"],
 ["protestos","Protestos em cartório","sn",1,"Regularidade fiscal"],
 ["proc_trab","Processos trabalhistas relevantes","sn",2,"Condições de trabalho"],
 ["proc_crim","Processos criminais da empresa ou dos sócios","sn",3,"Integridade"],
 ["pep","Sócio ou administrador politicamente exposto (PEP / envolvimento político)","sn",2,"Integridade"],
 ["prisao","Sócio preso, denunciado ou sob investigação","sn",4,"Integridade"],
 ["rotat","Sócios abrem e fecham empresas rapidamente (CNPJs baixados ou inaptos nos últimos 3 anos)","num",3,"Perfil societário"],
 ["midia","Mídia negativa (desmatamento, trabalho escravo, grilagem, fraude fiscal)","sn",2,"Integridade"],
 ["mte","Cadastro de Empregadores do MTE (lista suja)","sn",6,"Condições de trabalho"],
 ["ibama","Embargo ambiental (IBAMA / órgão estadual)","sn",4,"Origem e território"],
 ["desmat","Desmatamento após 31/12/2020 na área (PRODES / MapBiomas Alerta) — critério EUDR","sn",6,"Desmatamento e EUDR"],
 ["morat","Área na lista de não conformes da Moratória da Soja (bioma Amazônia, desmatamento após 2008)","sn",5,"Desmatamento e EUDR"],
 ["ti_uc","Sobreposição com Terra Indígena, quilombola ou Unidade de Conservação","sn",6,"Direitos territoriais"],
 ["fundiario","Conflito fundiário ou irregularidade de título/georreferenciamento (SIGEF/INCRA)","sn",3,"Direitos territoriais"]
];
const UF_CENTER = {AC:[-9.0,-70.5],AL:[-9.6,-36.6],AP:[1.4,-51.8],AM:[-4.2,-62.5],BA:[-13.5,-40.5],CE:[-5.2,-39.5],DF:[-15.8,-47.9],ES:[-19.5,-40.6],GO:[-16.0,-49.6],MA:[-5.0,-45.3],MT:[-12.6,-55.9],MS:[-20.5,-54.8],MG:[-18.5,-44.6],PA:[-3.8,-52.5],PB:[-7.1,-36.8],PR:[-24.6,-51.6],PE:[-8.4,-37.9],PI:[-7.4,-42.7],RJ:[-22.2,-42.7],RN:[-5.8,-36.6],RS:[-29.7,-53.3],RO:[-10.9,-62.8],RR:[2.0,-61.4],SC:[-27.3,-50.4],SP:[-22.3,-48.6],SE:[-10.6,-37.4],TO:[-10.2,-48.3]};

/* Questionário por nível: N1 trading/esmagadora · N2 armazém/cerealista/cooperativa · N3 produtor. [id, pergunta, resposta de risco, pontos] */
const Q = {
 N1:[
  {g:"Identificação e societário", items:[
   ["n1_01","A empresa está ativa na Receita Federal e tem inscrição estadual regular em todos os estados onde opera?","nao"],
   ["n1_02","Algum sócio ou administrador participa, ou participou nos últimos 5 anos, de outra empresa de grãos hoje baixada ou inapta?","sim"],
   ["n1_03","Possui certidões negativas válidas (federal, estadual, municipal, FGTS e trabalhista)?","nao"],
   ["n1_04","Houve troca de CNPJ, cisão ou sucessão de empresas do grupo nos últimos 3 anos?","sim"]]},
  {g:"Originação e rastreabilidade", items:[
   ["n1_05","Mantém cadastro georreferenciado (polígono da área) de todas as fazendas de origem, exigido pela EUDR?","nao",3],
   ["n1_06","Consegue rastrear cada embarque até as fazendas de origem (lote, armazém, nota fiscal, polígono)?","nao",3],
   ["n1_07","Faz monitoramento socioambiental dos fornecedores diretos e indiretos (desmatamento, embargos, TI/UC, lista suja)?","nao",3],
   ["n1_08","É signatária e cumpre a Moratória da Soja / Protocolo Verde de Grãos?","nao"],
   ["n1_09","Separa fisicamente os grãos de origem verificada (segregação) ou usa balanço de massa auditado?","nao"],
   ["n1_10","Compra soja de armazéns ou cerealistas que não informam as fazendas de origem?","sim",3]]},
  {g:"Fornecedores N2 e N3", items:[
   ["n1_11","Entregou a lista completa de fornecedores N2/N3 dos últimos 12 meses (nome, CNPJ/CPF, município, CAR, volume)?","nao"],
   ["n1_12","Tem contratos com cláusulas de desmatamento zero, trabalho decente e direitos territoriais?","nao"],
   ["n1_13","Bloqueia fornecedores com embargo, desmatamento após 2020 ou na lista suja?","nao",3],
   ["n1_14","Paga fornecedores somente por meio bancário, em nome do emitente da nota fiscal?","nao"],
   ["n1_15","Há operações de triangulação (fazenda “limpa” emitindo nota de grão de outra área)?","sim",5]]},
  {g:"Trabalho, ESG e integridade", items:[
   ["n1_16","A empresa ou seus sócios constam, ou já constaram, no Cadastro de Empregadores do MTE (trabalho análogo ao de escravo)?","sim",5],
   ["n1_17","Publica relatório de sustentabilidade com metas de desmatamento e emissões (padrões GRI/ISSB)?","nao",1],
   ["n1_18","Possui código de ética, política de direitos humanos e canal de denúncia em funcionamento?","nao"],
   ["n1_19","Já recebeu autuação ou denúncia por desmatamento, trabalho escravo ou conflito em terra indígena na cadeia?","sim",4],
   ["n1_20","Assinou o NDA e o termo LGPD autorizando o repasse das informações ao cliente contratante?","nao"]]}],
 N2:[
  {g:"Armazenagem e operação", items:[
   ["n2_01","Emite nota fiscal de entrada para toda a soja recebida dos produtores?","nao"],
   ["n2_02","As notas de saída têm notas de entrada correspondentes (balanço de massa fecha)?","nao",3],
   ["n2_03","A capacidade estática dos silos é compatível com o volume movimentado no período?","nao"],
   ["n2_04","O armazém está cadastrado no SICARM/Conab e tem certificação de armazenagem?","nao"],
   ["n2_05","Possui balança rodoviária aferida (IPEM/INMETRO) e classifica umidade e impurezas com laudo?","nao"]]},
  {g:"Origem dos grãos", items:[
   ["n2_06","Entregou a lista de produtores (N3) com CPF/CNPJ, município, CAR e volume por safra?","nao"],
   ["n2_07","Mistura grãos de origens diferentes sem registro (impede a rastreabilidade)?","sim",3],
   ["n2_08","Os produtores fornecedores têm CAR ativo, sem embargos e sem desmatamento após 2020?","nao",3],
   ["n2_09","Recebe soja de áreas em Terra Indígena, Unidade de Conservação ou com conflito fundiário?","sim",5],
   ["n2_10","Paga produtores em espécie ou em nome de terceiros?","sim"]]},
  {g:"Trabalho e conformidade", items:[
   ["n2_11","Todos os trabalhadores estão formalmente contratados (CLT, safra ou terceiro regular)?","nao"],
   ["n2_12","Sofreu fiscalização trabalhista ou ambiental com autuação nos últimos 5 anos?","sim"],
   ["n2_13","Assinou o NDA e o termo LGPD?","nao"]]}],
 N3:[
  {g:"Propriedade e território", items:[
   ["n3_01","Possui inscrição estadual de produtor rural ativa e emite nota fiscal de produtor?","nao"],
   ["n3_02","A propriedade tem CAR ativo e georreferenciamento certificado no SIGEF/INCRA?","nao"],
   ["n3_03","Existe embargo ambiental (IBAMA ou órgão estadual) sobre a área?","sim",4],
   ["n3_04","Houve abertura de área (desmatamento) após 31/12/2020, mesmo com autorização?","sim",5],
   ["n3_05","A área possui Reserva Legal e APP conforme o Código Florestal (ou adesão ao PRA)?","nao"]]},
  {g:"Produção e insumos", items:[
   ["n3_06","Usa somente agrotóxicos registrados, com receituário agronômico e destinação correta das embalagens?","nao"],
   ["n3_07","A área plantada declarada confere com a área do CAR e com imagens de satélite?","nao"],
   ["n3_08","Arrenda ou faz parceria com terceiros em áreas não informadas?","sim"]]},
  {g:"Trabalho e comunidades", items:[
   ["n3_09","Há trabalho infantil, retenção de documentos, dívida com o empregador ou alojamento degradante?","sim",5],
   ["n3_10","Os trabalhadores (inclusive safristas e operadores de máquinas) são registrados e usam EPIs?","nao"],
   ["n3_11","Existe conflito com comunidades indígenas, quilombolas ou posseiros na área ou no entorno?","sim",4],
   ["n3_12","Assinou o termo de consentimento LGPD?","nao"]]}]
};

/* Checklist documental */
const DOCS = {
 N1:["Contrato social e alterações","Cartão CNPJ e inscrições estaduais","Certidões negativas (RFB/PGFN, SEFAZ, município, FGTS, CNDT)","Política de originação responsável / desmatamento zero","Relatório de monitoramento socioambiental de fornecedores","Lista de fazendas de origem com polígonos (geojson/KML)","Contratos com o cliente contratante","Contratos com armazéns e produtores","Notas fiscais de entrada (amostra)","Notas fiscais de saída e conhecimentos de embarque","Relatório de sustentabilidade / inventário de emissões","Certificações (RTRS, ProTerra, ISCC), se houver"],
 N2:["Cartão CNPJ e inscrição estadual","Certidões negativas","Cadastro SICARM/Conab do armazém","Notas fiscais de entrada dos produtores","Notas fiscais de saída","Tickets de pesagem e laudos de classificação","Cadastro de produtores com CAR","Contratos com produtores","Comprovantes de pagamento","Registro de empregados (eSocial)"],
 N3:["Documento do produtor (CPF ou CNPJ)","Inscrição estadual de produtor rural","Nota fiscal de produtor","Recibo do CAR e demonstrativo","Matrícula do imóvel / certificação SIGEF","Contratos de arrendamento ou parceria","Receituários agronômicos","Comprovantes de venda e recebimento","Termo de consentimento LGPD"]
};

/* Inspeção física */
const INSP = {
 N1:[["i_est","Estoque físico conciliado ao estoque declarado (silos e armazéns)"],["i_bal","Balança rodoviária com certificado IPEM/INMETRO e pesagem-teste realizada"],["i_lote","Rastreio de lote: embarque ao cliente → armazém → fazenda (polígono)"],["i_mon","Sistema de monitoramento socioambiental testado com amostra de fornecedores"],["i_trab","Condições de trabalho e segurança nas unidades"]],
 N2:[["i_ctrl","Recebimento, classificação e segregação de lotes efetivos"],["i_cap","Volume movimentado compatível com a capacidade estática dos silos"],["i_arm","Armazenagem, aeração e segurança adequadas (NR-33/NR-35)"],["i_lote","Lotes rastreáveis até o produtor"],["i_trab","Condições de trabalho dos empregados"]],
 N3:[["i_prop","Existência da propriedade e sede confirmadas no local"],["i_area","Área plantada compatível com o CAR e com imagens de satélite"],["i_rl","Reserva Legal e APP preservadas, sem sinais de abertura recente"],["i_agro","Armazenamento de agrotóxicos e destinação de embalagens"],["i_trab","Alojamentos, EPIs e condições de trabalho adequadas"],["i_men","Ausência de menores trabalhando"]]
};

const EV_TYPES = ["Foto da mercadoria / grãos","Foto do silo / armazém","Foto da balança","Foto da lavoura / propriedade","Nota fiscal","Pedido de compra","Contrato","Ticket de pesagem","Laudo de classificação","Romaneio / CT-e","Recibo do CAR","Mapa / polígono da área","Comprovante de pagamento","Registro de empregados","Outro"];
const PHOTO_TYPES = ["Foto da mercadoria / grãos","Foto do silo / armazém","Foto da balança","Foto da lavoura / propriedade"];

const SUP_TYPES = {N1:["Trading / exportadora","Esmagadora (indústria)"],N2:["Armazém / cerealista","Cooperativa","Revenda / originador"],N3:["Produtor pessoa física","Produtor pessoa jurídica","Grupo agrícola"]};
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
/* Produtividade média de referência (kg/ha) — valores iniciais a calibrar com o cliente */
const PROD_REF = {MT:3700, GO:3700, MS:3500, PR:3600, RS:3200, SC:3500, BA:3800, MA:3300, PI:3300, TO:3300, PA:3300, MG:3600, SP:3500, RO:3500, DF:3800};

/* Municípios produtores e portos — coordenadas aproximadas da sede */
const MUNI = [
 ["Sorriso","MT",-12.545,-55.711],["Lucas do Rio Verde","MT",-13.050,-55.911],["Sinop","MT",-11.864,-55.502],["Nova Mutum","MT",-13.837,-56.083],["Campo Novo do Parecis","MT",-13.676,-57.889],["Sapezal","MT",-12.989,-58.764],["Querência","MT",-12.597,-52.182],["Primavera do Leste","MT",-15.560,-54.297],["Rondonópolis","MT",-16.470,-54.636],["Canarana","MT",-13.551,-52.270],["Diamantino","MT",-14.408,-56.446],
 ["Rio Verde","GO",-17.798,-50.928],["Jataí","GO",-17.881,-51.714],["Cristalina","GO",-16.768,-47.613],["Mineiros","GO",-17.565,-52.551],
 ["Dourados","MS",-22.221,-54.806],["Maracaju","MS",-21.614,-55.168],["Chapadão do Sul","MS",-18.788,-52.623],["Sidrolândia","MS",-20.932,-54.961],
 ["Luís Eduardo Magalhães","BA",-12.096,-45.786],["Barreiras","BA",-12.152,-44.990],["São Desidério","BA",-12.363,-44.973],["Formosa do Rio Preto","BA",-11.048,-45.193],
 ["Balsas","MA",-7.533,-46.035],["Tasso Fragoso","MA",-8.475,-45.747],["Uruçuí","PI",-7.229,-44.556],["Baixa Grande do Ribeiro","PI",-7.849,-45.214],["Porto Nacional","TO",-10.708,-48.417],["Campos Lindos","TO",-7.990,-46.866],
 ["Paragominas","PA",-2.997,-47.353],["Santarém","PA",-2.443,-54.708],["Barcarena","PA",-1.506,-48.625],
 ["Cascavel","PR",-24.957,-53.455],["Ponta Grossa","PR",-25.095,-50.162],["Paranaguá","PR",-25.520,-48.509],
 ["Passo Fundo","RS",-28.262,-52.407],["Cruz Alta","RS",-28.639,-53.606],["Rio Grande","RS",-32.035,-52.099],
 ["Unaí","MG",-16.359,-46.906],["Santos","SP",-23.961,-46.333],["São Luís","MA",-2.530,-44.300],["São Paulo","SP",-23.550,-46.633]
];

const CLAUSES = [
 ["c_origem","Origem e rastreabilidade até a fazenda, com polígono georreferenciado (EUDR)"],
 ["c_desmat","Desmatamento zero após 31/12/2020 e cumprimento da Moratória da Soja"],
 ["c_trab","Proibição de trabalho análogo ao escravo e de trabalho infantil (CLT, NR-31, ECA)"],
 ["c_terr","Respeito a Terras Indígenas, quilombolas, Unidades de Conservação e consulta prévia"],
 ["c_amb","Conformidade ambiental: CAR ativo, Reserva Legal e ausência de embargos"],
 ["c_aud","Direito de auditoria e inspeção pelo cliente contratante ou terceiro independente"],
 ["c_lgpd","Confidencialidade e tratamento de dados pessoais conforme a LGPD"],
 ["c_anti","Anticorrupção (Lei 12.846/2013), veracidade das informações e rescisão por não conformidade grave"]
];

const NDA_VERSION = "minuta v0.1 — para avaliação jurídica";
const NDA_TEXT = [
 ["1. Partes e objeto","Este termo é celebrado entre a Kinsey Allen Brasil Auditoria e Consultoria Ltda. (\"Kinsey BR\") e o fornecedor identificado abaixo, no âmbito da due diligence da cadeia da soja contratada pelo cliente contratante da Kinsey BR."],
 ["2. Confidencialidade","A Kinsey BR manterá sigilo sobre as informações comerciais, fiscais e operacionais recebidas e as usará somente para a diligência. O fornecedor autoriza o repasse dos resultados e das evidências ao cliente contratante, que se obriga ao mesmo sigilo."],
 ["3. Dados pessoais tratados (LGPD, Lei 13.709/2018)","Nome, CPF, cargo, contato e assinatura de responsáveis e produtores; endereços, coordenadas e polígonos das propriedades e armazéns; fotografias com data e geolocalização; dados de contratação de empregados, sem dados sensíveis."],
 ["4. Finalidade e base legal","Verificar a existência das mercadorias, a realidade das transações e a origem lícita e livre de desmatamento da soja, inclusive para atender exigências como a regulamentação europeia de produtos livres de desmatamento (EUDR). Bases legais: cumprimento de obrigação legal ou regulatória (art. 7º, II), exercício regular de direitos em contrato (art. 7º, VI) e legítimo interesse (art. 7º, IX)."],
 ["5. Compartilhamento","O cliente contratante (controlador destinatário dos resultados), advogados e auditores da Kinsey BR e provedores de hospedagem do aplicativo, sob contrato de confidencialidade. Consultas a bases públicas (Receita Federal, SEFAZ, SICAR, SIGEF, IBAMA, MTE, PRODES/MapBiomas, tribunais)."],
 ["6. Retenção e segurança","Os dados ficam guardados pelo prazo da diligência e pelo período exigido pelas normas de auditoria e pela regulamentação aplicável (mínimo de 5 anos), com acesso restrito e registro de quem consultou."],
 ["7. Direitos do titular","Confirmação, acesso, correção, anonimização, portabilidade, informação sobre compartilhamento e revogação do consentimento (art. 18), pelo canal do Encarregado (DPO) da Kinsey BR."],
 ["8. Declaração de veracidade","O fornecedor declara que as informações, documentos, polígonos e fotos enviados são verdadeiros e correspondem à realidade da operação, ciente de que divergências serão registradas como achado de risco."]
];

/* Traduções (EN) do conteúdo do segmento */
const EN_SEG = {
"Originação e rastreabilidade":"Sourcing and traceability","Armazenagem e operação":"Storage and operations","Origem dos grãos":"Grain origin","Propriedade e território":"Property and land","Produção e insumos":"Production and inputs","Trabalho e comunidades":"Labor and communities","Trabalho, ESG e integridade":"Labor, ESG and integrity","Identificação e societário":"Identification and ownership","Fornecedores N2 e N3":"N2 and N3 suppliers","Trabalho e conformidade":"Labor and compliance",
"A empresa está ativa na Receita Federal e tem inscrição estadual regular em todos os estados onde opera?":"Is the company active with the Federal Revenue Service and does it hold regular state registrations wherever it operates?",
"Algum sócio ou administrador participa, ou participou nos últimos 5 anos, de outra empresa de grãos hoje baixada ou inapta?":"Does any partner or officer hold, or has held in the last 5 years, a stake in another grain company now closed or unfit?",
"Possui certidões negativas válidas (federal, estadual, municipal, FGTS e trabalhista)?":"Does it hold valid clearance certificates (federal, state, municipal, FGTS and labor)?",
"Houve troca de CNPJ, cisão ou sucessão de empresas do grupo nos últimos 3 anos?":"Has there been a change of tax ID, spin-off or succession of group companies in the last 3 years?",
"Mantém cadastro georreferenciado (polígono da área) de todas as fazendas de origem, exigido pela EUDR?":"Does it keep a geo-referenced register (plot polygon) of all origin farms, as required by the EUDR?",
"Consegue rastrear cada embarque até as fazendas de origem (lote, armazém, nota fiscal, polígono)?":"Can it trace each shipment back to the origin farms (lot, warehouse, invoice, polygon)?",
"Faz monitoramento socioambiental dos fornecedores diretos e indiretos (desmatamento, embargos, TI/UC, lista suja)?":"Does it run social and environmental monitoring of direct and indirect suppliers (deforestation, embargoes, indigenous lands/protected areas, slave-labor list)?",
"É signatária e cumpre a Moratória da Soja / Protocolo Verde de Grãos?":"Is it a signatory to and compliant with the Soy Moratorium / Green Grain Protocol?",
"Separa fisicamente os grãos de origem verificada (segregação) ou usa balanço de massa auditado?":"Does it physically segregate verified-origin grain or use an audited mass balance?",
"Compra soja de armazéns ou cerealistas que não informam as fazendas de origem?":"Does it buy soybeans from warehouses or grain dealers that do not disclose the origin farms?",
"Entregou a lista completa de fornecedores N2/N3 dos últimos 12 meses (nome, CNPJ/CPF, município, CAR, volume)?":"Has it delivered the full list of N2/N3 suppliers for the last 12 months (name, tax ID, municipality, CAR, volume)?",
"Tem contratos com cláusulas de desmatamento zero, trabalho decente e direitos territoriais?":"Does it have contracts with zero-deforestation, decent-work and land-rights clauses?",
"Bloqueia fornecedores com embargo, desmatamento após 2020 ou na lista suja?":"Does it block suppliers with embargoes, deforestation after 2020 or on the slave-labor list?",
"Paga fornecedores somente por meio bancário, em nome do emitente da nota fiscal?":"Does it pay suppliers only by bank transfer, to the invoice issuer?",
"Há operações de triangulação (fazenda “limpa” emitindo nota de grão de outra área)?":"Are there laundering operations (a “clean” farm invoicing grain from another area)?",
"A empresa ou seus sócios constam, ou já constaram, no Cadastro de Empregadores do MTE (trabalho análogo ao de escravo)?":"Are the company or its partners, or have they ever been, on the Labor Ministry's Employers Register (slave-like labor)?",
"Publica relatório de sustentabilidade com metas de desmatamento e emissões (padrões GRI/ISSB)?":"Does it publish a sustainability report with deforestation and emissions targets (GRI/ISSB standards)?",
"Possui código de ética, política de direitos humanos e canal de denúncia em funcionamento?":"Does it have a code of ethics, a human rights policy and a working whistleblower channel?",
"Já recebeu autuação ou denúncia por desmatamento, trabalho escravo ou conflito em terra indígena na cadeia?":"Has it been fined or reported for deforestation, slave labor or indigenous-land conflict in the chain?",
"Assinou o NDA e o termo LGPD autorizando o repasse das informações ao cliente contratante?":"Has it signed the NDA and LGPD consent authorizing sharing with the contracting client?",
"Emite nota fiscal de entrada para toda a soja recebida dos produtores?":"Does it issue an incoming invoice for all soybeans received from producers?",
"As notas de saída têm notas de entrada correspondentes (balanço de massa fecha)?":"Do outgoing invoices match incoming invoices (does the mass balance close)?",
"A capacidade estática dos silos é compatível com o volume movimentado no período?":"Is the silos' static capacity consistent with the volume handled in the period?",
"O armazém está cadastrado no SICARM/Conab e tem certificação de armazenagem?":"Is the warehouse registered with SICARM/Conab and certified for storage?",
"Possui balança rodoviária aferida (IPEM/INMETRO) e classifica umidade e impurezas com laudo?":"Does it have a certified truck scale (IPEM/INMETRO) and grade moisture and impurities with a report?",
"Entregou a lista de produtores (N3) com CPF/CNPJ, município, CAR e volume por safra?":"Has it delivered the producer list (N3) with tax ID, municipality, CAR and volume per crop?",
"Mistura grãos de origens diferentes sem registro (impede a rastreabilidade)?":"Does it mix grain from different origins without records (preventing traceability)?",
"Os produtores fornecedores têm CAR ativo, sem embargos e sem desmatamento após 2020?":"Do supplying producers have an active CAR, no embargoes and no deforestation after 2020?",
"Recebe soja de áreas em Terra Indígena, Unidade de Conservação ou com conflito fundiário?":"Does it receive soybeans from indigenous lands, protected areas or areas under land conflict?",
"Paga produtores em espécie ou em nome de terceiros?":"Does it pay producers in cash or to third parties?",
"Todos os trabalhadores estão formalmente contratados (CLT, safra ou terceiro regular)?":"Are all workers formally hired (CLT, seasonal or regular contractor)?",
"Sofreu fiscalização trabalhista ou ambiental com autuação nos últimos 5 anos?":"Has it been fined in a labor or environmental inspection in the last 5 years?",
"Assinou o NDA e o termo LGPD?":"Has it signed the NDA and LGPD consent?",
"Possui inscrição estadual de produtor rural ativa e emite nota fiscal de produtor?":"Does it hold an active rural producer state registration and issue producer invoices?",
"A propriedade tem CAR ativo e georreferenciamento certificado no SIGEF/INCRA?":"Does the property have an active CAR and certified geo-referencing in SIGEF/INCRA?",
"Existe embargo ambiental (IBAMA ou órgão estadual) sobre a área?":"Is there an environmental embargo (IBAMA or state agency) on the area?",
"Houve abertura de área (desmatamento) após 31/12/2020, mesmo com autorização?":"Was land cleared (deforestation) after 31/12/2020, even with authorization?",
"A área possui Reserva Legal e APP conforme o Código Florestal (ou adesão ao PRA)?":"Does the area have Legal Reserve and permanent preservation areas under the Forest Code (or PRA enrollment)?",
"Usa somente agrotóxicos registrados, com receituário agronômico e destinação correta das embalagens?":"Does it use only registered pesticides, with agronomic prescriptions and proper packaging disposal?",
"A área plantada declarada confere com a área do CAR e com imagens de satélite?":"Does the declared planted area match the CAR area and satellite imagery?",
"Arrenda ou faz parceria com terceiros em áreas não informadas?":"Does it lease or partner with third parties on undisclosed areas?",
"Há trabalho infantil, retenção de documentos, dívida com o empregador ou alojamento degradante?":"Is there child labor, document retention, debt bondage or degrading housing?",
"Os trabalhadores (inclusive safristas e operadores de máquinas) são registrados e usam EPIs?":"Are workers (including seasonal workers and machine operators) registered and using PPE?",
"Existe conflito com comunidades indígenas, quilombolas ou posseiros na área ou no entorno?":"Is there conflict with indigenous, quilombola or squatter communities in or around the area?",
"Assinou o termo de consentimento LGPD?":"Has it signed the LGPD consent form?",
"Desmatamento e EUDR":"Deforestation and EUDR","Direitos territoriais":"Land rights",
"Desmatamento após 31/12/2020 na área (PRODES / MapBiomas Alerta) — critério EUDR":"Deforestation after 31/12/2020 in the area (PRODES / MapBiomas Alerta) — EUDR criterion",
"Área na lista de não conformes da Moratória da Soja (bioma Amazônia, desmatamento após 2008)":"Area on the Soy Moratorium non-compliance list (Amazon biome, deforestation after 2008)",
"Sobreposição com Terra Indígena, quilombola ou Unidade de Conservação":"Overlap with indigenous, quilombola land or protected area",
"Conflito fundiário ou irregularidade de título/georreferenciamento (SIGEF/INCRA)":"Land conflict or title/geo-referencing irregularity (SIGEF/INCRA)",
"Mídia negativa (desmatamento, trabalho escravo, grilagem, fraude fiscal)":"Negative media (deforestation, slave labor, land grabbing, tax fraud)",
"Trading / exportadora":"Trading / exporter","Esmagadora (indústria)":"Crusher (industry)","Armazém / cerealista":"Warehouse / grain dealer","Revenda / originador":"Reseller / originator","Grupo agrícola":"Farming group",
"Foto da mercadoria / grãos":"Photo of goods / grain","Foto do silo / armazém":"Photo of silo / warehouse","Foto da lavoura / propriedade":"Photo of field / property","Laudo de classificação":"Grading report","Mapa / polígono da área":"Map / plot polygon",
"Paranaguá/PR (porto)":"Paranaguá/PR (port)","CBOT Chicago · soja em grão":"CBOT Chicago · soybeans","CBOT · farelo de soja":"CBOT · soybean meal","CBOT · óleo de soja":"CBOT · soybean oil",
"Origem e rastreabilidade até a fazenda, com polígono georreferenciado (EUDR)":"Origin and traceability to the farm, with geo-referenced polygon (EUDR)",
"Desmatamento zero após 31/12/2020 e cumprimento da Moratória da Soja":"Zero deforestation after 31/12/2020 and Soy Moratorium compliance",
"Respeito a Terras Indígenas, quilombolas, Unidades de Conservação e consulta prévia":"Respect for indigenous and quilombola lands, protected areas and prior consultation",
"Conformidade ambiental: CAR ativo, Reserva Legal e ausência de embargos":"Environmental compliance: active CAR, Legal Reserve and no embargoes",
"Anticorrupção (Lei 12.846/2013), veracidade das informações e rescisão por não conformidade grave":"Anti-corruption (Law 12,846/2013), truthful information and termination for serious non-compliance"
};

/* Fontes públicas específicas do setor */
const FONTES_EXTRA = [["Abiove · Moratória da Soja e relatórios", "https://abiove.org.br"], ["INPE TerraBrasilis · PRODES/DETER (desmatamento)", "https://terrabrasilis.dpi.inpe.br"], ["INCRA SIGEF · imóveis georreferenciados", "https://sigef.incra.gov.br"], ["Sistema Ipê · denúncia de trabalho escravo (MTE)", "https://ipe.sit.trabalho.gov.br"]];
/* Alertas do setor (notícias públicas) — [data, título, resumo, fonte] */
const SETOR_NEWS = [
[
"08/2025",
"Cade determina suspensão da Moratória da Soja",
"Superintendência do Cade considerou o pacto de 2006 anticoncorrencial; o tema passou a ser disputado na Justiça.",
"https://www.brasilagro.com.br/conteudo/-superintendencia-do-cade-determina-suspensao-da-moratoria-da-soja.html"
],
[
"25/08/2025",
"Justiça Federal suspende decisão do Cade",
"Liminar obtida pela Abiove restabeleceu a Moratória.",
"https://www.band.com.br/agro/noticias/liminar-suspende-decisao-do-cade-sobre-a-moratoria-da-soja-202508261055"
],
[
"2025",
"Cade aplica medida só a partir de 1º/01/2026",
"Plenário decidiu, por maioria, adiar a medida preventiva.",
"https://www.noticiasagricolas.com.br/noticia/408472"
],
[
"11/2025",
"STF suspende todos os processos sobre a Moratória da Soja",
"Decisão do ministro Flávio Dino, a pedido da Abiove, levada a referendo do plenário. Acompanhar o desfecho antes de usar comercialmente.",
"https://agenciabrasil.ebc.com.br/justica/noticia/2025-11/stf-suspende-todos-os-processos-do-pais-sobre-moratoria-da-soja"
]
];

/* Auditoria reforçada com base nos alertas do setor */
Q.N1.push({g:"Alertas do setor", items:[["n1_a1", "Mantém monitoramento de desmatamento (PRODES/DETER) de 100% das fazendas, independentemente do desfecho judicial da Moratória da Soja?", "nao", 4], ["n1_a2", "Compra soja de fazendas com polígono sobreposto a embargo, Terra Indígena ou Unidade de Conservação?", "sim", 5]]});
Q.N2.push({g:"Alertas do setor", items:[["n2_a1", "Recebe grãos de produtores sem polígono georreferenciado (exigido pela EUDR para exportar à União Europeia)?", "sim", 3]]});
Q.N3.push({g:"Alertas do setor", items:[["n3_a1", "Houve supressão de vegetação na fazenda após 22/07/2008 no bioma Amazônia ou após 31/12/2020 em qualquer bioma?", "sim", 4]]});
INSP.N1.push(...[["i_mor", "Lista de bloqueio (Moratória, embargos, lista suja) aplicada no sistema de compras"]]);
INSP.N3.push(...[["i_poly", "Polígono conferido em campo (pontos de GPS nos limites) e comparado com imagens de satélite"]]);
EV_TYPES.splice(Math.max(0, EV_TYPES.indexOf("Outro")), 0, ...["Análise de satélite (PRODES/DETER)", "Consulta de embargos (IBAMA/estado)"]);
/* [id, níveis, padrão de risco, procedimento, evidências exigidas, índice em SETOR_NEWS] */
const AUDIT_TESTS = [["t_mor", ["N1"], "Insegurança jurídica da Moratória da Soja (Cade, Justiça Federal e STF)", "Verificar se o protocolo de monitoramento segue ativo e documentado; registrar o status judicial na data do parecer.", ["Contrato", "Análise de satélite (PRODES/DETER)"], 3], ["t_sat", ["N3"], "Desmatamento após o marco de corte", "Comparar o polígono da fazenda com PRODES/DETER e MapBiomas Alerta e arquivar o relatório.", ["Mapa / polígono da área", "Análise de satélite (PRODES/DETER)"], 0], ["t_emb", ["N2", "N3"], "Áreas embargadas e lavagem de grãos", "Consultar embargos do IBAMA e do estado; conferir se o volume vendido é compatível com a área plantada.", ["Consulta de embargos (IBAMA/estado)", "Nota fiscal"], 1], ["t_eudr", ["N1", "N2"], "Exportação para a UE sem geolocalização", "Amostrar lotes exportados e verificar o polígono de cada fazenda de origem.", ["Romaneio / CT-e", "Mapa / polígono da área"], 2]];
/* Cláusula → [base legal de referência, o que verificar, essencial] */
const CLAUSE_INFO = {"c_origem": ["Regulamento (UE) 2023/1115 (EUDR); Lei 12.651/2012", "Polígono de cada fazenda e vínculo lote → fazenda", true], "c_desmat": ["Lei 12.651/2012; Decreto 6.514/2008, art. 54; Moratória da Soja (pacto setorial em discussão no STF)", "Marcos de 22/07/2008 (Moratória) e 31/12/2020 (EUDR); acompanhar a decisão do STF", true], "c_trab": ["CP art. 149; CF art. 7º, XXXIII; ECA; NR-31", "Consulta ao Cadastro de Empregadores (MTE)", true], "c_terr": ["CF art. 231; ADCT art. 68; Lei 9.985/2000 (SNUC); Convenção 169 da OIT", "Sobreposição com TI, territórios quilombolas e UCs (FUNAI, INCRA, ICMBio)", true], "c_amb": ["Lei 12.651/2012 (CAR e Reserva Legal); Lei 9.605/1998", "CAR ativo, Reserva Legal e ausência de embargos", true], "c_aud": ["CC arts. 421 e 422; Decreto 11.129/2022 (programa de integridade)", "Acesso a documentos, locais e trabalhadores, inclusive visitas sem aviso", false], "c_lgpd": ["Lei 13.709/2018 (LGPD)", "Base legal, finalidade, compartilhamento e prazo de guarda dos dados", false], "c_anti": ["Lei 12.846/2013; Decreto 11.129/2022", "Declaração de veracidade e rescisão imediata por não conformidade grave", true]};
Object.assign(EN_SEG, {"Alertas do setor": "Sector alerts", "Consulta à lista suja (print com data)": "Dirty list check (dated screenshot)", "Análise de satélite (PRODES/DETER)": "Satellite analysis (PRODES/DETER)", "Consulta de embargos (IBAMA/estado)": "Embargo check (IBAMA/state)", "Entrevista com trabalhadores (registro)": "Worker interview (record)", "Foto das áreas de vivência": "Photo of living quarters", "Mantém monitoramento de desmatamento (PRODES/DETER) de 100% das fazendas, independentemente do desfecho judicial da Moratória da Soja?": "Does it monitor deforestation (PRODES/DETER) on 100% of farms, regardless of the court outcome of the Soy Moratorium?", "Compra soja de fazendas com polígono sobreposto a embargo, Terra Indígena ou Unidade de Conservação?": "Does it buy soy from farms whose polygon overlaps an embargo, Indigenous Land or protected area?", "Recebe grãos de produtores sem polígono georreferenciado (exigido pela EUDR para exportar à União Europeia)?": "Does it receive grain from producers without a georeferenced polygon (required by the EUDR to export to the European Union)?", "Houve supressão de vegetação na fazenda após 22/07/2008 no bioma Amazônia ou após 31/12/2020 em qualquer bioma?": "Was vegetation cleared on the farm after 22/07/2008 in the Amazon biome or after 31/12/2020 in any biome?", "Lista de bloqueio (Moratória, embargos, lista suja) aplicada no sistema de compras": "Block list (Moratorium, embargoes, dirty list) applied in the purchasing system", "Polígono conferido em campo (pontos de GPS nos limites) e comparado com imagens de satélite": "Polygon verified in the field (GPS points on the boundaries) and compared with satellite images", "Insegurança jurídica da Moratória da Soja (Cade, Justiça Federal e STF)": "Legal uncertainty around the Soy Moratorium (CADE, Federal Courts and Supreme Court)", "Verificar se o protocolo de monitoramento segue ativo e documentado; registrar o status judicial na data do parecer.": "Check that the monitoring protocol is still active and documented; record the court status on the opinion date.", "Desmatamento após o marco de corte": "Deforestation after the cut-off date", "Comparar o polígono da fazenda com PRODES/DETER e MapBiomas Alerta e arquivar o relatório.": "Compare the farm polygon with PRODES/DETER and MapBiomas Alerta and keep the report.", "Áreas embargadas e lavagem de grãos": "Embargoed areas and grain laundering", "Consultar embargos do IBAMA e do estado; conferir se o volume vendido é compatível com a área plantada.": "Check IBAMA and state embargoes; verify that the volume sold matches the planted area.", "Exportação para a UE sem geolocalização": "Exports to the EU without geolocation", "Amostrar lotes exportados e verificar o polígono de cada fazenda de origem.": "Sample exported lots and check the polygon of each origin farm.", "Regulamento (UE) 2023/1115 (EUDR); Lei 12.651/2012": "Regulation (EU) 2023/1115 (EUDR); Law 12,651/2012 (Forest Code)", "Polígono de cada fazenda e vínculo lote → fazenda": "Polygon of each farm and lot → farm link", "Lei 12.651/2012; Decreto 6.514/2008, art. 54; Moratória da Soja (pacto setorial em discussão no STF)": "Law 12,651/2012; Decree 6,514/2008, art. 54; Soy Moratorium (sector pact under review by the Supreme Court)", "Marcos de 22/07/2008 (Moratória) e 31/12/2020 (EUDR); acompanhar a decisão do STF": "Cut-off dates 22/07/2008 (Moratorium) and 31/12/2020 (EUDR); follow the Supreme Court decision", "CP art. 149; CF art. 7º, XXXIII; ECA; NR-31": "Penal Code art. 149; Constitution art. 7, XXXIII; Child and Adolescent Statute; NR-31", "Consulta ao Cadastro de Empregadores (MTE)": "Check of the MTE Employers Register (dirty list)", "CF art. 231; ADCT art. 68; Lei 9.985/2000 (SNUC); Convenção 169 da OIT": "Constitution art. 231; ADCT art. 68; Law 9,985/2000 (SNUC); ILO Convention 169", "Sobreposição com TI, territórios quilombolas e UCs (FUNAI, INCRA, ICMBio)": "Overlap with Indigenous Lands, quilombola territories and protected areas (FUNAI, INCRA, ICMBio)", "Lei 12.651/2012 (CAR e Reserva Legal); Lei 9.605/1998": "Law 12,651/2012 (CAR and Legal Reserve); Law 9,605/1998 (Environmental Crimes)", "CAR ativo, Reserva Legal e ausência de embargos": "Active CAR, Legal Reserve and no embargoes", "CC arts. 421 e 422; Decreto 11.129/2022 (programa de integridade)": "Civil Code arts. 421 and 422; Decree 11,129/2022 (integrity program)", "Acesso a documentos, locais e trabalhadores, inclusive visitas sem aviso": "Access to documents, sites and workers, including unannounced visits", "Lei 13.709/2018 (LGPD)": "Law 13,709/2018 (LGPD)", "Base legal, finalidade, compartilhamento e prazo de guarda dos dados": "Legal basis, purpose, sharing and retention period of the data", "Lei 12.846/2013; Decreto 11.129/2022": "Law 12,846/2013 (Anti-Corruption); Decree 11,129/2022", "Declaração de veracidade e rescisão imediata por não conformidade grave": "Truthfulness statement and immediate termination for serious non-compliance"});
/* EN complementar */
Object.assign(EN_SEG, {"Estoque físico conciliado ao estoque declarado (silos e armazéns)":"Physical stock reconciled with declared stock (silos and warehouses)","Balança rodoviária com certificado IPEM/INMETRO e pesagem-teste realizada":"Truck scale with IPEM/INMETRO certificate and test weighing performed","Rastreio de lote: embarque ao cliente → armazém → fazenda (polígono)":"Lot tracing: shipment to client → warehouse → farm (polygon)","Sistema de monitoramento socioambiental testado com amostra de fornecedores":"Social and environmental monitoring system tested with a sample of suppliers","Condições de trabalho e segurança nas unidades":"Working conditions and safety at the units","Cartão CNPJ e inscrições estaduais":"CNPJ card and state registrations","Política de originação responsável / desmatamento zero":"Responsible sourcing / zero deforestation policy","Relatório de monitoramento socioambiental de fornecedores":"Supplier social and environmental monitoring report","Lista de fazendas de origem com polígonos (geojson/KML)":"List of origin farms with polygons (geojson/KML)","Contratos com armazéns e produtores":"Contracts with warehouses and producers","Notas fiscais de saída e conhecimentos de embarque":"Outgoing invoices and bills of lading","Relatório de sustentabilidade / inventário de emissões":"Sustainability report / emissions inventory","Certificações (RTRS, ProTerra, ISCC), se houver":"Certifications (RTRS, ProTerra, ISCC), if any","Recebimento, classificação e segregação de lotes efetivos":"Receipt, grading and segregation of actual lots","Volume movimentado compatível com a capacidade estática dos silos":"Volume handled consistent with the silos' static capacity","Armazenagem, aeração e segurança adequadas (NR-33/NR-35)":"Adequate storage, aeration and safety (NR-33/NR-35)","Condições de trabalho dos empregados":"Employees' working conditions","Cadastro SICARM/Conab do armazém":"Warehouse SICARM/Conab registration","Notas fiscais de saída":"Outgoing invoices","Tickets de pesagem e laudos de classificação":"Weighing tickets and grading reports","Existência da propriedade e sede confirmadas no local":"Property and headquarters confirmed on site","Área plantada compatível com o CAR e com imagens de satélite":"Planted area consistent with CAR and satellite images","Reserva Legal e APP preservadas, sem sinais de abertura recente":"Legal Reserve and permanent protection areas preserved, with no signs of recent clearing","Armazenamento de agrotóxicos e destinação de embalagens":"Pesticide storage and container disposal","Alojamentos, EPIs e condições de trabalho adequadas":"Adequate housing, PPE and working conditions","Ausência de menores trabalhando":"No minors working","Recibo do CAR e demonstrativo":"CAR receipt and statement","Matrícula do imóvel / certificação SIGEF":"Property title deed / SIGEF certification","Contratos de arrendamento ou parceria":"Lease or partnership agreements","Receituários agronômicos":"Agronomic prescriptions"});

/* operações comerciais: produto negociado (NCM aceitos, palavras-chave da descrição e item de demonstração) */
const OPS_PROD = {prod: "soja e derivados", ncm: ["1201", "1208", "1507", "2304"], kw: /soja|farelo|soy/i, demo: ["Soja em grãos", "12019000", "SC", 128]};

/* cotações automáticas (função agendada do Firebase): o que aparece na barra, praças ligadas e referência */
const COT_AUTO = {un: "sc", kg: 60, ref: "cepea_soja_paranagua", bar: [["cepea_soja_paranagua", "Paranaguá", "/sc"], ["cepea_soja_parana", "Paraná", "/sc"], ["dolar", "Dólar", ""]], br: {PR: "cepea_soja_paranagua"}, intl: {}, nota: "Soja: Indicadores CEPEA/ESALQ (R$ por saca de 60 kg)."};
