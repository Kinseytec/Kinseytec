/* Registros de demonstração — KinseyTec – Café. Todos marcados EXEMPLO (dados fictícios). Volumes em toneladas de café beneficiado. */
window.SEED = (() => {
  const t = "2026-11-03T12:00:00.000Z";
  const A = (ids, v) => Object.fromEntries(ids.map(i => [i, {v}]));
  const NDA = (nome, cargo, doc, em) => ({aceito:true, nome, cargo, doc, em, versao:"minuta v0.1 — para avaliação jurídica"});
  const INVN = (o) => ({situacao:"Ativa", divida:{v:"nao"}, protestos:{v:"nao"}, proc_trab:{v:"nao"}, proc_crim:{v:"nao"}, pep:{v:"nao"}, prisao:{v:"nao"}, midia:{v:"nao"}, mte:{v:"nao"}, resgate:{v:"nao"}, ibama:{v:"nao"}, desmat:{v:"nao"}, ti_uc:{v:"nao"}, agrot:{v:"nao"}, rotat:{v:"0"}, ...o});
  return [
  /* ---------- N1 · exportadoras / torrefadoras ---------- */
  ["suppliers","ex-n1-mg",{nivel:"N1",tipo:"Exportadora",parentId:"",nome:"EXEMPLO Sul de Minas Coffee Exportadora S.A.",doc:"00.000.901/0001-00",ie:"001.000.901.00-01",abertura:"2006-03-12",volume:"36000",uf:"MG",municipio:"Varginha",lat:-21.551,lng:-45.430,endEstoque:"Armazém geral — Distrito Industrial de Varginha",endExtracao:"Fazendas no Sul de Minas e Cerrado",contratacao:"CLT",
    answers:{...A(["n1_01","n1_03","n1_05","n1_06","n1_07","n1_08","n1_09","n1_11","n1_12","n1_13","n1_14","n1_17","n1_18","n1_19","n1_20"],"sim"),...A(["n1_02","n1_04","n1_10","n1_15","n1_16"],"nao")},
    docs:{d0:"ok",d1:"ok",d2:"ok",d3:"ok",d4:"ok",d5:"ok",d6:"ok"},insp:{i_est:{v:"ok",n:"86.400 sacas conciliadas"},i_bal:{v:"ok"},i_lote:{v:"ok"},i_cert:{v:"ok"}},balanco:{ei:"4100",compras:"36000",vendas:"35200",ef:"4880"},
    invest:INVN({}),nda:NDA("Responsável Exemplo","Diretora de sustentabilidade","000.000.000-00","2026-11-02T14:10:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n1-es",{nivel:"N1",tipo:"Trading de café",parentId:"",nome:"EXEMPLO Conilon Capixaba Comércio Ltda.",doc:"00.000.902/0001-00",ie:"082.000.902",abertura:"2024-06-20",volume:"14000",uf:"ES",municipio:"Colatina",lat:-19.539,lng:-40.630,endEstoque:"Armazém arrendado — BR-259",endExtracao:"Não informado",contratacao:"Terceirizada",
    answers:{...A(["n1_01","n1_03","n1_14"],"sim"),...A(["n1_05","n1_06","n1_07","n1_11","n1_13","n1_17"],"nao"),n1_10:{v:"sim",n:"Compra de corretores sem origem"},n1_15:{v:"sim",n:"Notas de produtor de outras fazendas"},n1_02:{v:"sim",n:"Sócio de empresa baixada em 2024"}},
    docs:{d0:"ok",d1:"ok"},insp:{i_est:{v:"nao",n:"Estoque 20% menor que o declarado"}},balanco:{ei:"500",compras:"14000",vendas:"15100",ef:"300"},
    invest:INVN({resgate:{v:"sim",n:"EXEMPLO: resgate em fazenda fornecedora em 2025"},rotat:{v:"2",n:"2 CNPJs baixados dos mesmos sócios"}}),criadoEm:t}],
  ["suppliers","ex-n1-ro",{nivel:"N1",tipo:"Torrefadora (indústria)",parentId:"",nome:"EXEMPLO Café Robusta Amazônico Indústria Ltda.",doc:"00.000.903/0001-00",abertura:"2014-09-01",volume:"6000",uf:"RO",municipio:"Cacoal",lat:-11.438,lng:-61.447,contratacao:"CLT",
    answers:{...A(["n1_01","n1_03","n1_06","n1_09","n1_11","n1_14","n1_18","n1_20"],"sim"),...A(["n1_02","n1_04","n1_15","n1_16"],"nao"),n1_07:{v:"nao",n:"Monitora só fornecedores diretos"},n1_05:{v:"nao"}},
    docs:{d0:"ok",d1:"ok",d2:"ok"},insp:{i_est:{v:"ok"},i_lote:{v:"ress",n:"Parte dos lotes sem polígono"}},balanco:{},invest:INVN({}),
    nda:NDA("Responsável Exemplo","Gerente de compras","000.000.000-00","2026-11-02T16:00:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n1-sp",{nivel:"N1",tipo:"Exportadora",parentId:"",nome:"EXEMPLO Alta Mogiana Cafés Especiais Ltda.",doc:"00.000.904/0001-00",abertura:"2017-04-14",volume:"8000",uf:"SP",municipio:"Franca",lat:-20.539,lng:-47.401,answers:{},docs:{},insp:{},balanco:{},criadoEm:t}],
  ["suppliers","ex-n1-ba",{nivel:"N1",tipo:"Trading de café",parentId:"",nome:"EXEMPLO Planalto Baiano Café Eireli",doc:"00.000.905/0001-00",abertura:"2024-11-03",volume:"3000",uf:"BA",municipio:"Vitória da Conquista",lat:-14.866,lng:-40.839,answers:{},docs:{},insp:{},balanco:{},invest:INVN({situacao:"Inapta"}),criadoEm:t}],
  /* ---------- N2 · cooperativas / armazéns / corretores ---------- */
  ["suppliers","ex-n2-mg",{nivel:"N2",tipo:"Cooperativa",parentId:"ex-n1-mg",nome:"EXEMPLO Cooperativa dos Cafeicultores de Guaxupé",doc:"00.000.951/0001-00",abertura:"1980-04-10",volume:"18000",uf:"MG",municipio:"Guaxupé",lat:-21.305,lng:-46.712,contratacao:"CLT",
    answers:{...A(["n2_01","n2_02","n2_03","n2_04","n2_05","n2_06","n2_08","n2_11","n2_13"],"sim"),...A(["n2_07","n2_09","n2_10","n2_12"],"nao")},docs:{d0:"ok",d1:"ok",d2:"ok",d3:"ok",d5:"ok"},insp:{i_ctrl:{v:"ok"},i_cap:{v:"ok"},i_lote:{v:"ok"}},balanco:{ei:"1200",compras:"18000",vendas:"17600",ef:"1550"},
    invest:INVN({}),nda:NDA("Responsável Exemplo","Presidente","000.000.000-00","2026-11-03T09:00:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n2-es",{nivel:"N2",tipo:"Corretor / maquinista",parentId:"ex-n1-es",nome:"EXEMPLO Máquina de Café Palha Ltda.",doc:"00.000.952/0001-00",abertura:"2023-01-15",volume:"7000",uf:"ES",municipio:"São Gabriel da Palha",lat:-19.018,lng:-40.536,contratacao:"Informal",
    answers:{n2_01:{v:"nao"},n2_02:{v:"nao",n:"Vende mais do que compra com nota"},n2_07:{v:"sim"},n2_08:{v:"nao"},n2_10:{v:"sim"}},docs:{},insp:{},balanco:{ei:"0",compras:"7000",vendas:"7900",ef:"0"},
    invest:INVN({proc_trab:{v:"sim",n:"EXEMPLO: ação civil pública trabalhista"}}),criadoEm:t}],
  ["suppliers","ex-n2-cer",{nivel:"N2",tipo:"Armazém geral",parentId:"ex-n1-mg",nome:"EXEMPLO Armazéns Gerais do Cerrado Mineiro",doc:"00.000.953/0001-00",abertura:"2011-08-01",volume:"9000",uf:"MG",municipio:"Patrocínio",lat:-18.944,lng:-46.993,answers:{...A(["n2_01","n2_02","n2_05"],"sim")},docs:{},insp:{},balanco:{},criadoEm:t}],
  /* ---------- N3 · produtores ---------- */
  ["suppliers","ex-n3-mg1",{nivel:"N3",tipo:"Produtor pessoa física",parentId:"ex-n2-mg",nome:"EXEMPLO Fazenda Serra da Mantiqueira",doc:"000.000.901-00",uf:"MG",municipio:"Machado",lat:-21.675,lng:-45.922,car:"MG-0000000-EXEMPLO",areaHa:"220",volume:"390",contratacao:"Safra (registrados)",
    answers:{...A(["n3_01","n3_02","n3_05","n3_06","n3_07","n3_09","n3_10","n3_11","n3_12"],"sim"),...A(["n3_03","n3_04","n3_08"],"nao")},docs:{d0:"ok",d1:"ok",d3:"ok",d5:"ok",d7:"ok"},insp:{i_prop:{v:"ok"},i_area:{v:"ok"},i_aloj:{v:"ok"},i_reg:{v:"ok"}},
    invest:INVN({}),nda:NDA("Produtor Exemplo","Proprietário","000.000.000-00","2026-11-03T10:30:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n3-es1",{nivel:"N3",tipo:"Produtor pessoa física",parentId:"ex-n2-es",nome:"EXEMPLO Sítio Córrego Fundo",doc:"000.000.902-00",uf:"ES",municipio:"Jaguaré",lat:-18.906,lng:-40.076,car:"",areaHa:"40",volume:"180",contratacao:"Por “gato” (intermediário)",
    answers:{n3_01:{v:"sim"},n3_06:{v:"nao",n:"Colhedores sem registro"},n3_07:{v:"nao",n:"Alojamento sem camas e sem água potável"},n3_08:{v:"sim",n:"Contratação por “gato” com dívida de transporte"},n3_09:{v:"nao"}},docs:{},insp:{i_aloj:{v:"nao",n:"Trabalhadores dormindo no chão"}},
    invest:INVN({resgate:{v:"sim",n:"EXEMPLO: resgate de 12 trabalhadores em 2025"},mte:{v:"sim",n:"EXEMPLO: empregador na lista suja"}}),criadoEm:t}],
  ["suppliers","ex-n3-cer",{nivel:"N3",tipo:"Produtor pessoa jurídica",parentId:"ex-n2-cer",nome:"EXEMPLO Agro Cerrado Alto Ltda.",doc:"00.000.961/0001-00",uf:"MG",municipio:"Monte Carmelo",lat:-18.725,lng:-47.499,car:"MG-0000001-EXEMPLO",areaHa:"600",volume:"1100",contratacao:"CLT",
    answers:{...A(["n3_01","n3_02","n3_06","n3_07"],"sim"),...A(["n3_03","n3_04"],"nao"),n3_05:{v:"nao",n:"Sem receituário para parte dos produtos"}},docs:{d0:"ok",d3:"ok"},insp:{},criadoEm:t}],
  ["suppliers","ex-n3-ro",{nivel:"N3",tipo:"Agricultor familiar",parentId:"ex-n1-ro",nome:"EXEMPLO Sítio Robusta do Rolim",doc:"000.000.903-00",uf:"RO",municipio:"Rolim de Moura",lat:-11.725,lng:-61.776,car:"RO-0000000-EXEMPLO",areaHa:"18",volume:"40",answers:{n3_01:{v:"sim"},n3_02:{v:"sim"}},docs:{},insp:{},criadoEm:t}],
  /* ---------- contratos, parecer e cotações ---------- */
  ["contracts","ex-ct1",{supplierId:"ex-n1-mg",tipo:"Compra e venda de café",numero:"EX-2026/401",contraparte:"EXEMPLO Cooperativa dos Cafeicultores de Guaxupé",inicio:"2026-07-01",fim:"2027-06-30",volume:"6000",preco:"1.890,00",obs:"Contrato de exemplo para demonstrar o fluxo de aprovação.",file:null,criadoEm:"2026-11-01T10:00:00.000Z"}],
  ["contracts","ex-ct2",{supplierId:"ex-n1-es",tipo:"Fornecimento contínuo",numero:"EX-2026/431",contraparte:"EXEMPLO Máquina de Café Palha Ltda.",inicio:"2026-07-01",fim:"2027-06-30",volume:"3000",preco:"820,00",obs:"Exemplo: preço muito abaixo da cotação de referência.",file:null,criadoEm:"2026-11-02T11:20:00.000Z"}],
  ["contracts","ex-ct3",{supplierId:"ex-n2-mg",tipo:"Compra e venda de café",numero:"EX-2026/407",contraparte:"EXEMPLO Fazenda Serra da Mantiqueira",inicio:"2026-07-01",fim:"2027-06-30",volume:"390",preco:"1.910,00",obs:"",file:null,criadoEm:"2026-11-02T16:00:00.000Z"}],
  ["pareceres","ex-ct3",{status:"aprovado",clausulas:{c_origem:true,c_trab:true,c_aloj:true,c_desmat:true,c_cert:true,c_aud:true,c_preco:true,c_lgpd:true},parecer:"Exemplo de parecer: cláusulas completas.",em:"2026-11-03T08:40:00.000Z",por:""}],
  ["config","precos",{br:{MG:{valor:"1.880,00",data:"03/11/2026",fonte:"EXEMPLO"},CER:{valor:"1.920,00",data:"03/11/2026",fonte:"EXEMPLO"},SP:{valor:"1.900,00",data:"03/11/2026",fonte:"EXEMPLO"},ES:{valor:"1.250,00",data:"03/11/2026",fonte:"EXEMPLO"},RO:{valor:"1.210,00",data:"03/11/2026",fonte:"EXEMPLO"},BA:{valor:"1.700,00",data:"03/11/2026",fonte:"EXEMPLO"}},
    intl:{NY:{valor:"312,40",data:"03/11/2026",fonte:"EXEMPLO"},LDN:{valor:"4.380",data:"03/11/2026",fonte:"EXEMPLO"}},hist:[{em:t,MG:"1.880,00",CER:"1.920,00",ES:"1.250,00",NY:"312,40",LDN:"4.380"}],fonte:"EXEMPLO — substituir pela cotação do dia",atualizadoEm:t}],
  ["config","geral",{cotacao:"1850",data:"EXEMPLO — substituir pela cotação do dia e a fonte",em:t}]
  ];
})();
