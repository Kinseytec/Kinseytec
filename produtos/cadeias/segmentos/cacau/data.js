/* ================= CONTEÚDO DA DILIGÊNCIA ================= */
/* Cliente contratante: ponto de partida do mapa e da cadeia. O administrador altera em Usuários → Cliente contratante. */
const CLIENTE_PADRAO = {nome:"Cliente contratante", local:"Ilhéus/BA", lat:-14.80, lng:-39.06};
function CLI(){ const c = (typeof S !== "undefined" && S.config && S.config.cliente) || {}; const lat = parseFloat(c.lat), lng = parseFloat(c.lng);
  return {nome:(c.nome||"").trim() || CLIENTE_PADRAO.nome, doc:(c.doc||"").trim(), local:(c.local||"").trim() || CLIENTE_PADRAO.local, lat:isFinite(lat) ? lat : CLIENTE_PADRAO.lat, lng:isFinite(lng) ? lng : CLIENTE_PADRAO.lng}; }

/* Cotações: praças no Brasil, bolsas internacionais, histórico e fontes */
const PRACAS_BR = [["PA","Pará (média)"],["BA","Bahia (média)"],["ILH","Ilhéus/BA"],["ALT","Altamira/PA"],["ES","Espírito Santo"],["RO","Rondônia"]];
const INTL = [["NY","ICE Nova York","US$/t"],["LDN","ICE Londres","£/t"],["ICCO","ICCO preço diário","US$/t"]];
const PRECO = {bar:["PA","BA","ILH"], barLabel:{ILH:"Ilhéus"}, fonteEx:"precodocacau.com.br",
  hist:[["PA","PA"],["BA","BA"],["ILH","Ilhéus"],["NY","NY"],["LDN","Londres"]],
  links:[["Preço do Cacau (BR)","https://precodocacau.com.br/cotacao/"],["Notícias Agrícolas","https://www.noticiasagricolas.com.br/cotacoes/cacau"],["ICE Nova York","https://www.ice.com/products/7/Cocoa-Futures"],["ICE Londres","https://www.ice.com/products/37089079/London-Cocoa-Futures"],["ICCO","https://www.icco.org/statistics/"]]};

/* Investigação (fontes públicas): id, rótulo, tipo, pontos, critério */
const INV = [
 // id, rótulo, tipo, pontos, critério
 ["divida","Dívida ativa (PGFN / estado / município)","sn",2,"Regularidade fiscal"],
 ["protestos","Protestos em cartório","sn",1,"Regularidade fiscal"],
 ["proc_trab","Processos trabalhistas relevantes","sn",2,"Condições de trabalho"],
 ["proc_crim","Processos criminais da empresa ou dos sócios","sn",3,"Integridade"],
 ["pep","Sócio ou administrador politicamente exposto (PEP / envolvimento político)","sn",2,"Integridade"],
 ["prisao","Sócio preso, denunciado ou sob investigação","sn",4,"Integridade"],
 ["rotat","Sócios abrem e fecham empresas rapidamente (CNPJs baixados ou inaptos nos últimos 3 anos)","num",3,"Perfil societário"],
 ["midia","Mídia negativa (trabalho escravo, desmatamento, fraude)","sn",2,"Integridade"],
 ["mte","Cadastro de Empregadores do MTE (lista suja)","sn",6,"Condições de trabalho"],
 ["ibama","Embargo ambiental (IBAMA / SEMAS-PA)","sn",3,"Origem e território"]
];
const UF_CENTER = {AC:[-9.0,-70.5],AL:[-9.6,-36.6],AP:[1.4,-51.8],AM:[-4.2,-62.5],BA:[-13.5,-40.5],CE:[-5.2,-39.5],DF:[-15.8,-47.9],ES:[-19.5,-40.6],GO:[-16.0,-49.6],MA:[-5.0,-45.3],MT:[-12.6,-55.9],MS:[-20.5,-54.8],MG:[-18.5,-44.6],PA:[-3.8,-52.5],PB:[-7.1,-36.8],PR:[-24.6,-51.6],PE:[-8.4,-37.9],PI:[-7.4,-42.7],RJ:[-22.2,-42.7],RN:[-5.8,-36.6],RS:[-29.7,-53.3],RO:[-10.9,-62.8],RR:[2.0,-61.4],SC:[-27.3,-50.4],SP:[-22.3,-48.6],SE:[-10.6,-37.4],TO:[-10.2,-48.3]};

