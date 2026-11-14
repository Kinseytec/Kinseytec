import os
import json,sys
S=os.environ['KT_TRAB'] + '/'
w=json.load(open(S+'geo/package/countries-110m.json'))
w={'type':'Topology','transform':w.get('transform'),'arcs':w['arcs'],'objects':{'countries':w['objects']['countries']}}
for g in w['objects']['countries']['geometries']: g['properties']={}
b=json.load(open(S+'geo/dm/package/src/js/data/bra.topo.json'))
head=open(S+'app/head.html').read(); body=open(S+'app/body.html').read()
js=open(S+'app/data.js').read()+"\n"+open(S+'app/seed.js').read()+"\n"+open(S+'app/i18n.js').read()+"\nif (typeof EN_SEG === 'object') Object.assign(EN, EN_SEG);\n"+open(S+'app/app.js').read()+"\n"+open(S+'app/report_widths.js').read()+"\n"+open(S+'app/report.js').read()+"\n"+open(S+'app/cobre.js').read()+"\n"+open(S+'app/importar.js').read()+"\n"+open(S+'app/personalizado.js').read()+"\n"+open(S+'app/operacoes.js').read()+"\n"+open(S+'app/documentos.js').read()+"\n"+open(S+'app/orgaos.js').read()+"\n"+open(S+'app/painel.js').read()+"\n"+open(S+'app/cotacoes.js').read()+"\n"+open(S+'app/visao.js').read()+"".join("\n"+open(S+'app/'+x).read() for x in ['ma.js','termos.js','dd.js','valuation.js','contratos.js','teaser.js','pos.js','relatorios.js','juridica.js','honorarios.js','matching.js','mapa.js','kinsey_mapa.js','organiza.js','base_inicial.js'] if os.path.exists(S+'app/'+x))  # módulos próprios do segmento, nesta ordem
body=body.replace('__WORLD__',json.dumps(w,separators=(',',':'))).replace('__BRA__',json.dumps(b,separators=(',',':'))).replace('__APPJS__',js)
import os; os.makedirs(os.environ['KT_SAIDA'],exist_ok=True)
open(os.environ['KT_SAIDA'] + '/kinseytec.html','w').write(head+body)
print(len(head+body))
