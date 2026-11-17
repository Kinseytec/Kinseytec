/* ================= KINSEY CAPITAL · AVALIAÇÃO DE IMÓVEIS (NBR 14653) =================
   Aba "Imóveis" da Avaliação de ativos. O sistema faz os cálculos de engenharia para o engenheiro responsável revisar:
   - documentos: matrícula, escritura e IPTU (PDF, Word ou texto) → matrícula, cartório, inscrição, áreas, valor venal,
     endereço, proprietário e ônus (hipoteca, alienação fiduciária, penhora, usufruto, indisponibilidade);
   - método comparativo direto de dados de mercado (NBR 14653-2, tratamento por fatores): fonte de cada amostra,
     fatores de oferta, área, localização (índice fiscal), padrão, conservação (Ross-Heidecke), vagas e andar;
     saneamento por Chauvenet, intervalo de confiança de 80% (t de Student), campo de arbítrio de ±15% e
     enquadramento dos graus de fundamentação (tabela de tratamento por fatores) e de precisão;
   - método evolutivo (terreno + benfeitorias pelo CUB com BDI, depreciação Ross-Heidecke e fator de comercialização);
   - laudo em Word (marca do cliente), memorando de revisão de laudo de terceiro e mais ou menos-valia levada ao PPA
     (valor justo, CPC 15; propriedade para investimento, CPC 28). */
