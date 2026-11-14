"""Gera o projeto Firebase (Hosting + Firestore + Storage) do KinseyTec – Cacau (pasta definida por KT_SAIDA)"""
import os, re, json, shutil
S = os.environ['KT_TRAB'] + '/'
OUT = os.environ['KT_SAIDA'] + '/firebase'
PUB = OUT + '/public'
if os.path.isdir(PUB): shutil.rmtree(PUB)
for d in ['libs', 'icons']: os.makedirs(f'{PUB}/{d}', exist_ok=True)

FB_SDK = "10.12.2"
fb_tags = "".join(f'<script src="/__/firebase/{FB_SDK}/firebase-{m}-compat.js"></script>\n' for m in ["app", "auth", "firestore", "storage", "functions"]) + '<script src="/__/firebase/init.js"></script>\n'
USE_STORAGE = True  # plano Blaze ativo: arquivos no Storage
auth_js = ('window.KT_USE_STORAGE = %s;\n' % ('true' if USE_STORAGE else 'false')) + open(S + 'fb/fb_files.js').read() + '\n' + open(S + 'fb/fb_contact.js').read() + '\n' + open(S + 'fb/fb_auth.js').read()
RESET = ('<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);color-scheme:light}'
         'body{margin:0;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>\n')

def page(src_html, extra_js, manifest, title):
    h = open(src_html).read()
    h = h.replace('https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js', '/libs/d3.min.js')
    h = h.replace('https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js', '/libs/topojson-client.min.js')
    h = h.replace('https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/lite.umd.js', '/libs/exifr-lite.umd.js')
    # remove qualquer referência ao ambiente de desenvolvimento
    # vídeos da Kim: desativados até os novos vídeos (sem cliente específico) ficarem prontos
    V_ON = False
    h = h.replace('"/_blob/ace63d1ec6f5e5aa3fea1a7ba2f75e66"', '"/videos/kim_pt.mp4"' if V_ON else '""').replace('"/_blob/5abd5110e61fc0fe09a05e7635c97b86"', '"/videos/kim_en.mp4"' if V_ON else '""').replace('"/_blob/a0037f74ca13e1168ec8f3ba1ad8036b"', '""')
    # injeta Firebase + camada de acesso antes do script principal (o último <script> sem src)
    i = h.rfind('<script>\n')
    assert i > 0
    h = h[:i] + fb_tags + '<script>\n' + auth_js + '\n' + extra_js + '\n</script>\n' + h[i:]
    head = ('<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            f'<link rel="manifest" href="/{manifest}">\n<link rel="icon" href="/icons/icon-192.png">\n<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n' + RESET)
    # o <title>/<style> do app ficam no head; o restante vai no body
    j = h.find('</style>') + len('</style>')
    return head + h[:j] + '\n</head>\n<body>\n' + h[j:] + '\n</body>\n</html>\n'

main = page(os.environ['KT_SAIDA'] + '/kinseytec.html', open(S + 'fb/fb_main.js').read(), 'manifest.webmanifest', 'KinseyTec – Cacau')
portal = page(os.environ['KT_SAIDA'] + '/portal_fornecedor.html', open(S + 'fb/fb_portal.js').read(), 'manifest-portal.webmanifest', 'Portal do Fornecedor KinseyTec')
for n, t in [('index.html', main), ('portal.html', portal)]:
    assert not any(x in t.lower() for x in __import__('json').loads(os.environ.get('KT_PROIBIDOS', '[]'))), n
    assert '1157' not in t, n
    open(f'{PUB}/{n}', 'w').write(t)

# protege o código publicado: compacta e embaralha os scripts internos
import subprocess as _sp; _sp.run(['node', S + 'minify/min.js', f'{PUB}/index.html', f'{PUB}/portal.html'], check=True)
L = S + 'libs/'
shutil.copy(L + 'd3-7.8.5/package/dist/d3.min.js', PUB + '/libs/d3.min.js')
shutil.copy(L + 'topojson-client-3.1.0/package/dist/topojson-client.min.js', PUB + '/libs/topojson-client.min.js')
shutil.copy(L + 'exifr-7.1.3/package/dist/lite.umd.js', PUB + '/libs/exifr-lite.umd.js')

from PIL import Image
sym = Image.open(S + 'logo/symbol_white.png').convert('RGBA')
for size, name in [(192, 'icon-192.png'), (512, 'icon-512.png'), (180, 'apple-touch-icon.png')]:
    bg = Image.new('RGBA', (size, size), (1, 31, 75, 255)); s2 = int(size * .72); bg.alpha_composite(sym.resize((s2, s2), Image.LANCZOS), ((size - s2) // 2, (size - s2) // 2))
    bg.convert('RGB').save(f'{PUB}/icons/{name}')
sym.resize((128, 128), Image.LANCZOS).save(PUB + '/icons/logo_white.png')

V = os.environ['KT_SAIDA'] + '/'
for src, dst in []:  # vídeos desativados (ver V_ON)
    shutil.copy(V + src, f'{PUB}/videos/{dst}')

def mani(name, short, start):
    return json.dumps({"name": name, "short_name": short, "start_url": start, "scope": "/", "display": "standalone", "background_color": "#011F4B", "theme_color": "#011F4B", "lang": "pt-BR",
                       "icons": [{"src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]}, ensure_ascii=False, indent=2)
open(PUB + '/manifest.webmanifest', 'w').write(mani("KinseyTec – Cacau", "KinseyTec", "/"))
open(PUB + '/manifest-portal.webmanifest', 'w').write(mani("KinseyTec – Portal do Fornecedor", "KinseyTec Fornecedor", "/portal.html"))

PROJECT_ID = os.environ['KT_PROJETO']  # ID real do projeto no Firebase
import subprocess; subprocess.run(['python3', S + 'fb/gen_ios.py', PUB, PROJECT_ID], check=True)
json.dump({"hosting": {"public": "public", "ignore": ["firebase.json", "**/.*"], "cleanUrls": True,
           "headers": [{"source": "/videos/**", "headers": [{"key": "Cache-Control", "value": "public, max-age=86400"}]},
                       {"source": "**/*.html", "headers": [{"key": "Cache-Control", "value": "no-cache"}]},
                       {"regex": "^/(index|portal|instalar)?(\\.html)?$", "headers": [{"key": "Cache-Control", "value": "no-cache"}]},
                       {"source": "**/*.mobileconfig", "headers": [{"key": "Content-Type", "value": "application/x-apple-aspen-config"}, {"key": "Cache-Control", "value": "no-cache"}]}]},
           "firestore": {"rules": "firestore.rules", "indexes": "firestore.indexes.json"},
           "functions": [{"source": "functions", "codebase": "default", "runtime": "nodejs20", "ignore": ["node_modules", ".git", "*.log"],
                          "predeploy": ["npm --prefix \"$RESOURCE_DIR\" install --omit=dev --no-audit --no-fund"]}],
           **({"storage": {"rules": "storage.rules"}} if USE_STORAGE else {})}, open(OUT + '/firebase.json', 'w'), indent=2)
json.dump({"indexes": [], "fieldOverrides": []}, open(OUT + '/firestore.indexes.json', 'w'), indent=2)
json.dump({"projects": {"default": PROJECT_ID}}, open(OUT + '/.firebaserc', 'w'), indent=2)
FN = OUT + '/functions'
if os.path.isdir(FN): shutil.rmtree(FN)
shutil.copytree(S + 'fb/functions', FN, ignore=shutil.ignore_patterns('node_modules', 'importar.js'))
shutil.copy(S + 'app/importar.js', FN + '/importar.js')   # leitor de ZIP/PDF do próprio sistema, usado pelas listas oficiais
shutil.copy(S + 'fb/firestore.rules', OUT + '/firestore.rules'); shutil.copy(S + 'fb/storage.rules', OUT + '/storage.rules')
print('ok', sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs) // 1024 // 1024, 'MB')
