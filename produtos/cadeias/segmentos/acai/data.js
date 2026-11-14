/* ================= KinseyTec – Açaí · CONTEÚDO DA DILIGÊNCIA ================= */
/* Cliente contratante: ponto de partida do mapa (indústria de polpa, exportadora ou varejista). */
const CLIENTE_PADRAO = {nome:"Cliente contratante", local:"Indústria de polpa · Castanhal/PA", lat:-1.297, lng:-47.926};

/* Cotações: praças (R$ por lata de 14 kg), referências de exportação, histórico e fontes */
const PRACAS_BR = [["PA","Pará (média)"],["BEL","Belém · feira do açaí"],["IGM","Igarapé-Miri/PA"],["CAM","Cametá/PA"],["AP","Amapá (média)"],["AM","Amazonas (média)"],["PGPM","Preço mínimo Conab (PGPM-Bio, por kg)"]];
const INTL = [["FOB","Polpa congelada · exportação FOB","US$/kg"],["EUR","Polpa · mercado europeu","€/kg"]];
const PRECO = {bar:["PA","BEL","AP"], barLabel:{PA:"Pará",BEL:"Belém",AP:"Amapá"}, fonteEx:"Sedap-PA, Conab ou pesquisa de campo",
  hist:[["PA","PA"],["BEL","Belém"],["AP","AP"],["FOB","FOB"]],
  links:[["Conab · preços mínimos (PGPM-Bio)","https://www.conab.gov.br/precos-minimos"],["Sedap · Pará","https://www.sedap.pa.gov.br"],["IBGE · extração vegetal (PEVS)","https://www.ibge.gov.br/estatisticas/economicas/agricultura-e-pecuaria/9105-producao-da-extracao-vegetal-e-da-silvicultura.html"],["Comex Stat · exportações","https://comexstat.mdic.gov.br"]]};

/* Investigação (fontes públicas): id, rótulo, tipo, pontos, critério */
const INV = [
 ["divida","Dívida ativa (PGFN / estado / município)","sn",2,"Regularidade fiscal"],
 ["protestos","Protestos em cartório","sn",1,"Regularidade fiscal"],
 ["proc_trab","Processos trabalhistas relevantes","sn",2,"Condições de trabalho"],
 ["proc_crim","Processos criminais da empresa ou dos sócios","sn",3,"Integridade"],
 ["pep","Sócio ou administrador politicamente exposto (PEP / envolvimento político)","sn",2,"Integridade"],
 ["prisao","Sócio preso, denunciado ou sob investigação","sn",4,"Integridade"],
 ["rotat","Sócios abrem e fecham empresas rapidamente (CNPJs baixados ou inaptos nos últimos 3 anos)","num",3,"Perfil societário"],
 ["midia","Mídia negativa (trabalho infantil, contaminação, desmatamento, fraude)","sn",2,"Integridade"],
 ["mte","Cadastro de Empregadores do MTE (lista suja)","sn",6,"Condições de trabalho"],
 ["sanit","Interdição, apreensão ou autuação sanitária (Vigilância Sanitária, ADEPARÁ, MAPA)","sn",4,"Segurança do alimento"],
 ["ibama","Embargo ambiental (IBAMA / SEMAS)","sn",3,"Floresta e biodiversidade"],
 ["desmat","Supressão de floresta ou várzea para plantio após 2020 (PRODES / MapBiomas)","sn",4,"Floresta e biodiversidade"],
 ["ti_uc","Área em terra indígena, quilombola, RESEX ou UC sem acordo com a comunidade","sn",5,"Comunidades e território"],
 ["sisgen","Uso de patrimônio genético ou conhecimento tradicional sem cadastro no SisGen (Lei 13.123/2015)","sn",2,"Comunidades e território"]
];
const UF_CENTER = {AC:[-9.0,-70.5],AL:[-9.6,-36.6],AP:[1.4,-51.8],AM:[-4.2,-62.5],BA:[-13.5,-40.5],CE:[-5.2,-39.5],DF:[-15.8,-47.9],ES:[-19.5,-40.6],GO:[-16.0,-49.6],MA:[-5.0,-45.3],MT:[-12.6,-55.9],MS:[-20.5,-54.8],MG:[-18.5,-44.6],PA:[-3.8,-52.5],PB:[-7.1,-36.8],PR:[-24.6,-51.6],PE:[-8.4,-37.9],PI:[-7.4,-42.7],RJ:[-22.2,-42.7],RN:[-5.8,-36.6],RS:[-29.7,-53.3],RO:[-10.9,-62.8],RR:[2.0,-61.4],SC:[-27.3,-50.4],SP:[-22.3,-48.6],SE:[-10.6,-37.4],TO:[-10.2,-48.3]};

