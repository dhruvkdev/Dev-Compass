#!/usr/bin/env bash
set -euo pipefail

# Deploy this repo to Google Cloud Run (Artifact Registry + Cloud Run).
# Prerequisites: gcloud CLI, Docker, billing enabled, APIs:
#   gcloud services enable run.googleapis.com artifactregistry.googleapis.com
#
# Usage:
#   export GCP_PROJECT="your-project-id"
#   export GCP_REGION="us-central1"   # optional, default us-central1
#   export SERVICE_NAME="dev-compass" # optional
#   ./scripts/deploy-cloud-run.sh

: "${GCP_PROJECT:?Set GCP_PROJECT to your Google Cloud project ID}"
REGION="${GCP_REGION:-us-central1}"
SERVICE="${SERVICE_NAME:-dev-compass}"
REPO="${ARTIFACT_REPO:-dev-compass}"
IMAGE="${REGION}-docker.pkg.dev/${GCP_PROJECT}/${REPO}/${SERVICE}:$(date -u +%Y%m%d%H%M%S)"

gcloud config set project "${GCP_PROJECT}"

gcloud artifacts repositories describe "${REPO}" --location="${REGION}" >/dev/null 2>&1 \
  || gcloud artifacts repositories create "${REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Dev Compass images"

gcloud auth configure-docker "${REGION}-docker.pkg.dev" -q

docker build -t "${IMAGE}" .
docker push "${IMAGE}"

gcloud run deploy "${SERVICE}" \
  --image="${IMAGE}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production"

echo "Deployed ${SERVICE}. Set secrets / env in Cloud Run console for DATABASE_URL, UPSTASH_*, BETTER_AUTH_*, GITHUB_*, GOOGLE_*, etc."
