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

RES="## Publicação KinseyTec\n\n| Sistema | Endereço | Publicação | Site | Banco de dados |\n|---|---|---|---|---|\n"; FALHA=0
for X in $LISTA; do
  PRODUTO=${X%%/*}; SEG=${X##*/}; CFG="produtos/$PRODUTO/segmentos/$SEG/seg.json"
  [ -f "$CFG" ] || { RES+="| $X | — | ✘ segmento não encontrado | | |\n"; FALHA=1; continue; }
  P=$(python3 -c "import json;print(json.load(open('$CFG'))['projeto'])"); N=$(python3 -c "import json;print(json.load(open('$CFG'))['name'])")
  echo "::group::$N → $P"
  OK="✔"
  python3 ferramentas/construir.py "$PRODUTO" "$SEG" || { RES+="| $N | — | ✘ falha ao construir | | |\n"; FALHA=1; echo "::endgroup::"; continue; }
  DIR="dist/$PRODUTO/$SEG/firebase"
  (cd "$DIR" && firebase deploy --project "$P" --only hosting,firestore,storage,functions --non-interactive --force) || \
  (cd "$DIR" && firebase deploy --project "$P" --only hosting,firestore,storage --non-interactive && echo "Funções não publicadas: confira o plano Blaze") || \
  (cd "$DIR" && firebase deploy --project "$P" --only hosting,firestore --non-interactive && echo "Storage não ativado: publicado sem as regras de arquivos") || { OK="✘"; FALHA=1; }
  echo '[{"origin":["https://'"$P"'.web.app","https://'"$P"'.firebaseapp.com"],"method":["GET"],"maxAgeSeconds":3600}]' > /tmp/cors.json
  (gsutil -q cors set /tmp/cors.json "gs://$P.firebasestorage.app" 2>/dev/null || gsutil -q cors set /tmp/cors.json "gs://$P.appspot.com" 2>/dev/null) || echo "CORS do Storage não aplicado (download em .zip)"
  echo "::endgroup::"
  sleep 3
  H=$(curl -s -o /dev/null -w '%{http_code}' "https://$P.web.app/")
  FS=$(curl -s "https://firestore.googleapis.com/v1/projects/$P/databases/(default)/documents/config/teste")
  if echo "$FS" | grep -qi "database (default) does not exist"; then DB="✘ banco não criado"; FALHA=1; else DB="✔"; fi
  [ "$H" = "200" ] && SITE="✔" || { SITE="✘ ($H)"; FALHA=1; }
  RES+="| $N | https://$P.web.app | $OK | $SITE | $DB |\n"
done
echo -e "$RES" | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
exit $FALHA
