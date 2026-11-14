/* ================= KINSEY CAPITAL · TERMOS DO M&A =================
   O núcleo da plataforma nasceu para cadeias de fornecimento. No M&A não existem "fornecedores":
   N1 = investidores, N2 = intermediadores e parceiros, N3 = targets (vendedores) e o centro da rede é a Kinsey Capital.
   Esta camada troca os termos em tudo o que aparece na tela (textos, dicas, rótulos) e nos PDFs e PowerPoints,
   sem alterar o código interno nem os dados gravados. Em inglês, quem traduz é o i18n do núcleo. */
if (typeof MA_MODELOS !== "undefined") (() => {
  const FEM = {do:"da", o:"a", ao:"à", pelo:"pela", deste:"desta", este:"esta", desse:"dessa", esse:"essa", um:"uma", nenhum:"nenhuma", novo:"nova", mesmo:"mesma", outro:"outra", seu:"sua", num:"numa", no:"na", cada:"cada", qualquer:"qualquer",
    dos:"das", os:"as", aos:"às", pelos:"pelas", destes:"destas", estes:"estas", desses:"dessas", esses:"essas", nos:"nas", "todos os":"todas as", "vários":"várias", quantos:"quantas", seus:"suas", outros:"outras", novos:"novas", alguns:"algumas"};
  const cap = (orig, novo) => orig[0] === orig[0].toUpperCase() && orig[0] !== orig[0].toLowerCase() ? novo[0].toUpperCase() + novo.slice(1) : novo;
  const R = [
    [/\bPortal do [Ff]ornecedor\b/g, "Portal da empresa"],
    [/\b([Ff])ornecedores N1\b/g, (m, f) => cap(f, "investidores") + " (N1)"], [/\b([Ff])ornecedor N1\b/g, (m, f) => cap(f, "investidor") + " (N1)"],
    [/\b([Ff])ornecedores N2\b/g, (m, f) => cap(f, "intermediadores e parceiros") + " (N2)"], [/\b([Ff])ornecedor N2\b/g, (m, f) => cap(f, "intermediador ou parceiro") + " (N2)"],
    [/\b([Ff])ornecedores N3\b/g, (m, f) => cap(f, "targets") + " (N3)"], [/\b([Ff])ornecedor N3\b/g, (m, f) => cap(f, "target") + " (N3)"],
    [/\b[Bb]ase de fornecedores\b/g, "Base inicial"], [/\b([Ii])mportar fornecedores\b/g, (m, i) => cap(i, "importar empresas")],
    [/\b(todos os|Todos os|vários|Vários|quantos|Quantos|dos|Dos|os|Os|aos|Aos|pelos|Pelos|destes|Destes|estes|Estes|desses|Desses|esses|Esses|nos|Nos|seus|Seus|outros|Outros|novos|Novos|alguns|Alguns)\s+fornecedores\b/g, (m, a) => cap(a, FEM[a.toLowerCase()] || a) + " empresas"],
    [/\b(do|Do|o|O|ao|Ao|pelo|Pelo|deste|Deste|este|Este|desse|Desse|esse|Esse|um|Um|nenhum|Nenhum|novo|Novo|mesmo|Mesmo|outro|Outro|seu|Seu|num|Num|no|No)\s+fornecedor\b/g, (m, a) => cap(a, FEM[a.toLowerCase()] || a) + " empresa"],
    [/\b([Ff])ornecedor(es)?\s+(cadastrad|avaliad|mapead|vinculad|removid|envolvid|encontrad|selecionad|importad|aprovad|reprovad|listad|consultad|analisad|indicad|pré-cadastrad|novo|ativ)o(s)?\b/g, (m, f, pl, adj, pl2) => cap(f, pl ? "empresas" : "empresa") + " " + adj + "a" + (pl2 || "")],
    [/\bFornecedores\b/g, "Empresas"], [/\bfornecedores\b/g, "empresas"], [/\bFornecedor\b/g, "Empresa"], [/\bfornecedor\b/g, "empresa"],
    [/\b([Ee]mpresas?)\b([^.;:!?\n]{0,40}?)\b(encontrad|cadastrad|avaliad|mapead|vinculad|removid|selecionad|importad|aprovad|reprovad|consultad|analisad|indicad|pré-cadastrad)o(s?)\b/g, (m, e, meio, adj, pl) => e + meio + adj + "a" + pl],
    [/\b(o|O|ao|Ao|do|Do|pelo|Pelo|no|No)\s+cliente contratante\b/g, (m, a) => cap(a, {o:"a", ao:"à", do:"da", pelo:"pela", no:"na"}[a.toLowerCase()]) + " Kinsey Capital"], [/\b[Cc]liente contratante\b/g, "Kinsey Capital"],
    [/\bCadeia N1 → N2 → N3\b/g, "Base inicial N1 → N2 → N3"], [/\bCadeia\b/g, "Base inicial"], [/\bcadeia\b/g, "base inicial"],
    [/\bInspeção física in loco\b/g, "Visitas e reuniões"], [/\bInspeção\b/g, "Visitas"]
  ];
  const troca = t => { if (!t || !/ornecedor|contratante|adeia|nspeção/.test(t)) return t; let o = t; R.forEach(([re, sub]) => { o = o.replace(re, sub); }); return o; };
  const PULA = /^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE)$/;
  function aplica(root){
    if (typeof LANG !== "undefined" && LANG !== "pt") return; if (!root) return;
    if (root.nodeType === 3){ const p = root.parentElement; if (p && !PULA.test(p.tagName) && !p.isContentEditable){ const v = troca(root.nodeValue); if (v !== root.nodeValue) root.nodeValue = v; } return; }
    if (root.nodeType !== 1 || PULA.test(root.tagName)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())){ const p = n.parentElement; if (!p || PULA.test(p.tagName) || p.isContentEditable) continue; const v = troca(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    const els = [root, ...root.querySelectorAll("[placeholder],[aria-label],[title]")];
    els.forEach(e => e.getAttribute && ["placeholder","aria-label","title"].forEach(a => { const v = e.getAttribute(a); if (v){ const t = troca(v); if (t !== v) e.setAttribute(a, t); } }));
  }
  let obs = null;
  const liga = () => { if (obs) return; obs = new MutationObserver(ms => { obs.disconnect(); ms.forEach(m => { if (m.type === "characterData") aplica(m.target); else m.addedNodes.forEach(aplica); }); obs.observe(document.body, {childList:true, subtree:true, characterData:true}); });
    aplica(document.body); obs.observe(document.body, {childList:true, subtree:true, characterData:true}); };
  if (document.body) liga(); else document.addEventListener("DOMContentLoaded", liga);
  /* PDFs e PowerPoints */
  if (typeof KTPdf === "function"){ const _K = KTPdf; KTPdf = function(){ const P = _K.apply(this, arguments), tx = P.text; P.text = (x, y, s, ...r) => tx(x, y, troca(String(s ?? "")), ...r); return P; }; }
  if (typeof ktPptx === "function"){ const _P = ktPptx; ktPptx = function(slides, title){ (slides || []).forEach(sl => (sl.sh || []).forEach(o => (o.p || []).forEach(q => { (Array.isArray(q.r) ? q.r : [q]).forEach(r => { if (r.t) r.t = troca(String(r.t)); }); }))); return _P(slides, troca(title || "")); }; }
  window.KT_TERMOS = {troca};
})();