/* Questionário por nível: N1 indústria/exportadora · N2 batedor, entreposto ou intermediário · N3 extrativista/manejador */
const Q = {
 N1:[
  {g:"Identificação e societário", items:[
   ["n1_01","A empresa está ativa na Receita Federal e tem inscrição estadual regular em todos os estados onde opera?","nao"],
   ["n1_02","Algum sócio ou administrador participa, ou participou nos últimos 5 anos, de outra empresa de açaí hoje baixada ou inapta?","sim"],
   ["n1_03","Possui certidões negativas válidas (federal, estadual, municipal, FGTS e trabalhista)?","nao"],
   ["n1_04","Houve troca de CNPJ, cisão ou sucessão de empresas do grupo nos últimos 3 anos?","sim"]]},
  {g:"Segurança do alimento", items:[
   ["n1_05","A fábrica tem registro no MAPA, licença sanitária vigente e programa de Boas Práticas de Fabricação?","nao",3],
   ["n1_06","Faz branqueamento ou pasteurização de todo o fruto/polpa (prevenção da doença de Chagas)?","nao",4],
   ["n1_07","Mantém análises microbiológicas e laudos por lote, com rastreio até o fornecedor?","nao"],
   ["n1_08","Controla a cadeia fria (temperatura do fruto, polpa e transporte) com registros?","nao"],
   ["n1_09","Já teve produto recolhido, interditado ou apreendido por órgão sanitário?","sim",3],
   ["n1_10","Compra açaí de intermediários que não informam a comunidade ou a área de origem?","sim",3]]},
  {g:"Fornecedores N2 e N3", items:[
   ["n1_11","Entregou a lista de fornecedores N2/N3 da última safra (nome, CPF/CNPJ, município, comunidade, volume)?","nao"],
   ["n1_12","Tem contratos com cláusulas de trabalho infantil zero, boas práticas de manejo e preço justo?","nao"],
   ["n1_13","Faz visitas ou auditorias nas comunidades e batedores fornecedores?","nao"],
   ["n1_14","Paga fornecedores por meio bancário ou com recibo e nota fiscal de produtor?","nao"],
   ["n1_15","Compra açaí sem nota fiscal ou com nota de terceiros (“nota fria”)?","sim",3]]},
  {g:"Trabalho, comunidades e ESG", items:[
   ["n1_16","A empresa ou seus sócios constam, ou já constaram, no Cadastro de Empregadores do MTE (trabalho análogo ao de escravo)?","sim",5],
   ["n1_17","Tem política contra trabalho infantil na coleta (crianças subindo no açaizeiro) e monitora a cadeia?","nao",3],
   ["n1_18","Possui código de ética, política de direitos humanos e canal de denúncia em funcionamento?","nao"],
   ["n1_19","Possui certificações (orgânico, comércio justo, UEBT) ou programa com as comunidades fornecedoras?","nao",1],
   ["n1_20","Assinou o NDA e o termo LGPD autorizando o repasse das informações ao cliente contratante?","nao"]]}],
 N2:[
  {g:"Operação e higiene", items:[
   ["n2_01","Emite ou recebe nota fiscal em todas as compras de açaí?","nao"],
   ["n2_02","As vendas têm compras correspondentes (balanço de massa da safra fecha)?","nao",3],
   ["n2_03","O ponto de batimento ou entreposto tem licença sanitária e faz branqueamento do fruto?","nao",3],
   ["n2_04","Mantém o fruto e a polpa refrigerados e protegidos (rasas limpas, gelo, cobertura)?","nao"],
   ["n2_05","Registra a origem de cada lote (comunidade, extrativista e data da coleta)?","nao"]]},
  {g:"Origem e pagamentos", items:[
   ["n2_06","Entregou a lista de extrativistas e produtores (N3) com CPF, comunidade, município e volume?","nao"],
   ["n2_07","Mistura açaí de várias origens sem registro (impede a rastreabilidade)?","sim",2],
   ["n2_08","Paga ao extrativista pelo menos o preço mínimo (PGPM-Bio) e com recibo?","nao",2],
   ["n2_09","Compra de áreas em terra indígena, quilombola, RESEX ou UC sem acordo com a comunidade?","sim",4],
   ["n2_10","Adianta dinheiro ao extrativista e desconta na safra (risco de endividamento)?","sim",2]]},
  {g:"Trabalho e conformidade", items:[
   ["n2_11","Todos os trabalhadores (batedores, carregadores) estão formalmente contratados?","nao"],
   ["n2_12","Há crianças ou adolescentes trabalhando no batimento, carregamento ou coleta?","sim",5],
   ["n2_13","Assinou o NDA e o termo LGPD?","nao"]]}],
 N3:[
  {g:"Área e manejo", items:[
   ["n3_01","Possui inscrição de produtor rural, DAP/CAF ou cadastro na associação da comunidade?","nao"],
   ["n3_02","A área tem CAR ativo, ou está em território coletivo com autorização da comunidade?","nao"],
   ["n3_03","O açaizal é manejado sem derrubar a floresta (manejo de mínimo impacto)?","nao",3],
   ["n3_04","Houve derrubada de floresta ou várzea para plantio de açaí após 2020?","sim",4],
   ["n3_05","Existe embargo ambiental ou conflito de terra na área?","sim",3]]},
  {g:"Coleta e trabalho", items:[
   ["n3_06","Crianças ou adolescentes sobem no açaizeiro ou trabalham na coleta e no transporte das rasas?","sim",5],
   ["n3_07","Os coletores (peconheiros) usam equipamentos de proteção e há regras contra acidentes de queda?","nao",2],
   ["n3_08","Existe retenção de documentos, dívida com o comprador ou restrição de saída?","sim",5],
   ["n3_09","Os trabalhadores são da família, associados ou contratados formalmente (sem intermediários informais)?","nao"]]},
  {g:"Venda", items:[
   ["n3_10","Recebe o pagamento em seu nome, com recibo ou nota fiscal de produtor?","nao"],
   ["n3_11","O preço recebido por lata ficou próximo da cotação do dia e acima do preço mínimo?","nao"],
   ["n3_12","Assinou o termo de consentimento LGPD?","nao"]]}]
};

