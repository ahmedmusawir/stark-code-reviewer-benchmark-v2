#!/bin/bash
set -e  # Fail fast

echo "🤖 STARK FACTORY: Installing Google Cloud SDK..."

# 1. Pre-requisites
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates gnupg curl

# 2. Add Google's keys
# Check if key already exists to avoid duplication/errors
if [ ! -f /usr/share/keyrings/cloud.google.gpg ]; then
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
fi

# 3. Add the Repo
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list

# 4. Install
sudo apt-get update && sudo apt-get install -y google-cloud-cli

echo "✅ GCloud Installed."
echo "--------------------------------------------------"
echo "🚀 ACTION REQUIRED: Logging you in..."
echo "1. Click the link below."
echo "2. Login with your Google Account."
echo "3. Paste the code back here."
echo "--------------------------------------------------"

# 5. Trigger Login
gcloud auth login

echo "--------------------------------------------------"
echo "✅ Authentication Complete. You are ready for Phase 2."