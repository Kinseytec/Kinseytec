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
  cloudresourcemanager.googleapis.com firebase.googleapis.com serviceusage.googleapis.com >/dev/null

gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create publicador-github --display-name="Publicação automática (GitHub)"

for R in roles/firebase.admin roles/cloudfunctions.admin roles/run.admin roles/artifactregistry.admin \
         roles/cloudbuild.builds.editor roles/iam.serviceAccountUser roles/storage.admin \
         roles/secretmanager.admin roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$PROJ" --member="serviceAccount:$SA" --role="$R" --condition=None -q >/dev/null
done

gcloud iam workload-identity-pools describe github --location=global >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools create github --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers describe github --location=global --workload-identity-pool=github >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools providers create-oidc github --location=global --workload-identity-pool=github \
    --display-name="GitHub Actions" --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository=='$REPO' && assertion.ref=='refs/heads/main'"

gcloud iam service-accounts add-iam-policy-binding "$SA" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$NUM/locations/global/workloadIdentityPools/github/attribute.repository/$REPO" >/dev/null

echo
echo "Pronto. No GitHub (Settings > Secrets and variables > Actions > Variables), crie:"
echo "  GCP_WIF_PROVIDER    = projects/$NUM/locations/global/workloadIdentityPools/github/providers/github"
echo "  GCP_SERVICE_ACCOUNT = $SA"
echo "E em Settings > Environments, crie o ambiente: producao (opcional: Required reviewers = quem aprova cada publicação)."
