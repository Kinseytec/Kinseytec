"""Construtor da Plataforma KinseyTec.

uso:
  python3 ferramentas/construir.py cadeias cacau        (um segmento)
  python3 ferramentas/construir.py cadeias todos        (todos os segmentos do produto)
  python3 ferramentas/construir.py lista                (mostra produtos e segmentos)

Junta o núcleo comum (nucleo/) com o pacote do segmento (produtos/<produto>/segmentos/<seg>/),
aplica os textos do segmento (PT/EN) e gera em dist/<produto>/<seg>/:
  firebase/                     pronto para publicar (firebase deploy)
  kinseytec.html, portal_fornecedor.html   (versões completas, para conferência)
e o pacote dist/KinseyTec_<Nome>_Firebase.zip
"""
import sys, os, json, re, shutil, subprocess, base64

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
NUC = RAIZ + 'nucleo/'
PROD = RAIZ + 'produtos/'
# termos que nunca podem aparecer no que é publicado (guardados codificados)
PROIBIDOS = [base64.b64decode(x).decode() for x in ['Y2xhdWRl', 'YmFycnk=']]

# função comum do cliente contratante (nome, CNPJ, local) para segmentos que não a definem
COMMON = ('function CLI(){ const c = (typeof S !== "undefined" && S.config && S.config.cliente) || {}; const lat = parseFloat(c.lat), lng = parseFloat(c.lng);\n'
          '  return {nome:(c.nome||"").trim() || CLIENTE_PADRAO.nome, doc:(c.doc||"").trim(), local:(c.local||"").trim() || CLIENTE_PADRAO.local, lat:isFinite(lat) ? lat : CLIENTE_PADRAO.lat, lng:isFinite(lng) ? lng : CLIENTE_PADRAO.lng}; }\n')

TEXTOS = ['app/app.js', 'app/body.html', 'app/head.html', 'portal/portal.js', 'portal/body.html', 'fb/fb_auth.js', 'fb/fb_main.js', 'fb/fb_portal.js',
          'fb/gen_ios.py', 'fb/firestore.rules', 'fb/storage.rules', 'fb/fb_contact.js', 'fb/fb_files.js', 'build.py', 'portal/build.py', 'fb/build_fb.py']


def segmentos(produto):
    d = PROD + produto + '/segmentos/'
    return sorted(x for x in os.listdir(d) if os.path.isfile(d + x + '/seg.json')) if os.path.isdir(d) else []


def aplica(path, pares):
    s = open(path).read()
    for a, b in pares: s = s.replace(a, b)
    open(path, 'w').write(s)


def minificador():
    m = NUC + 'recursos/minify/'
    if not os.path.isdir(m + 'node_modules/terser'):
        print('instalando o compactador (uma vez)…')
        subprocess.run(['npm', 'ci', '--silent', '--no-audit', '--no-fund'], cwd=m, check=True)


