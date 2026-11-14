import os
import base64
D=os.environ['KT_TRAB'] + '/'
head=open(D+'app/head.html').read()
head=head.replace('<title>KinseyTec – Cacau</title>','<title>Portal do Fornecedor KinseyTec</title>',1).replace('content="KinseyTec Cacau"','content="Fornecedor KinseyTec"',1)
logo='data:image/png;base64,'+base64.b64encode(open(D+'logo/symbol_white128.png','rb').read()).decode()
body=open(D+'portal/body.html').read().replace('__LOGO__',logo)
import subprocess
# o Portal recebe só o texto das perguntas e documentos (sem resposta de risco, pesos e regras de análise)
dados=subprocess.run(['node',D+'portal/dados_portal.js',D+'app/data.js'],capture_output=True,text=True,check=True).stdout
js=dados+"\n"+open(D+'portal/portal.js').read()
for proibido in ['AUDIT_TESTS','CLAUSE_INFO','EV_GUIDE','RISK_LABEL','SETOR_NEWS','PROD_REF','COBRE_CFG','INSP','"sim",','"nao",']:
    assert proibido not in dados, 'portal com dado interno: '+proibido
body=body.replace('__JS__',js)
open(os.environ['KT_SAIDA'] + '/portal_fornecedor.html','w').write(head+body); print('ok')
