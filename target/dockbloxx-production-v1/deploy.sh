#!/bin/bash
set -euo pipefail

# --- ⚙️ CONFIGURATION ---
PROJECT_ID="nextjs-production-staging"
REGION="us-east1"
SERVICE_NAME="dockbloxx-prod-staging"

# --- 🌍 PUBLIC VARIABLES (Update these!) ---
# URL placeholder until first deploy
NEXT_PUBLIC_APP_URL="https://dockbloxx-prod-staging-1041708144232.us-east1.run.app"
NEXT_PUBLIC_BACKEND_URL="https://dbp.dockbloxx.com"
# REPLACE THIS with the actual Prod-Staging Stripe Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51M1wc0C9xAnLYIr4ZCrtmIiWHW2MkEq6m19dQgx59H4FcPtH857bGTfdbaOlh6Sb1rdCj3P7Dn2apNqBpeG3JbPH00sn8SlAvu"

# --- 🚀 EXECUTION ---
echo "=================================================="
echo "🤖 Stark Deployment Agent: Initiating Sequence"
echo "   Project: $PROJECT_ID"
echo "   Region:  $REGION"
echo "   Service: $SERVICE_NAME"
echo "=================================================="

# 1. Ensure we are looking at the right project
gcloud config set project "$PROJECT_ID" --quiet

# 2. Submit the build
echo "🚀 Submitting Cloud Build..."
gcloud builds submit \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --config cloudbuild.yaml \
  --substitutions _REGION="$REGION",_SERVICE_NAME="$SERVICE_NAME",_NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL",_NEXT_PUBLIC_BACKEND_URL="$NEXT_PUBLIC_BACKEND_URL",_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"

echo "=================================================="
echo "✅ Deployment Sequence Complete."
echo "   Check the Cloud Run URL above to verify."
echo "   Remember to update NEXT_PUBLIC_APP_URL in this script with the real URL!"
echo "=================================================="