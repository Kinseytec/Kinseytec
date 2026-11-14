/* ================= PRÉ-ANÁLISE DE DOCUMENTOS (para o Jurídico) =================
   Quando um documento entra no sistema (Evidências, Portal do Fornecedor), o texto é lido no próprio navegador
   (PDF com texto, Word, TXT/XML) e o sistema identifica o tipo (contrato social, cartão CNPJ, certidões, licença,
   CAR, procuração, contrato comercial) e aponta inconsistências a investigar. O advogado vê a fila no Jurídico,
   emite o parecer (aprovar, ressalvas, reprovar) com nome e OAB; a decisão prevalece sobre a pré-análise na matriz. */
const DOCAN = (() => {
  const PTS = {alto: 3, medio: 1, baixo: 0, info: 0}, SEV_TX = {alto: "Alto", medio: "Médio", baixo: "Baixo", info: "Observação"};
  const dl = v => String(v || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  const semAc = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const hoje = () => new Date().toISOString().slice(0, 10);
  const dBR = d => d ? new Date(d + "T12:00").toLocaleDateString("pt-BR") : "—";
  const MES = {janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12};
  const iso = (d, m, a) => `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const datas = t => { const out = []; for (const m of t.matchAll(/\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})\b/g)) if (+m[2] >= 1 && +m[2] <= 12) out.push(iso(m[1], m[2], m[3]));
    for (const m of semAc(t).matchAll(/\b(\d{1,2})\s*(?:º|o)?\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/g)) out.push(iso(m[1], MES[m[2]], m[3])); return out; };
  const cpfOk = d => { if (!/^\d{11}$/.test(d) || /^(\d)\1+$/.test(d)) return false; const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i); const r = s * 10 % 11; return r === 10 ? 0 : r; }; return dv(9) === +d[9] && dv(10) === +d[10]; };
  const prod = () => typeof OPS_PROD !== "undefined" ? OPS_PROD : null;

  /* tipos de documento reconhecidos (a ordem importa) */
  const TIPOS = [
    ["contrato_social", /contrato social|altera[çc][aã]o contratual|consolida[çc][aã]o (do contrato|contratual)|estatuto social|ato constitutivo|requerimento de empres[aá]rio|constitui[çc][aã]o de sociedade/i, "Contrato social / alteração"],
    ["cartao_cnpj", /comprovante de inscri[çc][aã]o\s+e\s+de\s+situa[çc][aã]o\s+cadastral/i, "Cartão CNPJ"],
    ["ctf_ibama", /cadastro t[ée]cnico federal|CTF\/APP|CTF\/AIDA|certificado de regularidade[\s\S]{0,200}ibama|ibama[\s\S]{0,200}certificado de regularidade/i, "CTF IBAMA (Certificado de Regularidade)"],
    ["cnd_ibama", /(certid[aã]o|declara[çc][aã]o)[\s\S]{0,120}(d[ée]bitos?|negativa)[\s\S]{0,250}(ibama|instituto brasileiro do meio ambiente)|(ibama|instituto brasileiro do meio ambiente)[\s\S]{0,250}certid[aã]o (negativa|positiva)/i, "CND IBAMA"],
    ["cnd_federal", /tributos federais e [àa] d[íi]vida ativa da uni[aã]o/i, "Certidão federal (Receita e PGFN)"],
    ["cndt", /d[ée]bitos trabalhistas/i, "CNDT (débitos trabalhistas)"],
    ["crf", /regularidade do fgts|certificado de regularidade/i, "CRF do FGTS"],
    ["cnd_estadual", /certid[aã]o[\s\S]{0,300}(fazenda estadual|secretaria (de estado )?da fazenda|receita estadual|d[íi]vida ativa (do estado|estadual)|procuradoria[- ]geral do estado|d[ée]bitos (tribut[áa]rios )?estaduais|\bICMS\b)|(secretaria (de estado )?da fazenda|\bSEFAZ\b|procuradoria[- ]geral do estado)[\s\S]{0,300}certid[aã]o/i, "CND estadual"],
    ["cnd_municipal", /certid[aã]o[\s\S]{0,300}(tributos municipais|d[ée]bitos municipais|fazenda municipal|mobili[áa]rio|\bISS\b|\bIPTU\b)|(prefeitura|secretaria municipal (de )?(finan[çc]as|fazenda))[\s\S]{0,300}certid[aã]o/i, "CND municipal"],
    ["avcb", /auto de vistoria do corpo de bombeiros|\bAVCB\b|\bCLCB\b|certificado de (licen[çc]a|aprova[çc][aã]o|vistoria) do corpo de bombeiros|corpo de bombeiros militar[\s\S]{0,300}(vistoria|certificado|licen[çc]a)/i, "AVCB (Corpo de Bombeiros)"],
    ["mtr_inea", /\bINEA\b[\s\S]{0,400}(\bMTR\b|manifesto)|(\bMTR\b|manifesto de (transporte de )?res[íi]duos)[\s\S]{0,400}\bINEA\b/i, "MTR INEA (RJ)"],
    ["mtr", /manifesto de transporte de res[íi]duos|manifesto de res[íi]duos|\bMTR\b[\s\S]{0,200}(gerador|transportador|destinador)|\bSINIR\b/i, "MTR (manifesto de resíduos)"],
    ["cdf", /certificado de destina[çc][aã]o final|\bCDF\b[\s\S]{0,200}res[íi]duos/i, "CDF (destinação final de resíduos)"],
    ["alvara", /alvar[áa] de (funcionamento|localiza[çc][aã]o|licen[çc]a)|licen[çc]a (de|para) funcionamento|alvar[áa] (municipal|sanit[áa]rio)/i, "Alvará de funcionamento"],
    ["certidao", /certid[aã]o/i, "Certidão"],
    ["licenca", /licen[çc]a (de opera[çc][aã]o|ambiental|pr[ée]via|de instala[çc][aã]o|simplificada)|autoriza[çc][aã]o ambiental/i, "Licença ambiental"],
    ["car", /cadastro ambiental rural|recibo de inscri[çc][aã]o do im[óo]vel rural/i, "Recibo do CAR"],
    ["procuracao", /procura[çc][aã]o/i, "Procuração"],
    ["nota", /DANFE|nota fiscal eletr[ôo]nica|<infNFe/i, "Nota fiscal"],
    ["contrato", /contrato|instrumento particular/i, "Contrato comercial"]];
  const DOC_TIPO = /contrat|cnpj|certid|licen|car\b|recibo do car|procura|estatuto|cadastro|outro|nota/i;

  /* ---------- leitura do texto ---------- */
  async function texto(blob, nome){
    const n = String(nome || "").toLowerCase(), t = blob.type || "", buf = await blob.arrayBuffer();
    if (/pdf/.test(t) || /\.pdf$/.test(n)){ const L = await IMP.lerPDF(buf); return L.map(r => r.join(" ")).join("\n"); }
    if (/wordprocessingml/.test(t) || /\.docx$/.test(n)){ const d = await IMP.lerDOCX(buf); return [...(d.linhas || []), ...(d.tabela || []).map(r => r.join(" "))].join("\n"); }
    if (/^text\/|xml|json|csv/.test(t) || /\.(txt|xml|csv)$/.test(n)){ let s = new TextDecoder().decode(buf); if (s.includes("\uFFFD")) s = new TextDecoder("latin1").decode(buf); return s; }
    return null;
  }

  /* ---------- extração (o que fica guardado na evidência) ---------- */
  function extrair(t, declarado){
    const tt = t.replace(/[ \t]+/g, " "), base = semAc(tt);
    const tipo = (TIPOS.find(([, re]) => re.test(tt)) || TIPOS.find(([k]) => k === "contrato" && /contrat/i.test(declarado || "")) || [null])[0];
    const cnpjs = [...new Set([...tt.matchAll(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g)].map(m => dl(m[0])).filter(d => IMP.docValido(d)))];
    const cpfsT = [...new Set([...tt.matchAll(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g)].map(m => dl(m[0])))];
    const socios = cpfsT.map(cpf => { const i = tt.search(new RegExp(cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1\\.$2\\.$3-$4"))), antes = tt.slice(Math.max(0, i - 260), i);
      const ms = [...antes.split("\n").pop().matchAll(/([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú']+(?:[ \t]+(?:d[aeo]s?|e|[A-ZÀ-Ú][A-ZÀ-Úa-zà-ú']+)){1,6})[ \t]*,[ \t]*(?:brasileir|portugu|natural|nacionalidade|solteir|casad|divorciad|separad|vi[úu]v|maior|empres[áa]ri|comerciante|agricultor|produtor)/g)];
      return {cpf, valido: cpfOk(cpf), nome: ms.length ? ms[ms.length - 1][1].trim() : ""}; });
    const cap = tt.match(/capital social[^R]{0,80}R\$\s*([\d.]+,\d{2})/i), capital = cap ? +cap[1].replace(/\./g, "").replace(",", ".") : null;
    const oi = base.search(/objeto social|objeto da sociedade|tem por objeto|tera por objeto|objetivo social/), objeto = oi >= 0 ? tt.slice(oi, oi + 700) : "";
    const ds = datas(tt).filter(d => d >= "1950-01-01" && d <= "2100-12-31").sort();
    const vm = tt.match(/v[áa]lid[ao]\s*(?:at[ée]|por)?\s*:?\s*(?:o dia\s*)?(\d{2}\/\d{2}\/\d{4})|validade\s*:?\s*(?:\d{2}\/\d{2}\/\d{4}\s*(?:a|at[ée])\s*)?(\d{2}\/\d{2}\/\d{4})|vencimento\s*:?\s*(\d{2}\/\d{2}\/\d{4})|prazo de validade[^\d]{0,40}(\d{2}\/\d{2}\/\d{4})/i);
    const validade = vm ? datas(vm.slice(1).find(Boolean))[0] || "" : "";
    const sit = (tt.match(/situa[çc][aã]o cadastral\s*:?\s*(ATIVA|INAPTA|SUSPENSA|BAIXADA|NULA)/i) || [])[1] || "";
    const carSit = (tt.match(/(?:situa[çc][aã]o|status)\s*(?:do (?:im[óo]vel|cadastro))?\s*:?\s*(ATIVO|PENDENTE|CANCELADO|SUSPENSO)/i) || [])[1] || "";
    const carNum = (tt.replace(/\s/g, "").match(/[A-Z]{2}-\d{7}-[0-9A-F]{32}/i) || [""])[0].toUpperCase();
    const campo = rot => { const m = tt.match(new RegExp("(?:^|\\n)[ \\t]*(?:" + rot + ")(?:[ \\t]*\\(\\*\\))?[ \\t]*(?::[ \\t]*|\\n[ \\t]*)([^\\n]{1,90})", "i")); return m ? m[1].replace(/\s{2,}.*$/, "").trim() : ""; };
    const cart = /comprovante de inscri/i.test(tt), dt1 = v => { const m = String(v || "").match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ""; };
    const cad = cart ? {nome: campo("NOME EMPRESARIAL"), fantasia: campo("T[ÍI]TULO DO ESTABELECIMENTO \\(NOME DE FANTASIA\\)"), municipio: campo("MUNIC[ÍI]PIO"), uf: (campo("UF").match(/\b[A-Z]{2}\b/) || [""])[0], abertura: dt1(campo("DATA DE ABERTURA|DATA DE INSCRI[ÇC][ÃA]O NO CNPJ|DATA DE CONSTITUI[ÇC][ÃA]O")), cnae: campo("C[ÓO]DIGO E DESCRI[ÇC][ÃA]O DA ATIVIDADE ECON[ÔO]MICA PRINCIPAL")}
      : {nome: ((tt.match(/(?:denomina[çc][aã]o social|raz[aã]o social|nome empresarial)[^:\n]{0,30}[:\-]?\s*([^\n]{4,90})/i) || [])[1] || "").replace(/[,;.]\s.*$/, "").trim()};
    const endereco = cart ? [campo("LOGRADOURO"), campo("N[ÚU]MERO"), campo("COMPLEMENTO"), campo("BAIRRO\\/DISTRITO|BAIRRO"), campo("CEP")].filter(x => x && !/^\*+$/.test(x) && !/^(N[ÚU]MERO|COMPLEMENTO|BAIRRO|CEP|MUNIC)/i.test(x)).join(", ") : "";
    return {tipo, rotulo: tipo ? TIPOS.find(([k]) => k === tipo)[2] : (declarado || "Documento"), chars: t.trim().length, cnpjs, socios, capital, objeto: objeto.replace(/\s+/g, " "), datas: [ds[0] || "", ds[ds.length - 1] || ""], validade,
      positiva: /certid[aã]o positiva/i.test(tt) && !/efeitos? de negativa/i.test(tt), positivaEfNeg: /positiva com efeitos? de negativa/i.test(tt), situacao: sit.toUpperCase(), carSit: carSit.toUpperCase(), carNum, endereco, cad, emissao: (datas((tt.match(/emitid[oa] no dia\s*(\d{2}\/\d{2}\/\d{4})|data (?:de |da )?emiss[aã]o\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i) || []).slice(1).find(Boolean) || "")[0] || ""),
      assinado: /assinad[oa]s? (digitalmente|eletronicamente|por)|assinatura (digital|eletr[ôo]nica)|ICP-?Brasil|gov\.br|docusign|clicksign|d4sign|certificado digital|_{6,}|reconhe[çc]o (a|as) firma|firma reconhecida|\bp\.?\s?p\.?\b|testemunhas?\s*:/i.test(tt), registro: /junta comercial|\bJUCE[A-Z]{0,3}\b|\bNIRE\b|certifico o registro|registrad[oa] sob|arquivad[oa] sob|deferido|chancela/i.test(tt),
      clausulas: {anticorrupcao: /12\.846|anticorrup/i.test(tt), trabalho: /escravo|an[áa]log[ao]|infantil/i.test(tt), lgpd: /13\.709|LGPD|dados pessoais/i.test(tt), ambiental: /ambiental|desmat|embargo/i.test(tt), rescisao: /rescis|resolu[çc][aã]o/i.test(tt)},
      nomesTexto: base.slice(0, 8000), municipiosCitados: null};
  }

  /* ---------- pontos para o advogado (recalculados a cada abertura, cruzando com o cadastro atual) ---------- */
  function achados(e, s){
    const A = [], x = e.analise?.extraido, add = (sev, txt, inv) => A.push({sev, txt, inv});
    if (!e.analise) return A;
    if (!x){ add("info", e.analise.motivo || "Leitura automática indisponível para este arquivo.", "Conferência manual do documento pelo advogado."); return A; }
    if (x.chars < 60){ add("info", "PDF digitalizado (imagem) sem texto pesquisável: leitura automática limitada.", "Conferir o documento manualmente; se possível, pedir a versão digital (PDF com texto ou certidão emitida no site do órgão)."); return A; }
    const sd = dl(s?.doc), nomeT = x.nomesTexto || "";
    if (sd.length === 14 && x.cnpjs.length && !x.cnpjs.includes(sd) && !x.cnpjs.some(c => c.slice(0, 8) === sd.slice(0, 8)) && !["nota", "mtr", "mtr_inea", "cdf"].includes(x.tipo))
      add("medio", `O documento cita CNPJ ${x.cnpjs.slice(0, 2).map(d => d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")).join(", ")}, diferente do cadastro do fornecedor.`, "Confirmar se o documento é do fornecedor ou de outra empresa (empresa ligada, antigo CNPJ, terceiro).");
    else if (sd.length === 14 && x.cnpjs.some(c => c.slice(0, 8) === sd.slice(0, 8) && c !== sd)) add("baixo", "O documento é de outro estabelecimento (matriz/filial) da mesma empresa.", "Confirmar qual estabelecimento opera com o cliente.");
    if (s?.nome){ const tok = semAc(s.nome).replace(/exemplo|ltda|s\.?a\.?|eireli|me\b|epp|comercio|industria|de|da|do|e\b/g, " ").split(/\W+/).filter(w => w.length >= 4);
      if (tok.length && tok.filter(w => nomeT.includes(w)).length / tok.length < .5 && ["contrato_social", "cartao_cnpj", "cnd_federal", "cndt", "crf", "certidao", "licenca", "cnd_ibama", "ctf_ibama", "cnd_estadual", "cnd_municipal", "avcb", "alvara"].includes(x.tipo)) add("baixo", "A razão social do cadastro não aparece no documento.", "Verificar se houve mudança de nome ou se o documento é de outra empresa."); }
    const p = prod(), venc = x.validade && x.validade < hoje();
    if (x.tipo === "contrato_social"){
      if (!x.registro) add("medio", "Não foi localizada chancela de registro na Junta Comercial (NIRE, número de arquivamento).", "Pedir a via registrada ou a certidão simplificada da Junta Comercial.");
      if (x.assinado === false) add("medio", "Não há indício de assinatura dos sócios no documento.", "Pedir a via assinada (física ou com assinatura digital) e conferir quem assina.");
      if (x.capital != null){ const v = parseFloat(String(s?.volume || "").replace(",", ".")), un = p?.demo?.[2], pr = p?.demo?.[3], kgp = un === "KG" ? pr : un === "SC" ? pr / 60 : un === "@" ? pr / 15 : null, fat = v && kgp ? v * 1000 * kgp : null;
        if (x.capital < 10000) add("medio", `Capital social de R$ ${fmt(x.capital, 2)}: muito baixo para a atividade.`, "Avaliar a capacidade econômica do fornecedor (balanço, faturamento, estrutura) e o risco de empresa de fachada.");
        else if (fat && x.capital < fat * .01) add("medio", `Capital social de R$ ${fmt(x.capital, 2)} é inferior a 1% do faturamento estimado pelo volume declarado (R$ ${fmt(fat)} por ano).`, "Pedir demonstrações financeiras e comprovar a origem dos recursos da operação."); }
      else add("baixo", "Capital social não localizado no texto.", "Conferir o capital social e sua integralização.");
      if (!x.objeto) add("baixo", "Cláusula de objeto social não localizada.", "Conferir se a atividade da empresa inclui a operação com o cliente.");
      else if (p?.kw && !p.kw.test(x.objeto) && !/com[ée]rcio atacadista em geral|com[ée]rcio de mercadorias em geral/i.test(x.objeto)) add("medio", `O objeto social não menciona ${p.prod}.`, "Verificar se a atividade autorizada (objeto social e CNAE) permite a compra e venda do produto.");
      x.socios.filter(q => !q.valido).forEach(q => add("alto", `CPF de sócio inválido no documento: ${q.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")}${q.nome ? " (" + q.nome + ")" : ""}.`, "Indício de documento adulterado ou erro: confirmar a identidade do sócio e o documento original."));
      if (!x.socios.length) add("baixo", "Sócios (nome e CPF) não identificados automaticamente.", "Identificar sócios e administradores e consultá-los nas listas restritivas.");
      if (x.datas[1] && x.datas[1] < new Date(Date.now() - 3 * 365 * 864e5).toISOString().slice(0, 10)) add("baixo", `A data mais recente no documento é ${dBR(x.datas[1])}.`, "Pedir a última alteração contratual ou a consolidação vigente.");
      if (s?.municipio && !nomeT.includes(semAc(s.municipio))) add("baixo", `O município do cadastro (${s.municipio}) não aparece no documento.`, "Verificar a sede atual e se a operação ocorre em filial ou outro endereço.");
      const rq = s?.receita?.socios || []; if (rq.length && x.socios.length){ const fora = rq.filter(q => !nomeT.includes(semAc(q.nome).split(" ")[0]) || !nomeT.includes(semAc(q.nome).split(" ").slice(-1)[0]));
        if (fora.length) add("medio", `Sócio(s) na Receita Federal não encontrados no documento: ${fora.map(q => q.nome).slice(0, 4).join(", ")}.`, "O documento pode estar desatualizado: pedir a alteração contratual mais recente e conferir o quadro societário."); }
      /* partes relacionadas: sócio que também é fornecedor, sócio em comum com outro fornecedor, sócio que recebe pagamentos */
      x.socios.filter(q => q.valido).forEach(q => {
        const outro = S.suppliers.find(o => o.id !== s?.id && dl(o.doc) === q.cpf); if (outro) add("medio", `Sócio ${q.nome || q.cpf} também está na cadeia como fornecedor (${outro.nome}, ${outro.nivel}).`, "Avaliar partes relacionadas e a real independência entre os elos da cadeia.");
        S.evidences.filter(o => o.supplierId !== s?.id && o.analise?.extraido?.socios?.some(z => z.cpf === q.cpf)).slice(0, 2).forEach(o => { const os = supById(o.supplierId); if (os) add("medio", `Sócio ${q.nome || q.cpf} em comum com ${os.nome} (${os.nivel}).`, "Verificar grupo econômico, triangulação e independência das operações."); });
        const pg = (S.operacoes || []).filter(o => o.tipo === "pag" && dl(o.pag?.favDoc) === q.cpf); if (pg.length) add("alto", `Sócio ${q.nome || q.cpf} recebeu ${pg.length} pagamento(s) diretamente como pessoa física.`, "Verificar se os pagamentos deveriam ser feitos à empresa e a origem/destino dos recursos (lavagem, sonegação).");
        (s?.listas?.achados || []).filter(a => a.k === q.cpf).forEach(a => add("alto", `Sócio ${q.nome || q.cpf} consta em: ${a.rotulo}.`, "Avaliar a continuidade da relação e documentar a decisão."));
      });
    }
    if (x.tipo === "cartao_cnpj"){
      if (x.situacao && x.situacao !== "ATIVA") add("alto", `Situação cadastral no cartão CNPJ: ${x.situacao}.`, "Empresa irregular na Receita Federal: suspender compras até a regularização.");
      if (x.emissao && x.emissao < new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10)) add("baixo", `Cartão CNPJ emitido em ${dBR(x.emissao)} (mais de 90 dias).`, "Emitir comprovante atualizado.");
      if (p?.kw && !p.kw.test(x.nomesTexto) && !p.kw.test(x.objeto)) add("medio", `As atividades (CNAE) do cartão CNPJ não mencionam ${p.prod}.`, "Verificar se a empresa está habilitada para a atividade.");
    }
    const ROT = x.rotulo || "Documento", aVencer = d => d && d >= hoje() && d < new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    if (["cnd_ibama", "cnd_estadual", "cnd_municipal"].includes(x.tipo)){
      const orgao = {cnd_ibama: "no IBAMA (multas e débitos ambientais)", cnd_estadual: "na Fazenda Estadual (ICMS e dívida ativa do estado)", cnd_municipal: "no município (ISS, taxas e dívida ativa municipal)"}[x.tipo];
      if (x.positiva) add("alto", `${ROT} POSITIVA: há débitos ou pendências ${orgao}.`, x.tipo === "cnd_ibama" ? "Levantar os autos de infração e multas ambientais, verificar embargos e a atividade autuada; avaliar a suspensão das compras." : "Levantar os débitos e exigir regularização ou parcelamento; avaliar o risco de sucessão.");
      else if (x.positivaEfNeg) add("baixo", `${ROT} positiva com efeitos de negativa: débitos com exigibilidade suspensa.`, "Conferir os processos e parcelamentos em andamento.");
      if (venc) add("medio", `${ROT} vencida em ${dBR(x.validade)}.`, "Pedir certidão atualizada no site do órgão emissor.");
      else if (aVencer(x.validade)) add("baixo", `${ROT} vence em ${dBR(x.validade)}.`, "Programar a renovação.");
      else if (!x.validade) add("baixo", `Validade da ${ROT} não localizada.`, "Conferir a validade no documento ou no site do órgão emissor.");
    }
    if (x.tipo === "ctf_ibama"){
      if (/n[ãa]o (est[áa]|se encontra) (regular|em situa[çc][aã]o regular)|irregular|suspens|cancelad|inativ/i.test(nomeT)) add("alto", "CTF IBAMA indica situação irregular, suspensa ou cancelada.", "Atividade potencialmente poluidora sem cadastro regular no IBAMA: exigir regularização antes de novas compras.");
      if (venc) add("alto", `Certificado de Regularidade do CTF vencido em ${dBR(x.validade)}.`, "Pedir o certificado atualizado (emitido no site do IBAMA) e conferir os relatórios anuais (RAPP) e a TCFA.");
      else if (aVencer(x.validade)) add("baixo", `Certificado de Regularidade do CTF vence em ${dBR(x.validade)}.`, "Programar a emissão do novo certificado.");
      else if (!x.validade) add("baixo", "Validade do Certificado de Regularidade do CTF não localizada.", "Conferir no site do IBAMA (consulta pública de certificado).");
      if (p?.kw && !p.kw.test(nomeT) && !/res[íi]duo|sucata|reciclag|com[ée]rcio|ind[úu]stria|transporte/i.test(nomeT)) add("baixo", "As atividades do CTF não parecem incluir a operação com o cliente.", "Conferir se a categoria e a atividade cadastradas no CTF cobrem o que o fornecedor faz.");
    }
    if (x.tipo === "avcb"){
      if (venc) add("alto", `AVCB vencido em ${dBR(x.validade)}.`, "Estabelecimento sem licença válida do Corpo de Bombeiros: exigir renovação ou protocolo, sobretudo em depósitos e pátios com material inflamável.");
      else if (aVencer(x.validade)) add("baixo", `AVCB vence em ${dBR(x.validade)}.`, "Acompanhar a renovação.");
      else if (!x.validade) add("baixo", "Validade do AVCB não localizada.", "Conferir validade, área e endereço vistoriados.");
      if (s?.municipio && !nomeT.includes(semAc(s.municipio))) add("medio", `O município do cadastro (${s.municipio}) não aparece no AVCB.`, "Confirmar se o AVCB é do endereço que opera com o cliente.");
    }
    if (x.tipo === "alvara"){
      if (venc) add("alto", `Alvará de funcionamento vencido em ${dBR(x.validade)}.`, "Estabelecimento sem alvará válido: exigir renovação; ferros-velhos e depósitos sem alvará são alvo de operações policiais.");
      else if (aVencer(x.validade)) add("baixo", `Alvará vence em ${dBR(x.validade)}.`, "Acompanhar a renovação.");
      else if (!x.validade) add("baixo", "Validade do alvará não localizada.", "Conferir se o alvará é definitivo ou provisório e a atividade autorizada.");
      if (s?.municipio && !nomeT.includes(semAc(s.municipio))) add("medio", `O município do cadastro (${s.municipio}) não aparece no alvará.`, "Confirmar se o alvará é do endereço que opera com o cliente.");
      if (p?.kw && !p.kw.test(nomeT) && !/com[ée]rcio|dep[óo]sito|ind[úu]stria|recicl|sucata|armaz/i.test(nomeT)) add("medio", `A atividade autorizada no alvará não menciona ${p.prod}.`, "Verificar se o alvará cobre a atividade exercida.");
    }
    if (x.tipo === "mtr" || x.tipo === "mtr_inea" || x.tipo === "cdf"){
      if (sd.length === 14 && x.cnpjs.length && !x.cnpjs.includes(sd)) add("medio", `O fornecedor não aparece como gerador, transportador ou destinador no ${x.tipo === "cdf" ? "CDF" : "MTR"}.`, "Confirmar o papel do fornecedor no manifesto e a origem do material.");
      if (/cancelad/i.test(nomeT)) add("alto", `${x.tipo === "cdf" ? "CDF" : "MTR"} cancelado.`, "Manifesto cancelado não comprova o transporte nem a destinação: pedir o documento válido.");
      if (x.datas[1] && x.datas[1] < new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10)) add("baixo", `Documento de ${dBR(x.datas[1])} (mais de um ano).`, "Pedir os manifestos do período avaliado.");
      if (x.tipo !== "cdf" && !/recebid|baixad|destina[çc][aã]o (final )?(confirmada|realizada)|recebimento/i.test(nomeT)) add("baixo", "Não há confirmação de recebimento no destinador.", "Conferir no SINIR (ou no sistema do INEA) se o manifesto foi recebido e se há CDF emitido.");
      if (p?.kw && !p.kw.test(nomeT) && !/sucata|metal|res[íi]duo/i.test(nomeT)) add("baixo", `O material do manifesto não menciona ${p.prod}.`, "Conferir a descrição, a classe e a quantidade do resíduo com as notas fiscais.");
    }
    if (["cnd_federal", "cndt", "crf", "certidao"].includes(x.tipo)){
      if (x.positiva) add("alto", "Certidão POSITIVA: há débitos ou pendências em nome do fornecedor.", "Levantar os débitos, avaliar o risco de sucessão e de responsabilidade e exigir regularização.");
      else if (x.positivaEfNeg) add("baixo", "Certidão positiva com efeitos de negativa: débitos com exigibilidade suspensa.", "Conferir os processos e parcelamentos em andamento.");
      if (venc) add("medio", `Certidão vencida em ${dBR(x.validade)}.`, "Pedir certidão atualizada.");
      else if (!x.validade) add("baixo", "Validade da certidão não localizada.", "Conferir a validade no documento ou no site do órgão emissor.");
    }
    if (x.tipo === "licenca"){
      if (venc) add("alto", `Licença ambiental vencida em ${dBR(x.validade)}.`, "Operação sem licença válida: exigir renovação ou protocolo tempestivo de renovação.");
      else if (x.validade && x.validade < new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10)) add("baixo", `Licença vence em ${dBR(x.validade)}.`, "Acompanhar o pedido de renovação.");
      else if (!x.validade) add("baixo", "Validade da licença não localizada.", "Conferir prazo e condicionantes da licença.");
    }
    if (x.tipo === "car"){
      if (/CANCELADO|SUSPENSO/.test(x.carSit)) add("alto", `CAR com situação ${x.carSit}.`, "Imóvel sem CAR ativo: verificar embargos, sobreposições e regularização ambiental.");
      else if (x.carSit === "PENDENTE") add("medio", "CAR com situação PENDENTE.", "Verificar as pendências de análise e possíveis sobreposições.");
      if (x.carNum && s?.car && dl(s.car) && dl(x.carNum) !== dl(s.car)) add("medio", "Número do CAR no recibo é diferente do informado no cadastro.", "Confirmar qual imóvel fornece o produto.");
    }
    if (x.tipo === "procuracao" && venc) add("medio", `Procuração vencida em ${dBR(x.validade)}.`, "Pedir procuração vigente para quem assina pelo fornecedor.");
    if (x.tipo === "contrato"){
      const falta = Object.entries({anticorrupcao: "anticorrupção (Lei 12.846/2013)", trabalho: "trabalho escravo e infantil", lgpd: "proteção de dados (LGPD)", ambiental: "socioambiental", rescisao: "rescisão por descumprimento"}).filter(([k]) => !x.clausulas[k]).map(([, v]) => v);
      if (falta.length >= 3) add("medio", `Cláusulas não encontradas: ${falta.join(", ")}.`, "Incluir as cláusulas essenciais de compliance antes da aprovação."); else if (falta.length) add("baixo", `Cláusulas não encontradas: ${falta.join(", ")}.`, "Avaliar a inclusão das cláusulas.");
      if (venc) add("medio", `Contrato com vigência encerrada em ${dBR(x.validade)}.`, "Verificar renovação ou aditivo.");
      if (x.assinado === false) add("medio", "Não há indício de assinatura das partes no contrato.", "Pedir a via assinada por todas as partes (física ou digital) e conferir os poderes de quem assina.");
    }
    return A;
  }
  const nivelMax = L => L.some(a => a.sev === "alto") ? "alto" : L.some(a => a.sev === "medio") ? "medio" : L.some(a => a.sev === "baixo") ? "baixo" : "";
  const pill = sev => `<span class="pill ${sev === "alto" ? "r-alto" : sev === "medio" ? "r-medio" : sev === "baixo" ? "r-baixo" : "r-pend"}" style="font-size:10.5px;padding:1px 8px">${SEV_TX[sev] || "OK"}</span>`;
  const PAR_TX = {aprovado: "Aprovado", ressalvas: "Aprovado com ressalvas", reprovado: "Reprovado"};

  /* ---------- análise na entrada do documento ---------- */
  async function analisar(evId, blob, body){
    if (!blob || !DOC_TIPO.test(String(body?.tipo || "") + " " + String(body?.obs || "")) && !/pdf|word|text|xml/.test(blob.type || "")) return null;
    if (/^image\//.test(blob.type || "")){ const r = {em: nowISO(), extraido: null, motivo: "Documento em imagem (foto): leitura automática indisponível."}; await Store.update("evidences", evId, {analise: r}).catch(() => {}); return r; }
    let t = null; try{ t = await texto(blob, body?.nome); }catch(e){}
    const r = t == null ? {em: nowISO(), extraido: null, motivo: "Formato de arquivo sem leitura automática."} : {em: nowISO(), extraido: extrair(t, body?.tipo)};
    if (r.extraido) delete r.extraido.municipiosCitados;
    await Store.update("evidences", evId, {analise: r}).catch(() => {}); return r;
  }
  EXT_EVID.push((id, blob, body) => { analisar(id, blob, body).catch(() => {}); });

  /* ---------- matriz de risco: parecer do advogado prevalece sobre a pré-análise ---------- */
  EXT_RISKS.push((s, add) => {
    S.evidences.filter(e => e.supplierId === s.id && e.analise).forEach(e => { const rot = e.analise.extraido?.rotulo || e.tipo, p = e.parecerDoc;
      if (p?.status === "reprovado") add("Jurídico", `Documento reprovado pelo Jurídico: ${rot}`, 6);
      else if (p?.status === "ressalvas") add("Jurídico", `Documento aprovado com ressalvas: ${rot}`, 1);
      else if (!p) achados(e, s).filter(a => PTS[a.sev]).forEach(a => add("Pré-análise documental", `${rot}: ${a.txt}`, PTS[a.sev])); });
  });
  EXT_TOUCH.push(s => S.evidences.some(e => e.supplierId === s.id && e.analise));

  /* ---------- tela: parecer do advogado sobre o documento ---------- */
  function parecer(evId){
    const e = S.evidences.find(x => x.id === evId); if (!e) return; const s = supById(e.supplierId), A = achados(e, s), p = e.parecerDoc || {}, ed = Store.me.canEdit, x = e.analise?.extraido;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Pré-análise documental · ${s ? s.nivel + " · " + esc(s.nome) : "—"}</div><h2>${esc(x?.rotulo || e.tipo)} ${pill(nivelMax(A))}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <div style="display:flex;gap:8px;flex-wrap:wrap">${e.url ? `<a class="btn sm" href="${esc(e.url)}" target="_blank" rel="noopener">Abrir ${esc(e.nome || "documento")} ↗</a>` : ""}${s ? `<button type="button" class="btn sm" id="pd-sup">Dossiê do fornecedor</button>` : ""}</div>
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Pontos a investigar (${A.filter(a => a.sev !== "info").length})</h3>
          ${A.length ? A.slice().sort((a, b) => (PTS[b.sev] || 0) - (PTS[a.sev] || 0)).map(a => `<div style="display:flex;gap:8px;align-items:flex-start;font-size:13px">${pill(a.sev)}<div><div>${esc(a.txt)}</div><div class="sub" style="margin:2px 0 0;font-size:12px">Investigar: ${esc(a.inv)}</div></div></div>`).join("") : `<p class="sub" style="margin:0">Nenhuma inconsistência encontrada na leitura automática.</p>`}</div>
        ${x ? `<dl class="kv"><dt>Tipo identificado</dt><dd>${esc(x.rotulo)}</dd>${x.cnpjs.length ? `<dt>CNPJ citados</dt><dd class="mono">${x.cnpjs.slice(0, 4).join(", ")}</dd>` : ""}${x.socios.length ? `<dt>Sócios / pessoas</dt><dd>${x.socios.slice(0, 8).map(q => `${esc(q.nome || "—")} <span class="mono">${q.cpf.replace(/^(\d{3})\d{6}(\d{2})$/, "$1.***.***-$2")}</span>${q.valido ? "" : " <b style=\"color:var(--bad)\">CPF inválido</b>"}`).join("<br>")}</dd>` : ""}
          ${x.capital != null ? `<dt>Capital social</dt><dd>R$ ${fmt(x.capital, 2)}</dd>` : ""}${x.validade ? `<dt>Validade</dt><dd>${dBR(x.validade)}</dd>` : ""}${x.situacao ? `<dt>Situação</dt><dd>${esc(x.situacao)}</dd>` : ""}${x.objeto ? `<dt>Objeto social</dt><dd style="font-size:12.5px">${esc(x.objeto.slice(0, 400))}…</dd>` : ""}</dl>` : ""}
        <form id="fpd" class="card" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Parecer do advogado</h3>
          ${ed ? `<button type="button" class="btn sm" id="pd-min" style="align-self:flex-start">Gerar minuta a partir da pré-análise</button>` : ""}
          <div class="fld"><label for="pd-txt">Análise e conclusão</label><textarea id="pd-txt" ${ed ? "" : "disabled"} placeholder="Conclusão, ressalvas e providências">${esc(p.texto)}</textarea></div>
          ${ed ? advCampos("pd", p.advogado || advPadrao(), false) : ""}
          ${p.status ? `<div class="banner">Último parecer: <b>${PAR_TX[p.status]}</b> em ${dt(p.em)}${p.advogado?.nome ? ` · ${esc(p.advogado.nome)} · ${esc(p.advogado.oab || "")}` : ""}</div>` : ""}
          <p class="err" id="pd-err" hidden></p>
          ${ed ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn ok" data-pd="aprovado">Aprovar</button><button type="button" class="btn warn" data-pd="ressalvas">Aprovar com ressalvas</button><button type="button" class="btn bad" data-pd="reprovado">Reprovar</button></div>` : `<span class="sub">Aguardando parecer da equipe jurídica.</span>`}
        </form></div>`);
    const ps = $("#pd-sup"); if (ps) ps.onclick = () => { close(); openSupplier(s.id, "docs"); };
    const pm = $("#pd-min"); if (pm) pm.onclick = () => { const L = [`PARECER SOBRE DOCUMENTO · ${x?.rotulo || e.tipo}`, `Fornecedor: ${s?.nome || "—"} (${s?.nivel || ""}) ${s?.doc ? "· CNPJ/CPF " + s.doc : ""} · Data: ${new Date().toLocaleDateString("pt-BR")}`, "", "1. Pontos identificados na pré-análise"];
      (A.length ? A : [{sev: "", txt: "Nenhuma inconsistência na leitura automática.", inv: "—"}]).forEach(a => L.push(`- [${SEV_TX[a.sev] || "—"}] ${a.txt} Providência: ${a.inv}`));
      L.push("", "2. Conclusão", nivelMax(A) === "alto" ? "Recomendação: REPROVAR ou condicionar a aprovação ao saneamento dos pontos acima." : nivelMax(A) === "medio" ? "Recomendação: APROVAR COM RESSALVAS, com as providências acima e prazo." : "Recomendação: APROVAR.", "",
        "______________________________________", $("#pd-adv").value || "[Nome do advogado responsável]", oabFmt($("#pd-oab").value) || "OAB/UF nº [número]", "Advogado responsável");
      const ta = $("#pd-txt"); ta.value = (ta.value.trim() ? ta.value.trim() + "\n\n" : "") + L.join("\n"); ta.style.minHeight = "280px"; };
    $$("[data-pd]").forEach(b => b.onclick = async () => { const st = b.dataset.pd, txt = $("#pd-txt").value.trim();
      if (st !== "aprovado" && !txt){ $("#pd-err").textContent = "Escreva a análise explicando as ressalvas ou a reprovação."; $("#pd-err").hidden = false; return; }
      const adv = advLer("pd"); if (!adv){ $("#pd-err").textContent = ADV_ERR; $("#pd-err").hidden = false; return; }
      try{ await Store.update("evidences", evId, {parecerDoc: {status: st, texto: txt, advogado: adv, em: nowISO(), por: Store.me.id || ""}}); close(); toast(PAR_TX[st]); }
      catch(err){ $("#pd-err").textContent = "Parecer não registrado: só a equipe com acesso de Editor emite pareceres."; $("#pd-err").hidden = false; } });
  }
  /* reanálise: o arquivo é informado de novo (arquivos no Storage não são relidos pelo navegador) */
  function reanalisar(evId){
    const e = S.evidences.find(x => x.id === evId); if (!e) return;
    const run = async blob => { const r = await analisar(evId, blob, {...e, nome: e.nome}); toast(r ? "Documento analisado" : "Formato sem leitura automática"); };
    if (String(e.url || "").startsWith("data:")){ run(dataURLtoBlob(e.url)); return; }
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".pdf,.docx,.txt,.xml,image/*"; inp.onchange = () => { if (inp.files[0]) run(inp.files[0]); }; inp.click();
  }

  /* ---------- Jurídico: fila de documentos ---------- */
  S.pdF = S.pdF || "pend";
  EXT_JUR.push(() => {
    const host = $("#juridico"); if (!host) return;
    const docs = S.evidences.filter(e => e.analise || (DOC_TIPO.test(e.tipo || "") && !/^image\//.test(e.mime || "") && !/nota fiscal/i.test(e.tipo || "")));
    const L = docs.map(e => { const s = supById(e.supplierId); return {e, s, A: achados(e, s)}; }).filter(o => o.s && !/nota fiscal/i.test(o.e.tipo || "") && o.e.analise?.extraido?.tipo !== "nota");
    const pend = L.filter(o => !o.e.parecerDoc), vis = (S.pdF === "pend" ? pend : L).sort((a, b) => (PTS[nivelMax(b.A)] || 0) - (PTS[nivelMax(a.A)] || 0) || String(b.e.criadoEm).localeCompare(String(a.e.criadoEm)));
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:10px";
    el.innerHTML = `<div class="head"><div><div class="eyebrow">Contratos sociais, certidões, licenças e contratos · N1, N2 e N3</div><h3>Pré-análise de documentos</h3><p class="sub" style="margin:4px 0 0">O sistema lê cada documento anexado (pelo Portal ou pela equipe) e aponta inconsistências a investigar. ${pend.length} aguardando parecer · ${L.filter(o => nivelMax(o.A) === "alto" && !o.e.parecerDoc).length} com ponto alto.</p></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm ${S.pdF === "pend" ? "primary" : ""}" data-pdf="pend">Aguardando parecer (${pend.length})</button><button type="button" class="btn sm ${S.pdF === "todos" ? "primary" : ""}" data-pdf="todos">Todos (${L.length})</button></div></div>
      ${vis.length ? `<div class="tbl"><table><thead><tr><th>Fornecedor</th><th>Documento</th><th>Pré-análise</th><th>Principal ponto</th><th>Parecer</th><th></th></tr></thead><tbody>${vis.slice(0, 150).map(({e, s, A}) => { const top = A.filter(a => a.sev !== "info").sort((a, b) => PTS[b.sev] - PTS[a.sev])[0];
        return `<tr><td style="min-width:150px"><span class="lvtag">${s.nivel}</span> ${esc(s.nome)}</td><td style="min-width:130px">${esc(e.analise?.extraido?.rotulo || e.tipo)}<div class="sub" style="margin:0;font-size:11.5px">${esc(e.nome || "")} · ${dt(e.criadoEm)}${e.origem ? " · " + esc(e.origem) : ""}</div></td>
          <td>${e.analise ? pill(nivelMax(A)) : `<span class="sub">não analisado</span>`}</td><td style="min-width:200px;font-size:12.5px">${esc(top ? top.txt : A[0]?.txt || "—")}</td>
          <td style="font-size:12.5px">${e.parecerDoc ? `<b>${PAR_TX[e.parecerDoc.status]}</b><div class="sub" style="margin:0;font-size:11.5px">${esc(e.parecerDoc.advogado?.nome || "")} ${esc(e.parecerDoc.advogado?.oab || "")}</div>` : "Aguardando"}</td>
          <td style="white-space:nowrap">${e.analise ? `<button type="button" class="btn sm" data-pdo="${e.id}">${e.parecerDoc ? "Ver" : "Analisar e emitir parecer"}</button>` : `<button type="button" class="btn sm" data-pdr="${e.id}">Ler documento</button>`}</td></tr>`; }).join("")}</tbody></table></div>`
        : `<div class="empty">${S.pdF === "pend" ? "Nenhum documento aguardando parecer." : "Nenhum documento anexado ainda. Contratos sociais, certidões e licenças enviados pelo Portal ou em Evidências aparecem aqui com a pré-análise."}</div>`}`;
    const ref = host.querySelector(".head"); if (ref) ref.after(el); else host.prepend(el);
    $$("[data-pdf]", el).forEach(b => b.onclick = () => { S.pdF = b.dataset.pdf; renderJuridico(); });
    $$("[data-pdo]", el).forEach(b => b.onclick = () => parecer(b.dataset.pdo));
    $$("[data-pdr]", el).forEach(b => b.onclick = () => reanalisar(b.dataset.pdr));
  });
  /* detalhe da evidência mostra a pré-análise */
  EXT_EVVIEW.push((e, close) => {
    const body = $(".sheet-b"); if (!body || (!e.analise && !DOC_TIPO.test(e.tipo || ""))) return; const s = supById(e.supplierId), A = achados(e, s);
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px";
    el.innerHTML = `<h3>Pré-análise documental ${e.analise ? pill(nivelMax(A)) : ""}</h3>${e.analise ? (A.length ? A.slice(0, 6).map(a => `<div style="display:flex;gap:8px;font-size:13px">${pill(a.sev)}<span>${esc(a.txt)}</span></div>`).join("") : `<p class="sub" style="margin:0">Nenhuma inconsistência na leitura automática.</p>`) : `<p class="sub" style="margin:0">Documento ainda não lido.</p>`}
      <div style="display:flex;gap:8px;flex-wrap:wrap">${e.analise ? `<button type="button" class="btn sm" id="ev-pd">${e.parecerDoc ? "Ver parecer" : "Parecer do advogado"}</button>` : `<button type="button" class="btn sm" id="ev-pr">Ler documento</button>`}${e.parecerDoc ? `<span class="sub" style="align-self:center">${PAR_TX[e.parecerDoc.status]} · ${esc(e.parecerDoc.advogado?.nome || "")}</span>` : ""}</div>`;
    body.insertBefore(el, body.lastElementChild);
    const a = $("#ev-pd"); if (a) a.onclick = () => { close(); parecer(e.id); }; const b = $("#ev-pr"); if (b) b.onclick = () => { close(); reanalisar(e.id); };
  });
  /* aba Documentos: o que o fornecedor respondeu pelo Portal (sem tenho, justificativas e outros documentos) */
  EXT_DOCS.push((s, b) => {
    const df = s.docsFornecedor || {}, lv = s.nivel, nomes = Object.fromEntries([...(DOCS[lv] || []).map((t, i) => ["d" + i, t]), ...((S.config.personalizado?.documentos) || []).map(p => [p.id, p.texto])]);
    const just = Object.entries(df).filter(([, v]) => v && (v.v === "nao" || v.v === "na")), outros = S.evidences.filter(e => e.supplierId === s.id && e.origem === "Portal do Fornecedor" && e.justificativa);
    if (!just.length && !outros.length) return;
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px";
    el.innerHTML = `<h3>Respostas do fornecedor pelo Portal</h3>${just.length ? `<div class="eyebrow">Documentos que o fornecedor informou não ter ou não se aplicar (${just.length})</div>${just.map(([k, v]) => `<div style="font-size:13px;border-top:1px solid var(--line);padding-top:6px"><b>${esc(nomes[k] || k)}</b> · ${v.v === "nao" ? "Não tem" : "Não se aplica"}<div class="sub" style="margin:2px 0 0">Justificativa: ${esc(v.j || "—")}</div></div>`).join("")}` : ""}
      ${outros.length ? `<div class="eyebrow" style="margin-top:6px">Outros documentos enviados com justificativa (${outros.length})</div>${outros.map(e => `<div style="font-size:13px;border-top:1px solid var(--line);padding-top:6px"><a href="#" data-ev="${e.id}" style="color:var(--glow)">${esc(String(e.obs || e.nome).split(" · ")[0])}</a><div class="sub" style="margin:2px 0 0">Justificativa: ${esc(e.justificativa)}</div></div>`).join("")}` : ""}`;
    b.appendChild(el); $$("[data-ev]", el).forEach(a => a.onclick = ev => { ev.preventDefault(); openEvidence(a.dataset.ev); });
  });
  /* tipos de evidência para documentos societários e cadastrais */
  [["Contrato social / alteração", /contrato social/i], ["Cartão CNPJ", /cart[aã]o cnpj/i], ["Certidão", /^certid/i], ["CND federal", /cnd federal|certid[aã]o federal/i], ["CND estadual", /cnd estadual/i], ["CND municipal", /cnd municipal/i], ["CND IBAMA", /cnd ibama/i], ["CTF IBAMA", /ctf ibama/i],
   ["Licença ambiental", /licen[çc]a ambiental|licen[çc]a \/ alvar/i], ["Alvará de funcionamento", /alvar/i], ["AVCB (Corpo de Bombeiros)", /avcb/i], ["MTR (manifesto de resíduos)", /\bMTR\b/], ["MTR INEA (RJ)", /MTR INEA/i], ["CDF (destinação final de resíduos)", /\bCDF\b/], ["Procuração", /procura/i]].forEach(([t, re]) => { if (!EV_TYPES.some(x => re.test(x))) EV_TYPES.splice(Math.max(0, EV_TYPES.indexOf("Outro")), 0, t); });
  RPT_REC.unshift([/Documento reprovado pelo Jurídico|aprovado com ressalvas/i, "Sanear os pontos do parecer jurídico e reapresentar o documento; sem saneamento, suspender a relação comercial.", "Lei 12.846/2013; Decreto 11.129/2022; CC arts. 421 e 422"],
    [/Certidão POSITIVA|POSITIVA: há débitos|vencida|vencido|CAR com situação|Licença ambiental vencida|CTF IBAMA indica|cancelado/i, "Exigir regularização e documento atualizado em prazo definido; avaliar a suspensão das compras.", "CTN arts. 205 e 206; Lei 12.651/2012; Lei 6.938/1981; Lei 12.440/2011 (CNDT)"],
    [/Sócio|CPF de sócio|partes relacionadas|Capital social|objeto social|Junta Comercial/i, "Verificar quadro societário, capacidade econômica e partes relacionadas; documentar a análise do Jurídico.", "Lei 9.613/1998; Lei 12.846/2013; CC arts. 997 e 1.150"]);
  const pendentes = () => S.evidences.filter(e => e.analise?.extraido && !e.parecerDoc && e.analise.extraido.tipo !== "nota" && !/nota fiscal/i.test(e.tipo || "") && supById(e.supplierId)).length;
  return {analisar, achados, parecer, reanalisar, extrair, texto, pendentes};
})();