/* Questionamentos iniciais por nível. risk = resposta que gera indicador de risco. */
const Q = {
 N1:[
  {g:"Identificação e societário", items:[
   ["n1_01","A empresa está ativa na Receita Federal e tem inscrição estadual regular em todos os estados onde opera?","nao"],
   ["n1_02","Algum sócio ou administrador participa, ou participou nos últimos 5 anos, de outra empresa de cacau hoje baixada ou inapta?","sim"],
   ["n1_03","Possui certidões negativas válidas (federal, estadual, municipal, FGTS e trabalhista)?","nao"],
   ["n1_04","Houve troca de CNPJ, cisão ou sucessão de empresas do grupo nos últimos 3 anos?","sim"]]},
  {g:"Mercadoria e operação", items:[
   ["n1_05","Mantém inventário físico periódico do estoque, com contagem documentada?","nao"],
   ["n1_06","Os armazéns (próprios ou de terceiros) têm capacidade compatível com o volume vendido ao cliente?","nao"],
   ["n1_07","Possui balança com certificado de verificação do IPEM/INMETRO vigente?","nao"],
   ["n1_08","Classifica o cacau no recebimento (umidade, impurezas e prova de corte) com ticket e laudo?","nao"],
   ["n1_09","Segrega e identifica os lotes por fornecedor e origem até a expedição?","nao"],
   ["n1_10","Vende cacau a outros compradores além do cliente contratante?",null]]},
  {g:"Fornecedores N2 e N3", items:[
   ["n1_11","Entregou a lista completa de fornecedores N2/N3 dos últimos 12 meses (nome, CNPJ/CPF, município, volume)?","nao"],
   ["n1_12","Tem contratos escritos com os fornecedores, com cláusulas de origem, trabalho e meio ambiente?","nao"],
   ["n1_13","Faz homologação de fornecedores (KYC, CAR, Cadastro de Empregadores do MTE)?","nao"],
   ["n1_14","Paga fornecedores somente por meio bancário, em nome do emitente da nota fiscal?","nao"],
   ["n1_15","Realiza pagamentos em espécie a fornecedores ou produtores?","sim"]]},
  {g:"Trabalho, integridade e LGPD", items:[
   ["n1_16","A empresa ou seus sócios constam, ou já constaram, no Cadastro de Empregadores do MTE (trabalho análogo ao de escravo)?","sim"],
   ["n1_17","Todos os empregados estão registrados (CLT/eSocial) ou formalmente contratados?","nao"],
   ["n1_18","Possui código de ética e canal de denúncia em funcionamento?","nao"],
   ["n1_19","Já recebeu denúncia ou autuação por trabalho infantil, análogo ao escravo ou ambiental na cadeia?","sim"],
   ["n1_20","Assinou o NDA e o termo LGPD autorizando o repasse das informações ao cliente contratante?","nao"]]}],
 N2:[
  {g:"Operação", items:[
   ["n2_01","Emite nota fiscal de entrada para todas as compras de produtores?","nao"],
   ["n2_02","As notas de saída para a trader têm notas de entrada correspondentes (balanço de massa fecha)?","nao"],
   ["n2_03","A capacidade de armazenagem é compatível com o volume movimentado no período?","nao"],
   ["n2_04","Mantém cadastro de fornecedores e segregação de lotes por origem?","nao"],
   ["n2_05","Possui balança aferida e emite ticket de pesagem por entrega?","nao"]]},
  {g:"Origem e pagamentos", items:[
   ["n2_06","Entregou a lista de produtores (N3) com CPF/CNPJ, município, CAR e volume?","nao"],
   ["n2_07","Os produtores fornecedores possuem CAR e inscrição estadual de produtor rural?","nao"],
   ["n2_08","Tem contratos escritos com os produtores?","nao"],
   ["n2_09","Paga produtores em espécie?","sim"],
   ["n2_10","O preço pago ao produtor acompanha a cotação de referência do cacau na data?","nao"]]},
  {g:"Trabalho e conformidade", items:[
   ["n2_11","Todos os trabalhadores estão formalmente contratados (CLT, safra ou terceiro regular)?","nao"],
   ["n2_12","Sofreu fiscalização trabalhista ou ambiental com autuação nos últimos 5 anos?","sim"],
   ["n2_13","Assinou o NDA e o termo LGPD?","nao"]]}],
 N3:[
  {g:"Produtor e propriedade", items:[
   ["n3_01","Possui inscrição estadual de produtor rural ativa?","nao"],
   ["n3_02","Emite nota fiscal de produtor nas vendas de cacau?","nao"],
   ["n3_03","A propriedade tem CAR ativo (Cadastro Ambiental Rural)?","nao"],
   ["n3_04","Existe embargo ambiental (IBAMA ou órgão estadual) sobre a área?","sim"],
   ["n3_05","Faz fermentação e secagem do cacau na propriedade?",null]]},
  {g:"Trabalho e moradia", items:[
   ["n3_06","Há menores de 18 anos trabalhando na lavoura, quebra ou secagem?","sim"],
   ["n3_07","Os trabalhadores têm moradia, água potável, sanitários e EPIs adequados?","nao"],
   ["n3_08","Existe retenção de documentos, dívida com o empregador ou restrição de saída?","sim"],
   ["n3_09","Os trabalhadores são registrados ou contratados por parceria/meação formalizada?","nao"]]},
  {g:"Venda", items:[
   ["n3_10","Recebe o pagamento por transferência bancária em seu nome?","nao"],
   ["n3_11","O preço recebido por arroba ficou próximo da cotação do dia da venda?","nao"],
   ["n3_12","Assinou o termo de consentimento LGPD?","nao"]]}]
};