/* Checklist documental */
const DOCS = {
 N1:["Contrato social e alterações","Cartão CNPJ e inscrições estaduais","Certidões negativas (RFB/PGFN, SEFAZ, município, FGTS, CNDT)","Registro do estabelecimento no MAPA e licença sanitária","Manual e registros de Boas Práticas de Fabricação","Laudos microbiológicos e de branqueamento por lote","Contratos com o cliente contratante","Contratos com batedores, cooperativas e comunidades","Notas fiscais de entrada (amostra)","Notas fiscais de saída e registros de exportação","Política contra trabalho infantil e relatório de monitoramento","Certificações (orgânico, comércio justo, UEBT), se houver"],
 N2:["Cartão CNPJ ou CPF e inscrição estadual","Licença sanitária do ponto de batimento","Notas fiscais ou recibos de compra dos extrativistas","Notas fiscais de saída","Registro de origem por lote","Cadastro de extrativistas e comunidades","Comprovantes de pagamento","Registro de empregados (eSocial)"],
 N3:["Documento do extrativista ou produtor (CPF)","DAP/CAF ou declaração da associação","Recibo do CAR ou autorização do território coletivo","Plano ou declaração de manejo do açaizal","Comprovantes de venda e recebimento","Termo de consentimento LGPD"]
};

/* Inspeção física */
const INSP = {
 N1:[["i_est","Estoque de polpa congelada conciliado ao estoque declarado (câmaras frias)"],["i_bpf","Boas Práticas de Fabricação: higiene, branqueamento, pasteurização e temperatura"],["i_lote","Rastreio de lote: venda ao cliente → recebimento do fruto → batedor → comunidade"],["i_lab","Laudos e controle de qualidade por lote"],["i_trab","Condições de trabalho e segurança na fábrica"]],
 N2:[["i_hig","Higiene do batimento, branqueamento do fruto e refrigeração"],["i_cap","Volume batido compatível com a capacidade e com as compras registradas"],["i_lote","Lotes identificados até a comunidade de origem"],["i_men","Ausência de crianças e adolescentes no batimento e no transporte"],["i_trab","Condições de trabalho dos batedores e carregadores"]],
 N3:[["i_prop","Existência da área e da comunidade confirmada no local"],["i_man","Açaizal manejado sem derrubada de floresta"],["i_col","Coleta: idade dos peconheiros, EPIs e riscos de queda"],["i_trab","Condições de moradia, água e trabalho adequadas"],["i_men","Ausência de crianças subindo no açaizeiro"],["i_preco","Preço pago ao extrativista e forma de pagamento"]]
};

const EV_TYPES = ["Foto do fruto / rasas","Foto do batimento / fábrica","Foto da balança","Foto do açaizal / comunidade","Nota fiscal","Recibo de compra","Contrato","Laudo sanitário / microbiológico","Romaneio / CT-e","Recibo do CAR","Comprovante de pagamento","Registro de empregados","Outro"];
const PHOTO_TYPES = ["Foto do fruto / rasas","Foto do batimento / fábrica","Foto da balança","Foto do açaizal / comunidade"];

const SUP_TYPES = {N1:["Indústria de polpa","Exportadora","Distribuidora"],N2:["Batedor / ponto de batimento","Entreposto","Cooperativa / associação","Intermediário (atravessador)"],N3:["Extrativista / ribeirinho","Comunidade / associação","Produtor de açaí manejado"]};
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
/* Produtividade média de referência (kg de fruto/ha) — valores iniciais a calibrar com o cliente */
const PROD_REF = {PA:6000, AP:5000, AM:4000, MA:4000, AC:3500, RO:3500};

/* Municípios produtores e polos — coordenadas aproximadas da sede */
const MUNI = [
 ["Igarapé-Miri","PA",-1.976,-48.960],["Cametá","PA",-2.244,-49.496],["Abaetetuba","PA",-1.722,-48.882],["Limoeiro do Ajuru","PA",-1.898,-49.389],["Ponta de Pedras","PA",-1.390,-48.871],["Muaná","PA",-1.528,-49.217],["São Sebastião da Boa Vista","PA",-1.716,-49.541],["Breves","PA",-1.682,-50.480],["Oeiras do Pará","PA",-2.003,-49.854],["Mocajuba","PA",-2.584,-49.507],["Tomé-Açu","PA",-2.418,-48.152],["Belém","PA",-1.456,-48.490],["Castanhal","PA",-1.297,-47.926],["Barcarena","PA",-1.506,-48.625],["Bragança","PA",-1.054,-46.766],
 ["Macapá","AP",0.034,-51.069],["Santana","AP",-0.058,-51.181],["Mazagão","AP",-0.115,-51.289],
 ["Codajás","AM",-3.837,-62.057],["Coari","AM",-4.085,-63.141],["Manaus","AM",-3.119,-60.022],
 ["São Luís","MA",-2.530,-44.300],["Feijó","AC",-8.164,-70.354],["Santos","SP",-23.961,-46.333],["São Paulo","SP",-23.550,-46.633]
];

const CLAUSES = [
 ["c_origem","Origem e rastreabilidade do açaí até a comunidade ou área de manejo"],
 ["c_inf","Proibição de trabalho infantil na coleta, no batimento e no transporte (Decreto 6.481/2008 – Lista TIP)"],
 ["c_trab","Proibição de trabalho análogo ao escravo e de endividamento do extrativista"],
 ["c_sanit","Segurança do alimento: branqueamento, Boas Práticas e cadeia fria"],
 ["c_amb","Manejo sem derrubada de floresta e respeito a territórios tradicionais"],
 ["c_preco","Preço justo, ao menos o preço mínimo (PGPM-Bio), pago ao extrativista com recibo"],
 ["c_aud","Direito de auditoria e inspeção pelo cliente contratante ou terceiro independente"],
 ["c_lgpd","Confidencialidade, LGPD, anticorrupção (Lei 12.846/2013) e rescisão por não conformidade grave"]
];

