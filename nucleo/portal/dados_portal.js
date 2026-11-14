/* Gera os dados do segmento que o Portal do Fornecedor pode receber.
   O Portal NÃO recebe: qual resposta é considerada risco, pesos, testes de auditoria, regras de análise,
   cláusulas e recomendações jurídicas, fontes e alertas do setor. Só o texto das perguntas e dos documentos.
   uso: node dados_portal.js <data.js>   (imprime o JavaScript para o Portal) */
const vm = require("vm"), fs = require("fs");
const src = fs.readFileSync(process.argv[2], "utf8");
const ctx = {console}; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(src + "\n;globalThis.__x = {Q, DOCS, NDA_TEXT, NDA_VERSION, SUP_TYPES, MUNI, UFS};", ctx);
const x = ctx.__x, Q = {};
for (const [n, gs] of Object.entries(x.Q)) Q[n] = gs.map(g => ({g: g.g, items: g.items.map(it => [it[0], it[1]])}));
const out = {Q, DOCS: x.DOCS, NDA_TEXT: x.NDA_TEXT, NDA_VERSION: x.NDA_VERSION, SUP_TYPES: x.SUP_TYPES, MUNI: x.MUNI, UFS: x.UFS};
process.stdout.write("/* dados do Portal do Fornecedor (sem critérios de avaliação) */\n" + Object.entries(out).map(([k, v]) => `const ${k} = ${JSON.stringify(v)};`).join("\n") + "\n");