/* Checklist documental */
const DOCS = {
 N1:["Contrato social e alterações","Cartão CNPJ e inscrição estadual","Certidões negativas (RFB/PGFN, SEFAZ, município, FGTS, CNDT)","Licenças (alvará, ambiental, sanitária)","Contratos com o cliente contratante","Contratos com fornecedores N2/N3","Notas fiscais de entrada (amostra)","Notas fiscais de saída ao cliente","Pedidos de compra","Tickets de pesagem e romaneios","CT-e / MDF-e da expedição","Comprovantes de pagamento a fornecedores","Livro de inventário / posição de estoque","Certificado IPEM/INMETRO da balança","Registro de empregados (eSocial)","Código de ética e canal de denúncia","NDA e termo LGPD assinados","Declaração de veracidade assinada"],
 N2:["Cartão CNPJ e inscrição estadual","Certidões negativas","Notas fiscais de entrada dos produtores","Notas fiscais de saída à trader","Tickets de pesagem","Cadastro de produtores com CAR","Contratos com produtores","Comprovantes de pagamento","Registro de empregados","NDA e termo LGPD assinados"],
 N3:["Documento do produtor (CPF ou CNPJ)","Inscrição estadual de produtor rural","Nota fiscal de produtor","Recibo do CAR","Comprovante de área / matrícula / posse","Comprovantes de venda e recebimento","Termo de consentimento LGPD"]
};