def construir(produto, seg):
    SD = PROD + f'{produto}/segmentos/{seg}/'
    cfg = json.load(open(SD + 'seg.json'))
    W = RAIZ + f'build/{produto}/{seg}/'          # pasta de trabalho (descartável)
    OUT = RAIZ + f'dist/{produto}/{seg}'
    for d in (W, OUT):
        if os.path.isdir(d): shutil.rmtree(d)
    os.makedirs(W); os.makedirs(OUT)
    ign = shutil.ignore_patterns('recursos', '__pycache__')
    for d in ['app', 'portal', 'fb']: shutil.copytree(NUC + d, W + d, ignore=ign)
    shutil.copy(NUC + 'build.py', W + 'build.py')
    for d in ['geo', 'libs', 'logo', 'minify']: os.symlink(NUC + 'recursos/' + d, W + d)

    # conteúdo do segmento
    data = open(SD + 'data.js').read()
    if 'function CLI(' not in data: data += '\n' + COMMON
    open(W + 'app/data.js', 'w').write(data)
    shutil.copy(SD + 'seed.js', W + 'app/seed.js')
    for extra in sorted(os.listdir(SD)):              # arquivos extras do segmento substituem os do núcleo (ex.: app/cobre.js)
        if os.path.isdir(SD + extra) and extra in ('app', 'portal', 'fb'):
            shutil.copytree(SD + extra, W + extra, dirs_exist_ok=True)

    PT = [tuple(x) for x in cfg.get('pt', [])]
    EN = [tuple(x) for x in cfg.get('en', [])]
    for f in TEXTOS: aplica(W + f, PT)
    # i18n: chaves em PT recebem o mapa PT; traduções recebem o mapa EN
    s = open(W + 'app/i18n.js').read()
    def fix(m):
        k, v = m.group(1), m.group(2)
        for a, b in PT: k = k.replace(a, b)
        for a, b in EN: v = v.replace(a, b)
        return f'"{k}":"{v}"'
    s = re.sub(r'"((?:[^"\\]|\\.)*)":"((?:[^"\\]|\\.)*)"', fix, s)
    def fixre(m):
        k, v = m.group(1), m.group(2)
        for a, b in PT: k = k.replace(a, b)
        for a, b in EN: v = v.replace(a, b)
        return f'[/{k}/, "{v}"]'
    s = re.sub(r'\[/((?:[^/\\\n]|\\.)*)/, "((?:[^"\\\\]|\\\\.)*)"\]', fixre, s)
    for a, b in cfg.get('en_regex', []): s = s.replace(a, b)
    open(W + 'app/i18n.js', 'w').write(s)

    env = dict(os.environ, KT_TRAB=W.rstrip('/'), KT_SAIDA=OUT, KT_PROJETO=cfg['projeto'], KT_PROIBIDOS=json.dumps(PROIBIDOS))
    for cmd in [['python3', W + 'build.py'], ['python3', W + 'portal/build.py'], ['python3', W + 'fb/build_fb.py']]:
        subprocess.run(cmd, check=True, env=env, stdout=subprocess.DEVNULL)
    # links de mapa (satélite e Earth 3D) não podem ter sido alterados pela troca de unidades do segmento
    import re as _re
    h = open(OUT + '/kinseytec.html').read()
    if _re.search(r'google\.com/maps/(kg|sc|lata|@@)|earth\.google\.com/web/(kg|sc|lata)', h) or 'mapaSat(' not in h: print('ATENÇÃO: links de mapa alterados'); sys.exit(1)
    md = open(SD + 'fb/COMO_PUBLICAR.md' if os.path.isfile(SD + 'fb/COMO_PUBLICAR.md') else NUC + 'fb/COMO_PUBLICAR.md').read()   # guia próprio do segmento, se houver
    for a, b in PT: md = md.replace(a, b)
    open(OUT + '/firebase/COMO_PUBLICAR.md', 'w').write(md)

    # conferência final: nenhum termo proibido no que vai ser publicado
    termos = PROIBIDOS + ([cfg['forbid']] if cfg.get('forbid') else [])
    ruins = []
    for dp, _, fs in os.walk(OUT + '/firebase'):
        for f in fs:
            t = open(os.path.join(dp, f), 'rb').read().lower()
            if any(x.lower().encode() in t for x in termos): ruins.append(os.path.join(dp, f))
    if ruins: print('ATENÇÃO, termos proibidos em:\n  ' + '\n  '.join(ruins)); sys.exit(1)
    z = RAIZ + f"dist/KinseyTec_{cfg['file']}_Firebase.zip"
    if os.path.exists(z): os.remove(z)
    subprocess.run(['zip', '-qr', z, 'firebase'], cwd=OUT, check=True)
    print(f"✔ {cfg['name']:<28} projeto {cfg['projeto']:<24} {os.path.relpath(z, RAIZ)} ({os.path.getsize(z) // 1024} KB)")


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a or a[0] == 'lista':
        for p in sorted(os.listdir(PROD)):
            print(p + ':', ' '.join(segmentos(p)) or '(em preparação)')
        sys.exit(0)
    produto = a[0]
    alvo = a[1:] or ['todos']
    lista = segmentos(produto) if alvo == ['todos'] else alvo
    if not lista: print(f'Produto "{produto}" ainda não tem segmentos.'); sys.exit(1)
    minificador()
    for seg in lista: construir(produto, seg)
