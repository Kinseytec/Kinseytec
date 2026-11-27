#!/bin/bash
# Constrói e publica no Firebase os sistemas escolhidos (ou os afetados pelo último commit) e confere cada um no ar.
# Usado pelo GitHub Actions (.github/workflows/publicar.yml). ESCOLHA: "todos" ou "cadeias/soja cadeias/metal ..."
set -u
todos() { for p in produtos/*/segmentos/*/seg.json; do echo "$p" | sed 's#produtos/\([^/]*\)/segmentos/\([^/]*\)/seg.json#\1/\2#'; done; }
if [ -n "${ESCOLHA:-}" ]; then
  [ "$ESCOLHA" = "todos" ] && LISTA=$(todos) || LISTA="$ESCOLHA"
else
  MUDOU=$(git diff --name-only HEAD^ HEAD 2>/dev/null || echo "nucleo/")
  if echo "$MUDOU" | grep -q '^nucleo/\|^ferramentas/construir.py'; then LISTA=$(todos)      # núcleo mudou: todos os sistemas
  else LISTA=$(echo "$MUDOU" | sed -n 's#^produtos/\([^/]*\)/segmentos/\([^/]*\)/.*#\1/\2#p' | sort -u); fi
fi
[ -z "$(echo $LISTA | tr -d ' ')" ] && { echo "Nenhum sistema alterado."; exit 0; }

RES="## Publicação KinseyTec\n\n| Sistema | Endereço | Publicação | Site | Banco de dados | Função de leitura |\n|---|---|---|---|---|---|\n"; FALHA=0
for X in $LISTA; do
  PRODUTO=${X%%/*}; SEG=${X##*/}; CFG="produtos/$PRODUTO/segmentos/$SEG/seg.json"
  [ -f "$CFG" ] || { RES+="| $X | — | ✘ segmento não encontrado | | |\n"; FALHA=1; continue; }
  P=$(python3 -c "import json;print(json.load(open('$CFG'))['projeto'])"); N=$(python3 -c "import json;print(json.load(open('$CFG'))['name'])")
  echo "::group::$N → $P"
  OK="✔"
  python3 ferramentas/construir.py "$PRODUTO" "$SEG" || { RES+="| $N | — | ✘ falha ao construir | | |\n"; FALHA=1; echo "::endgroup::"; continue; }
  DIR="dist/$PRODUTO/$SEG/firebase"
  # cópia de segurança do banco antes de publicar (e proteções permanentes: PITR, backup diário, lixeira do Storage)
  (cd "$DIR" && bash backup_antes_de_publicar.sh "$P") || echo "::warning::backup antes de publicar não concluído (o backup diário continua valendo)"
  (cd "$DIR" && firebase deploy --project "$P" --only hosting,firestore,storage,functions --non-interactive --force) || \
  (cd "$DIR" && firebase deploy --project "$P" --only hosting,firestore,storage --non-interactive && echo "Funções não publicadas: confira o plano Blaze") || \
  (cd "$DIR" && firebase deploy --project "$P" --only hosting,firestore --non-interactive && echo "Storage não ativado: publicado sem as regras de arquivos") || { OK="✘"; FALHA=1; }
  # endereços reais do site (o site padrão pode ter outro nome, ex.: kinseytec-ma.web.app)
  SITES=$(firebase hosting:sites:list --project "$P" --json 2>/dev/null | python3 -c "import sys,json
try:
  d=json.load(sys.stdin); L=d.get('result',{}).get('sites',[]) if isinstance(d.get('result'),dict) else d.get('result',[])
  print(' '.join(s['name'].split('/')[-1] for s in L))
except Exception: pass")
  [ -z "$SITES" ] && SITES="$P"
  ORIG=$(for S in $SITES $P; do printf '"https://%s.web.app","https://%s.firebaseapp.com",' "$S" "$S"; done | sed 's/,$//')
  echo "[{\"origin\":[$ORIG],\"method\":[\"GET\"],\"maxAgeSeconds\":3600}]" > /tmp/cors.json
  B=$(gcloud storage buckets list --project="$P" --format='value(name)' 2>/dev/null | grep -E 'firebasestorage\.app$|appspot\.com$' | head -1)
  if [ -n "$B" ] && gcloud storage buckets update "gs://$B" --cors-file=/tmp/cors.json >/dev/null 2>&1; then echo "Storage liberado para: $SITES"; else echo "::warning::CORS do Storage não aplicado"; fi
  # funções chamadas pelo sistema: acesso público ao endereço (cada função confere login, perfil e cliente)
  for F in lerarquivo convidar consultarempresa prospeccao investidoresprovaveis lersite atualizaragora; do
    gcloud run services describe "$F" --region=southamerica-east1 --project="$P" >/dev/null 2>&1 || continue
    gcloud run services add-iam-policy-binding "$F" --region=southamerica-east1 --member=allUsers --role=roles/run.invoker --project="$P" >/dev/null 2>&1 \
      && echo "função $F: acesso liberado" || echo "::warning::função $F: acesso público bloqueado (política da organização iam.allowedPolicyMemberDomains)"
  done
  FUN=$(firebase functions:list --project "$P" 2>/dev/null | grep -c -i 'lerArquivo')
  echo "::endgroup::"
  sleep 3
  S1=$(echo $SITES | awk '{print $1}'); H=$(curl -s -o /dev/null -w '%{http_code}' "https://$S1.web.app/")
  FS=$(curl -s "https://firestore.googleapis.com/v1/projects/$P/databases/(default)/documents/config/teste")
  if echo "$FS" | grep -qi "database (default) does not exist"; then DB="✘ banco não criado"; FALHA=1; else DB="✔"; fi
  [ "$H" = "200" ] && SITE="✔" || { SITE="✘ ($H)"; FALHA=1; }
  [ "${FUN:-0}" -gt 0 ] && FL="✔" || FL="✘ (veja o log)"
  RES+="| $N | https://$S1.web.app | $OK | $SITE | $DB | $FL |\n"
done
echo -e "$RES" | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
exit $FALHA