/* Inspeção física (slides 10 e 11) */
const INSP = {
 N1:[["i_est","Contagem de estoque conciliada ao estoque declarado e ao livro de inventário"],["i_bal","Balança com certificado IPEM/INMETRO e pesagem-teste realizada"],["i_lote","Rastreio de lote: venda ao cliente → entrada → fornecedor → propriedade"],["i_cap","Área e capacidade de armazenagem compatíveis com o volume movimentado"],["i_rec","Recebimento e classificação com tickets, romaneios e laudos"],["i_exp","Expedição: romaneios, CT-e/MDF-e e notas de saída conferidos"],["i_pag","Pagamentos a fornecedores por meio bancário, em nome do emitente"],["i_trab","Condições de trabalho: registros, EPIs, alojamentos, jornada, sem menores"]],
 N2:[["i_ctrl","Efetividade dos controles de recebimento e segregação"],["i_cap","Operação compatível com a capacidade instalada"],["i_arm","Armazenagem e segurança adequadas"],["i_lote","Lotes rastreáveis até o produtor"],["i_trab","Condições de trabalho verificadas"]],
 N3:[["i_prop","Existência da propriedade confirmada no local"],["i_cult","Cultivo de cacau compatível com a área declarada"],["i_ferm","Estrutura de fermentação e secagem"],["i_trab","Condições de trabalho e moradia adequadas"],["i_men","Ausência de menores em atividade"]]
};

const EV_TYPES = ["Foto da mercadoria","Foto do galpão / armazém","Foto da balança","Foto da propriedade","Nota fiscal","Pedido de compra","Contrato","Ticket de pesagem","Romaneio / CT-e","Certidão","Recibo do CAR","Comprovante de pagamento","Registro de empregados","NDA / termo LGPD","Outro"];
const PHOTO_TYPES = ["Foto da mercadoria","Foto do galpão / armazém","Foto da balança","Foto da propriedade"];

const SUP_TYPES = {N1:["Trader"],N2:["Fornecedor","Comprador regional","Armazém","Cooperativa","Intermediário"],N3:["Produtor pessoa física","Produtor pessoa jurídica","Pequeno fornecedor"]};
const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
/* Produtividade média de referência (kg/ha) — valores iniciais a calibrar com o cliente na etapa preparatória */
const PROD_REF = {PA:900, BA:350, ES:600, RO:700, AM:450, MT:600};

/* Municípios produtores de cacau — coordenadas aproximadas da sede */
const MUNI = [
 ["Medicilândia","PA",-3.446,-52.889],["Altamira","PA",-3.204,-52.206],["Uruará","PA",-3.715,-53.739],["Brasil Novo","PA",-3.297,-52.534],["Placas","PA",-3.868,-54.214],["Anapu","PA",-3.469,-51.200],["Pacajá","PA",-3.836,-50.638],["Novo Repartimento","PA",-4.247,-49.950],["Tucumã","PA",-6.749,-51.162],["São Félix do Xingu","PA",-6.644,-51.995],["Tomé-Açu","PA",-2.418,-48.152],["Rurópolis","PA",-4.094,-54.909],["Marabá","PA",-5.381,-49.132],["Belém","PA",-1.456,-48.490],
 ["Ilhéus","BA",-14.789,-39.049],["Itabuna","BA",-14.786,-39.280],["Uruçuca","BA",-14.593,-39.284],["Camacan","BA",-15.414,-39.496],["Gandu","BA",-13.744,-39.486],["Ibirapitanga","BA",-14.164,-39.374],["Una","BA",-15.293,-39.075],["Itacaré","BA",-14.278,-38.996],["Buerarema","BA",-14.959,-39.302],["Ubaitaba","BA",-14.303,-39.323],["Coaraci","BA",-14.640,-39.556],["Valença","BA",-13.370,-39.073],["Teixeira de Freitas","BA",-17.535,-39.742],["Salvador","BA",-12.971,-38.501],
 ["Linhares","ES",-19.391,-40.072],["São Mateus","ES",-18.716,-39.858],
 ["Ji-Paraná","RO",-10.877,-61.951],["Ariquemes","RO",-9.913,-63.041],["Cacoal","RO",-11.438,-61.447],
 ["Urucurituba","AM",-3.128,-58.155],["Manaus","AM",-3.119,-60.022],["Alta Floresta","MT",-9.876,-56.086],["São Paulo","SP",-23.550,-46.633]
];

