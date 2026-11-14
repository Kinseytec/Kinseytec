/* ================= RELATÓRIO DE PONTOS =================
   PDF para o cliente contratante (quando liberado pelo administrador) · PDF e PowerPoint para o administrador.
   Geradores próprios (sem bibliotecas externas). */
const RPT_EXT = [];   /* seções extras do PDF por segmento */
const SEG_NOME = (document.title || "").replace(/^KinseyTec\s*[–-]\s*/, "").trim();
const rptFile = ext => `KinseyTec_${SEG_NOME.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ e /g, "_").replace(/[^A-Za-z0-9]+/g, "_")}_Relatorio_de_Pontos_${new Date().toISOString().slice(0,10)}.${ext}`;
const rptIsAdmin = () => Store.me?.role === "admin";
const rptCfg = () => S.config.relatorio || {};
const rptAllowed = () => rptIsAdmin() || rptCfg().clientePdf !== false;

/* Recomendação e base normativa por tipo de ponto (texto do motivo de risco) */
const RPT_REC = [
 [/lista suja|escravo|Cadastro de Empregadores/i, "Suspender novas compras até a verificação; consultar o Cadastro de Empregadores a cada atualização e exigir plano de remediação documentado.", "CP art. 149; Cadastro de Empregadores (MTE); Lei 12.846/2013"],
 [/infantil|menores|crianças|adolescentes/i, "Inspeção sem aviso na safra; afastamento imediato de menores das atividades proibidas e plano de remediação com a família e a comunidade.", "CF art. 7º, XXXIII; ECA (Lei 8.069/1990); Decreto 6.481/2008 (Lista TIP)"],
 [/aliciamento|gato|outros estados/i, "Exigir contratação direta e registrada, sem intermediários; entrevistar os trabalhadores e conferir transporte e alojamento.", "CP arts. 149 e 207; CLT; NR-31"],
 [/alojamento|NR-31|moradia|vivência|descont/i, "Inspecionar alojamentos, água, banheiros e descontos em folha; exigir adequação com prazo e nova verificação.", "NR-31; CLT; CP art. 149"],
 [/Terra Indígena|Unidade de Conservação|quilombol|territ/i, "Bloquear a origem sobreposta e confirmar com FUNAI, INCRA e ICMBio antes de qualquer compra.", "CF art. 231; ADCT art. 68; Lei 9.985/2000 (SNUC); Convenção 169 da OIT"],
 [/desmat|PRODES|DETER|supress|embarg/i, "Bloquear fazendas com alerta ou embargo; exigir polígono georreferenciado e análise de satélite datada de cada origem.", "Lei 12.651/2012; Decreto 6.514/2008, art. 54; Regulamento (UE) 2023/1115 (EUDR)"],
 [/\bCAR\b|polígono/i, "Exigir o recibo do CAR ativo e o polígono da área; comparar com imagens de satélite e embargos.", "Lei 12.651/2012 (Código Florestal); Regulamento (UE) 2023/1115"],
 [/GTA|lavagem de gado|indiret|nascimento/i, "Reconstruir a cadeia por GTA até a fazenda de nascimento e checar CAR, PRODES e embargos de cada elo.", "TAC da Carne (MPF); normas de trânsito animal; Decreto 6.514/2008, art. 54"],
 [/receptação|furt|roub|concessionária|queimado|descascado|marcação|roubo de carga/i, "Recusar e documentar material suspeito; exigir cadastro do vendedor e documento de origem; comunicar as autoridades quando houver indício de crime.", "CP arts. 155, 180 e 265; Lei 12.305/2010"],
 [/revestido|composição|desbitolado|INMETRO/i, "Teste de raspagem e laudo de composição por lote; exigir certificação dos cabos revendidos.", "Lei 9.933/1999 (metrologia e certificação); CDC (Lei 8.078/1990)"],
 [/dinheiro|espécie|lavagem/i, "Exigir pagamentos bancários identificados; limitar pagamentos em espécie e reportar operações atípicas.", "Lei 9.613/1998 (lavagem de dinheiro); Lei 12.846/2013"],
 [/licença|alvará|MTR|cadastro de compra/i, "Exigir licença ambiental, alvará e cadastros vigentes no endereço da operação; suspender compras até a regularização.", "Lei 6.938/1981; Lei 12.305/2010; legislação estadual e municipal"],
 [/branqueamento|Boas Práticas|sanit|laudo/i, "Exigir Boas Práticas, branqueamento e laudos válidos; auditar a cadeia fria.", "RDC Anvisa 275/2002; normas sanitárias estaduais"],
 [/preço mínimo|PGPM|endivid|aviamento/i, "Comparar recibos com o preço mínimo e verificar adiantamentos e dívidas do extrativista.", "Lei 8.427/1992; PGPM-Bio (Conab); CP art. 149"],
 [/Moratória/i, "Manter o monitoramento independente de desmatamento e registrar o status judicial na data de cada parecer.", "Moratória da Soja (pacto setorial em discussão no STF); Regulamento (UE) 2023/1115"],
 [/certifica/i, "Conferir validade e escopo do certificado e o balanço de massa dos lotes certificados.", "CC art. 422 (boa-fé); regras do esquema certificador"],
 [/PEP|político/i, "Aplicar diligência reforçada: origem de recursos, conflitos de interesse e aprovação da alta direção.", "Lei 9.613/1998; Lei 12.846/2013; Decreto 11.129/2022"],
 [/preso|investiga|operação|inquérito|processo|crimin/i, "Avaliar o mérito dos processos; incluir cláusula de rescisão e declaração de integridade; monitorar os desdobramentos.", "Lei 12.846/2013; Decreto 11.129/2022; CC arts. 474 e 475"],
 [/CNPJ|inapt|baixad|aberto há|fachada|sócios que abrem|abre e fecha/i, "Confirmar sede, operação e quadro societário na Receita Federal e na Junta Comercial; visitar o endereço.", "IN RFB 2.119/2022 (CNPJ); Lei 12.846/2013"],
 [/dívida|PGFN|protesto/i, "Avaliar a capacidade financeira e a continuidade do fornecedor; exigir certidões negativas atualizadas.", "Certidões RFB/PGFN; Lei 6.830/1980"],
 [/trabalhis|eSocial|registro de empregados/i, "Conferir registros no eSocial e certidão de débitos trabalhistas (CNDT).", "CLT; Lei 12.440/2011 (CNDT)"],
 [/Balanço de massa|estoque/i, "Conciliar estoques, compras e vendas; investigar compras sem nota ou origens misturadas.", "NBC TA 500 e NBC TA 520 (evidência e procedimentos analíticos)"],
 [/Volume vendido|capacidade|produtividade|área/i, "Comparar o volume vendido com a capacidade da área ou do pátio; pedir explicação documentada.", "NBC TA 520 (procedimentos analíticos)"],
 [/preço|cotação/i, "Investigar o preço muito abaixo do mercado: pode indicar origem irregular ou subfaturamento.", "Lei 9.613/1998; CC art. 422"],
 [/reprovado|cláusula|Contrat/i, "Renegociar o contrato com as cláusulas essenciais e emitir novo parecer jurídico.", "CC arts. 421, 422, 474 e 475; Lei 12.846/2013"],
 [/foto|GPS|km|Existência/i, "Realizar inspeção presencial com fotos originais, data e GPS no local declarado.", "NBC TA 500 (evidência de auditoria); NBC TO 3000"],
 [/NDA|LGPD/i, "Obter o aceite do NDA e do termo LGPD antes de compartilhar dados.", "Lei 13.709/2018 (LGPD)"],
 [/Questionário com|respostas/i, "Cobrar as respostas pendentes em prazo definido; sem resposta, classificar como risco.", "Política de due diligence do cliente; NBC TO 3000"],
 [/nota|NF/i, "Conferir a chave de cada nota no portal da NF-e e a compatibilidade com o estoque.", "Legislação do ICMS e da NF-e (SEFAZ); Lei 8.137/1990"]
];
const RPT_DEF = [null, "Avaliar o ponto com o fornecedor e documentar a conclusão e o plano de ação.", "Política de due diligence do cliente; NBC TO 3000"];
function rptLabel(crit, t){
  const g = [[/^Apenas \d+ de 3 fotos/, "Menos de 3 fotos mínimas de mercadoria e instalações"], [/^CNPJ aberto há/, "CNPJ aberto há menos de 2 anos"], [/^Questionário com/, "Questionário com menos da metade das respostas"],
    [/tiradas a mais de 5 km/, "Fotos tiradas a mais de 5 km do local declarado"], [/^Balanço de massa não fecha/, "Balanço de massa não fecha (diferença acima de 5%)"], [/^Volume vendido/, "Volume vendido acima da capacidade da área"],
    [/abaixo da cotação/, "Contrato com preço mais de 20% abaixo da cotação de referência"], [/reprovado pelo Jurídico/, "Contrato reprovado pelo Jurídico"]].find(([re]) => re.test(t));
  if (g) return g[1];
  return crit === "Questionário" ? t : t.replace(/ — .*$/, "");
}
function rptData(){
  const L = S.suppliers.map(s => ({s, r:riskOf(s)})), dist = {alto:0, medio:0, baixo:0, pend:0}, map = new Map();
  L.forEach(({s, r}) => { dist[r.level]++; r.reasons.forEach(x => { const lab = rptLabel(x.crit, x.txt), k = x.crit + "|" + lab; let f = map.get(k);
    if (!f){ f = {crit:x.crit, txt:lab, pts:0, max:0, sups:[]}; map.set(k, f); } f.pts += x.pts; f.max = Math.max(f.max, x.pts); if (!f.sups.includes(s)) f.sups.push(s); }); });
  const pontos = [...map.values()].map(f => { const ru = RPT_REC.find(([re]) => re.test(f.crit + " " + f.txt)) || RPT_DEF; return {...f, sev: f.max >= 4 ? "Alta" : f.max >= 2 ? "Média" : "Baixa", rec:ru[1], norma:ru[2]}; })
    .sort((a,b) => (b.max - a.max) || (b.sups.length - a.sups.length) || (b.pts - a.pts));
  const st = k => S.pareceres[k.id]?.status || "pendente";
  const contratos = S.contracts.map(k => { const p = S.pareceres[k.id], s = supById(k.supplierId), falta = p?.clausulas ? CLAUSES.filter(([cid]) => !p.clausulas[cid]) : [];
    return {k, s, status:st(k), falta, crit: falta.filter(([cid]) => clauseInfo(cid)?.[2]), adv: p?.advogado?.nome ? p.advogado : null}; });
  const normas = new Set(); pontos.forEach(p => p.norma.split("; ").forEach(n => normas.add(n)));
  if (typeof CLAUSE_INFO !== "undefined") Object.values(CLAUSE_INFO).forEach(([b]) => b.split("; ").forEach(n => normas.add(n)));
  const niv = l => S.suppliers.filter(s => s.nivel === l).length;
  return {L, dist, pontos, contratos, normas:[...normas].sort((a,b) => a.localeCompare(b, "pt")), niv:{N1:niv("N1"), N2:niv("N2"), N3:niv("N3")},
    alto: L.filter(x => x.r.level === "alto").sort((a,b) => b.r.score - a.r.score), cl: CLI(), data: new Date().toLocaleDateString("pt-BR"), cfg: rptCfg(),
    ev: S.evidences.length, cst: ["pendente","aprovado","ressalvas","reprovado"].map(x => [x, S.contracts.filter(k => st(k) === x).length])};
}
const rptNames = (sups, n=6) => sups.slice(0, n).map(s => `${s.nome} (${s.nivel})`).join("; ") + (sups.length > n ? `; e mais ${sups.length - n}` : "");
const rptMot = (r, n=3) => r.reasons.slice().sort((a,b) => b.pts - a.pts).slice(0, n).map(x => rptLabel(x.crit, x.txt)).join("; ");
const RPT_SC = {Alta:[198,40,40], "Média":[178,106,0], Baixa:[46,125,50]}, RPT_LV = {alto:"Alto", medio:"Médio", baixo:"Baixo", pend:"Em avaliação"};

