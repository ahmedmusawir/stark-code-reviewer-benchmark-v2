#!/bin/bash
set -euo pipefail

echo "🤖 STARK FACTORY: Infrastructure Initialization"
echo "--------------------------------------------------"

# --- 1. INTERACTIVE INPUTS ---

# Ask for Project ID (Default: nextjs-production-staging)
# If you press ENTER, it uses the default.
DEFAULT_PROJECT="nextjs-production-staging"
read -p "🎯 Enter Google Cloud Project ID [$DEFAULT_PROJECT]: " USER_PROJECT
PROJECT_ID="${USER_PROJECT:-$DEFAULT_PROJECT}"

# Ask for Region (Default: us-east1)
DEFAULT_REGION="us-east1"
read -p "🌎 Enter Target Region [$DEFAULT_REGION]: " USER_REGION
REGION="${USER_REGION:-$DEFAULT_REGION}"

echo "--------------------------------------------------"
echo "🚀 Initializing: $PROJECT_ID in $REGION"
echo "--------------------------------------------------"

# --- 2. SET CONTEXT ---
gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"

# --- 3. ENABLE APIs ---
echo "🔌 Enabling required APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com

# --- 4. CREATE ARTIFACT REGISTRY ---
REPO_NAME="cloud-run-source-deploy"
echo "📦 Checking Artifact Registry: $REPO_NAME..."

# Check if repo exists to avoid error spam
if gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
    echo "   ✅ Repo already exists. Skipping creation."
else
    echo "   ✨ Creating new Docker repository..."
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Docker repository for Cloud Run"
    echo "   ✅ Repo created."
fi

# --- 5. CHECK SECRETS (Observer Mode) ---
echo "🔐 Verifying Secrets existence..."
MISSING_SECRETS=0
# You can add more secrets to this list as needed
for secret in WOOCOM_CONSUMER_KEY WOOCOM_CONSUMER_SECRET STRIPE_SECRET_KEY; do
    if ! gcloud secrets describe "$secret" &>/dev/null; then
        echo "   ❌ MISSING: $secret"
        MISSING_SECRETS=1
    else
        echo "   ✅ Found: $secret"
    fi
done

echo "--------------------------------------------------"
if [ "$MISSING_SECRETS" -eq 1 ]; then
    echo "⚠️  WARNING: Some secrets are missing."
    echo "   Use 'gcloud secrets create [NAME] --data-file=[PATH]' to fix this."
else
    echo "✅ Infrastructure Ready. You are clear to launch deploy.sh"
fi