const CLAUSES = [
 ["c_origem","Origem e rastreabilidade do cacau até a propriedade (município/UF, CAR)"],
 ["c_trab","Proibição de trabalho análogo ao escravo e de trabalho infantil (CLT, NR-31, ECA, Decreto 6.481/2008)"],
 ["c_amb","Conformidade ambiental: CAR ativo e ausência de embargos"],
 ["c_aud","Direito de auditoria e inspeção pelo cliente contratante ou terceiro independente"],
 ["c_lgpd","Confidencialidade e tratamento de dados pessoais conforme a LGPD"],
 ["c_anti","Anticorrupção (Lei 12.846/2013) e veracidade das informações"],
 ["c_resc","Rescisão e suspensão por não conformidade grave"],
 ["c_preco","Preço, pesagem e classificação definidos de forma objetiva"]
];

/* Minuta-base — NDA + LGPD. Texto para avaliação conjunta com o Jurídico da Kinsey BR antes do uso. */
const NDA_VERSION = "minuta v0.1 — para avaliação jurídica";
const NDA_TEXT = [
 ["1. Partes e objeto","Este termo é celebrado entre a Kinsey Allen Brasil Auditoria e Consultoria Ltda. (\"Kinsey BR\") e o fornecedor identificado abaixo, no âmbito da due diligence da cadeia de cacau contratada pelo cliente contratante da Kinsey BR."],
 ["2. Confidencialidade","A Kinsey BR manterá sigilo sobre as informações comerciais, fiscais e operacionais recebidas e as usará somente para a diligência. O fornecedor autoriza o repasse dos resultados e das evidências ao cliente contratante, que se obriga ao mesmo sigilo."],
 ["3. Dados pessoais tratados (LGPD, Lei 13.709/2018)","Nome, CPF, cargo, contato e assinatura de responsáveis e produtores; endereços e coordenadas dos locais de estoque e de extração; fotografias com data e geolocalização; dados de contratação de empregados em forma agregada. Não coletamos dados pessoais sensíveis, salvo quando indispensáveis à verificação de condições de trabalho, e sempre de forma minimizada."],
 ["4. Finalidade e base legal","Verificar a existência das mercadorias, a realidade das transações e a origem lícita do cacau. Bases legais: cumprimento de obrigação legal ou regulatória (art. 7º, II), exercício regular de direitos em contrato (art. 7º, VI), legítimo interesse (art. 7º, IX) e, quando aplicável, consentimento (art. 7º, I)."],
 ["5. Compartilhamento","O cliente contratante (controlador destinatário dos resultados), advogados e auditores da Kinsey BR e provedores de hospedagem do aplicativo, sob contrato de confidencialidade. Consultas a bases públicas (Receita Federal, SEFAZ, SICAR, IBAMA, Cadastro de Empregadores do MTE)."],
 ["6. Retenção e segurança","Os dados ficam guardados pelo prazo da diligência e pelo período exigido pelas normas de auditoria (papéis de trabalho, mínimo de 5 anos), com acesso restrito e registro de quem consultou."],
 ["7. Direitos do titular","Confirmação, acesso, correção, anonimização, portabilidade, informação sobre compartilhamento e revogação do consentimento (art. 18), pelo canal do Encarregado (DPO) da Kinsey BR."],
 ["8. Declaração de veracidade","O fornecedor declara que as informações, documentos e fotos enviados são verdadeiros e correspondem à realidade da operação, ciente de que divergências serão registradas como achado de risco."]
];