if (window.KT_DD && window.KT_DOCX) (() => {
  const D = KT_DD, {mi} = D, n = v => typeof v === "number" ? (isFinite(v) ? v : null) : num(v);
  const brl = v => "R$ " + (+v || 0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
  const f2 = (v, d = 2) => (+v || 0).toLocaleString("pt-BR", {minimumFractionDigits:d, maximumFractionDigits:d});
  const dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : "—"; };
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const TIPOS = ["Apartamento", "Casa", "Sala ou conjunto comercial", "Loja", "Galpão ou armazém", "Terreno", "Prédio comercial", "Imóvel rural"];
  const FINS = ["Valor justo para o PPA (CPC 15)", "Propriedade para investimento (CPC 28)", "Fundo de investimento imobiliário", "Compra e venda", "Garantia", "Laudo contábil e fiscal (Lei 12.973)"];
  /* Ross-Heidecke: estados de conservação (a a i) */
  const HEID = [["a", "Novo", 0], ["b", "Entre novo e regular", .0032], ["c", "Regular", .0252], ["d", "Entre regular e reparos simples", .0809], ["e", "Reparos simples", .181], ["f", "Entre reparos simples e importantes", .332], ["g", "Reparos importantes", .526], ["h", "Entre reparos importantes e sem valor", .752]];
  const VIDA = {"Apartamento":60, "Casa":60, "Sala ou conjunto comercial":60, "Loja":50, "Galpão ou armazém":40, "Prédio comercial":60, "Terreno":0, "Imóvel rural":40};
  const ross = (idade, vida, est) => { if (!(vida > 0)) return 0; const x = Math.min(1, Math.max(0, idade / vida)), r = .5 * (x + x * x), c = (HEID.find(h => h[0] === est) || HEID[2])[2]; return r + (1 - r) * c; };
  /* Chauvenet e t de Student (bicaudal, 80%) */
  const CHAU = {3:1.38, 4:1.54, 5:1.65, 6:1.73, 7:1.80, 8:1.86, 9:1.92, 10:1.96, 11:2.00, 12:2.03, 13:2.07, 14:2.10, 15:2.13, 16:2.15, 17:2.17, 18:2.20, 19:2.22, 20:2.24, 22:2.28, 25:2.33, 30:2.39, 40:2.50, 50:2.58};
  const chauK = m => { const ks = Object.keys(CHAU).map(Number).sort((a, b) => a - b); let k = ks[0]; for (const x of ks) if (x <= m) k = x; return CHAU[k]; };
  const T80 = [3.078, 1.886, 1.638, 1.533, 1.476, 1.440, 1.415, 1.397, 1.383, 1.372, 1.363, 1.356, 1.350, 1.345, 1.341, 1.337, 1.333, 1.330, 1.328, 1.325, 1.323, 1.321, 1.319, 1.318, 1.316, 1.315, 1.314, 1.313, 1.311, 1.310];
  const t80 = gl => gl >= 1 ? (T80[Math.min(gl, 30) - 1] || 1.282) : 0;
  const eu = () => Store.me?.email || Store.me?.nome || "";
  const lista = s => s.imoveis || [];
  const salvaLista = (s, L) => D.up(s, {imoveis:L});
  const novoId = () => "im" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  /* ---------------- documentos ---------------- */
  function lerDocumento(t){
    const T = String(t || "").replace(/\s+/g, " "), o = {achou:[]}, m2 = x => n(String(x).replace(/\s/g, ""));
    const R = (k, re, f = m => m[m.length - 1]) => { const m = T.match(re); if (m){ o[k] = f(m); o.achou.push(k); } };
    R("matricula", /matr[ií]cula\s*(?:n[ºo°.]*\s*)?([\d.]{3,})/i, m => m[1]);
    R("cartorio", /(\d{1,2}[ºo°]?\s*(?:oficial|cart[oó]rio|servi[cç]o) de registro de im[oó]veis(?:\s+(?:da comarca )?de\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç ]{2,40}?)?)(?=\s+(?:MATR[IÍ]CULA|matr[ií]cula|LIVRO|livro|CNS|$)|[.;,\n]|$)/i, m => m[1].trim());
    R("inscricao", /(?:inscri[cç][aã]o (?:imobili[aá]ria|municipal|cadastral)|n[ºo°.]* do contribuinte|n[uú]mero do contribuinte|cadastro (?:imobili[aá]rio|municipal))\D{0,20}([\d.\-/]{6,})/i, m => m[1]);
    R("areaTerreno", /[aá]rea (?:total )?(?:do )?terreno\D{0,25}([\d.]+,\d{1,2}|\d+)\s*m/i, m => m2(m[1]));
    R("areaConstruida", /[aá]rea (?:total )?(?:constru[ií]da|edificada)\D{0,25}([\d.]+,\d{1,2}|\d+)\s*m/i, m => m2(m[1]));
    R("areaPrivativa", /[aá]rea (?:privativa|[uú]til)(?: total)?\D{0,25}([\d.]+,\d{1,2}|\d+)\s*m/i, m => m2(m[1]));
    R("valorVenal", /valor venal(?: (?:total|do im[oó]vel|de refer[eê]ncia))?\D{0,25}R?\$?\s*([\d.]+,\d{2})/i, m => m2(m[1]));
    R("endereco", /((?:rua|avenida|av\.|alameda|travessa|estrada|rodovia|pra[cç]a|largo)\s+[^,;\n]{3,70},?\s*(?:n[ºo°.]*\s*)?\d+[^;]{0,40}?)(?=[,;.]|\s+(?:bairro|cep|apto|apartamento|sala|lote))/i, m => m[1].trim());
    R("ano", /(?:ano (?:de |da )?constru[cç][aã]o|constru[ií]d[oa] em|habite-?se[^.]{0,40}?)\D{0,10}((?:19|20)\d{2})/i, m => +m[1]);
    R("proprietario", /(?:propriet[aá]ri[oa]s?|adquirente|outorgad[oa]s? compradore?s?|compromiss[aá]ri[oa])[:\s]+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 .&\-]{5,90})/, m => m[1].trim());
    const onus = ["hipoteca", "aliena[cç][aã]o fiduci[aá]ria", "penhora", "usufruto", "indisponibilidade", "arresto", "servid[aã]o"].filter(x => new RegExp(x, "i").test(T)).map(x => x.replace(/\[cç\]/g, "ç").replace(/\[aã\]/g, "ã").replace(/\[aá\]/g, "á"));
    if (onus.length){ o.onus = onus; o.achou.push("ônus"); }
    if (/cancelad[ao]|baixad[ao]|averba[cç][aã]o de cancelamento/i.test(T) && onus.length) o.onusNota = "há menção a cancelamento: conferir se o ônus ainda está ativo";
    return o;
  }

  /* ---------------- método comparativo ---------------- */
  const areaDe = (im, x) => n(x.area) || 0, areaAval = im => n(im.tipo === "Terreno" ? im.areaTerreno : (im.areaPrivativa || im.areaConstruida || im.areaTerreno)) || 0;
  function fatores(im, a){
    const P = im.param || {}, Aa = areaAval(im), As = areaDe(im, a), F = {};
    F.oferta = a.tipoDado === "transação" ? 1 : (n(P.oferta) ?? 0.9);
    if (Aa && As){ const r = As / Aa, ex = Math.abs(1 - r) <= .3 ? .25 : .125; F.area = +Math.pow(r, ex).toFixed(4); } else F.area = 1;
    F.loc = n(a.fLoc) || (n(im.indiceFiscal) && n(a.indiceFiscal) ? +(n(im.indiceFiscal) / n(a.indiceFiscal)).toFixed(4) : 1);
    F.padrao = n(a.fPadrao) || 1;
    const vida = VIDA[im.tipo] || 60, ia = im.ano ? new Date().getFullYear() - im.ano : null, is = a.ano ? new Date().getFullYear() - a.ano : null;
    F.conserv = n(a.fConserv) || (ia != null && is != null && vida ? +((1 - ross(ia, vida, im.estado || "c")) / (1 - ross(is, vida, a.estado || "c"))).toFixed(4) : 1);
    F.vagas = n(a.fVagas) || (im.vagas != null && a.vagas != null && im.vagas !== "" && a.vagas !== "" ? +(1 + (n(P.vaga) ?? 5) / 100 * (n(im.vagas) - n(a.vagas))).toFixed(4) : 1);
    F.andar = n(a.fAndar) || 1;
    const comb = F.area * F.loc * F.padrao * F.conserv * F.vagas * F.andar;
    return {F, comb, unit:As ? n(a.preco) / As : 0};
  }
  function comparativo(im){
    const A = (im.amostras || []).filter(a => n(a.preco) > 0 && n(a.area) > 0), Aa = areaAval(im);
    if (A.length < 3 || !Aa) return {ok:false, motivo:A.length < 3 ? `${A.length} amostra(s) válida(s): mínimo de 3` : "informe a área do imóvel avaliado", A};
    const L = A.map(a => { const x = fatores(im, a); return {a, ...x, homog:x.unit * x.F.oferta * x.comb}; });
    let ativos = L.slice(), excl = [];
    for (let it = 0; it < 3; it++){ const v = ativos.map(x => x.homog), m = v.reduce((t, x) => t + x, 0) / v.length, sd = Math.sqrt(v.reduce((t, x) => t + (x - m) ** 2, 0) / Math.max(1, v.length - 1)), k = chauK(v.length);
      const fora = ativos.filter(x => sd > 0 && Math.abs(x.homog - m) / sd > k); if (!fora.length || ativos.length - fora.length < 3) break; excl.push(...fora); ativos = ativos.filter(x => !fora.includes(x)); }
    const v = ativos.map(x => x.homog), N = v.length, media = v.reduce((t, x) => t + x, 0) / N, sd = Math.sqrt(v.reduce((t, x) => t + (x - media) ** 2, 0) / Math.max(1, N - 1));
    const t = t80(N - 1), ic = [media - t * sd / Math.sqrt(N), media + t * sd / Math.sqrt(N)], amp = (ic[1] - ic[0]) / media, cv = sd / media;
    const precisao = amp <= .30 ? "III" : amp <= .40 ? "II" : amp <= .50 ? "I" : "fora de enquadramento";
    /* fundamentação (tratamento por fatores): 1 caracterização; 2 quantidade de dados; 3 identificação; 4 intervalo dos fatores */
    const g1 = +(im.param?.carac || 2), g2 = N >= 12 ? 3 : N >= 5 ? 2 : N >= 3 ? 1 : 0, g3 = +(im.param?.ident || (ativos.every(x => x.a.url) ? 2 : 1));
    const combs = ativos.map(x => x.comb), g4 = combs.every(c => c >= .8 && c <= 1.25) ? 3 : combs.every(c => c >= .5 && c <= 2) ? 2 : combs.every(c => c >= .4 && c <= 2.5) ? 1 : 0;
    const pts = g1 + g2 + g3 + g4, G = [g1, g2, g3, g4];
    const fund = pts >= 10 && g2 === 3 && g4 === 3 && G.every(g => g >= 2) ? "III" : pts >= 6 && g2 >= 2 && g4 >= 2 && G.every(g => g >= 1) ? "II" : pts >= 4 && G.every(g => g >= 1) ? "I" : "fora de enquadramento";
    const valor = media * Aa, arred = Math.round(valor / 1000) * 1000;
    return {ok:true, L, ativos, excl, N, media, sd, cv, ic, amp, precisao, G, pts, fund, Aa, valor, arred, arbitrio:[valor * .85, valor * 1.15]};
  }
  /* ---------------- método evolutivo ---------------- */
  function evolutivo(im){
    const E = im.evol || {}, vida = VIDA[im.tipo] || 60, idade = im.ano ? new Date().getFullYear() - im.ano : n(E.idade) || 0;
    const terreno = n(im.areaTerreno) * n(E.terrenoM2), K = ross(idade, vida, im.estado || "c"), cub = n(E.cub), ac = n(im.areaConstruida) || n(im.areaPrivativa);
    if (!(terreno > 0) && !(cub > 0 && ac > 0)) return {ok:false};
    const novo = ac * cub * (1 + (n(E.bdi) ?? 25) / 100), benf = novo * (1 - K), fc = n(E.fc) || 1;
    return {ok:true, terreno, novo, benf, K, idade, vida, fc, valor:(terreno + benf) * fc};
  }
  const resultado = im => { const C = comparativo(im), E = evolutivo(im), met = im.metodo || (C.ok ? "comparativo" : E.ok ? "evolutivo" : im.terceiro?.valor ? "terceiro" : "comparativo");
    const v = met === "evolutivo" ? (E.ok ? E.valor : null) : met === "terceiro" ? n(im.terceiro?.valor) : (C.ok ? C.arred : null); return {C, E, met, valor:v, mv:v != null && im.contabil != null && im.contabil !== "" ? v - n(im.contabil) : null}; };

  /* ---------------- revisão de laudo de terceiro ---------------- */
  function revisarLaudo(t, im){
    const T = String(t || "").replace(/\s+/g, " "), nT = nrm(T), A = [], ok = (c, txt) => A.push({c, txt});
    ok(/14\.?653/.test(T), /14\.?653/.test(T) ? "Cita a ABNT NBR 14653 (avaliação de bens)." : "Não cita a ABNT NBR 14653: exigir o enquadramento normativo.");
    ok(/14\.?653-?2|parte 2|im[oó]veis urbanos/i.test(T) || /14\.?653-?3|rurais/i.test(T), "Parte da norma aplicável ao tipo de imóvel (urbano 14653-2, rural 14653-3).");
    const db = T.match(/data[- ]base[^\d]{0,15}(\d{2}\/\d{2}\/\d{4})/i); ok(!!db, db ? `Data-base informada: ${db[1]}.` : "Data-base não identificada.");
    ok(/\bART\b|anota[cç][aã]o de responsabilidade t[eé]cnica|\bRRT\b/i.test(T), /\bART\b|anota[cç][aã]o de responsabilidade/i.test(T) ? "Menciona ART/RRT do responsável técnico." : "Não menciona ART/RRT: solicitar a anotação de responsabilidade técnica.");
    ok(/crea|cau\b/i.test(T), /crea|cau\b/i.test(T) ? "Responsável técnico com registro profissional (CREA/CAU)." : "Registro profissional (CREA/CAU) não identificado.");
    /* graus: "Grau II / Grau III" logo após a menção a fundamentação e precisão (numerais em maiúsculas) */
    let gs = []; for (const m of T.matchAll(/fundamenta[cç][aã]o/gi)){ const w = [...T.slice(m.index, m.index + 320).matchAll(/(?:Grau|GRAU)\s+(III|II|I)\b/g)].map(x => x[1]); if (w.length){ gs = w; break; } }
    const gf = gs[0] || null, gp = gs[1] || (/precis/i.test(trG) ? null : null);
    ok(!!gf, gf ? `Grau de fundamentação declarado: ${gf}.` : "Grau de fundamentação não declarado.");
    ok(!!gp, gp ? `Grau de precisão declarado: ${gp}.` : "Grau de precisão não declarado.");
    if (gf === "I") ok(false, "Grau de fundamentação I: aceitável só em situações específicas; confirme se atende à finalidade.");
    const am = Math.max((T.match(/ficha de dados da amostra/gi) || []).length, (T.match(/\bamostra\s*n?[ºo°]?\s*\d+|\belemento\s*\d+|\bdado\s*\d+/gi) || []).length, new Set((T.match(/ANEXO III\s*-\s*\d+\s*\/\s*(\d+)/g) || []).map(x => x)).size ? +((T.match(/ANEXO III\s*-\s*\d+\s*\/\s*(\d+)/) || [])[1] || 0) : 0); ok(am >= 5, am ? `Cerca de ${am} referência(s) a amostras/elementos de mercado${am < 5 ? ": abaixo de 5 (fundamentação no máximo grau I)" : ""}.` : "Não encontrei a relação de amostras de mercado.");
    ok(/homogeneiza|fator(es)? de|tratamento (por fatores|estat[ií]stico)|regress[aã]o/i.test(T), "Homogeneização ou tratamento estatístico descrito.");
    ok(/saneamento|chauvenet|desvio|outlier|discrepante/i.test(T), /saneamento|chauvenet|discrepante/i.test(T) ? "Saneamento das amostras descrito." : "Saneamento das amostras não descrito.");
    ok(/vistoria|relat[oó]rio fotogr[aá]fico|foto/i.test(T), /vistoria|fotogr/i.test(T) ? "Vistoria e relatório fotográfico presentes." : "Vistoria ou relatório fotográfico não identificado.");
    ok(/matr[ií]cula/i.test(T), /matr[ií]cula/i.test(T) ? "Documentação (matrícula) considerada." : "Matrícula do imóvel não citada.");
    const vals = [...T.matchAll(/valor de mercado[^R]{0,80}R\$\s*([\d.]+(?:,\d{2})?)/gi)].map(m => n(m[1])).filter(Boolean), val = vals.length ? vals[vals.length - 1] : null;
    if (val) ok(true, `Valor de mercado concluído: ${brl(val)}.`);
    const unit = T.match(/([\d.]+,\d{2})\s*(?:R\$)?\s*\/?\s*m[²2]/i), area = n(im.areaPrivativa || im.areaConstruida || im.areaTerreno);
    if (val && unit && area){ const calc = n(unit[1]) * area, dif = Math.abs(calc - val) / val; ok(dif <= .02, `Conferência: ${f2(n(unit[1]))}/m² × ${f2(area)} m² = ${brl(calc)} (${(dif * 100).toFixed(1)}% do valor concluído).`); }
    if (/industrial/i.test(T) && /residencial|apartamento/i.test(T)) ok(false, "O texto mistura uso industrial e residencial (ex.: metodologia de imóvel industrial em laudo residencial): revisar a coerência.");
    const C = comparativo(im); if (val && C.ok){ const d = (val - C.arred) / C.arred; ok(Math.abs(d) <= .15, `Nosso cálculo pelas amostras do sistema: ${brl(C.arred)}; o laudo está ${d >= 0 ? "acima" : "abaixo"} em ${(Math.abs(d) * 100).toFixed(1)}%${Math.abs(d) > .15 ? " (fora do campo de arbítrio de ±15%)" : ""}.`); }
    const falhas = A.filter(x => !x.c).length;
    return {itens:A, valor:val, conclusao:falhas === 0 ? "atende" : falhas <= 3 ? "atende com ressalvas" : "não atende sem ajustes"};
  }

  /* ---------------- Word: laudo e memorando ---------------- */
  const marca = () => window.KT_MARCA && !KT_MARCA.kinsey() ? KT_MARCA.curto() : "Kinsey BR";
  const assin = () => S.config.assinaturas_ativos?.lista?.length ? S.config.assinaturas_ativos.lista : (typeof MA_ASSINATURAS_ATIVOS !== "undefined" ? MA_ASSINATURAS_ATIVOS : []);
  async function laudo(s, im){
    const R = resultado(im), C = R.C, E = R.E, P = [], t = (x, o = {}) => P.push({t:x, ...o}), h = x => P.push({t:x, b:true, keep:true, before:220, sz:22}), tb = (rows, widths) => P.push({table:{rows, head:true, widths}});
    t("LAUDO DE AVALIAÇÃO DE IMÓVEL", {b:true, jc:"center", sz:28, after:80}); t(im.nome || im.endereco || "Imóvel", {b:true, jc:"center"}); t(`Data-base: ${dBR(im.dataBase)} · Emissão: ${new Date().toLocaleDateString("pt-BR")}`, {jc:"center", after:300});
    h("1. Sumário executivo");
    tb([["Item", "Conteúdo"], ["Contratante", s.receita?.razao || s.nome], ["Finalidade", im.finalidade || FINS[0]], ["Autoria", `${marca()} · responsável técnico: ${assin()[0]?.nome || "[engenheiro responsável]"}`],
      ["Metodologia", R.met === "evolutivo" ? "Método evolutivo (terreno + benfeitorias), NBR 14653-2" : "Método comparativo direto de dados de mercado, tratamento por fatores, NBR 14653-2"],
      ["Graus", C.ok ? `Fundamentação ${C.fund} (${C.pts} pontos) · Precisão ${C.precisao}` : "—"], ["Valor de mercado", R.valor != null ? window.KT_MAND ? KT_MAND.reais(R.valor) : brl(R.valor) : "[a apurar]"]], [2600, 6400]);
    h("2. Objeto da avaliação");
    tb([["Característica", "Dado"], ["Tipo", im.tipo || ""], ["Endereço", [im.endereco, im.bairro, im.cidade && `${im.cidade}/${im.uf || ""}`].filter(Boolean).join(", ")], ["Matrícula e cartório", [im.matricula && `nº ${im.matricula}`, im.cartorio].filter(Boolean).join(" · ") || "[matrícula]"],
      ["Inscrição municipal (IPTU)", im.inscricao || "—"], ["Área do terreno", im.areaTerreno ? `${f2(im.areaTerreno)} m²` : "—"], ["Área construída", im.areaConstruida ? `${f2(im.areaConstruida)} m²` : "—"], ["Área privativa", im.areaPrivativa ? `${f2(im.areaPrivativa)} m²` : "—"],
      ["Vagas · andar", [im.vagas != null && im.vagas !== "" ? `${im.vagas} vaga(s)` : "", im.andar ? `${im.andar}º andar` : ""].filter(Boolean).join(" · ") || "—"], ["Ano de construção · conservação", `${im.ano || "—"} · ${(HEID.find(x => x[0] === (im.estado || "c")) || HEID[2])[1]}`],
      ["Valor venal (IPTU)", im.valorVenal ? brl(im.valorVenal) : "—"], ["Ônus na matrícula", (im.onus || []).length ? im.onus.join(", ") + (im.onusNota ? ` (${im.onusNota})` : "") : "nenhum identificado nos documentos analisados"]], [3200, 5800]);
    h("3. Metodologia");
    t("Valor de mercado: quantia mais provável pela qual se negociaria voluntária e conscientemente o bem, na data de referência, nas condições do mercado vigente (ABNT NBR 14653-1).");
    if (C.ok){ t(`Foram pesquisados ${C.L.length} imóveis semelhantes, com a fonte de cada um identificada (Anexo). Os preços unitários foram homogeneizados pelos fatores de oferta (${f2(im.param?.oferta ?? .9)} para ofertas; 1,00 para transações), área (expoente 1/4 até 30% de diferença e 1/8 acima), localização (índice fiscal ou ajuste do avaliador), padrão, conservação (Ross-Heidecke), vagas e andar.`);
      t(`Saneamento pelo critério de Chauvenet: ${C.excl.length ? `${C.excl.length} amostra(s) excluída(s)` : "nenhuma amostra excluída"}. Média saneada de R$ ${f2(C.media)}/m² (desvio-padrão de R$ ${f2(C.sd)}/m²; coeficiente de variação de ${(C.cv * 100).toFixed(1)}%), intervalo de confiança de 80% de R$ ${f2(C.ic[0])} a R$ ${f2(C.ic[1])}/m² (amplitude ${(C.amp * 100).toFixed(1)}%), e campo de arbítrio de ±15%.`); }
    if (E.ok) t(`Método evolutivo (verificação): terreno ${brl(E.terreno)} + benfeitorias ${brl(E.benf)} (custo de reposição ${brl(E.novo)} pelo CUB com BDI, depreciação Ross-Heidecke de ${(E.K * 100).toFixed(1)}% para ${E.idade} anos de ${E.vida}) × fator de comercialização ${f2(E.fc)} = ${brl(E.valor)}.`);
    if (C.ok){ h("4. Graus de fundamentação e de precisão (NBR 14653-2)");
      tb([["Item", "Descrição", "Grau / pontos"], ["1", "Caracterização do imóvel avaliando", String(C.G[0])], ["2", "Quantidade mínima de dados de mercado utilizados", `${C.N} dados · ${C.G[1]}`], ["3", "Identificação dos dados de mercado", String(C.G[2])], ["4", "Intervalo admissível do conjunto de fatores", String(C.G[3])], ["", "Total", `${C.pts} pontos · Grau ${C.fund}`], ["", "Precisão (amplitude do IC 80%)", `${(C.amp * 100).toFixed(1)}% · Grau ${C.precisao}`]], [900, 5300, 2800]); }
    h(`${C.ok ? 5 : 4}. Premissas e ressalvas`);
    t("A avaliação considera o imóvel livre e desembaraçado de ônus, salvo os indicados, com documentação regular, e as informações fornecidas pelo contratante como verdadeiras. Não foram feitas pesquisas em órgãos públicos além dos documentos recebidos, nem levantamentos topográficos ou estruturais. As amostras são ofertas e transações publicadas, identificadas por fonte, sujeitas à variação de mercado.");
    if (/PPA|CPC 15|CPC 28|12\.973/.test(im.finalidade || "")) t(`Para fins contábeis, o valor de mercado corresponde ao valor justo (CPC 46). Valor contábil informado: ${im.contabil != null && im.contabil !== "" ? brl(im.contabil) : "[a informar]"}${R.mv != null ? `; ${R.mv >= 0 ? "mais-valia" : "menos-valia"} de ${brl(Math.abs(R.mv))}` : ""}.`);
    h(`${C.ok ? 6 : 5}. Resultado`); t(`Valor de mercado na data-base de ${dBR(im.dataBase)}: ${R.valor != null ? brl(R.valor) : "[a apurar]"}${C.ok ? ` (campo de arbítrio de ${brl(C.arbitrio[0])} a ${brl(C.arbitrio[1])})` : ""}.`, {b:true});
    h("Responsáveis"); assin().forEach(a => { P.push({t:"______________________________________________", jc:"left", before:360, after:0}); t(a.nome, {b:true, jc:"left", after:0}); t([a.papel, a.registro].filter(Boolean).join(" · "), {jc:"left"}); });
    if (C.ok){ h("Anexo · Homogeneização das amostras");
      tb([["Nº", "Fonte · endereço", "Área m²", "R$/m²", "Oferta", "Área", "Loc.", "Padrão", "Conserv.", "Vagas", "Andar", "Homog. R$/m²", "Situação"], ...C.L.map((x, i) => [String(i + 1), `${x.a.fonte || ""}${x.a.endereco ? " · " + x.a.endereco : ""}${x.a.url ? " · " + x.a.url : ""}`, f2(x.a.area), f2(x.unit), f2(x.F.oferta), f2(x.F.area), f2(x.F.loc), f2(x.F.padrao), f2(x.F.conserv), f2(x.F.vagas), f2(x.F.andar), f2(x.homog), C.excl.includes(x) ? "excluída" : "utilizada"])],
        [420, 2300, 650, 800, 500, 500, 500, 520, 560, 500, 500, 850, 650]); }
    const bytes = KT_DOCX.build(P, {header:`Laudo de avaliação de imóvel · ${im.nome || ""} · data-base ${dBR(im.dataBase)}`, headerColor:"5A6578", titulo:"Laudo de avaliação de imóvel"});
    await rptSave(bytes, `Laudo_imovel_${(im.nome || "imovel").replace(/[^\wÀ-ú]+/g, "_").slice(0, 30)}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }
  async function memorando(s, im){
    const Rv = im.terceiro?.revisao; if (!Rv) return; const P = [], t = (x, o = {}) => P.push({t:x, ...o}), h = x => P.push({t:x, b:true, keep:true, before:200});
    t("MEMORANDO DE REVISÃO DE LAUDO DE AVALIAÇÃO", {b:true, jc:"center", sz:26, after:80}); t(`${marca()} · ${new Date().toLocaleDateString("pt-BR")}`, {jc:"center", after:240});
    t(`Assunto: revisão do laudo "${im.terceiro.arquivo || ""}" sobre o imóvel ${im.nome || im.endereco || ""}${im.terceiro.valor ? `, que conclui pelo valor de mercado de ${brl(im.terceiro.valor)}` : ""}.`);
    h("Pontos verificados"); P.push({table:{rows:[["Situação", "Verificação"], ...Rv.itens.map(x => [x.c ? "Conforme" : "Atenção", x.txt])], head:true, widths:[1500, 7500]}});
    h("Conclusão"); t(`O laudo ${Rv.conclusao}${Rv.conclusao !== "atende" ? "; os pontos de atenção devem ser esclarecidos pelo emissor antes do uso" : ""}. ${im.terceiro.valor && /PPA|CPC/.test(im.finalidade || "") ? `Aceito o valor, ele será o valor justo do imóvel no PPA${im.contabil != null && im.contabil !== "" ? ` (mais ou menos-valia de ${brl(im.terceiro.valor - n(im.contabil))})` : ""}.` : ""}`, {b:true});
    t("Revisão técnica de conformidade e coerência; não substitui nova avaliação.", {i:true});
    h("Responsáveis pela revisão"); assin().forEach(a => { P.push({t:"______________________________________________", jc:"left", before:300, after:0}); t(a.nome, {b:true, jc:"left", after:0}); t([a.papel, a.registro].filter(Boolean).join(" · "), {jc:"left"}); });
    await rptSave(KT_DOCX.build(P, {header:`Memorando de revisão · ${im.nome || ""}`, headerColor:"5A6578", titulo:"Memorando de revisão de laudo"}), `Memorando_revisao_laudo_${(im.nome || "imovel").replace(/[^\wÀ-ú]+/g, "_").slice(0, 30)}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }
  async function excel(s, im){
    const R = resultado(im), C = R.C, H = v => ({v, s:"h"}), T = v => ({v, s:"t"}), B = v => ({v, s:"b"});
    const abas = [{nome:"Homogeneização", larguras:[6, 34, 40, 12, 14, 14, 9, 9, 9, 9, 9, 9, 9, 10, 14, 12], linhas:[[T(`Homogeneização · ${im.nome || ""}`)], [`Data-base ${dBR(im.dataBase)} · área avaliada ${f2(areaAval(im))} m² · NBR 14653-2, tratamento por fatores`], [],
      [H("Nº"), H("Fonte"), H("Endereço · URL"), H("Área"), H("Preço"), H("R$/m²"), H("Oferta"), H("Área"), H("Local"), H("Padrão"), H("Conserv."), H("Vagas"), H("Andar"), H("Combinado"), H("Homog. R$/m²"), H("Situação")],
      ...(C.L || []).map((x, i) => [i + 1, x.a.fonte || "", [x.a.endereco, x.a.url].filter(Boolean).join(" · "), n(x.a.area), n(x.a.preco), x.unit, x.F.oferta, x.F.area, x.F.loc, x.F.padrao, x.F.conserv, x.F.vagas, x.F.andar, x.comb, x.homog, C.excl.includes(x) ? "excluída (Chauvenet)" : "utilizada"]), [],
      ...(C.ok ? [["", B("Média saneada R$/m²"), "", "", "", B(C.media)], ["", "Desvio-padrão", "", "", "", C.sd], ["", "IC 80% (mín · máx)", "", "", "", C.ic[0], C.ic[1]], ["", "Amplitude do IC", "", "", "", {v:C.amp, s:"p"}], ["", `Grau de fundamentação ${C.fund} (${C.pts} pontos) · precisão ${C.precisao}`], ["", B("Valor de mercado"), "", "", "", B(C.arred)]] : [["", C.motivo || ""]])]}];
    await rptSave(KT_XLSX.gerar(abas), `Imovel_${(im.nome || "imovel").replace(/[^\wÀ-ú]+/g, "_").slice(0, 30)}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  /* ---------------- tela ---------------- */
  const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
  function html(s){
    const L = lista(s), ed = D.ed() ? "" : "disabled"; let im = L.find(x => x.id === S.imSel) || L[0]; if (im) S.imSel = im.id;
    const head = `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">NBR 14653 · CPC 15 · CPC 28 · CPC 46</div><h3 style="margin:0">Avaliação de imóveis</h3>
      <p class="sub" style="margin:2px 0 0">Importe a matrícula, a escritura e o IPTU; inclua as amostras de mercado com a fonte; o sistema homogeneíza, saneia, enquadra os graus da NBR 14653-2 e emite o laudo para o engenheiro responsável revisar. Também revisa laudos de terceiros.</p></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${L.length ? `<select id="im-sel">${L.map(x => `<option value="${x.id}" ${x.id === im?.id ? "selected" : ""}>${esc(x.nome || x.endereco || "Imóvel")}</option>`).join("")}</select>` : ""}${D.ed() ? `<button type="button" class="btn sm primary" id="im-novo">+ Novo imóvel</button>` : ""}</div></div>`;
    if (!im) return head + `<div class="empty">Nenhum imóvel cadastrado para este target.</div>`;
    const R = resultado(im), C = R.C, E = R.E, f = (id, l, v, o = {}) => `<div class="fld ${o.full ? "full" : ""}"><label for="im-${id}">${l}</label><input id="im-${id}" ${o.num ? 'inputmode="decimal"' : ""} ${o.type ? `type="${o.type}"` : ""} value="${esc(typeof v === "number" ? String(v).replace(".", ",") : v ?? "")}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ""} ${ed}></div>`;
    const q = encodeURIComponent([im.bairro, im.cidade].filter(Boolean).join(" ")), tipoQ = encodeURIComponent((im.tipo || "imóvel").toLowerCase());
    return head + `<form class="card" id="im-f" style="display:flex;flex-direction:column;gap:10px" novalidate><div class="head" style="margin:0"><div><h3 style="margin:0">${esc(im.nome || "Imóvel")}</h3><p class="sub" style="margin:2px 0 0">Documentos lidos: ${esc((im.docs || []).map(d => d.tipo + " (" + d.arquivo + ")").join(", ") || "nenhum")}</p></div>
        <label class="btn sm primary">Importar matrícula, escritura ou IPTU<input type="file" id="im-doc" accept=".pdf,.docx,.txt" hidden ${ed}></label></div>
      ${(im.onus || []).length ? `<div class="banner" style="font-size:13px"><b>Ônus na matrícula:</b> ${esc(im.onus.join(", "))}${im.onusNota ? ` · ${esc(im.onusNota)}` : ""}</div>` : ""}
      <div class="form">${f("nome", "Identificação", im.nome)}<div class="fld"><label for="im-tipo">Tipo</label><select id="im-tipo" ${ed}>${TIPOS.map(x => `<option ${x === im.tipo ? "selected" : ""}>${x}</option>`).join("")}</select></div>
        <div class="fld"><label for="im-fin">Finalidade</label><select id="im-fin" ${ed}>${FINS.map(x => `<option ${x === im.finalidade ? "selected" : ""}>${x}</option>`).join("")}</select></div>${f("db", "Data-base", im.dataBase, {type:"date"})}
        ${f("end", "Endereço", im.endereco, {full:true})}${f("bai", "Bairro", im.bairro)}${f("cid", "Cidade", im.cidade)}${f("uf", "UF", im.uf)}${f("mat", "Matrícula", im.matricula)}${f("cart", "Cartório", im.cartorio)}${f("insc", "Inscrição IPTU", im.inscricao)}
        ${f("at", "Área do terreno (m²)", im.areaTerreno, {num:1})}${f("ac", "Área construída (m²)", im.areaConstruida, {num:1})}${f("ap", "Área privativa (m²)", im.areaPrivativa, {num:1})}${f("vg", "Vagas", im.vagas, {num:1})}${f("an", "Andar", im.andar, {num:1})}${f("ano", "Ano de construção", im.ano, {num:1})}
        <div class="fld"><label for="im-est">Estado de conservação</label><select id="im-est" ${ed}>${HEID.map(([c, l]) => `<option value="${c}" ${c === (im.estado || "c") ? "selected" : ""}>${c} · ${l}</option>`).join("")}</select></div>
        ${f("vv", "Valor venal IPTU (R$)", im.valorVenal, {num:1})}${f("if", "Índice fiscal (R$/m² do IPTU)", im.indiceFiscal, {num:1})}${f("ct", "Valor contábil (R$)", im.contabil, {num:1})}
        ${f("of", "Fator de oferta", im.param?.oferta ?? .9, {num:1})}${f("pv", "Ajuste por vaga (%)", im.param?.vaga ?? 5, {num:1})}
        <div class="fld"><label for="im-c1">Caracterização do avaliando</label><select id="im-c1" ${ed}>${[[3, "Completa (todas as variáveis)"], [2, "Completa nos fatores usados"], [1, "Situação paradigma"]].map(([v, l]) => `<option value="${v}" ${+(im.param?.carac || 2) === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="fld"><label for="im-c3">Identificação das amostras</label><select id="im-c3" ${ed}>${[[3, "Todas as características, com foto e vistoria"], [2, "Todas as características"], [1, "Só os fatores usados"]].map(([v, l]) => `<option value="${v}" ${+(im.param?.ident || 2) === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="fld"><label for="im-met">Método do resultado</label><select id="im-met" ${ed}><option value="" ${!im.metodo ? "selected" : ""}>Automático (comparativo com 3 ou mais amostras)</option><option value="comparativo" ${im.metodo === "comparativo" ? "selected" : ""}>Comparativo de dados de mercado</option><option value="evolutivo" ${im.metodo === "evolutivo" ? "selected" : ""}>Evolutivo</option><option value="terceiro" ${im.metodo === "terceiro" ? "selected" : ""}>Laudo de terceiro revisado</option></select></div></div>
      <details ${E.ok ? "open" : ""}><summary class="sub">Método evolutivo (terreno + benfeitorias)</summary><div class="form" style="margin-top:8px">${f("tm2", "Terreno (R$/m²)", im.evol?.terrenoM2, {num:1})}${f("cub", "CUB (R$/m², Sinduscon)", im.evol?.cub, {num:1})}${f("bdi", "BDI (%)", im.evol?.bdi ?? 25, {num:1})}${f("fc", "Fator de comercialização", im.evol?.fc ?? 1, {num:1})}</div></details>
      ${D.ed() ? `<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn sm ghost" id="im-del">Excluir imóvel</button><button type="submit" class="btn sm primary">Salvar dados</button></div>` : ""}</form>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3 style="margin:0">Pesquisa de mercado</h3><p class="sub" style="margin:2px 0 0">Inclua imóveis semelhantes na região com a fonte (portal, imobiliária, corretor) e o endereço do anúncio. Ofertas recebem o fator de oferta; transações, 1,00.</p></div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="sub" style="font-size:12px;align-self:center">Pesquisar em:</span>${[["ZAP Imóveis", `https://www.zapimoveis.com.br/venda/?transacao=venda&onde=${q}`], ["VivaReal", `https://www.vivareal.com.br/venda/?q=${q}`], ["Imovelweb", `https://www.imovelweb.com.br/imoveis-venda-q-${q}.html`], ["OLX", `https://www.olx.com.br/imoveis/venda?q=${tipoQ}%20${q}`], ["Mapa", `https://www.google.com/maps/search/${encodeURIComponent([im.endereco, im.cidade].filter(Boolean).join(" "))}`]].map(([l, u]) => `<a class="btn sm ghost" href="${u}" target="_blank" rel="noopener">${l}</a>`).join("")}</div>
        <div class="tbl" style="overflow:auto"><table><thead><tr><th>Nº</th><th>Fonte · endereço</th><th class="dd-num">Área</th><th class="dd-num">Preço</th><th class="dd-num">R$/m²</th><th class="dd-num">Fator comb.</th><th class="dd-num">Homog.</th><th></th></tr></thead><tbody>${(C.L || (im.amostras || []).map(a => ({a, ...fatores(im, a), homog:0}))).map((x, i) => `<tr ${C.excl?.includes(x) ? 'style="opacity:.55"' : ""}><td>${i + 1}</td><td>${x.a.url ? `<a href="${esc(x.a.url)}" target="_blank" rel="noopener">${esc(x.a.fonte || "anúncio")}</a>` : esc(x.a.fonte || "")}<div class="sub" style="margin:0;font-size:11.5px">${esc(x.a.endereco || "")} · ${esc(x.a.tipoDado || "oferta")}${C.excl?.includes(x) ? " · excluída (Chauvenet)" : ""}</div></td><td class="dd-num">${f2(x.a.area)}</td><td class="dd-num">${brl(x.a.preco)}</td><td class="dd-num">${f2(x.unit)}</td><td class="dd-num">${f2(x.comb, 3)}</td><td class="dd-num">${x.homog ? f2(x.homog) : "—"}</td><td>${D.ed() ? `<button type="button" class="btn sm ghost" data-amdel="${i}">Excluir</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="8" class="sub">Nenhuma amostra.</td></tr>`}</tbody></table></div>
        ${D.ed() ? `<form id="am-f" class="form" novalidate>${[["fo", "Fonte (portal, imobiliária)"], ["ur", "Endereço do anúncio (URL)"], ["en", "Endereço da amostra"], ["ar", "Área (m²)", 1], ["pr", "Preço (R$)", 1], ["ano", "Ano de construção", 1], ["vg", "Vagas", 1], ["fl", "Fator localização (vazio = índice fiscal)", 1], ["ifs", "Índice fiscal da amostra (R$/m²)", 1], ["fp", "Fator padrão", 1], ["fa", "Fator andar", 1]].map(([id, l, nm]) => `<div class="fld"><label for="am-${id}">${l}</label><input id="am-${id}" ${nm ? 'inputmode="decimal"' : ""}></div>`).join("")}
          <div class="fld"><label for="am-td">Tipo do dado</label><select id="am-td"><option value="oferta">Oferta</option><option value="transação">Transação</option></select></div><div class="fld"><label for="am-es">Conservação</label><select id="am-es">${HEID.map(([c, l]) => `<option value="${c}" ${c === "c" ? "selected" : ""}>${c} · ${l}</option>`).join("")}</select></div>
          <div class="fld full"><label for="am-cola">Ou cole o texto do anúncio (o sistema tenta ler preço, área e endereço)</label><textarea id="am-cola" rows="2"></textarea></div><div class="fld full"><button type="submit" class="btn sm">Incluir amostra</button></div></form>` : ""}</div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3 style="margin:0">Resultado</h3>
        ${C.ok ? `<div class="dd-kpis">${k("Valor de mercado", brl(C.arred), `${f2(C.media)}/m² × ${f2(C.Aa)} m²`)}${k("Campo de arbítrio ±15%", `${mi(C.arbitrio[0])} a ${mi(C.arbitrio[1])}`)}${k("Fundamentação", `Grau ${C.fund}`, `${C.pts} pontos · ${C.N} dados`)}${k("Precisão", `Grau ${C.precisao}`, `amplitude do IC 80%: ${(C.amp * 100).toFixed(1)}%`)}</div>` : `<p class="sub" style="margin:0">Comparativo: ${esc(C.motivo)}.</p>`}
        ${E.ok ? `<p class="sub" style="margin:0;font-size:12.5px">Evolutivo: terreno ${brl(E.terreno)} + benfeitorias ${brl(E.benf)} (depreciação ${(E.K * 100).toFixed(1)}%) × FC ${f2(E.fc)} = <b>${brl(E.valor)}</b>${C.ok ? ` (${((E.valor / C.arred - 1) * 100).toFixed(1)}% do comparativo)` : ""}.</p>` : ""}
        ${R.valor != null ? `<p style="margin:0">Valor adotado (${R.met}): <b>${brl(R.valor)}</b>${R.mv != null ? ` · ${R.mv >= 0 ? "mais-valia" : "menos-valia"} de <b>${brl(Math.abs(R.mv))}</b> sobre o contábil de ${brl(im.contabil)}` : ""}</p>` : ""}
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="im-laudo">Laudo (Word)</button><button type="button" class="btn sm" id="im-xl">Homogeneização (Excel)</button>${D.ed() ? `<button type="button" class="btn sm" id="im-ppa" ${R.mv != null ? "" : "disabled"}>Levar a mais ou menos-valia ao PPA</button>` : ""}</div></div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3 style="margin:0">Laudo de terceiro</h3><p class="sub" style="margin:0">Importe o laudo de outro avaliador (ou do engenheiro em trabalho separado): o sistema confere norma, data-base, ART, graus, amostras, saneamento, vistoria, documentação e coerência do valor, e emite o memorando de revisão.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn sm primary">Importar laudo de terceiro (PDF ou Word)<input type="file" id="im-ter" accept=".pdf,.docx,.txt" hidden ${ed}></label>${im.terceiro?.revisao ? `<button type="button" class="btn sm" id="im-memo">Memorando de revisão (Word)</button>` : ""}</div>
        ${im.terceiro?.revisao ? `<p style="margin:0;font-size:13px">${esc(im.terceiro.arquivo)} · valor ${im.terceiro.valor ? brl(im.terceiro.valor) : "não identificado"} · <b>${esc(im.terceiro.revisao.conclusao)}</b></p><ul style="margin:0;padding-left:18px">${im.terceiro.revisao.itens.map(x => `<li style="font-size:12.5px;margin:2px 0;color:${x.c ? "inherit" : "var(--warn,#F2C14E)"}">${esc(x.txt)}</li>`).join("")}</ul>` : ""}</div>`;
  }
  async function textoArq(fl){ if (window.KT_AUTO?.texto) return KT_AUTO.texto(fl); if (window.KT_OPDOC) return (await KT_OPDOC.lerArquivo(fl)).join("\n"); return ""; }
  function bind(host, s){
    const L = () => lista(supById(s.id) || s), im = () => L().find(x => x.id === S.imSel), up = async patch => { await salvaLista(s, L().map(x => x.id === S.imSel ? {...x, ...patch} : x)); };
    const sel = $("#im-sel", host); if (sel) sel.onchange = () => { S.imSel = sel.value; renderView(); };
    const nv = $("#im-novo", host); if (nv) nv.onclick = async () => { const id = novoId(); await salvaLista(s, [...L(), {id, nome:`Imóvel ${L().length + 1}`, tipo:"Galpão ou armazém", finalidade:FINS[0], dataBase:s.ativos?.dataBase || "", amostras:[], criadoEm:nowISO(), por:eu()}]); S.imSel = id; renderView(); };
    const fm = $("#im-f", host); if (fm) fm.onsubmit = async e => { e.preventDefault(); const v = id => $("#im-" + id, host).value.trim(), nn = id => v(id) === "" ? null : n(v(id));
      await up({nome:v("nome"), tipo:v("tipo"), finalidade:v("fin"), dataBase:v("db"), endereco:v("end"), bairro:v("bai"), cidade:v("cid"), uf:v("uf").toUpperCase(), matricula:v("mat"), cartorio:v("cart"), inscricao:v("insc"),
        areaTerreno:nn("at"), areaConstruida:nn("ac"), areaPrivativa:nn("ap"), vagas:nn("vg"), andar:nn("an"), ano:nn("ano"), estado:v("est"), valorVenal:nn("vv"), indiceFiscal:nn("if"), contabil:nn("ct"), metodo:v("met"),
        param:{oferta:nn("of") ?? .9, vaga:nn("pv") ?? 5, carac:+v("c1"), ident:+v("c3")}, evol:{terrenoM2:nn("tm2"), cub:nn("cub"), bdi:nn("bdi") ?? 25, fc:nn("fc") ?? 1}}); toast("Dados do imóvel salvos"); };
    const dl = $("#im-del", host); if (dl) dl.onclick = async () => { if (!confirm("Excluir este imóvel e as amostras?")) return; await salvaLista(s, L().filter(x => x.id !== S.imSel)); S.imSel = null; renderView(); };
    const dc = $("#im-doc", host); if (dc) dc.onchange = async () => { const fl = dc.files[0]; if (!fl) return; try{ const t = await textoArq(fl), o = lerDocumento(t), cur = im();
        const tipo = /iptu|valor venal|contribuinte/i.test(t) ? "IPTU" : /escritura|tabeli[aã]o|outorgante/i.test(t) ? "Escritura" : /matr[ií]cula|registro de im[oó]veis/i.test(t) ? "Matrícula" : "Documento";
        const patch = {docs:[...(cur.docs || []), {tipo, arquivo:fl.name, em:nowISO(), achou:o.achou}]}; ["matricula", "cartorio", "inscricao", "areaTerreno", "areaConstruida", "areaPrivativa", "valorVenal", "endereco", "ano"].forEach(k2 => { if (o[k2] != null && (cur[k2] == null || cur[k2] === "")) patch[k2] = o[k2]; });
        if (o.onus) patch.onus = [...new Set([...(cur.onus || []), ...o.onus])]; if (o.onusNota) patch.onusNota = o.onusNota; if (o.proprietario && !cur.proprietario) patch.proprietario = o.proprietario;
        if (patch.valorVenal && (patch.areaConstruida || cur.areaConstruida || patch.areaTerreno || cur.areaTerreno) && !cur.indiceFiscal) patch.indiceFiscal = +(patch.valorVenal / (patch.areaConstruida || cur.areaConstruida || patch.areaTerreno || cur.areaTerreno)).toFixed(2);
        await up(patch); toast(`${tipo} lido: ${o.achou.join(", ") || "nenhum campo reconhecido"}`); }catch(x){ console.error(x); toast("Não foi possível ler o documento (PDF digitalizado não é lido)."); } };
    const af = $("#am-f", host); if (af) af.onsubmit = async e => { e.preventDefault(); const v = id => $("#am-" + id, host).value.trim(), nn = id => v(id) === "" ? null : n(v(id)), cola = v("cola");
      let a = {fonte:v("fo"), url:v("ur"), endereco:v("en"), area:nn("ar"), preco:nn("pr"), ano:nn("ano"), vagas:nn("vg"), fLoc:nn("fl"), indiceFiscal:nn("ifs"), fPadrao:nn("fp"), fAndar:nn("fa"), tipoDado:v("td"), estado:v("es"), em:nowISO(), por:eu()};
      if (cola){ const p = cola.match(/R\$\s*([\d.]+(?:,\d{2})?)/), ar = cola.match(/([\d.]+(?:,\d+)?)\s*m[²2]/i), u = cola.match(/https?:\/\/\S+/), en = cola.match(/((?:rua|avenida|av\.|alameda|travessa|estrada)\s+[^,\n]{3,60}(?:,\s*\d+)?)/i), vg = cola.match(/(\d+)\s*vagas?/i);
        a = {...a, preco:a.preco ?? (p ? n(p[1]) : null), area:a.area ?? (ar ? n(ar[1]) : null), url:a.url || (u ? u[0] : ""), endereco:a.endereco || (en ? en[1] : ""), vagas:a.vagas ?? (vg ? +vg[1] : null), fonte:a.fonte || (u ? new URL(u[0]).hostname.replace(/^www\./, "") : "anúncio colado")}; }
      if (!(a.preco > 0) || !(a.area > 0)){ toast("Informe o preço e a área da amostra."); return; }
      await up({amostras:[...(im().amostras || []), a]}); toast("Amostra incluída"); };
    $$("[data-amdel]", host).forEach(b => b.onclick = async () => { const C = comparativo(im()), x = C.L ? C.L[+b.dataset.amdel].a : (im().amostras || [])[+b.dataset.amdel]; await up({amostras:(im().amostras || []).filter(a => a !== x && !(a.em === x.em && a.preco === x.preco))}); });
    const ld = $("#im-laudo", host); if (ld) ld.onclick = () => laudo(supById(s.id) || s, im()).catch(e => { console.error(e); toast("Não foi possível gerar o laudo."); });
    const xl = $("#im-xl", host); if (xl) xl.onclick = () => excel(s, im()).catch(e => { console.error(e); toast("Não foi possível gerar a planilha."); });
    const pp = $("#im-ppa", host); if (pp) pp.onclick = async () => { const tot = L().map(x => resultado(x)).filter(r => r.mv != null).reduce((t, r) => t + r.mv, 0);
      await D.up(s, {pos:{ppa:{imoveis:+(tot / 1e6).toFixed(4), imoveisFonte:`Avaliação de imóveis: ${L().length} imóvel(is), ${mi(tot)} em ${new Date().toLocaleDateString("pt-BR")}`}}}); toast(`Mais ou menos-valia de imóveis (${mi(tot)}) levada ao PPA`); };
    const tr = $("#im-ter", host); if (tr) tr.onchange = async () => { const fl = tr.files[0]; if (!fl) return; try{ const t = await textoArq(fl), cur = im(), Rv = revisarLaudo(t, cur);
        await up({terceiro:{arquivo:fl.name, em:nowISO(), valor:Rv.valor, revisao:Rv}}); toast(`Laudo revisado: ${Rv.conclusao}`); }catch(x){ console.error(x); toast("Não foi possível ler o laudo."); } };
    const mm = $("#im-memo", host); if (mm) mm.onclick = () => memorando(supById(s.id) || s, im()).catch(e => { console.error(e); toast("Não foi possível gerar o memorando."); });
  }
  (window.KT_ATV_ABAS ||= []).push(["imo", "Imóveis", {html, bind}]);
  window.KT_IMOV = {lerDocumento, fatores, comparativo, evolutivo, resultado, revisarLaudo, laudo, memorando, ross};
})();
