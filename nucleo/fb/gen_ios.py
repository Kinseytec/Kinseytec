"""Gera os instaladores de iPhone (perfis .mobileconfig com Web Clip) e a página /instalar.
uso: gen_ios.py <pasta public> <id do projeto>"""
import sys, uuid, base64, plistlib, os
PUB, PID = sys.argv[1], sys.argv[2]
BASE = f"https://{PID}.web.app"
icon = open(os.path.join(PUB, 'icons/apple-touch-icon.png'), 'rb').read()

def profile(fname, label, url, desc, ident):
    clip = {"PayloadType": "com.apple.webClip.managed", "PayloadVersion": 1,
            "PayloadIdentifier": f"br.com.kinsey.kinseytec.{ident}.webclip", "PayloadUUID": str(uuid.uuid5(uuid.NAMESPACE_URL, url + '#clip')).upper(),
            "PayloadDisplayName": label, "Label": label, "URL": url, "Icon": icon,
            "FullScreen": True, "IsRemovable": True, "Precomposed": True, "IgnoreManifestScope": False}
    top = {"PayloadType": "Configuration", "PayloadVersion": 1, "PayloadContent": [clip],
           "PayloadIdentifier": f"br.com.kinsey.kinseytec.{ident}", "PayloadUUID": str(uuid.uuid5(uuid.NAMESPACE_URL, url + '#top')).upper(),
           "PayloadDisplayName": label, "PayloadOrganization": "Kinsey BR", "PayloadDescription": desc, "PayloadRemovalDisallowed": False}
    with open(os.path.join(PUB, fname), 'wb') as f: plistlib.dump(top, f)

profile("KinseyTec_Cacau.mobileconfig", "KinseyTec", BASE + "/",
        "Instala o KinseyTec – Cacau na tela de início do iPhone. Acesso para administrador, cliente e equipe Kinsey BR.", "app")
profile("KinseyTec_Fornecedor.mobileconfig", "KinseyTec Fornecedor", BASE + "/portal.html",
        "Instala o Portal do Fornecedor KinseyTec na tela de início do iPhone.", "portal")

page = """<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Instalar KinseyTec</title><link rel="icon" href="/icons/icon-192.png"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<style>:root{--navy:#011F4B;--acc:#0473C3;--fog:#E6E8EC}*{box-sizing:border-box}body{margin:0;background:var(--navy);color:#fff;font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:max(24px,env(safe-area-inset-top)) 16px 32px}
main{max-width:520px;margin:0 auto}.top{display:flex;align-items:center;gap:12px;margin-bottom:20px}.top img{width:52px;height:52px;border-radius:12px}
h1{font-size:22px;margin:0}h1 span{color:#7FB8E6}.sub{color:#B9C6D8;font-size:13px;margin:2px 0 0}
.card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:18px;margin:14px 0}
.card h2{font-size:16px;margin:0 0 6px}.btn{display:block;text-align:center;background:var(--acc);color:#fff;text-decoration:none;font-weight:700;padding:14px;border-radius:12px;margin:12px 0 4px}
.btn.alt{background:transparent;border:1px solid #7FB8E6;color:#CFE4F7}ol{padding-left:20px;margin:8px 0 0}li{margin:4px 0}small{color:#9FB0C6}.lang{float:right}
.lang button{background:none;border:1px solid #5d7aa0;color:#cfe0f5;border-radius:8px;padding:4px 8px;font-size:12px}.lang button.on{background:#0473C3;border-color:#0473C3}</style></head>
<body><main>
<div class="lang"><button data-l="pt" class="on">PT</button> <button data-l="en">EN</button></div>
<div class="top"><img src="/icons/apple-touch-icon.png" alt=""><div><h1>Kinsey<span>Tec</span> – Cacau</h1><p class="sub" data-t="sub">Instalação no iPhone</p></div></div>

<div class="card"><h2 data-t="h_app">Administrador, cliente e equipe Kinsey</h2>
<a class="btn" href="/KinseyTec_Cacau.mobileconfig" data-t="b_app">Instalar KinseyTec no iPhone</a>
<ol data-t="steps">
<li>Abra esta página no <b>Safari</b> e toque no botão acima → <b>Permitir</b>.</li>
<li>Abra <b>Ajustes</b> → toque em <b>Perfil Transferido</b> (logo abaixo do seu nome).</li>
<li>Toque em <b>Instalar</b>, digite o código do iPhone e confirme <b>Instalar</b>.</li>
<li>O ícone <b>KinseyTec</b> aparece na tela de início. Abra e entre com seu e-mail.</li>
</ol></div>

<div class="card"><h2 data-t="h_forn">Fornecedores</h2>
<a class="btn alt" href="/KinseyTec_Fornecedor.mobileconfig" data-t="b_forn">Instalar Portal do Fornecedor</a>
<small data-t="s_forn">Mesmos passos. O fornecedor vê apenas os próprios dados.</small></div>

<div class="card"><h2 data-t="h_alt">Outra forma (sem perfil)</h2>
<p data-t="alt" style="margin:0">No Safari, abra <b>__BASE__</b> → <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b> → <b>Adicionar</b>.</p></div>

<small data-t="note">O iPhone mostra "Não verificado" porque é um perfil de teste da Kinsey BR; é seguro instalar. Para remover: Ajustes → Geral → VPN e Gerenciamento de Dispositivos.</small>
</main>
<script>
const EN={h_ct:"Contact",sub:"iPhone installation",h_app:"Administrator, client and Kinsey team",b_app:"Install KinseyTec on iPhone",
steps:"<li>Open this page in <b>Safari</b> and tap the button above → <b>Allow</b>.</li><li>Open <b>Settings</b> → tap <b>Profile Downloaded</b> (just below your name).</li><li>Tap <b>Install</b>, enter your passcode and confirm <b>Install</b>.</li><li>The <b>KinseyTec</b> icon appears on your Home Screen. Open it and sign in with your e-mail.</li>",
h_forn:"Suppliers",b_forn:"Install Supplier Portal",s_forn:"Same steps. Suppliers only see their own data.",h_alt:"Another way (no profile)",
alt:"In Safari, open <b>__BASE__</b> → <b>Share</b> → <b>Add to Home Screen</b> → <b>Add</b>.",
note:"iPhone shows \\"Not Verified\\" because this is a Kinsey BR test profile; it is safe to install. To remove: Settings → General → VPN & Device Management."};
const PT={};document.querySelectorAll('[data-t]').forEach(e=>PT[e.dataset.t]=e.innerHTML);
function set(l){document.querySelectorAll('[data-t]').forEach(e=>e.innerHTML=(l==='en'?EN:PT)[e.dataset.t]);document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.l===l));document.documentElement.lang=l==='en'?'en':'pt-BR';try{localStorage.setItem('kinseytec-lang',l)}catch(e){}}
document.querySelectorAll('.lang button').forEach(b=>b.onclick=()=>set(b.dataset.l));
try{if(localStorage.getItem('kinseytec-lang')==='en')set('en')}catch(e){}
</script></body></html>
""".replace("__BASE__", BASE.replace("https://", ""))
open(os.path.join(PUB, 'instalar.html'), 'w').write(page)
print('ios ok', BASE)