/* Fontes públicas específicas do setor */
const FONTES_EXTRA = [["Sistema Ipê · denúncia de trabalho escravo (MTE)", "https://ipe.sit.trabalho.gov.br"], ["Ceplac · lavoura cacaueira (MAPA)", "https://www.gov.br/agricultura/pt-br/assuntos/ceplac"], ["INPE TerraBrasilis · PRODES/DETER (desmatamento)", "https://terrabrasilis.dpi.inpe.br"], ["INCRA SIGEF · imóveis georreferenciados", "https://sigef.incra.gov.br"]];
/* Alertas do setor (notícias públicas) — [data, título, resumo, fonte] */
const SETOR_NEWS = [
[
"2025",
"Bahia: 345 crianças e adolescentes em trabalho infantil em 2025",
"Fiscalizações apontam aumento do trabalho infantil no estado, que concentra parte relevante da produção de cacau.",
"https://www.correio24horas.com.br/bahia/numero-de-criancas-e-adolescentes-encontrados-em-trabalho-infantil-na-bahia-sobe-550-0626"
],
[
"—",
"Adolescentes resgatados de trabalho infantil em fazendas no Pará",
"Força-tarefa autuou produtores que mantinham adolescente no cultivo de cacau.",
"https://sbtnews.sbt.com.br/noticia/brasil/265960-adolescentes-sao-resgatados-de-trabalho-infantil-em-fazendas-no-para"
],
[
"2005–2019",
"Ao menos 148 trabalhadores resgatados em fazendas de cacau",
"Violações concentradas na Bahia e no Pará, que respondem por cerca de 90% da produção; cadeia com muitos intermediários e pouca rastreabilidade.",
"https://outraspalavras.net/outrasmidias/trabalho-escravo-gosto-azedo-da-industria-do-cacau/"
],
[
"—",
"Diretrizes da cadeia do cacau e canal Sistema Ipê",
"Documento setorial cita o Sistema Ipê, do MTE, para denúncias de trabalho análogo ao de escravo.",
"https://worldcocoafoundation.org/storage/files/cadeia-produtiva-do-cacau-documento-sintese-lancamento-diretrizes-final-compressed.pdf"
]
];

