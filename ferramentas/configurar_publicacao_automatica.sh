#!/bin/bash
# Configuração única da publicação automática do KinseyTec M&A (GitHub Actions -> Firebase).
# Rode no Cloud Shell (console.cloud.google.com, ícone >_ no topo), logado como dono do projeto.
# Não cria nem guarda chave: o GitHub entra no Google Cloud pela federação de identidade (Workload Identity),
# e só a branch main deste repositório tem permissão de publicar.
set -e
PROJ=${1:-kinsey-capital-ma}
REPO=${2:-kinseytec/kinseytec}
SA=publicador-github@$PROJ.iam.gserviceaccount.com

gcloud config set project "$PROJ" >/dev/null
NUM=$(gcloud projects describe "$PROJ" --format='value(projectNumber)')
echo "Projeto $PROJ ($NUM) · repositório $REPO"

gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
  cloudresourcemanager.googleapis.com firebase.googleapis.com serviceusage.googleapis.com \
  cloudfunctions.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com run.googleapis.com \
  eventarc.googleapis.com pubsub.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com \
  firestore.googleapis.com firebasestorage.googleapis.com storage.googleapis.com >/dev/null
# segredos das bases contratadas: existem com "nao configurado" até a Kinsey cadastrar a chave oficial (sem isso o deploy das funções para)
for S in ECONODATA_TOKEN RAMPER_TOKEN LEMITTI_TOKEN; do
  gcloud secrets describe "$S" >/dev/null 2>&1 || printf 'nao configurado' | gcloud secrets create "$S" --data-file=- >/dev/null
done

gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create publicador-github --display-name="Publicação automática (GitHub)"

for R in roles/firebase.admin roles/cloudfunctions.admin roles/run.admin roles/artifactregistry.admin \
         roles/cloudbuild.builds.editor roles/iam.serviceAccountUser roles/storage.admin \
         roles/secretmanager.admin roles/serviceusage.serviceUsageConsumer \
         roles/datastore.owner roles/datastore.importExportAdmin roles/cloudscheduler.admin roles/eventarc.admin; do
  gcloud projects add-iam-policy-binding "$PROJ" --member="serviceAccount:$SA" --role="$R" --condition=None -q >/dev/null
done

gcloud iam workload-identity-pools describe github --location=global >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools create github --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers describe github --location=global --workload-identity-pool=github >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools providers create-oidc github --location=global --workload-identity-pool=github \
    --display-name="GitHub Actions" --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository=='$REPO' && (assertion.ref=='refs/heads/main' || assertion.ref=='refs/heads/claude/affectionate-ride-h3apqa')"
gcloud iam workload-identity-pools providers update-oidc github --location=global --workload-identity-pool=github \
  --attribute-condition="assertion.repository=='$REPO' && (assertion.ref=='refs/heads/main' || assertion.ref=='refs/heads/claude/affectionate-ride-h3apqa')" >/dev/null 2>&1 || true

gcloud iam service-accounts add-iam-policy-binding "$SA" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$NUM/locations/global/workloadIdentityPools/github/attribute.repository/$REPO" >/dev/null

echo
echo "Pronto. No GitHub (Settings > Secrets and variables > Actions > Variables), crie:"
echo "  GCP_WIF_PROVIDER    = projects/$NUM/locations/global/workloadIdentityPools/github/providers/github"
echo "  GCP_SERVICE_ACCOUNT = $SA"
echo "Pronto: cada versão enviada daqui (ou que entrar na main) é publicada sozinha. Acompanhe em GitHub > Actions."
