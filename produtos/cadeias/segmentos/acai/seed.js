/* Registros de demonstração — KinseyTec – Açaí. Todos marcados EXEMPLO (dados fictícios). */
window.SEED = (() => {
  const t = "2026-11-03T12:00:00.000Z";
  const A = (ids, v) => Object.fromEntries(ids.map(i => [i, {v}]));
  const NDA = (nome, cargo, doc, em) => ({aceito:true, nome, cargo, doc, em, versao:"minuta v0.1 — para avaliação jurídica"});
  const INVN = (o) => ({situacao:"Ativa", divida:{v:"nao"}, protestos:{v:"nao"}, proc_trab:{v:"nao"}, proc_crim:{v:"nao"}, pep:{v:"nao"}, prisao:{v:"nao"}, midia:{v:"nao"}, mte:{v:"nao"}, sanit:{v:"nao"}, ibama:{v:"nao"}, desmat:{v:"nao"}, ti_uc:{v:"nao"}, sisgen:{v:"nao"}, rotat:{v:"0"}, ...o});
  return [
  /* ---------- N1 · indústrias / exportadoras ---------- */
  ["suppliers","ex-n1-cas",{nivel:"N1",tipo:"Indústria de polpa",parentId:"",nome:"EXEMPLO Amazônia Polpas Indústria S.A.",doc:"00.000.401/0001-00",ie:"15.000.401-0",abertura:"2009-03-12",volume:"18000",uf:"PA",municipio:"Castanhal",lat:-1.297,lng:-47.926,endEstoque:"BR-316, km 62 — câmaras frias",endExtracao:"Comunidades de Igarapé-Miri e Cametá",contratacao:"CLT",
    answers:{...A(["n1_01","n1_03","n1_05","n1_06","n1_07","n1_08","n1_11","n1_12","n1_13","n1_14","n1_17","n1_18","n1_19","n1_20"],"sim"),...A(["n1_02","n1_04","n1_09","n1_10","n1_15","n1_16"],"nao")},
    docs:{d0:"ok",d1:"ok",d2:"ok",d3:"ok",d4:"ok",d5:"ok",d6:"ok"},insp:{i_est:{v:"ok",n:"Estoque 1.240 t de polpa conciliado"},i_bpf:{v:"ok"},i_lote:{v:"ok"},i_lab:{v:"ok"}},balanco:{ei:"900",compras:"18000",vendas:"17200",ef:"1650"},
    invest:INVN({}),nda:NDA("Responsável Exemplo","Diretora de qualidade","000.000.000-00","2026-11-02T14:10:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n1-bel",{nivel:"N1",tipo:"Exportadora",parentId:"",nome:"EXEMPLO Norte Frutas Exportação Ltda.",doc:"00.000.402/0001-00",ie:"15.000.402-0",abertura:"2025-01-20",volume:"6500",uf:"PA",municipio:"Belém",lat:-1.456,lng:-48.490,endEstoque:"Câmara fria terceirizada — Distrito de Icoaraci",endExtracao:"Não informado",contratacao:"Terceirizada",
    answers:{...A(["n1_01","n1_03"],"sim"),...A(["n1_05","n1_07","n1_08","n1_11","n1_13","n1_17"],"nao"),n1_06:{v:"nao",n:"Branqueamento só em parte dos lotes"},n1_10:{v:"sim",n:"Compra de atravessadores sem origem"},n1_15:{v:"sim",n:"Notas de produtor de terceiros"},n1_09:{v:"sim",n:"Lote apreendido em 2025"}},
    docs:{d0:"ok",d1:"ok"},insp:{i_bpf:{v:"nao",n:"Sem registro de temperatura e branqueamento"}},balanco:{ei:"200",compras:"6500",vendas:"7400",ef:"150"},
    invest:INVN({sanit:{v:"sim",n:"EXEMPLO: apreensão sanitária em 2025"},rotat:{v:"2",n:"2 CNPJs baixados dos mesmos sócios"}}),criadoEm:t}],
  ["suppliers","ex-n1-mcp",{nivel:"N1",tipo:"Indústria de polpa",parentId:"",nome:"EXEMPLO Amapá Açaí Indústria Ltda.",doc:"00.000.403/0001-00",abertura:"2016-07-04",volume:"7200",uf:"AP",municipio:"Santana",lat:-0.058,lng:-51.181,contratacao:"CLT",
    answers:{...A(["n1_01","n1_03","n1_05","n1_06","n1_11","n1_14","n1_18","n1_20"],"sim"),...A(["n1_02","n1_04","n1_09","n1_15","n1_16"],"nao"),n1_17:{v:"nao",n:"Sem monitoramento nas comunidades"},n1_10:{v:"sim"}},
    docs:{d0:"ok",d1:"ok",d3:"ok"},insp:{i_bpf:{v:"ok"},i_lote:{v:"ress",n:"Parte dos lotes sem comunidade de origem"}},balanco:{},invest:INVN({}),
    nda:NDA("Responsável Exemplo","Gerente de compras","000.000.000-00","2026-11-02T16:00:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n1-ama",{nivel:"N1",tipo:"Distribuidora",parentId:"",nome:"EXEMPLO Rio Negro Alimentos Ltda.",doc:"00.000.404/0001-00",abertura:"2019-05-14",volume:"3000",uf:"AM",municipio:"Manaus",lat:-3.119,lng:-60.022,answers:{},docs:{},insp:{},balanco:{},criadoEm:t}],
  ["suppliers","ex-n1-aba",{nivel:"N1",tipo:"Indústria de polpa",parentId:"",nome:"EXEMPLO Abaeté Polpas Eireli",doc:"00.000.405/0001-00",abertura:"2024-10-02",volume:"2100",uf:"PA",municipio:"Abaetetuba",lat:-1.722,lng:-48.882,answers:{},docs:{},insp:{},balanco:{},invest:INVN({situacao:"Inapta"}),criadoEm:t}],
  /* ---------- N2 · batedores / cooperativas / intermediários ---------- */
  ["suppliers","ex-n2-igm",{nivel:"N2",tipo:"Cooperativa / associação",parentId:"ex-n1-cas",nome:"EXEMPLO Cooperativa dos Extrativistas de Igarapé-Miri",doc:"00.000.501/0001-00",abertura:"2003-04-10",volume:"7500",uf:"PA",municipio:"Igarapé-Miri",lat:-1.976,lng:-48.960,contratacao:"Associados",
    answers:{...A(["n2_01","n2_02","n2_03","n2_04","n2_05","n2_06","n2_08","n2_11","n2_13"],"sim"),...A(["n2_07","n2_09","n2_10","n2_12"],"nao")},docs:{d0:"ok",d1:"ok",d2:"ok",d4:"ok",d5:"ok"},insp:{i_hig:{v:"ok"},i_lote:{v:"ok"},i_men:{v:"ok"}},balanco:{ei:"0",compras:"7500",vendas:"7380",ef:"60"},
    invest:INVN({}),nda:NDA("Responsável Exemplo","Presidente","000.000.000-00","2026-11-03T09:00:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n2-bel",{nivel:"N2",tipo:"Intermediário (atravessador)",parentId:"ex-n1-bel",nome:"EXEMPLO Comércio de Açaí Guamá",doc:"000.000.501-00",abertura:"2022-02-15",volume:"3200",uf:"PA",municipio:"Belém",lat:-1.47,lng:-48.46,contratacao:"Informal",
    answers:{n2_01:{v:"nao"},n2_02:{v:"nao",n:"Vende mais do que compra com nota"},n2_03:{v:"nao"},n2_07:{v:"sim"},n2_10:{v:"sim",n:"Adiantamentos descontados na safra"},n2_12:{v:"sim",n:"Adolescentes no carregamento das rasas"}},docs:{},insp:{i_men:{v:"nao",n:"Adolescentes carregando rasas no porto"}},balanco:{ei:"0",compras:"3200",vendas:"3900",ef:"0"},
    invest:INVN({proc_trab:{v:"sim",n:"EXEMPLO: ação trabalhista por trabalho infantil"}}),criadoEm:t}],
  ["suppliers","ex-n2-cam",{nivel:"N2",tipo:"Batedor / ponto de batimento",parentId:"ex-n1-cas",nome:"EXEMPLO Batedeira Tocantins",doc:"00.000.502/0001-00",abertura:"2014-08-01",volume:"2400",uf:"PA",municipio:"Cametá",lat:-2.244,lng:-49.496,answers:{...A(["n2_01","n2_03","n2_04"],"sim")},docs:{},insp:{},balanco:{},criadoEm:t}],
  /* ---------- N3 · extrativistas / comunidades ---------- */
  ["suppliers","ex-n3-igm1",{nivel:"N3",tipo:"Comunidade / associação",parentId:"ex-n2-igm",nome:"EXEMPLO Comunidade Santo Antônio do Rio Meruú",doc:"00.000.601/0001-00",uf:"PA",municipio:"Igarapé-Miri",lat:-2.05,lng:-49.02,car:"PA-0000000-EXEMPLO",areaHa:"320",volume:"1500",contratacao:"Mão de obra familiar",
    answers:{...A(["n3_01","n3_02","n3_03","n3_07","n3_09","n3_10","n3_11","n3_12"],"sim"),...A(["n3_04","n3_05","n3_06","n3_08"],"nao")},docs:{d0:"ok",d1:"ok",d2:"ok",d3:"ok"},insp:{i_prop:{v:"ok"},i_man:{v:"ok"},i_col:{v:"ok"},i_men:{v:"ok"}},
    invest:INVN({}),nda:NDA("Liderança Exemplo","Presidente da associação","000.000.000-00","2026-11-03T10:30:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n3-pa1",{nivel:"N3",tipo:"Extrativista / ribeirinho",parentId:"ex-n2-bel",nome:"EXEMPLO Extrativista do Rio Jacaré",doc:"000.000.601-00",uf:"PA",municipio:"Breves",lat:-1.75,lng:-50.55,car:"",areaHa:"40",volume:"420",contratacao:"Diaristas",
    answers:{n3_01:{v:"nao"},n3_06:{v:"sim",n:"Crianças subindo no açaizeiro na safra"},n3_07:{v:"nao"},n3_08:{v:"sim",n:"Dívida com o atravessador"},n3_11:{v:"nao",n:"Recebe abaixo do preço mínimo"}},docs:{},insp:{i_men:{v:"nao",n:"Criança de 12 anos coletando"}},
    invest:INVN({ti_uc:{v:"sim",n:"EXEMPLO: área em RESEX sem acordo"}}),criadoEm:t}],
  ["suppliers","ex-n3-cam",{nivel:"N3",tipo:"Produtor de açaí manejado",parentId:"ex-n2-cam",nome:"EXEMPLO Sítio Boa Fé do Tocantins",doc:"000.000.602-00",uf:"PA",municipio:"Cametá",lat:-2.30,lng:-49.55,car:"PA-0000001-EXEMPLO",areaHa:"25",volume:"130",contratacao:"Mão de obra familiar",
    answers:{...A(["n3_01","n3_02","n3_03","n3_09"],"sim"),...A(["n3_04","n3_05","n3_06"],"nao"),n3_07:{v:"nao",n:"Sem EPI para os coletores"}},docs:{d0:"ok",d2:"ok"},insp:{},criadoEm:t}],
  ["suppliers","ex-n3-mcp",{nivel:"N3",tipo:"Extrativista / ribeirinho",parentId:"ex-n1-mcp",nome:"EXEMPLO Extrativistas do Rio Mazagão",doc:"000.000.603-00",uf:"AP",municipio:"Mazagão",lat:-0.115,lng:-51.289,car:"AP-0000000-EXEMPLO",areaHa:"60",volume:"280",answers:{n3_01:{v:"sim"},n3_02:{v:"sim"}},docs:{},insp:{},criadoEm:t}],
  /* ---------- contratos, parecer e cotações ---------- */
  ["contracts","ex-ct1",{supplierId:"ex-n1-cas",tipo:"Compra e venda de açaí",numero:"EX-2026/201",contraparte:"EXEMPLO Cooperativa dos Extrativistas de Igarapé-Miri",inicio:"2026-08-01",fim:"2027-07-31",volume:"5000",preco:"74,00",obs:"Contrato de exemplo para demonstrar o fluxo de aprovação.",file:null,criadoEm:"2026-11-01T10:00:00.000Z"}],
  ["contracts","ex-ct2",{supplierId:"ex-n1-bel",tipo:"Fornecimento contínuo",numero:"EX-2026/231",contraparte:"EXEMPLO Comércio de Açaí Guamá",inicio:"2026-08-01",fim:"2027-07-31",volume:"2500",preco:"38,00",obs:"Exemplo: preço muito abaixo da cotação de referência.",file:null,criadoEm:"2026-11-02T11:20:00.000Z"}],
  ["contracts","ex-ct3",{supplierId:"ex-n2-igm",tipo:"Compra e venda de açaí",numero:"EX-2026/207",contraparte:"EXEMPLO Comunidade Santo Antônio do Rio Meruú",inicio:"2026-08-01",fim:"2027-07-31",volume:"1500",preco:"72,00",obs:"",file:null,criadoEm:"2026-11-02T16:00:00.000Z"}],
  ["pareceres","ex-ct3",{status:"aprovado",clausulas:{c_origem:true,c_inf:true,c_trab:true,c_sanit:true,c_amb:true,c_preco:true,c_aud:true,c_lgpd:true},parecer:"Exemplo de parecer: cláusulas completas.",em:"2026-11-03T08:40:00.000Z",por:""}],
  ["config","precos",{br:{PA:{valor:"72,00",data:"03/11/2026",fonte:"EXEMPLO"},BEL:{valor:"85,00",data:"03/11/2026",fonte:"EXEMPLO"},IGM:{valor:"68,00",data:"03/11/2026",fonte:"EXEMPLO"},AP:{valor:"70,00",data:"03/11/2026",fonte:"EXEMPLO"},AM:{valor:"66,00",data:"03/11/2026",fonte:"EXEMPLO"},PGPM:{valor:"2,10",data:"03/11/2026",fonte:"EXEMPLO"}},
    intl:{FOB:{valor:"3,20",data:"03/11/2026",fonte:"EXEMPLO"}},hist:[{em:t,PA:"72,00",BEL:"85,00",AP:"70,00",FOB:"3,20"}],fonte:"EXEMPLO — substituir pela cotação do dia",atualizadoEm:t}],
  ["config","geral",{cotacao:"72",data:"EXEMPLO — substituir pela cotação do dia e a fonte",em:t}]
  ];
})();