/* Auditoria reforçada com base nos alertas do setor */
Q.N1.push({g:"Alertas do setor", items:[["n1_a1", "Compra cacau de municípios ou fazendas citados em operações de resgate de trabalhadores ou de trabalho infantil (Bahia e Pará)?", "sim", 4], ["n1_a2", "Cruza a lista de fornecedores com o Cadastro de Empregadores do MTE (lista suja) a cada atualização?", "nao", 3]]});
Q.N2.push({g:"Alertas do setor", items:[["n2_a1", "Compra de atravessadores sem identificar a fazenda de origem de cada lote?", "sim", 3]]});
Q.N3.push({g:"Alertas do setor", items:[["n3_a1", "Há menores de 18 anos na quebra do cacau, no uso de facão ou na aplicação de agrotóxicos?", "sim", 5], ["n3_a2", "Os trabalhadores da colheita têm registro, água potável, alojamento e banheiro conforme a NR-31?", "nao", 4]]});
INSP.N1.push(...[["i_mte", "Fornecedores conferidos no Cadastro de Empregadores do MTE na data da visita"]]);
INSP.N3.push(...[["i_viv", "Áreas de vivência (alojamento, água, banheiro, refeitório) conforme a NR-31"]]);
EV_TYPES.splice(Math.max(0, EV_TYPES.indexOf("Outro")), 0, ...["Consulta à lista suja (print com data)", "Foto das áreas de vivência"]);
PHOTO_TYPES.push(...["Foto das áreas de vivência"]);
/* [id, níveis, padrão de risco, procedimento, evidências exigidas, índice em SETOR_NEWS] */
const AUDIT_TESTS = [["t_inf", ["N3"], "Trabalho infantil na colheita (BA/PA)", "Visita sem aviso na safra; entrevistar trabalhadores; conferir idades nos registros; fotografar as áreas de quebra e secagem.", ["Foto da propriedade", "Registro de empregados"], 0], ["t_esc", ["N1", "N2", "N3"], "Trabalho análogo ao escravo", "Consultar o Cadastro de Empregadores (MTE) para o fornecedor e os sócios; arquivar o print com data; repetir a cada atualização.", ["Consulta à lista suja (print com data)"], 2], ["t_rast", ["N1", "N2"], "Cadeia com muitos intermediários e pouca rastreabilidade", "Amostrar 10 notas de venda ao cliente e rastrear até a fazenda: nota de entrada, ticket de pesagem e CAR da origem.", ["Nota fiscal", "Ticket de pesagem"], 2], ["t_viv", ["N3"], "Moradia e condições degradantes", "Inspecionar alojamentos, água, banheiros e refeitório e comparar com a NR-31.", ["Foto das áreas de vivência"], 1]];
/* Cláusula → [base legal de referência, o que verificar, essencial] */
const CLAUSE_INFO = {"c_origem": ["Regulamento (UE) 2023/1115 (EUDR); Lei 12.651/2012", "Município/UF, CAR e polígono de cada fazenda; amostra de notas rastreada até a origem", true], "c_trab": ["CP art. 149; CF art. 7º, XXXIII; ECA; Decreto 6.481/2008; NR-31", "Consulta ao Cadastro de Empregadores (MTE) e vedação de menores de 18 anos nas atividades da Lista TIP", true], "c_amb": ["Lei 12.651/2012; Decreto 6.514/2008, art. 54 (compra de área embargada)", "CAR ativo e consulta aos embargos do IBAMA e do órgão estadual", true], "c_aud": ["CC arts. 421 e 422; Decreto 11.129/2022 (programa de integridade)", "Acesso a documentos, locais e trabalhadores, inclusive visitas sem aviso", false], "c_lgpd": ["Lei 13.709/2018 (LGPD)", "Base legal, finalidade, compartilhamento e prazo de guarda dos dados", false], "c_anti": ["Lei 12.846/2013; Decreto 11.129/2022", "Declaração de veracidade, vedação de pagamentos indevidos e canal de denúncia", false], "c_resc": ["CC arts. 474 e 475 (cláusula resolutiva)", "Rescisão imediata por trabalho escravo, trabalho infantil ou desmatamento, sem multa para o cliente", true], "c_preco": ["Lei 9.972/2000 (classificação vegetal); Lei 9.933/1999 (metrologia)", "Preço vinculado a cotação pública, balança aferida e laudo de classificação", false]};
const EN_SEG = Object.assign({}, {"Alertas do setor": "Sector alerts", "Consulta à lista suja (print com data)": "Dirty list check (dated screenshot)", "Análise de satélite (PRODES/DETER)": "Satellite analysis (PRODES/DETER)", "Consulta de embargos (IBAMA/estado)": "Embargo check (IBAMA/state)", "Entrevista com trabalhadores (registro)": "Worker interview (record)", "Foto das áreas de vivência": "Photo of living quarters", "Compra cacau de municípios ou fazendas citados em operações de resgate de trabalhadores ou de trabalho infantil (Bahia e Pará)?": "Does it buy cocoa from municipalities or farms named in worker rescue or child labor operations (Bahia and Pará)?", "Cruza a lista de fornecedores com o Cadastro de Empregadores do MTE (lista suja) a cada atualização?": "Does it cross-check its supplier list against the MTE Employers Register (dirty list) at every update?", "Compra de atravessadores sem identificar a fazenda de origem de cada lote?": "Does it buy from middlemen without identifying the origin farm of each lot?", "Há menores de 18 anos na quebra do cacau, no uso de facão ou na aplicação de agrotóxicos?": "Are there minors under 18 breaking pods, using machetes or applying pesticides?", "Os trabalhadores da colheita têm registro, água potável, alojamento e banheiro conforme a NR-31?": "Do harvest workers have formal registration, drinking water, housing and toilets as required by NR-31?", "Fornecedores conferidos no Cadastro de Empregadores do MTE na data da visita": "Suppliers checked against the MTE Employers Register on the visit date", "Áreas de vivência (alojamento, água, banheiro, refeitório) conforme a NR-31": "Living areas (housing, water, toilets, canteen) compliant with NR-31", "Trabalho infantil na colheita (BA/PA)": "Child labor in the harvest (BA/PA)", "Visita sem aviso na safra; entrevistar trabalhadores; conferir idades nos registros; fotografar as áreas de quebra e secagem.": "Unannounced visit during harvest; interview workers; check ages in the records; photograph pod-breaking and drying areas.", "Trabalho análogo ao escravo": "Slave-like labor", "Consultar o Cadastro de Empregadores (MTE) para o fornecedor e os sócios; arquivar o print com data; repetir a cada atualização.": "Check the MTE Employers Register for the supplier and partners; keep a dated screenshot; repeat at every update.", "Cadeia com muitos intermediários e pouca rastreabilidade": "Chain with many intermediaries and little traceability", "Amostrar 10 notas de venda ao cliente e rastrear até a fazenda: nota de entrada, ticket de pesagem e CAR da origem.": "Sample 10 sales invoices to the client and trace back to the farm: incoming invoice, weighing ticket and origin CAR.", "Moradia e condições degradantes": "Housing and degrading conditions", "Inspecionar alojamentos, água, banheiros e refeitório e comparar com a NR-31.": "Inspect housing, water, toilets and canteen and compare with NR-31.", "Regulamento (UE) 2023/1115 (EUDR); Lei 12.651/2012": "Regulation (EU) 2023/1115 (EUDR); Law 12,651/2012 (Forest Code)", "Município/UF, CAR e polígono de cada fazenda; amostra de notas rastreada até a origem": "Municipality/state, CAR and polygon of each farm; sample of invoices traced to origin", "CP art. 149; CF art. 7º, XXXIII; ECA; Decreto 6.481/2008; NR-31": "Penal Code art. 149; Constitution art. 7, XXXIII; Child and Adolescent Statute; Decree 6,481/2008; NR-31", "Consulta ao Cadastro de Empregadores (MTE) e vedação de menores de 18 anos nas atividades da Lista TIP": "Check of the MTE Employers Register and ban on minors under 18 in activities on the TIP List", "Lei 12.651/2012; Decreto 6.514/2008, art. 54 (compra de área embargada)": "Law 12,651/2012; Decree 6,514/2008, art. 54 (buying from embargoed areas)", "CAR ativo e consulta aos embargos do IBAMA e do órgão estadual": "Active CAR and check of IBAMA and state embargoes", "CC arts. 421 e 422; Decreto 11.129/2022 (programa de integridade)": "Civil Code arts. 421 and 422; Decree 11,129/2022 (integrity program)", "Acesso a documentos, locais e trabalhadores, inclusive visitas sem aviso": "Access to documents, sites and workers, including unannounced visits", "Lei 13.709/2018 (LGPD)": "Law 13,709/2018 (LGPD)", "Base legal, finalidade, compartilhamento e prazo de guarda dos dados": "Legal basis, purpose, sharing and retention period of the data", "Lei 12.846/2013; Decreto 11.129/2022": "Law 12,846/2013 (Anti-Corruption); Decree 11,129/2022", "Declaração de veracidade, vedação de pagamentos indevidos e canal de denúncia": "Truthfulness statement, ban on improper payments and whistleblower channel", "CC arts. 474 e 475 (cláusula resolutiva)": "Civil Code arts. 474 and 475 (termination clause)", "Rescisão imediata por trabalho escravo, trabalho infantil ou desmatamento, sem multa para o cliente": "Immediate termination for slave labor, child labor or deforestation, with no penalty for the client", "Lei 9.972/2000 (classificação vegetal); Lei 9.933/1999 (metrologia)": "Law 9,972/2000 (plant product grading); Law 9,933/1999 (metrology)", "Preço vinculado a cotação pública, balança aferida e laudo de classificação": "Price linked to a public quotation, calibrated scale and grading report"});

/* operações comerciais: produto negociado (NCM aceitos, palavras-chave da descrição e item de demonstração) */
const OPS_PROD = {prod: "cacau e derivados", ncm: ["1801", "1802", "1803", "1804", "1805", "1806"], kw: /cacau|am[eê]ndoa|nibs|liquor|cocoa/i, demo: ["Cacau em amêndoas, inteiro, cru", "18010000", "KG", 14.5]};

/* cotações automáticas (função agendada do Firebase): o que aparece na barra, praças ligadas e referência */
const COT_AUTO = {un: "@", kg: 15, ref: "icco_brl_arroba", bar: [["icco_brl_arroba", "Cacau ICCO", "/@"], ["icco_ny", "Nova York", "/t"], ["dolar", "Dólar", ""]], br: {}, intl: {NY: "icco_ny", LDN: "icco_londres", ICCO: "icco_diario"}, nota: "Cacau: preço internacional da ICCO convertido pelo dólar PTAX (referência). Praças do Pará e da Bahia não têm fonte pública diária e continuam manuais."};