const NDA_VERSION = "minuta v0.1 — para avaliação jurídica";
const NDA_TEXT = [
 ["1. Partes e objeto","Este termo é celebrado entre a Kinsey Allen Brasil Auditoria e Consultoria Ltda. (\"Kinsey BR\") e o fornecedor identificado abaixo, no âmbito da due diligence da cadeia do açaí contratada pelo cliente contratante da Kinsey BR."],
 ["2. Confidencialidade","A Kinsey BR manterá sigilo sobre as informações comerciais, fiscais e operacionais recebidas e as usará somente para a diligência. O fornecedor autoriza o repasse dos resultados e das evidências ao cliente contratante, que se obriga ao mesmo sigilo."],
 ["3. Dados pessoais tratados (LGPD, Lei 13.709/2018)","Nome, CPF, cargo, contato e assinatura de responsáveis, extrativistas e produtores; comunidade, endereços e coordenadas dos locais de coleta, batimento e estoque; fotografias com data e geolocalização; dados de contratação de trabalhadores, sem dados sensíveis."],
 ["4. Finalidade e base legal","Verificar a existência das mercadorias, a realidade das transações, a segurança do alimento e a origem lícita do açaí, sem trabalho infantil ou escravo e sem destruição da floresta. Bases legais: cumprimento de obrigação legal ou regulatória (art. 7º, II), exercício regular de direitos em contrato (art. 7º, VI) e legítimo interesse (art. 7º, IX)."],
 ["5. Compartilhamento","O cliente contratante (controlador destinatário dos resultados), advogados e auditores da Kinsey BR e provedores de hospedagem do aplicativo, sob contrato de confidencialidade. Consultas a bases públicas (Receita Federal, SEFAZ, SICAR, IBAMA, MTE, órgãos sanitários, tribunais)."],
 ["6. Retenção e segurança","Os dados ficam guardados pelo prazo da diligência e pelo período exigido pelas normas de auditoria (mínimo de 5 anos), com acesso restrito e registro de quem consultou."],
 ["7. Direitos do titular","Confirmação, acesso, correção, anonimização, portabilidade, informação sobre compartilhamento e revogação do consentimento (art. 18), pelo canal do Encarregado (DPO) da Kinsey BR."],
 ["8. Declaração de veracidade","O fornecedor declara que as informações, documentos e fotos enviados são verdadeiros e correspondem à realidade da operação, ciente de que divergências serão registradas como achado de risco."]
];

