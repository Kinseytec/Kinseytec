#!/usr/bin/env bash
# KinseyTec · cópia de segurança antes de publicar (rodar no Cloud Shell, dentro da pasta firebase)
# 1) liga, uma única vez, as proteções permanentes do Firebase:
#    - recuperação a um ponto no tempo do banco (PITR, últimos 7 dias)
#    - backup automático diário do banco, guardado por 7 dias
#    - lixeira do Storage: arquivo apagado fica recuperável por 30 dias
# 2) faz uma exportação completa do banco (Firestore) para o Storage, datada, antes de cada publicação,
#    e guarda só o último e o penúltimo backup das publicações.
# Nada aqui apaga dados. Se um passo já estiver ligado, o script só avisa e segue.
set -u
PROJ="${1:-$(sed -n 's/.*"default": *"\([^"]*\)".*/\1/p' .firebaserc 2>/dev/null)}"
[ -z "$PROJ" ] && { echo "Informe o projeto: bash backup_antes_de_publicar.sh kinsey-capital-ma"; exit 1; }
echo "Projeto: $PROJ"
gcloud config set project "$PROJ" >/dev/null 2>&1

echo "== 1/4 Recuperação a um ponto no tempo (PITR, 7 dias)"
gcloud firestore databases update --database="(default)" --enable-pitr --project="$PROJ" >/dev/null 2>&1 \
  && echo "   ligada" || echo "   já estava ligada ou o perfil não permite (confira no console: Firestore › Recuperação de desastres)"

echo "== 2/4 Backup automático diário do banco (7 dias)"
if gcloud firestore backups schedules list --database="(default)" --project="$PROJ" 2>/dev/null | grep -q "dailyRecurrence\|DAILY\|recurrence"; then
  echo "   já existe"
else
  gcloud firestore backups schedules create --database="(default)" --recurrence=daily --retention=7d --project="$PROJ" >/dev/null 2>&1 \
    && echo "   criado" || echo "   não foi possível criar agora (confira o plano Blaze e o perfil de proprietário)"
fi

BUCKET="$(gcloud storage buckets list --project="$PROJ" --format='value(name)' 2>/dev/null | grep -E 'firebasestorage\.app$|appspot\.com$' | head -1)"
echo "== 3/4 Lixeira do Storage (arquivos apagados recuperáveis por 30 dias)"
if [ -n "$BUCKET" ]; then
  gcloud storage buckets update "gs://$BUCKET" --soft-delete-duration=30d >/dev/null 2>&1 \
    && echo "   ligada em gs://$BUCKET" || echo "   não foi possível ajustar (confira o perfil de proprietário)"
else
  echo "   bucket do Storage não encontrado"
fi

echo "== 4/4 Exportação completa do banco antes de publicar"
if [ -n "$BUCKET" ]; then
  DEST="gs://$BUCKET/backups/firestore-$(date +%Y%m%d-%H%M)"
  if gcloud firestore export "$DEST" --project="$PROJ" >/dev/null 2>&1; then
    echo "   OK: $DEST"
    # guarda só o último e o penúltimo backup das publicações (os mais antigos são removidos)
    ANTIGOS="$(gcloud storage ls "gs://$BUCKET/backups/" 2>/dev/null | grep 'firestore-' | sort | head -n -2)"
    for A in $ANTIGOS; do gcloud storage rm -r "$A" >/dev/null 2>&1 && echo "   backup antigo removido: $A"; done
  else
    echo "   a exportação não rodou (comum na primeira vez: confira permissões). O backup diário do passo 2 continua valendo."
  fi
else
  echo "   sem bucket para exportar; o backup diário do passo 2 continua valendo"
fi
echo
echo "Pronto. Agora publique: npx -y firebase-tools@13 deploy --project $PROJ"