/* ---------- gerador de PDF (Helvetica, WinAnsi) ---------- */
function KTPdf(){
  const W = 595.28, H = 841.89, M = 44, CW = W - 2*M, pages = []; let ops = null, y = 0;
  const CP = {"€":128,"‚":130,"„":132,"…":133,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,"™":153}, RP = {"→":"->","←":"<-","≥":">=","≤":"<=","✓":"v","↗":"","●":"•","■":"•","◆":"•"," ":" "};
  const enc = s => { let o = ""; for (const ch of String(s ?? "")){ if (RP[ch] != null){ o += enc(RP[ch]); continue; } let c = CP[ch] || ch.codePointAt(0); if (!CP[ch] && (c > 255 || (c >= 127 && c < 160))) c = 63; if (c < 32) c = 32; o += String.fromCharCode(c); } return o; };
  const wid = (s, sz, b) => { const t = RPT_W[b ? "b" : "n"]; let w = 0; for (const ch of enc(s)){ const c = ch.charCodeAt(0); w += t[c - 32] || 556; } return w * sz / 1000; };
  const esc = s => enc(s).replace(/[\\()]/g, m => "\\" + m).replace(/[\x80-\xff]/g, m => "\\" + m.charCodeAt(0).toString(8).padStart(3, "0"));
  const rgb = c => c.map(v => (v/255).toFixed(3)).join(" ");
  const api = {W, H, M, CW, get y(){ return y; }, set y(v){ y = v; },
    page(){ ops = []; pages.push(ops); y = M + 18; return api; },
    text(x, yy, s, sz=9.5, b=false, c=[27,36,51]){ ops.push(`BT /${b ? "F2" : "F1"} ${sz} Tf ${rgb(c)} rg ${x.toFixed(2)} ${(H - yy).toFixed(2)} Td (${esc(s)}) Tj ET`); },
    rect(x, yy, w, h, c){ ops.push(`${rgb(c)} rg ${x.toFixed(2)} ${(H - yy - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`); },
    line(x1, y1, x2, y2, c=[213,220,230], lw=.6){ ops.push(`${rgb(c)} RG ${lw} w ${x1.toFixed(2)} ${(H - y1).toFixed(2)} m ${x2.toFixed(2)} ${(H - y2).toFixed(2)} l S`); },
    wrap(s, sz, b, mw){ const out = []; String(s ?? "").split("\n").forEach(par => { let cur = ""; par.split(/\s+/).filter(Boolean).forEach(w => {
        while (wid(w, sz, b) > mw){ let i = w.length; while (i > 1 && wid(w.slice(0, i), sz, b) > mw) i--; if (cur){ out.push(cur); cur = ""; } out.push(w.slice(0, i)); w = w.slice(i); }
        const t = cur ? cur + " " + w : w; if (wid(t, sz, b) <= mw) cur = t; else { out.push(cur); cur = w; } }); out.push(cur); }); return out; },
    ensure(h){ if (y + h > H - M - 14) api.page(); },
    para(s, o={}){ const sz = o.size || 9.5, b = !!o.bold, x = M + (o.indent || 0), mw = (o.width || CW) - (o.indent || 0), ld = sz * 1.38;
      api.wrap(s, sz, b, mw).forEach(l => { api.ensure(ld); api.text(x, y + sz, l, sz, b, o.color); y += ld; }); y += (o.gap ?? 4); },
    h1(n, s){ api.ensure(46); y += 6; api.rect(M, y, 22, 22, [4,115,195]); api.text(M + (n > 9 ? 4 : 7.5), y + 15.5, String(n), 11, true, [255,255,255]); api.text(M + 30, y + 16, s, 14, true, [1,31,75]); y += 30; api.line(M, y, M + CW, y, [4,115,195], 1); y += 10; },
    h2(s){ api.ensure(26); y += 4; api.text(M, y + 11, s, 11, true, [1,31,75]); y += 18; },
    table(cols, rows, o={}){ const sz = o.size || 8.2, ld = sz * 1.32, pad = 4, ws = cols.map(c => c.w * CW);
      const head = () => { const hh = 18; api.rect(M, y, CW, hh, [1,31,75]); let x = M; cols.forEach((c, i) => { api.text(x + pad, y + 12, c.t, sz, true, [255,255,255]); x += ws[i]; }); y += hh; };
      api.ensure(40); head();
      rows.forEach((r, ri) => { const cells = r.map((c, i) => { const v = (c && typeof c === "object") ? c : {t:c}; return {...v, lines: api.wrap(v.t, sz, !!v.b, ws[i] - 2*pad)}; });
        const h = Math.max(...cells.map(c => c.lines.length)) * ld + 2*pad;
        if (y + h > H - M - 14){ api.page(); head(); }
        if (ri % 2) api.rect(M, y, CW, h, [238,245,252]);
        let x = M; cells.forEach((c, i) => { if (c.bg){ api.rect(x + 2, y + 2, ws[i] - 4, h - 4, c.bg); } c.lines.forEach((l, li) => api.text(x + pad, y + pad + sz + li*ld - 1, l, sz, !!c.b, c.c || [27,36,51])); x += ws[i]; });
        y += h; api.line(M, y, M + CW, y); });
      y += 10; },
    out(title, foot, skipFirst){ const N = pages.length;
      pages.forEach((p, i) => { if (skipFirst && i === 0) return; api_footer(p, i + 1, N); });
      function api_footer(p, n, N){ ops = p; api.line(M, H - M + 2, M + CW, H - M + 2); api.text(M, H - M + 14, foot, 7.5, false, [90,101,120]); const t = `Página ${n} de ${N}`; api.text(M + CW - wid(t, 7.5), H - M + 14, t, 7.5, false, [90,101,120]); }
      const objs = [], add = s => { objs.push(s); return objs.length; };
      add("<< /Type /Catalog /Pages 2 0 R >>"); add(""); add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"); add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
      const kids = pages.map(p => { const c = p.join("\n"), ci = add(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`); return add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${ci} 0 R >>`); });
      objs[1] = `<< /Type /Pages /Kids [${kids.map(k => k + " 0 R").join(" ")}] /Count ${kids.length} >>`;
      const hx = t => "<FEFF" + [...String(t)].map(ch => ch.codePointAt(0) > 65535 ? "003F" : ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")).join("") + ">";
      const info = add(`<< /Title ${hx(title)} /Author (Kinsey BR) /Creator (KinseyTec) /Producer (KinseyTec) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, "").slice(0,14)}) >>`);
      let s = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"; const off = [];
      objs.forEach((o, i) => { off.push(s.length); s += `${i + 1} 0 obj\n${o}\nendobj\n`; });
      const xr = s.length; s += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xr}\n%%EOF`;
      const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; }};
  return api;
}

function rptPdf(){
  const d = rptData(), P = KTPdf(), N = `KinseyTec – ${SEG_NOME}`, NAVY = [1,31,75], ACC = [4,115,195], MUT = [90,101,120], W = P.W, M = P.M, CW = P.CW;
  /* capa */
  P.page(); P.rect(0, 0, W, P.H, NAVY); P.rect(M, 120, 46, 4, [127,184,230]);
  P.text(M, 112, N, 13, true, [127,184,230]);
  P.y = 150; P.wrap("Relatório de pontos de auditoria e compliance da cadeia de fornecedores", 26, true, CW - 40).forEach(l => { P.text(M, P.y + 26, l, 26, true, [255,255,255]); P.y += 33; });
  P.y += 14; P.text(M, P.y, "Principais riscos, fornecedores envolvidos, recomendações, normas e legislação", 11, false, [201,214,234]);
  const kv = [["Cliente contratante", `${d.cl.nome}${d.cl.doc ? " · CNPJ " + d.cl.doc : ""}${d.cl.local ? " · " + d.cl.local : ""}`], ["Data-base", d.data], ["Fornecedores avaliados", `${d.L.length} (N1 ${d.niv.N1} · N2 ${d.niv.N2} · N3 ${d.niv.N3})`], ["Preparado por", d.cfg.responsavel || "Kinsey BR · equipe de asseguração"]];
  let yy = 520; kv.forEach(([a, b]) => { P.text(M, yy, a.toUpperCase(), 8, true, [127,184,230]); P.text(M, yy + 15, b, 11.5, true, [255,255,255]); yy += 42; });
  P.text(M, P.H - 60, "CONFIDENCIAL · uso exclusivo do cliente contratante e da Kinsey BR", 8, true, [127,184,230]);
  P.text(M, P.H - 46, "KinseyTec, uma empresa do Grupo Kinsey BR", 8, false, [201,214,234]);
  /* 1. sumário */
  P.page(); P.h1(1, "Sumário executivo");
  const altos = d.pontos.filter(p => p.sev === "Alta").length;
  P.para(`Foram avaliados ${d.L.length} fornecedores da cadeia do cliente contratante (${d.cl.nome}): ${d.niv.N1} de nível N1, ${d.niv.N2} de nível N2 e ${d.niv.N3} de nível N3. Classificação de risco: alto ${d.dist.alto}, médio ${d.dist.medio}, baixo ${d.dist.baixo} e em avaliação ${d.dist.pend}. A análise consolidou ${d.pontos.length} pontos de atenção, dos quais ${altos} de severidade alta, com recomendações e a base normativa de referência.`, {size:10, gap:12});
  const kp = [[String(d.L.length), "fornecedores avaliados"], [String(d.dist.alto), "em alto risco"], [String(altos), "pontos de severidade alta"], [String(d.cst[0][1]), "contratos sem parecer"]];
  P.ensure(70); const bw = (CW - 18) / 4; kp.forEach(([n, l], i) => { const x = M + i*(bw + 6); P.rect(x, P.y, bw, 58, [238,245,252]); P.rect(x, P.y, bw, 3, ACC); P.text(x + 10, P.y + 30, n, 22, true, i === 1 || i === 2 ? [198,40,40] : NAVY); P.text(x + 10, P.y + 47, l, 8, false, MUT); }); P.y += 72;
  P.h2("Distribuição de risco dos fornecedores");
  const tot = Math.max(1, d.L.length), cols = {alto:[198,40,40], medio:[242,179,61], baixo:[54,211,153], pend:[147,163,188]}; let x = M;
  P.ensure(40); ["alto","medio","baixo","pend"].forEach(k => { const w = CW * d.dist[k] / tot; if (w > 0){ P.rect(x, P.y, w, 16, cols[k]); x += w; } }); P.y += 26;
  x = M; ["alto","medio","baixo","pend"].forEach(k => { P.rect(x, P.y - 7, 8, 8, cols[k]); const t = `${RPT_LV[k]}: ${d.dist[k]}`; P.text(x + 12, P.y, t, 8.5); x += 110; }); P.y += 14;
  P.h2("Os 5 pontos mais relevantes");
  d.pontos.slice(0, 5).forEach((p, i) => P.para(`${i + 1}. [${p.sev}] ${p.crit}: ${p.txt} · ${p.sups.length} fornecedor(es)`, {size:9.5, gap:2}));
  /* 2. pontos */
  P.page(); P.h1(2, "Pontos de atenção, recomendações e normas");
  P.para("Cada ponto reúne os fornecedores em que foi identificado, a recomendação da Kinsey BR e as normas e a legislação de referência. Severidade: alta (risco legal ou reputacional grave), média ou baixa.", {size:9, color:MUT, gap:8});
  const lim = 30; d.pontos.slice(0, lim).forEach((p, i) => {
    P.ensure(70); const tag = p.sev.toUpperCase(), tw = 46; P.rect(M, P.y, tw, 14, RPT_SC[p.sev]); P.text(M + 5, P.y + 10, tag, 7.5, true, [255,255,255]);
    const ttl = P.wrap(`${i + 1}. ${p.crit}: ${p.txt}`, 10, true, CW - tw - 8); ttl.forEach((l, li) => P.text(M + tw + 8, P.y + 10 + li*13.5, l, 10, true, NAVY)); P.y += Math.max(18, ttl.length*13.5 + 4);
    P.para(`Envolvidos (${p.sups.length}): ${rptNames(p.sups, 8)}`, {size:8.8, indent:tw + 8, gap:1});
    P.para(`Recomendação: ${p.rec}`, {size:8.8, indent:tw + 8, gap:1});
    P.para(`Normas e legislação: ${p.norma}`, {size:8.8, indent:tw + 8, color:ACC, gap:9}); });
  if (d.pontos.length > lim) P.para(`Outros ${d.pontos.length - lim} pontos de menor relevância estão na matriz de fornecedores (seção 4) e no sistema.`, {size:9, color:MUT});
  if (!d.pontos.length) P.para("Nenhum ponto de atenção registrado até a data-base.");
  /* 3. alto risco */
  P.page(); P.h1(3, "Fornecedores de alto risco");
  if (d.alto.length) P.table([{t:"Fornecedor", w:.3}, {t:"Nível / UF", w:.12}, {t:"Pontos", w:.08}, {t:"Principais motivos", w:.5}], d.alto.map(({s, r}) => [{t:s.nome, b:true}, `${s.nivel} · ${s.uf || "—"}`, String(r.score), rptMot(r)]));
  else P.para("Nenhum fornecedor classificado como alto risco na data-base.");
  /* 4. matriz */
  P.h1(4, "Matriz de risco dos fornecedores");
  const ord = {alto:0, medio:1, baixo:2, pend:3};
  P.table([{t:"Fornecedor", w:.27}, {t:"Nível", w:.07}, {t:"Local", w:.17}, {t:"Risco", w:.11}, {t:"Pts", w:.06}, {t:"Principal motivo", w:.32}],
    d.L.slice().sort((a,b) => ord[a.r.level] - ord[b.r.level] || b.r.score - a.r.score).map(({s, r}) => [s.nome, s.nivel, [s.municipio, s.uf].filter(Boolean).join("/") || "—", {t:RPT_LV[r.level], b:true, c: r.level === "alto" ? [198,40,40] : r.level === "medio" ? [178,106,0] : r.level === "baixo" ? [46,125,50] : MUT}, String(r.score), rptMot(r, 1) || "—"]), {size:7.8});
  RPT_EXT.forEach(f => f(P, d));
  /* 5. contratos */
  P.h1(5, "Contratos e pareceres jurídicos");
  P.para(`Situação: ${d.cst.map(([k, n]) => `${{pendente:"sem parecer", aprovado:"aprovados", ressalvas:"com ressalvas", reprovado:"reprovados"}[k]} ${n}`).join(" · ")}.`, {size:9.5});
  if (d.contratos.length) P.table([{t:"Contrato", w:.16}, {t:"Partes", w:.25}, {t:"Situação", w:.12}, {t:"Advogado responsável", w:.18}, {t:"Cláusulas ausentes (* essencial)", w:.29}],
    d.contratos.map(c => [`${c.k.tipo || "Contrato"}${c.k.numero ? " nº " + c.k.numero : ""}`, `${c.s?.nome || "—"} → ${c.k.contraparte || "—"}`, {t:{pendente:"Sem parecer", aprovado:"Aprovado", ressalvas:"Com ressalvas", reprovado:"Reprovado"}[c.status], b:true}, c.adv ? `${c.adv.nome} · ${c.adv.oab || ""}` : "—",
      c.status === "pendente" ? "Aguardando revisão" : (c.falta.map(([cid, t]) => (clauseInfo(cid)?.[2] ? "* " : "") + t).join("; ") || "Nenhuma")]), {size:7.8});
  { const advs = [...new Map(d.contratos.filter(c => c.adv).map(c => [c.adv.nome + "|" + c.adv.oab, c.adv])).values()];
    if (advs.length) P.para(`Responsável(is) técnico(s) pelos pareceres jurídicos: ${advs.map(a => `${a.nome} (${a.oab})`).join("; ")}.`, {size:9}); }
  /* 6. testes e alertas */
  if (auditTests().length || setorNews().length){ P.h1(6, "Testes de asseguração e alertas do setor");
    if (auditTests().length) P.table([{t:"Padrão de risco", w:.28}, {t:"Procedimento", w:.42}, {t:"Evidência exigida", w:.2}, {t:"Cobertura", w:.1}],
      auditTests().map(([id, niv, pad, proc, evs]) => { const L = S.suppliers.filter(s => niv.includes(s.nivel)), ok = L.filter(s => evs.every(t => S.evidences.some(e => e.supplierId === s.id && e.tipo === t))).length; return [{t:pad, b:true}, proc, evs.join("; "), `${ok}/${L.length}`]; }), {size:7.8});
    if (setorNews().length){ P.h2("Alertas públicos considerados"); setorNews().forEach(([dt, t, r, u]) => P.para(`${dt} · ${t}. ${r}${u ? " Fonte: " + u : ""}`, {size:8.3, gap:3})); } }
  /* 7. normas */
  P.h1(7, "Normas e legislação de referência");
  d.normas.forEach(n => P.para("• " + n, {size:9, gap:1})); P.y += 6;
  /* 8. escopo */
  P.h1(8, "Escopo, metodologia e limitações");
  P.para(d.cfg.escopo || "Avaliação da cadeia de fornecedores do cliente contratante no sistema KinseyTec, com base em consultas a bases públicas (Receita Federal, Cadastro de Empregadores do MTE, IBAMA, SICAR, PGFN, tribunais e outras), questionários respondidos pelos fornecedores, documentos, inspeções físicas, evidências fotográficas georreferenciadas e pareceres jurídicos registrados até a data-base.", {size:9.5});
  P.para("Metodologia: cada resposta de risco, alerta de investigação, divergência de localização, balanço de massa, preço fora da cotação e contrato reprovado soma pontos na matriz de risco (alto a partir de 6, médio de 3 a 5, baixo abaixo de 3). O trabalho de asseguração segue como referência a NBC TO 3000 (trabalhos de asseguração) e as normas de evidência de auditoria (NBC TA 500 e 520).", {size:9.5});
  P.para("Limitações: o relatório reflete as informações disponíveis na data-base e depende da veracidade dos dados fornecidos. As referências normativas apoiam a análise e não substituem o parecer do advogado responsável. Pontos novos podem surgir com novas consultas, inspeções e atualizações das bases públicas.", {size:9.5, gap:20});
  P.ensure(60); P.line(M, P.y + 30, M + 200, P.y + 30, [27,36,51], .8); P.text(M, P.y + 44, d.cfg.responsavel || "Kinsey BR · equipe de asseguração", 9.5, true); P.text(M, P.y + 57, `${d.cl.local ? d.cl.local + ", " : ""}${d.data}`, 8.5, false, MUT);
  return P.out(`${N} · Relatório de pontos`, `${N} · Relatório de pontos · ${d.cl.nome} · Confidencial`, true);
}

/* ---------- gerador de PowerPoint (OOXML, zip sem compressão) ---------- */
function ktZip(files){
  const te = new TextEncoder(), T = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  const crc = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const parts = [], cen = []; let off = 0;
  const h = (n, v) => { const a = new Uint8Array(n); const dv = new DataView(a.buffer); v(dv); return a; };
  files.forEach(([name, txt]) => { const nb = te.encode(name), db = te.encode(txt), c = crc(db);
    const lh = h(30, v => { v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(8, 0, true); v.setUint16(10, 0, true); v.setUint16(12, 0x5021, true); v.setUint32(14, c, true); v.setUint32(18, db.length, true); v.setUint32(22, db.length, true); v.setUint16(26, nb.length, true); });
    parts.push(lh, nb, db);
    cen.push(h(46, v => { v.setUint32(0, 0x02014b50, true); v.setUint16(4, 20, true); v.setUint16(6, 20, true); v.setUint16(14, 0x5021, true); v.setUint32(16, c, true); v.setUint32(20, db.length, true); v.setUint32(24, db.length, true); v.setUint16(28, nb.length, true); v.setUint32(42, off, true); }), nb);
    off += 30 + nb.length + db.length; });
  const cs = cen.reduce((t, a) => t + a.length, 0);
  const end = h(22, v => { v.setUint32(0, 0x06054b50, true); v.setUint16(8, files.length, true); v.setUint16(10, files.length, true); v.setUint32(12, cs, true); v.setUint32(16, off, true); });
  const all = [...parts, ...cen, end], out = new Uint8Array(all.reduce((t, a) => t + a.length, 0)); let p = 0; all.forEach(a => { out.set(a, p); p += a.length; }); return out;
}
function ktPptx(slides, title){
  const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n', RT = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";
  const xe = s => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const E = v => Math.round(v * 914400), GRP = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
  const sp = (o, id) => { const paras = (o.p || []).map(q => { const runs = (Array.isArray(q.r) ? q.r : [q]).map(r => `<a:r><a:rPr lang="pt-BR" sz="${Math.round((r.s || 14) * 100)}" b="${r.b ? 1 : 0}" dirty="0"><a:solidFill><a:srgbClr val="${r.c || "1B2433"}"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>${xe(r.t)}</a:t></a:r>`).join("");
      return `<a:p><a:pPr algn="${o.al || "l"}"><a:spcBef><a:spcPts val="${q.sb || 0}"/></a:spcBef></a:pPr>${runs}</a:p>`; }).join("") || '<a:p><a:endParaRPr lang="pt-BR"/></a:p>';
    return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Forma ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${E(o.x)}" y="${E(o.y)}"/><a:ext cx="${E(o.w)}" cy="${E(o.h)}"/></a:xfrm><a:prstGeom prst="${o.round ? "roundRect" : "rect"}"><a:avLst/></a:prstGeom>${o.f ? `<a:solidFill><a:srgbClr val="${o.f}"/></a:solidFill>` : "<a:noFill/>"}${o.ln ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${o.ln}"/></a:solidFill></a:ln>` : "<a:ln><a:noFill/></a:ln>"}</p:spPr><p:txBody><a:bodyPr wrap="square" lIns="${E(o.pad ?? .08)}" tIns="${E(.04)}" rIns="${E(o.pad ?? .08)}" bIns="${E(.04)}" anchor="${o.v || "t"}"><a:noAutofit/></a:bodyPr><a:lstStyle/>${paras}</p:txBody></p:sp>`; };
  const files = [];
  files.push(["[Content_Types].xml", X + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}</Types>`]);
  files.push(["_rels/.rels", X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${RT}extended-properties" Target="docProps/app.xml"/></Relationships>`]);
  const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  files.push(["docProps/core.xml", X + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xe(title)}</dc:title><dc:creator>Kinsey BR</dc:creator><cp:lastModifiedBy>Kinsey BR</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`]);
  files.push(["docProps/app.xml", X + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>KinseyTec</Application><Slides>${slides.length}</Slides></Properties>`]);
  files.push(["ppt/presentation.xml", X + `<p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 3}"/>`).join("")}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:defaultTextStyle></p:presentation>`]);
  files.push(["ppt/_rels/presentation.xml.rels", X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}slideMaster" Target="slideMasters/slideMaster1.xml"/><Relationship Id="rId2" Type="${RT}theme" Target="theme/theme1.xml"/>${slides.map((_, i) => `<Relationship Id="rId${i + 3}" Type="${RT}slide" Target="slides/slide${i + 1}.xml"/>`).join("")}</Relationships>`]);
  files.push(["ppt/slideMasters/slideMaster1.xml", X + `<p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${GRP}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="3200"/></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>`]);
  files.push(["ppt/slideMasters/_rels/slideMaster1.xml.rels", X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="${RT}theme" Target="../theme/theme1.xml"/></Relationships>`]);
  files.push(["ppt/slideLayouts/slideLayout1.xml", X + `<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Em branco"><p:spTree>${GRP}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`]);
  files.push(["ppt/slideLayouts/_rels/slideLayout1.xml.rels", X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`]);
  const clr = (n, v) => `<a:${n}><a:srgbClr val="${v}"/></a:${n}>`, fill3 = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'.repeat(3), font = '<a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/>';
  files.push(["ppt/theme/theme1.xml", X + `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="KinseyTec"><a:themeElements><a:clrScheme name="KinseyTec">${clr("dk1","1B2433")}${clr("lt1","FFFFFF")}${clr("dk2","011F4B")}${clr("lt2","EEF5FC")}${clr("accent1","0473C3")}${clr("accent2","7FB8E6")}${clr("accent3","C62828")}${clr("accent4","F2B33D")}${clr("accent5","2E7D32")}${clr("accent6","5A6578")}${clr("hlink","0473C3")}${clr("folHlink","5A6578")}</a:clrScheme><a:fontScheme name="KinseyTec"><a:majorFont>${font}</a:majorFont><a:minorFont>${font}</a:minorFont></a:fontScheme><a:fmtScheme name="KinseyTec"><a:fillStyleLst>${fill3}</a:fillStyleLst><a:lnStyleLst>${'<a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'.repeat(3)}</a:lnStyleLst><a:effectStyleLst>${'<a:effectStyle><a:effectLst/></a:effectStyle>'.repeat(3)}</a:effectStyleLst><a:bgFillStyleLst>${fill3}</a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`]);
  slides.forEach((s, i) => {
    files.push([`ppt/slides/slide${i + 1}.xml`, X + `<p:sld ${NS}><p:cSld>${s.bg ? `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${s.bg}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>` : ""}<p:spTree>${GRP}${s.sh.map((o, k) => sp(o, k + 2)).join("")}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`]);
    files.push([`ppt/slides/_rels/slide${i + 1}.xml.rels`, X + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`]); });
  return ktZip(files);
}
function rptPptx(){
  const d = rptData(), N = `KinseyTec – ${SEG_NOME}`, NAVY = "011F4B", ACC = "0473C3", MUT = "5A6578", SEV = {Alta:"C62828", "Média":"B26A00", Baixa:"2E7D32"}, slides = [];
  const cut = (s, n) => { s = String(s ?? ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
  const frame = (t, sub) => { const sh = [{x:0, y:0, w:13.333, h:.12, f:ACC}, {x:.6, y:.35, w:12, h:.7, p:[{t, s:28, b:true, c:NAVY}]}];
    if (sub) sh.push({x:.6, y:1.0, w:12, h:.45, p:[{t:sub, s:13, c:MUT}]});
    sh.push({x:.6, y:7.0, w:9, h:.35, p:[{t:`${N} · Relatório de pontos · ${d.cl.nome} · Confidencial`, s:9, c:MUT}]}, {x:11.7, y:7.0, w:1.05, h:.35, al:"r", p:[{t:String(slides.length + 1), s:9, c:MUT}]}); return sh; };
  slides.push({bg:NAVY, sh:[{x:.8, y:1.2, w:11, h:.5, p:[{t:N, s:20, b:true, c:"7FB8E6"}]}, {x:.8, y:1.9, w:11.5, h:1.9, p:[{t:"Relatório de pontos de auditoria e compliance", s:40, b:true, c:"FFFFFF"}]},
    {x:.8, y:3.9, w:11.5, h:.5, p:[{t:"Principais riscos, fornecedores envolvidos, recomendações, normas e legislação", s:16, c:"C9D6EA"}]},
    {x:.8, y:5.0, w:11.5, h:1.4, p:[{t:"CLIENTE CONTRATANTE", s:11, b:true, c:"7FB8E6"}, {t:`${d.cl.nome}${d.cl.local ? " · " + d.cl.local : ""}`, s:18, b:true, c:"FFFFFF"}, ...(d.cl.doc ? [{t:"CNPJ " + d.cl.doc, s:12, c:"C9D6EA"}] : []), {t:`Data-base ${d.data} · ${d.cfg.responsavel || "Kinsey BR · equipe de asseguração"}`, s:13, c:"C9D6EA", sb:600}]},
    {x:.8, y:6.8, w:11.5, h:.4, p:[{t:"CONFIDENCIAL · KinseyTec, uma empresa do Grupo Kinsey BR", s:10, b:true, c:"7FB8E6"}]}]});
  const altos = d.pontos.filter(p => p.sev === "Alta").length, kp = [[d.L.length, "fornecedores avaliados", NAVY], [d.dist.alto, "em alto risco", "C62828"], [altos, "pontos de severidade alta", "C62828"], [d.cst[0][1], "contratos sem parecer", NAVY]];
  const s2 = frame("Sumário executivo", `N1 ${d.niv.N1} · N2 ${d.niv.N2} · N3 ${d.niv.N3} · ${d.ev} evidências registradas`);
  kp.forEach(([n, l, c], i) => s2.push({x:.6 + i*3.08, y:1.7, w:2.9, h:1.55, f:"EEF5FC", round:true, p:[{t:String(n), s:40, b:true, c}, {t:l, s:13, c:MUT}]}));
  s2.push({x:.6, y:3.6, w:12, h:.4, p:[{t:"Distribuição de risco dos fornecedores", s:15, b:true, c:NAVY}]});
  const tot = Math.max(1, d.L.length), cc = {alto:"C62828", medio:"F2B33D", baixo:"36D399", pend:"93A3BC"}; let x = .6;
  ["alto","medio","baixo","pend"].forEach(k => { const w = 12 * d.dist[k] / tot; if (w > .01){ s2.push({x, y:4.1, w, h:.55, f:cc[k], v:"ctr", al:"ctr", p:w > .7 ? [{t:String(d.dist[k]), s:14, b:true, c:"FFFFFF"}] : []}); x += w; } });
  s2.push({x:.6, y:4.75, w:12, h:.4, p:[{r:["alto","medio","baixo","pend"].map(k => ({t:`■ ${RPT_LV[k]}: ${d.dist[k]}     `, s:12, c:cc[k] === "F2B33D" ? "B26A00" : cc[k]}))}]});
  s2.push({x:.6, y:5.3, w:12, h:1.6, p:[{t:"Pontos mais relevantes", s:14, b:true, c:NAVY}, ...d.pontos.slice(0, 3).map((p, i) => ({t:cut(`${i + 1}. [${p.sev}] ${p.crit}: ${p.txt} · ${p.sups.length} fornecedor(es)`, 130), s:12, sb:300}))]});
  slides.push({sh:s2});
  const per = 5, top = d.pontos.slice(0, 15);
  for (let i = 0; i < Math.max(1, Math.ceil(top.length / per)); i++){
    const sh = frame(`Pontos de atenção e recomendações${top.length > per ? ` (${i + 1}/${Math.ceil(top.length / per)})` : ""}`, "Severidade · ponto · envolvidos · recomendação e base normativa");
    const hdr = [["Sev.", .6, 1.0], ["Ponto", 1.65, 3.6], ["Envolvidos", 5.3, 2.7], ["Recomendação · normas", 8.05, 4.65]];
    hdr.forEach(([t, xx, w]) => sh.push({x:xx, y:1.55, w, h:.4, f:NAVY, v:"ctr", p:[{t, s:12, b:true, c:"FFFFFF"}]}));
    top.slice(i*per, i*per + per).forEach((p, k) => { const yy = 2.0 + k*0.98;
      if (k % 2) sh.push({x:.6, y:yy, w:12.1, h:.95, f:"EEF5FC"});
      sh.push({x:.65, y:yy + .25, w:.9, h:.4, f:SEV[p.sev], v:"ctr", al:"ctr", p:[{t:p.sev.toUpperCase(), s:10, b:true, c:"FFFFFF"}]});
      sh.push({x:1.65, y:yy, w:3.6, h:.95, v:"ctr", p:[{t:cut(`${p.crit}: ${p.txt}`, 120), s:11, b:true, c:NAVY}]});
      sh.push({x:5.3, y:yy, w:2.7, h:.95, v:"ctr", p:[{t:cut(`${p.sups.length}: ${rptNames(p.sups, 3)}`, 110), s:10}]});
      sh.push({x:8.05, y:yy, w:4.65, h:.95, v:"ctr", p:[{t:cut(p.rec, 150), s:10}, {t:cut(p.norma, 95), s:9, c:ACC}]}); });
    slides.push({sh}); }
  const sh3 = frame("Fornecedores de alto risco", `${d.alto.length} fornecedor(es) com pontuação a partir de 6`);
  [["Fornecedor", .6, 3.4], ["Nível / UF", 4.05, 1.4], ["Pts", 5.5, .7], ["Principais motivos", 6.25, 6.45]].forEach(([t, xx, w]) => sh3.push({x:xx, y:1.55, w, h:.4, f:NAVY, v:"ctr", p:[{t, s:12, b:true, c:"FFFFFF"}]}));
  d.alto.slice(0, 8).forEach(({s, r}, k) => { const yy = 2.0 + k*.6; if (k % 2) sh3.push({x:.6, y:yy, w:12.1, h:.58, f:"EEF5FC"});
    sh3.push({x:.6, y:yy, w:3.4, h:.58, v:"ctr", p:[{t:cut(s.nome, 48), s:11, b:true, c:NAVY}]}, {x:4.05, y:yy, w:1.4, h:.58, v:"ctr", p:[{t:`${s.nivel} · ${s.uf || "—"}`, s:11}]}, {x:5.5, y:yy, w:.7, h:.58, v:"ctr", p:[{t:String(r.score), s:12, b:true, c:"C62828"}]}, {x:6.25, y:yy, w:6.45, h:.58, v:"ctr", p:[{t:cut(rptMot(r), 140), s:10}]}); });
  if (!d.alto.length) sh3.push({x:.6, y:2.1, w:12, h:.5, p:[{t:"Nenhum fornecedor em alto risco na data-base.", s:14}]});
  if (d.alto.length > 8) sh3.push({x:.6, y:6.85 - .3, w:12, h:.3, p:[{t:`e mais ${d.alto.length - 8} no relatório em PDF`, s:10, c:MUT}]});
  slides.push({sh:sh3});
  const sh4 = frame("Contratos e pareceres jurídicos", d.cst.map(([k, n]) => `${{pendente:"sem parecer", aprovado:"aprovados", ressalvas:"com ressalvas", reprovado:"reprovados"}[k]}: ${n}`).join(" · "));
  [["Contrato", .6, 2.4], ["Partes", 3.05, 3.9], ["Situação", 7.0, 1.6], ["Cláusulas essenciais ausentes", 8.65, 4.05]].forEach(([t, xx, w]) => sh4.push({x:xx, y:1.55, w, h:.4, f:NAVY, v:"ctr", p:[{t, s:12, b:true, c:"FFFFFF"}]}));
  d.contratos.slice(0, 8).forEach((c, k) => { const yy = 2.0 + k*.6; if (k % 2) sh4.push({x:.6, y:yy, w:12.1, h:.58, f:"EEF5FC"});
    const stt = {pendente:["Sem parecer", MUT], aprovado:["Aprovado", "2E7D32"], ressalvas:["Com ressalvas", "B26A00"], reprovado:["Reprovado", "C62828"]}[c.status];
    sh4.push({x:.6, y:yy, w:2.4, h:.58, v:"ctr", p:[{t:cut(`${c.k.tipo || "Contrato"} ${c.k.numero || ""}`, 40), s:10.5, b:true, c:NAVY}]}, {x:3.05, y:yy, w:3.9, h:.58, v:"ctr", p:[{t:cut(`${c.s?.nome || "—"} → ${c.k.contraparte || "—"}`, 80), s:10}]}, {x:7.0, y:yy, w:1.6, h:.58, v:"ctr", p:[{t:stt[0], s:11, b:true, c:stt[1]}]},
      {x:8.65, y:yy, w:4.05, h:.58, v:"ctr", p:[{t:cut(c.status === "pendente" ? "Aguardando revisão" : (c.crit.map(([, t]) => t).join("; ") || "Nenhuma"), 120), s:9.5}]}); });
  if (!d.contratos.length) sh4.push({x:.6, y:2.1, w:12, h:.5, p:[{t:"Nenhum contrato enviado ao Jurídico.", s:14}]});
  { const advs = [...new Map(d.contratos.filter(c => c.adv).map(c => [c.adv.nome + "|" + c.adv.oab, c.adv])).values()];
    if (advs.length) sh4.push({x:.6, y:6.9, w:12.1, h:.35, p:[{t:cut("Advogado(s) responsável(is): " + advs.map(a => `${a.nome} (${a.oab})`).join("; "), 160), s:10.5, c:MUT}]}); }
  slides.push({sh:sh4});
  const sh5 = frame("Normas e legislação de referência", "Base normativa dos pontos e das cláusulas analisadas");
  const nn = d.normas.slice(0, 30), half = Math.ceil(nn.length / 2);
  [nn.slice(0, half), nn.slice(half)].forEach((col, ci) => sh5.push({x:.6 + ci*6.15, y:1.6, w:5.95, h:5.3, p:col.map(t => ({t:"• " + cut(t, 90), s:11.5, sb:200}))}));
  slides.push({sh:sh5});
  const sh6 = frame("Próximos passos recomendados");
  [["Imediato", `Tratar os ${altos} pontos de severidade alta: suspender compras quando indicado, notificar os fornecedores e exigir plano de ação.`, "C62828"],
   ["Até 30 dias", "Concluir pareceres pendentes, completar evidências e inspeções e renegociar contratos sem cláusulas essenciais.", "B26A00"],
   ["Monitoramento", "Repetir as consultas a bases públicas e as inspeções periodicamente e atualizar a matriz de risco e este relatório.", ACC]].forEach(([t, b, c], i) =>
    sh6.push({x:.6 + i*4.1, y:1.5, w:3.9, h:2.6, f:"EEF5FC", round:true, p:[{t, s:18, b:true, c}, {t:b, s:13, sb:600}]}));
  sh6.push({x:.6, y:4.5, w:12.1, h:2.2, f:NAVY, round:true, pad:.3, v:"ctr", p:[{t:"Kinsey BR · KinseyTec", s:20, b:true, c:"FFFFFF"}, {t:"contato@kinsey.com.br · newton.kao@kinsey.com.br · (11) 96635-0424", s:15, c:"7FB8E6", sb:600}, {t:"Asseguração, auditoria, monitoramento e compliance da cadeia de fornecedores", s:12, c:"C9D6EA", sb:400}]});
  slides.push({sh:sh6});
  return ktPptx(slides, `${N} · Relatório de pontos · ${d.cl.nome}`);
}

/* ---------- download, histórico e tela ---------- */
async function rptSave(bytes, name, mime){
  const H = window.__ktHost?.use ? window.__ktHost : window.claude?.use ? window.claude : null, dl = H ? await H.use("downloads").catch(() => null) : null;
  if (dl){ try{ await dl.save({filename:name, data:new Blob([bytes], {type:mime})}); }catch(e){ if (e?.code !== "cancelled") toast("Download não concluído."); } return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([bytes], {type:mime})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
async function rptGen(fmt){
  if (fmt === "pptx" && !rptIsAdmin()){ toast("PowerPoint disponível só para o administrador."); return; }
  if (!rptAllowed()){ toast("Relatório não liberado pelo administrador."); return; }
  try{
    if (fmt === "pdf") await rptSave(rptPdf(), rptFile("pdf"), "application/pdf");
    else await rptSave(rptPptx(), rptFile("pptx"), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    const log = (S.config.relatorio_log?.itens || []).concat([{em:nowISO(), por:Store.me?.email || Store.me?.id || "", fmt}]).slice(-40);
    Store.set("config", "relatorio_log", {itens:log}).catch(() => {});
    toast(fmt === "pdf" ? "Relatório PDF gerado" : "Apresentação PowerPoint gerada");
  }catch(e){ console.error(e); toast("Não foi possível gerar o relatório."); }
}
function rptCard(){
  const adm = rptIsAdmin(), ok = rptAllowed(), c = rptCfg(), log = (S.config.relatorio_log?.itens || []).slice().reverse();
  return `<div class="card" id="rpt" style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px"><div class="head" style="margin:0"><div><div class="eyebrow">Relatório para o cliente contratante</div><h2>Relatório de pontos</h2><p class="sub">Principais riscos, fornecedores envolvidos, recomendações, normas e legislação, com a matriz de risco, os contratos e os testes de asseguração.</p></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${ok ? `<button type="button" class="btn primary" data-rpt="pdf">Baixar relatório (PDF)</button>` : `<div class="banner">O relatório em PDF é liberado pelo administrador da Kinsey BR.</div>`}${adm ? `<button type="button" class="btn" data-rpt="pptx">Gerar apresentação (PowerPoint)</button>` : ""}</div>
    ${adm ? `<details><summary style="cursor:pointer;font-weight:600">Controle do administrador</summary><form id="rpt-f" style="display:flex;flex-direction:column;gap:10px;margin-top:10px" novalidate>
      <label class="check"><input type="checkbox" id="rpt-cli" ${c.clientePdf !== false ? "checked" : ""}> Liberar o relatório em PDF para o cliente e a equipe (PowerPoint fica só com o administrador)</label>
      <div class="fld"><label for="rpt-resp">Responsável técnico (aparece na capa e na assinatura)</label><input id="rpt-resp" value="${esc(c.responsavel || "")}" placeholder="ex.: Kinsey BR · Nome do responsável · cargo"></div>
      <div class="fld"><label for="rpt-esc">Escopo do trabalho (opcional)</label><textarea id="rpt-esc" placeholder="Em branco, o relatório usa o texto padrão de escopo e metodologia">${esc(c.escopo || "")}</textarea></div>
      <button type="submit" class="btn sm" style="align-self:flex-start">Salvar controle</button></form>
      <div class="eyebrow" style="margin-top:12px">Histórico de relatórios gerados</div>${log.length ? `<div class="tbl"><table><thead><tr><th>Data</th><th>Usuário</th><th>Formato</th></tr></thead><tbody>${log.slice(0, 12).map(l => `<tr><td class="mono">${dt(l.em)}</td><td>${esc(l.por)}</td><td>${l.fmt === "pdf" ? "PDF" : "PowerPoint"}</td></tr>`).join("")}</tbody></table></div>` : `<p class="sub">Nenhum relatório gerado ainda.</p>`}</details>` : ""}</div>`;
}
function bindRpt(){
  $$("[data-rpt]").forEach(b => b.onclick = async () => { b.disabled = true; const t = b.textContent; b.textContent = "Gerando…"; await rptGen(b.dataset.rpt); b.disabled = false; b.textContent = t; });
  const f = $("#rpt-f"); if (f) f.onsubmit = e => { e.preventDefault(); save(Store.set("config", "relatorio", {clientePdf:$("#rpt-cli").checked, responsavel:$("#rpt-resp").value.trim(), escopo:$("#rpt-esc").value.trim(), em:nowISO()})).then(() => toast("Controle do relatório salvo")); };
}