/* Traduções (EN) do conteúdo do segmento */
const EN_SEG = {
"Identificação e societário":"Identification and ownership","Segurança do alimento":"Food safety","Fornecedores N2 e N3":"N2 and N3 suppliers","Trabalho, comunidades e ESG":"Labor, communities and ESG","Operação e higiene":"Operations and hygiene","Origem e pagamentos":"Origin and payments","Trabalho e conformidade":"Labor and compliance","Área e manejo":"Area and management","Coleta e trabalho":"Harvesting and labor","Venda":"Sale",
"Floresta e biodiversidade":"Forest and biodiversity","Comunidades e território":"Communities and territory",
"A empresa está ativa na Receita Federal e tem inscrição estadual regular em todos os estados onde opera?":"Is the company active with the Federal Revenue Service and does it hold regular state registrations wherever it operates?",
"Algum sócio ou administrador participa, ou participou nos últimos 5 anos, de outra empresa de açaí hoje baixada ou inapta?":"Does any partner or officer hold, or has held in the last 5 years, a stake in another açaí company now closed or unfit?",
"Possui certidões negativas válidas (federal, estadual, municipal, FGTS e trabalhista)?":"Does it hold valid clearance certificates (federal, state, municipal, FGTS and labor)?",
"Houve troca de CNPJ, cisão ou sucessão de empresas do grupo nos últimos 3 anos?":"Has there been a change of tax ID, spin-off or succession of group companies in the last 3 years?",
"A fábrica tem registro no MAPA, licença sanitária vigente e programa de Boas Práticas de Fabricação?":"Is the plant registered with the Agriculture Ministry, with a valid sanitary license and a Good Manufacturing Practices program?",
"Faz branqueamento ou pasteurização de todo o fruto/polpa (prevenção da doença de Chagas)?":"Does it blanch or pasteurize all fruit/pulp (Chagas disease prevention)?",
"Mantém análises microbiológicas e laudos por lote, com rastreio até o fornecedor?":"Does it keep microbiological tests and reports per lot, traceable to the supplier?",
"Controla a cadeia fria (temperatura do fruto, polpa e transporte) com registros?":"Does it control the cold chain (fruit, pulp and transport temperature) with records?",
"Já teve produto recolhido, interditado ou apreendido por órgão sanitário?":"Has any product been recalled, banned or seized by a health authority?",
"Compra açaí de intermediários que não informam a comunidade ou a área de origem?":"Does it buy açaí from middlemen who do not disclose the community or area of origin?",
"Entregou a lista de fornecedores N2/N3 da última safra (nome, CPF/CNPJ, município, comunidade, volume)?":"Has it delivered the N2/N3 supplier list for the last harvest (name, tax ID, municipality, community, volume)?",
"Tem contratos com cláusulas de trabalho infantil zero, boas práticas de manejo e preço justo?":"Does it have contracts with zero child labor, good management practices and fair price clauses?",
"Faz visitas ou auditorias nas comunidades e batedores fornecedores?":"Does it visit or audit supplying communities and pulpers?",
"Paga fornecedores por meio bancário ou com recibo e nota fiscal de produtor?":"Does it pay suppliers by bank transfer or with a receipt and producer invoice?",
"Compra açaí sem nota fiscal ou com nota de terceiros (“nota fria”)?":"Does it buy açaí without an invoice or with third-party (“cold”) invoices?",
"A empresa ou seus sócios constam, ou já constaram, no Cadastro de Empregadores do MTE (trabalho análogo ao de escravo)?":"Are the company or its partners, or have they ever been, on the Labor Ministry's Employers Register (slave-like labor)?",
"Tem política contra trabalho infantil na coleta (crianças subindo no açaizeiro) e monitora a cadeia?":"Does it have a policy against child labor in harvesting (children climbing açaí palms) and monitor the chain?",
"Possui código de ética, política de direitos humanos e canal de denúncia em funcionamento?":"Does it have a code of ethics, a human rights policy and a working whistleblower channel?",
"Possui certificações (orgânico, comércio justo, UEBT) ou programa com as comunidades fornecedoras?":"Does it hold certifications (organic, fair trade, UEBT) or run a program with supplying communities?",
"Assinou o NDA e o termo LGPD autorizando o repasse das informações ao cliente contratante?":"Has it signed the NDA and LGPD consent authorizing sharing with the contracting client?",
"Emite ou recebe nota fiscal em todas as compras de açaí?":"Does it issue or receive an invoice for every açaí purchase?",
"As vendas têm compras correspondentes (balanço de massa da safra fecha)?":"Do sales match purchases (does the harvest mass balance close)?",
"O ponto de batimento ou entreposto tem licença sanitária e faz branqueamento do fruto?":"Does the pulping point or depot hold a sanitary license and blanch the fruit?",
"Mantém o fruto e a polpa refrigerados e protegidos (rasas limpas, gelo, cobertura)?":"Does it keep fruit and pulp chilled and protected (clean baskets, ice, cover)?",
"Registra a origem de cada lote (comunidade, extrativista e data da coleta)?":"Does it record the origin of each lot (community, harvester and harvest date)?",
"Entregou a lista de extrativistas e produtores (N3) com CPF, comunidade, município e volume?":"Has it delivered the list of harvesters and producers (N3) with tax ID, community, municipality and volume?",
"Mistura açaí de várias origens sem registro (impede a rastreabilidade)?":"Does it mix açaí from several origins without records (preventing traceability)?",
"Paga ao extrativista pelo menos o preço mínimo (PGPM-Bio) e com recibo?":"Does it pay harvesters at least the minimum price (PGPM-Bio) with a receipt?",
"Compra de áreas em terra indígena, quilombola, RESEX ou UC sem acordo com a comunidade?":"Does it buy from indigenous, quilombola, extractive reserve or protected areas without the community's agreement?",
"Adianta dinheiro ao extrativista e desconta na safra (risco de endividamento)?":"Does it advance money to harvesters and deduct it at harvest (debt-bondage risk)?",
"Todos os trabalhadores (batedores, carregadores) estão formalmente contratados?":"Are all workers (pulpers, porters) formally hired?",
"Há crianças ou adolescentes trabalhando no batimento, carregamento ou coleta?":"Are children or adolescents working in pulping, loading or harvesting?",
"Assinou o NDA e o termo LGPD?":"Has it signed the NDA and LGPD consent?",
"Possui inscrição de produtor rural, DAP/CAF ou cadastro na associação da comunidade?":"Does it hold a rural producer registration, DAP/CAF or community association membership?",
"A área tem CAR ativo, ou está em território coletivo com autorização da comunidade?":"Does the area have an active CAR, or is it collective territory with the community's authorization?",
"O açaizal é manejado sem derrubar a floresta (manejo de mínimo impacto)?":"Is the açaí stand managed without clearing the forest (low-impact management)?",
"Houve derrubada de floresta ou várzea para plantio de açaí após 2020?":"Was forest or floodplain cleared to plant açaí after 2020?",
"Existe embargo ambiental ou conflito de terra na área?":"Is there an environmental embargo or land conflict in the area?",
"Crianças ou adolescentes sobem no açaizeiro ou trabalham na coleta e no transporte das rasas?":"Do children or adolescents climb açaí palms or work in harvesting and carrying baskets?",
"Os coletores (peconheiros) usam equipamentos de proteção e há regras contra acidentes de queda?":"Do climbers (peconheiros) use protective equipment and are there rules against falls?",
"Existe retenção de documentos, dívida com o comprador ou restrição de saída?":"Is there document retention, debt to the buyer or restriction on leaving?",
"Os trabalhadores são da família, associados ou contratados formalmente (sem intermediários informais)?":"Are workers family members, association members or formally hired (no informal intermediaries)?",
"Recebe o pagamento em seu nome, com recibo ou nota fiscal de produtor?":"Does it receive payment in its own name, with a receipt or producer invoice?",
"O preço recebido por lata ficou próximo da cotação do dia e acima do preço mínimo?":"Was the price per can close to the day's quote and above the minimum price?",
"Assinou o termo de consentimento LGPD?":"Has it signed the LGPD consent form?",
"Interdição, apreensão ou autuação sanitária (Vigilância Sanitária, ADEPARÁ, MAPA)":"Sanitary ban, seizure or fine (Health Surveillance, ADEPARÁ, Agriculture Ministry)",
"Supressão de floresta ou várzea para plantio após 2020 (PRODES / MapBiomas)":"Forest or floodplain clearing for planting after 2020 (PRODES / MapBiomas)",
"Área em terra indígena, quilombola, RESEX ou UC sem acordo com a comunidade":"Area in indigenous, quilombola, extractive reserve or protected land without community agreement",
"Uso de patrimônio genético ou conhecimento tradicional sem cadastro no SisGen (Lei 13.123/2015)":"Use of genetic heritage or traditional knowledge without SisGen registration (Law 13,123/2015)",
"Mídia negativa (trabalho infantil, contaminação, desmatamento, fraude)":"Negative media (child labor, contamination, deforestation, fraud)",
"Indústria de polpa":"Pulp processor","Exportadora":"Exporter","Distribuidora":"Distributor","Batedor / ponto de batimento":"Pulper / pulping point","Entreposto":"Depot","Cooperativa / associação":"Cooperative / association","Intermediário (atravessador)":"Middleman","Extrativista / ribeirinho":"Harvester / riverside dweller","Comunidade / associação":"Community / association","Produtor de açaí manejado":"Managed açaí producer",
"Foto do fruto / rasas":"Photo of fruit / baskets","Foto do batimento / fábrica":"Photo of pulping / plant","Foto do açaizal / comunidade":"Photo of açaí stand / community","Recibo de compra":"Purchase receipt","Laudo sanitário / microbiológico":"Sanitary / microbiological report",
"Belém · feira do açaí":"Belém · açaí market","Preço mínimo Conab (PGPM-Bio, por kg)":"Conab minimum price (PGPM-Bio, per kg)","Polpa congelada · exportação FOB":"Frozen pulp · FOB export","Polpa · mercado europeu":"Pulp · European market",
"Origem e rastreabilidade do açaí até a comunidade ou área de manejo":"Origin and traceability of açaí to the community or managed area",
"Proibição de trabalho infantil na coleta, no batimento e no transporte (Decreto 6.481/2008 – Lista TIP)":"Ban on child labor in harvesting, pulping and transport (Decree 6,481/2008 – worst forms list)",
"Proibição de trabalho análogo ao escravo e de endividamento do extrativista":"Ban on slave-like labor and harvester debt bondage",
"Segurança do alimento: branqueamento, Boas Práticas e cadeia fria":"Food safety: blanching, Good Practices and cold chain",
"Manejo sem derrubada de floresta e respeito a territórios tradicionais":"Management without forest clearing and respect for traditional territories",
"Preço justo, ao menos o preço mínimo (PGPM-Bio), pago ao extrativista com recibo":"Fair price, at least the minimum price (PGPM-Bio), paid to the harvester with a receipt",
"Direito de auditoria e inspeção pelo cliente contratante ou terceiro independente":"Audit and inspection rights for the contracting client or an independent third party",
"Confidencialidade, LGPD, anticorrupção (Lei 12.846/2013) e rescisão por não conformidade grave":"Confidentiality, LGPD, anti-corruption (Law 12,846/2013) and termination for serious non-compliance"
};

