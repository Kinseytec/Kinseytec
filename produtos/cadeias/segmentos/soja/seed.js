/* Registros de demonstração — KinseyTec – Soja. Todos marcados EXEMPLO (dados fictícios). */
window.SEED = (() => {
  const t = "2026-11-03T12:00:00.000Z";
  const A = (ids, v) => Object.fromEntries(ids.map(i => [i, {v}]));
  const NDA = (nome, cargo, doc, em) => ({aceito:true, nome, cargo, doc, em, versao:"minuta v0.1 — para avaliação jurídica"});
  const INVN = (o) => ({situacao:"Ativa", divida:{v:"nao"}, protestos:{v:"nao"}, proc_trab:{v:"nao"}, proc_crim:{v:"nao"}, pep:{v:"nao"}, prisao:{v:"nao"}, midia:{v:"nao"}, mte:{v:"nao"}, ibama:{v:"nao"}, desmat:{v:"nao"}, morat:{v:"nao"}, ti_uc:{v:"nao"}, fundiario:{v:"nao"}, rotat:{v:"0"}, ...o});
  return [
  /* ---------- N1 · tradings / esmagadoras ---------- */
  ["suppliers","ex-n1-mt",{nivel:"N1",tipo:"Trading / exportadora",parentId:"",nome:"EXEMPLO Cerrado Grãos Trading S.A.",doc:"00.000.101/0001-00",ie:"13.000.101-0",abertura:"2012-05-10",volume:"420000",uf:"MT",municipio:"Sorriso",lat:-12.545,lng:-55.711,endEstoque:"Rod. BR-163, km 742 — complexo de silos",endExtracao:"Fazendas no médio-norte de MT",contratacao:"CLT",
    answers:{...A(["n1_01","n1_03","n1_05","n1_06","n1_07","n1_08","n1_09","n1_11","n1_12","n1_13","n1_14","n1_17","n1_18","n1_20"],"sim"),...A(["n1_02","n1_04","n1_10","n1_15","n1_16","n1_19"],"nao")},
    docs:{d0:"ok",d1:"ok",d2:"ok",d3:"ok",d4:"ok",d5:"ok",d6:"ok"},insp:{i_est:{v:"ok",n:"Estoque 61.300 t conciliado"},i_bal:{v:"ok"},i_lote:{v:"ok"},i_mon:{v:"ok",n:"Amostra de 40 fornecedores sem alertas"}},balanco:{ei:"38000",compras:"420000",vendas:"405000",ef:"52500"},
    invest:INVN({}),nda:NDA("Responsável Exemplo","Diretor de sustentabilidade","000.000.000-00","2026-11-02T14:10:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n1-pa",{nivel:"N1",tipo:"Trading / exportadora",parentId:"",nome:"EXEMPLO Norte Agro Exportadora Ltda.",doc:"00.000.102/0001-00",ie:"15.000.102-0",abertura:"2025-02-03",volume:"95000",uf:"PA",municipio:"Paragominas",lat:-2.997,lng:-47.353,endEstoque:"Rod. BR-010 — armazém arrendado",endExtracao:"Não informado",contratacao:"Terceirizada",
    answers:{...A(["n1_01","n1_03","n1_14"],"sim"),...A(["n1_05","n1_06","n1_07","n1_08","n1_11","n1_13"],"nao"),n1_10:{v:"sim",n:"Compra de cerealistas sem informação de origem"},n1_15:{v:"sim",n:"Indício de notas de fazenda distinta da área colhida"},n1_02:{v:"sim",n:"Sócio de empresa baixada em 2024"}},
    docs:{d0:"ok",d1:"ok",d2:"pend"},insp:{i_est:{v:"nao",n:"Estoque físico 30% menor que o declarado"}},balanco:{ei:"2000",compras:"95000",vendas:"98500",ef:"6000"},
    invest:INVN({divida:{v:"sim",n:"EXEMPLO: débitos estaduais"},morat:{v:"sim",n:"EXEMPLO: fornecedor na lista de não conformes"},rotat:{v:"3",n:"3 CNPJs baixados dos mesmos sócios"}}),criadoEm:t}],
  ["suppliers","ex-n1-go",{nivel:"N1",tipo:"Esmagadora (indústria)",parentId:"",nome:"EXEMPLO Sudoeste Óleos Vegetais S.A.",doc:"00.000.103/0001-00",abertura:"2004-08-15",volume:"610000",uf:"GO",municipio:"Rio Verde",lat:-17.798,lng:-50.928,endEstoque:"Distrito Agroindustrial de Rio Verde",contratacao:"CLT",
    answers:{...A(["n1_01","n1_03","n1_05","n1_06","n1_09","n1_11","n1_12","n1_14","n1_18","n1_20"],"sim"),...A(["n1_02","n1_04","n1_10","n1_15","n1_16","n1_19"],"nao"),n1_07:{v:"nao",n:"Monitora só fornecedores diretos"},n1_17:{v:"nao"}},
    docs:{d0:"ok",d1:"ok",d2:"ok",d6:"ok"},insp:{i_est:{v:"ok"},i_bal:{v:"ok"},i_lote:{v:"ress",n:"Indiretos sem polígono"}},balanco:{},invest:INVN({proc_trab:{v:"sim",n:"EXEMPLO: ações trabalhistas coletivas"}}),
    nda:NDA("Responsável Exemplo","Gerente de originação","000.000.000-00","2026-11-02T16:00:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n1-ba",{nivel:"N1",tipo:"Trading / exportadora",parentId:"",nome:"EXEMPLO Matopiba Commodities Ltda.",doc:"00.000.104/0001-00",abertura:"2018-03-21",volume:"180000",uf:"BA",municipio:"Luís Eduardo Magalhães",lat:-12.096,lng:-45.786,answers:{},docs:{},insp:{},balanco:{},criadoEm:t}],
  ["suppliers","ex-n1-ma",{nivel:"N1",tipo:"Trading / exportadora",parentId:"",nome:"EXEMPLO Balsas Grãos e Logística Eireli",doc:"00.000.105/0001-00",abertura:"2024-11-04",volume:"60000",uf:"MA",municipio:"Balsas",lat:-7.533,lng:-46.035,answers:{},docs:{},insp:{},balanco:{},
    invest:INVN({situacao:"Inapta"}),criadoEm:t}],
  /* ---------- N2 · armazéns / cooperativas ---------- */
  ["suppliers","ex-n2-mt",{nivel:"N2",tipo:"Cooperativa",parentId:"ex-n1-mt",nome:"EXEMPLO Cooperativa Agrícola do Teles Pires",doc:"00.000.201/0001-00",abertura:"2001-07-01",volume:"150000",uf:"MT",municipio:"Lucas do Rio Verde",lat:-13.050,lng:-55.911,contratacao:"CLT",
    answers:{...A(["n2_01","n2_02","n2_03","n2_04","n2_05","n2_06","n2_08","n2_11","n2_13"],"sim"),...A(["n2_07","n2_09","n2_10","n2_12"],"nao")},docs:{d0:"ok",d1:"ok",d2:"ok",d3:"ok",d6:"ok"},insp:{i_ctrl:{v:"ok"},i_cap:{v:"ok"},i_lote:{v:"ok"}},balanco:{ei:"9000",compras:"150000",vendas:"146000",ef:"13200"},
    invest:INVN({}),nda:NDA("Responsável Exemplo","Presidente","000.000.000-00","2026-11-03T09:00:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n2-pa",{nivel:"N2",tipo:"Armazém / cerealista",parentId:"ex-n1-pa",nome:"EXEMPLO Cerealista Capim Ltda.",doc:"00.000.202/0001-00",abertura:"2023-01-15",volume:"40000",uf:"PA",municipio:"Paragominas",lat:-3.05,lng:-47.40,contratacao:"Informal",
    answers:{n2_01:{v:"nao"},n2_02:{v:"nao",n:"Saídas maiores que as entradas"},n2_07:{v:"sim"},n2_09:{v:"sim",n:"Origem próxima a Terra Indígena"},n2_10:{v:"sim"}},docs:{},insp:{},balanco:{ei:"500",compras:"40000",vendas:"44500",ef:"300"},
    invest:INVN({ibama:{v:"sim",n:"EXEMPLO: área embargada de fornecedor"}}),criadoEm:t}],
  ["suppliers","ex-n2-go",{nivel:"N2",tipo:"Armazém / cerealista",parentId:"ex-n1-go",nome:"EXEMPLO Armazéns Sudoeste Goiano Ltda.",doc:"00.000.203/0001-00",abertura:"2010-04-12",volume:"85000",uf:"GO",municipio:"Jataí",lat:-17.881,lng:-51.714,answers:{...A(["n2_01","n2_02","n2_03","n2_05"],"sim")},docs:{},insp:{},balanco:{},criadoEm:t}],
  /* ---------- N3 · produtores ---------- */
  ["suppliers","ex-n3-mt1",{nivel:"N3",tipo:"Grupo agrícola",parentId:"ex-n2-mt",nome:"EXEMPLO Fazenda Santa Clara",doc:"00.000.301/0001-00",uf:"MT",municipio:"Nova Mutum",lat:-13.837,lng:-56.083,car:"MT-0000000-EXEMPLO",areaHa:"4800",volume:"17500",contratacao:"CLT",
    answers:{...A(["n3_01","n3_02","n3_05","n3_06","n3_07","n3_10","n3_12"],"sim"),...A(["n3_03","n3_04","n3_08","n3_09","n3_11"],"nao")},docs:{d0:"ok",d1:"ok",d3:"ok",d4:"ok"},insp:{i_prop:{v:"ok"},i_area:{v:"ok"},i_rl:{v:"ok"},i_trab:{v:"ok"}},
    invest:INVN({}),nda:NDA("Produtor Exemplo","Proprietário","000.000.000-00","2026-11-03T10:30:00.000Z"),criadoEm:t}],
  ["suppliers","ex-n3-pa1",{nivel:"N3",tipo:"Produtor pessoa física",parentId:"ex-n2-pa",nome:"EXEMPLO Fazenda Nova Fronteira",doc:"000.000.301-00",uf:"PA",municipio:"Santarém",lat:-2.60,lng:-54.90,car:"",areaHa:"900",volume:"5200",contratacao:"Diaristas",
    answers:{n3_01:{v:"sim"},n3_04:{v:"sim",n:"Abertura de 300 ha em 2022"},n3_07:{v:"nao",n:"Área plantada maior que a do CAR"},n3_11:{v:"sim"}},docs:{},insp:{i_rl:{v:"nao",n:"Sinais de desmatamento recente"}},
    invest:INVN({desmat:{v:"sim",n:"EXEMPLO: alerta MapBiomas 2022"},ti_uc:{v:"sim",n:"EXEMPLO: sobreposição parcial com TI"}}),criadoEm:t}],
  ["suppliers","ex-n3-go",{nivel:"N3",tipo:"Produtor pessoa física",parentId:"ex-n2-go",nome:"EXEMPLO Fazenda Boa Vista do Rio Claro",doc:"000.000.302-00",uf:"GO",municipio:"Mineiros",lat:-17.565,lng:-52.551,car:"GO-0000000-EXEMPLO",areaHa:"1200",volume:"4300",contratacao:"Safra",
    answers:{...A(["n3_01","n3_02","n3_05","n3_07"],"sim"),...A(["n3_03","n3_04"],"nao"),n3_06:{v:"nao",n:"Sem receituário para parte dos produtos"}},docs:{d0:"ok",d3:"ok"},insp:{},criadoEm:t}],
  ["suppliers","ex-n3-mt2",{nivel:"N3",tipo:"Produtor pessoa jurídica",parentId:"ex-n2-mt",nome:"EXEMPLO Agropecuária Rio Arinos Ltda.",doc:"00.000.302/0001-00",uf:"MT",municipio:"Diamantino",lat:-14.408,lng:-56.446,car:"MT-0000001-EXEMPLO",areaHa:"2500",volume:"9100",answers:{n3_01:{v:"sim"},n3_02:{v:"sim"}},docs:{},insp:{},criadoEm:t}],
  /* ---------- contratos, parecer e cotações ---------- */
  ["contracts","ex-ct1",{supplierId:"ex-n1-mt",tipo:"Compra e venda de soja",numero:"EX-2026/101",contraparte:"EXEMPLO Cooperativa Agrícola do Teles Pires",inicio:"2026-10-01",fim:"2027-09-30",volume:"60000",preco:"118,00",obs:"Contrato de exemplo para demonstrar o fluxo de aprovação.",file:null,criadoEm:"2026-11-01T10:00:00.000Z"}],
  ["contracts","ex-ct2",{supplierId:"ex-n1-pa",tipo:"Fornecimento contínuo",numero:"EX-2026/131",contraparte:"EXEMPLO Cerealista Capim Ltda.",inicio:"2026-08-01",fim:"2027-07-31",volume:"30000",preco:"82,00",obs:"Exemplo: preço muito abaixo da cotação de referência.",file:null,criadoEm:"2026-11-02T11:20:00.000Z"}],
  ["contracts","ex-ct3",{supplierId:"ex-n2-mt",tipo:"Compra e venda de soja",numero:"EX-2026/107",contraparte:"EXEMPLO Fazenda Santa Clara",inicio:"2026-09-01",fim:"2027-08-31",volume:"17500",preco:"117,50",obs:"",file:null,criadoEm:"2026-11-02T16:00:00.000Z"}],
  ["pareceres","ex-ct3",{status:"aprovado",clausulas:{c_origem:true,c_desmat:true,c_trab:true,c_terr:true,c_amb:true,c_aud:true,c_lgpd:true,c_anti:true},parecer:"Exemplo de parecer: cláusulas completas.",em:"2026-11-03T08:40:00.000Z",por:""}],
  ["config","precos",{br:{PR:{valor:"135,40",data:"03/11/2026",fonte:"EXEMPLO"},MT:{valor:"118,20",data:"03/11/2026",fonte:"EXEMPLO"},GO:{valor:"124,60",data:"03/11/2026",fonte:"EXEMPLO"},MS:{valor:"123,10",data:"03/11/2026",fonte:"EXEMPLO"},BA:{valor:"121,80",data:"03/11/2026",fonte:"EXEMPLO"},PA:{valor:"120,50",data:"03/11/2026",fonte:"EXEMPLO"}},
    intl:{CBOT:{valor:"1.052",data:"03/11/2026",fonte:"EXEMPLO"}},hist:[{em:t,PR:"135,40",MT:"118,20",GO:"124,60",CBOT:"1.052"}],fonte:"EXEMPLO — substituir pela cotação do dia",atualizadoEm:t}],
  ["config","geral",{cotacao:"124",data:"EXEMPLO — substituir pela cotação do dia e a fonte",em:t}]
  ];
})();