/* Fontes públicas específicas do setor */
const FONTES_EXTRA = [["Adepará · defesa agropecuária (Pará)", "https://www.adepara.pa.gov.br"], ["Sistema Ipê · denúncia de trabalho escravo (MTE)", "https://ipe.sit.trabalho.gov.br"], ["SisGen · patrimônio genético e conhecimento tradicional", "https://sisgen.gov.br"], ["Conab · preços mínimos (PGPM-Bio)", "https://www.conab.gov.br/precos-minimos"]];
/* Alertas do setor (notícias públicas) — [data, título, resumo, fonte] */
const SETOR_NEWS = [
[
"07/2023",
"Fiscalização encontra trabalho infantil na colheita do açaí no Baixo Tocantins",
"Operação com MTE, MPT, PRF e Polícia Civil; cadeia na mira da fiscalização durante a safra.",
"https://www.brasildefato.com.br/2023/08/06/com-flagrantes-de-trabalho-infantil-cadeia-produtiva-do-acai-fica-na-mira-da-fiscalizacao-ate-o-final-da-colheita"
],
[
"07/2024",
"Trabalho infantil e lacunas de rastreabilidade na cadeia do açaí",
"Análise aponta falta de dados oficiais e subnotificação do trabalho infantil.",
"https://ihu.unisinos.br/641306-trabalho-infantil-e-impactos-socioeconomicos-a-realidade-da-colheita-do-acai-no-para"
],
[
"10/2026",
"MPT no Pará e Amapá: atuação com prefeituras contra o trabalho infantil no açaí",
"Procuradoria destaca riscos de saúde e segurança na colheita e novas tecnologias que reduzem riscos.",
"https://www.oliberal.com/economia/colheita-do-acai-no-para-novas-tecnologias-reduzem-riscos-e-aumentam-eficiencia-1.848382"
],
[
"10/2022",
"Direitos humanos na cadeia do açaí",
"Webinar do Instituto Peabiru sobre condições de trabalho dos peconheiros.",
"https://peabiru.org.br/wp-content/uploads/2022/10/221021_ApresentacaoWebinar_DireitosHumanosNoAcai.pptx.pdf"
]
];

/* Auditoria reforçada com base nos alertas do setor */
Q.N1.push({g:"Alertas do setor", items:[["n1_a1", "Compra açaí do Baixo Tocantins ou do Marajó sem visitas durante a safra?", "sim", 3], ["n1_a2", "Exige dos intermediários (marreteiros) a identificação da comunidade e do extrativista de cada rasa?", "nao", 3]]});
Q.N2.push({g:"Alertas do setor", items:[["n2_a1", "Usa adolescentes no transporte, na debulha ou no batimento?", "sim", 5]]});
Q.N3.push({g:"Alertas do setor", items:[["n3_a1", "Crianças ou adolescentes sobem nas palmeiras (peconha) ou carregam rasas?", "sim", 5], ["n3_a2", "O extrativista recebe ao menos o preço mínimo e tem recibo de cada venda?", "nao", 3]]});
INSP.N1.push(...[["i_rasa", "Rasas identificadas por comunidade e extrativista no recebimento"]]);
INSP.N3.push(...[["i_pec", "Coleta acompanhada: ausência de menores na escalada e uso de equipamento de proteção"]]);
EV_TYPES.splice(Math.max(0, EV_TYPES.indexOf("Outro")), 0, ...["Ficha de origem da rasa", "Foto da coleta (peconheiros)"]);
PHOTO_TYPES.push(...["Foto da coleta (peconheiros)"]);
/* [id, níveis, padrão de risco, procedimento, evidências exigidas, índice em SETOR_NEWS] */
const AUDIT_TESTS = [["t_inf", ["N2", "N3"], "Trabalho infantil na colheita e no transporte", "Visita sem aviso na safra; entrevistar famílias; registrar quem escala e quem transporta.", ["Foto da coleta (peconheiros)"], 0], ["t_orig", ["N1", "N2"], "Falta de dados e de rastreabilidade", "Rastrear as rasas recebidas até a comunidade, com ficha de origem e recibo.", ["Ficha de origem da rasa", "Recibo de compra"], 1], ["t_seg", ["N3"], "Quedas e acidentes na escalada", "Verificar o uso de equipamento e de técnicas mais seguras e registrar acidentes.", ["Foto da coleta (peconheiros)"], 2], ["t_preco", ["N3"], "Preço abaixo do mínimo e endividamento", "Comparar os recibos com o preço mínimo da Conab (PGPM-Bio) e verificar adiantamentos.", ["Recibo de compra", "Comprovante de pagamento"], 3]];
/* Cláusula → [base legal de referência, o que verificar, essencial] */
const CLAUSE_INFO = {"c_origem": ["Lei 13.123/2015 (biodiversidade, quando aplicável); normas sanitárias estaduais", "Comunidade ou área de manejo e extrativista de cada lote", true], "c_inf": ["CF art. 7º, XXXIII; ECA; Decreto 6.481/2008 (Lista TIP)", "Vedação de menores de 18 anos na escalada, no transporte e no batimento", true], "c_trab": ["CP art. 149", "Ausência de servidão por dívida (aviamento) e de retenção de pagamentos", true], "c_sanit": ["RDC Anvisa 275/2002 (Boas Práticas); normas sanitárias estaduais (branqueamento)", "Branqueamento, controle de temperatura e laudos microbiológicos", true], "c_amb": ["Lei 12.651/2012; CF art. 231; Convenção 169 da OIT", "Manejo sem derrubada e consulta às comunidades tradicionais", false], "c_preco": ["Lei 8.427/1992; PGPM-Bio (Conab)", "Preço igual ou superior ao mínimo, com recibo", false], "c_aud": ["CC arts. 421 e 422; Decreto 11.129/2022 (programa de integridade)", "Acesso a documentos, locais e trabalhadores, inclusive visitas sem aviso", false], "c_lgpd": ["Lei 13.709/2018; Lei 12.846/2013; CC arts. 474 e 475", "Tratamento de dados, integridade e rescisão por não conformidade grave", true]};
Object.assign(EN_SEG, {"Alertas do setor": "Sector alerts", "Consulta à lista suja (print com data)": "Dirty list check (dated screenshot)", "Análise de satélite (PRODES/DETER)": "Satellite analysis (PRODES/DETER)", "Consulta de embargos (IBAMA/estado)": "Embargo check (IBAMA/state)", "Entrevista com trabalhadores (registro)": "Worker interview (record)", "Foto das áreas de vivência": "Photo of living quarters", "Compra açaí do Baixo Tocantins ou do Marajó sem visitas durante a safra?": "Does it buy açaí from the Lower Tocantins or Marajó without visits during the harvest?", "Exige dos intermediários (marreteiros) a identificação da comunidade e do extrativista de cada rasa?": "Does it require middlemen to identify the community and the harvester of each basket?", "Usa adolescentes no transporte, na debulha ou no batimento?": "Does it use adolescents in transport, threshing or pulping?", "Crianças ou adolescentes sobem nas palmeiras (peconha) ou carregam rasas?": "Do children or adolescents climb palm trees or carry baskets?", "O extrativista recebe ao menos o preço mínimo e tem recibo de cada venda?": "Does the harvester receive at least the minimum price and a receipt for each sale?", "Rasas identificadas por comunidade e extrativista no recebimento": "Baskets identified by community and harvester on receipt", "Coleta acompanhada: ausência de menores na escalada e uso de equipamento de proteção": "Harvest observed: no minors climbing and use of protective equipment", "Trabalho infantil na colheita e no transporte": "Child labor in harvesting and transport", "Visita sem aviso na safra; entrevistar famílias; registrar quem escala e quem transporta.": "Unannounced visit during harvest; interview families; record who climbs and who carries.", "Falta de dados e de rastreabilidade": "Lack of data and traceability", "Rastrear as rasas recebidas até a comunidade, com ficha de origem e recibo.": "Trace received baskets back to the community, with origin form and receipt.", "Quedas e acidentes na escalada": "Falls and accidents while climbing", "Verificar o uso de equipamento e de técnicas mais seguras e registrar acidentes.": "Check the use of equipment and safer techniques and record accidents.", "Preço abaixo do mínimo e endividamento": "Price below the minimum and debt bondage", "Comparar os recibos com o preço mínimo da Conab (PGPM-Bio) e verificar adiantamentos.": "Compare receipts with the Conab minimum price (PGPM-Bio) and check advances.", "Lei 13.123/2015 (biodiversidade, quando aplicável); normas sanitárias estaduais": "Law 13,123/2015 (biodiversity, where applicable); state health rules", "Comunidade ou área de manejo e extrativista de cada lote": "Community or management area and harvester of each lot", "CF art. 7º, XXXIII; ECA; Decreto 6.481/2008 (Lista TIP)": "Constitution art. 7, XXXIII; Child and Adolescent Statute; Decree 6,481/2008 (TIP List)", "Vedação de menores de 18 anos na escalada, no transporte e no batimento": "Ban on minors under 18 climbing, carrying and pulping", "CP art. 149": "Penal Code art. 149", "Ausência de servidão por dívida (aviamento) e de retenção de pagamentos": "No debt bondage (aviamento) and no withholding of payments", "RDC Anvisa 275/2002 (Boas Práticas); normas sanitárias estaduais (branqueamento)": "Anvisa RDC 275/2002 (Good Practices); state health rules (blanching)", "Branqueamento, controle de temperatura e laudos microbiológicos": "Blanching, temperature control and microbiological reports", "Lei 12.651/2012; CF art. 231; Convenção 169 da OIT": "Law 12,651/2012; Constitution art. 231; ILO Convention 169", "Manejo sem derrubada e consulta às comunidades tradicionais": "Management without clearing and consultation of traditional communities", "Lei 8.427/1992; PGPM-Bio (Conab)": "Law 8,427/1992; PGPM-Bio (Conab)", "Preço igual ou superior ao mínimo, com recibo": "Price at or above the minimum, with receipt", "CC arts. 421 e 422; Decreto 11.129/2022 (programa de integridade)": "Civil Code arts. 421 and 422; Decree 11,129/2022 (integrity program)", "Acesso a documentos, locais e trabalhadores, inclusive visitas sem aviso": "Access to documents, sites and workers, including unannounced visits", "Lei 13.709/2018; Lei 12.846/2013; CC arts. 474 e 475": "Law 13,709/2018 (LGPD); Law 12,846/2013; Civil Code arts. 474 and 475", "Tratamento de dados, integridade e rescisão por não conformidade grave": "Data processing, integrity and termination for serious non-compliance", "Foto da coleta (peconheiros)": "Photo of the harvest (climbers)", "Ficha de origem da rasa": "Basket origin form"});
/* EN complementar */
Object.assign(EN_SEG, {"Estoque de polpa congelada conciliado ao estoque declarado (câmaras frias)":"Frozen pulp stock reconciled with declared stock (cold rooms)","Boas Práticas de Fabricação: higiene, branqueamento, pasteurização e temperatura":"Good Manufacturing Practices: hygiene, blanching, pasteurization and temperature","Rastreio de lote: venda ao cliente → recebimento do fruto → batedor → comunidade":"Lot tracing: sale to client → fruit receipt → pulper → community","Laudos e controle de qualidade por lote":"Quality reports and control per lot","Condições de trabalho e segurança na fábrica":"Working conditions and safety at the plant","Cartão CNPJ e inscrições estaduais":"CNPJ card and state registrations","Registro do estabelecimento no MAPA e licença sanitária":"MAPA establishment registration and health license","Manual e registros de Boas Práticas de Fabricação":"Good Manufacturing Practices manual and records","Laudos microbiológicos e de branqueamento por lote":"Microbiological and blanching reports per lot","Contratos com batedores, cooperativas e comunidades":"Contracts with pulpers, cooperatives and communities","Notas fiscais de saída e registros de exportação":"Outgoing invoices and export records","Política contra trabalho infantil e relatório de monitoramento":"Child labor policy and monitoring report","Certificações (orgânico, comércio justo, UEBT), se houver":"Certifications (organic, fair trade, UEBT), if any","Higiene do batimento, branqueamento do fruto e refrigeração":"Pulping hygiene, fruit blanching and refrigeration","Volume batido compatível com a capacidade e com as compras registradas":"Pulped volume consistent with capacity and recorded purchases","Lotes identificados até a comunidade de origem":"Lots identified back to the origin community","Ausência de crianças e adolescentes no batimento e no transporte":"No children or adolescents in pulping or transport","Condições de trabalho dos batedores e carregadores":"Working conditions of pulpers and carriers","Cartão CNPJ ou CPF e inscrição estadual":"CNPJ card or CPF and state registration","Licença sanitária do ponto de batimento":"Health license of the pulping point","Notas fiscais ou recibos de compra dos extrativistas":"Invoices or purchase receipts from harvesters","Notas fiscais de saída":"Outgoing invoices","Registro de origem por lote":"Origin record per lot","Cadastro de extrativistas e comunidades":"Register of harvesters and communities","Existência da área e da comunidade confirmada no local":"Area and community confirmed on site","Açaizal manejado sem derrubada de floresta":"Açaí grove managed without forest clearing","Coleta: idade dos peconheiros, EPIs e riscos de queda":"Harvest: climbers' age, PPE and fall risks","Condições de moradia, água e trabalho adequadas":"Adequate housing, water and working conditions","Ausência de crianças subindo no açaizeiro":"No children climbing açaí palms","Preço pago ao extrativista e forma de pagamento":"Price paid to the harvester and payment method","Documento do extrativista ou produtor (CPF)":"Harvester or producer ID (CPF)","DAP/CAF ou declaração da associação":"DAP/CAF or association statement","Recibo do CAR ou autorização do território coletivo":"CAR receipt or collective territory authorization","Plano ou declaração de manejo do açaizal":"Açaí grove management plan or statement"});

/* operações comerciais: produto negociado (NCM aceitos, palavras-chave da descrição e item de demonstração) */
const OPS_PROD = {prod: "açaí e derivados", ncm: ["0810", "0811", "0812", "2008", "2009", "2106"], kw: /a[çc]a[íi]|polpa|euterpe/i, demo: ["Açaí fruto in natura", "08109000", "KG", 4.2]};

/* cotações automáticas (função agendada do Firebase): o que aparece na barra, praças ligadas e referência */
const COT_AUTO = {un: "lata", kg: 14, ref: null, bar: [["dolar", "Dólar", ""]], br: {}, intl: {}, nota: "Açaí: não há cotação pública diária; registre o preço das praças manualmente (Sedap-PA, Conab ou compradores)."};
