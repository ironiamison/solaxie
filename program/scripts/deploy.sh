#!/usr/bin/env bash
# Deploy the Solaxie Anchor program. Run from repo root or program/.
set -euo pipefail
CLUSTER="${1:-devnet}"
cd "$(dirname "$0")/.."
echo "Building program..."
anchor build
echo "Deploying to $CLUSTER..."
anchor deploy --provider.cluster "$CLUSTER"
echo ""
echo "Program id: $(solana address -k target/deploy/solaxie-keypair.json)"
echo ""
echo "Next steps:"
echo "  1. Copy program id to app/.env.local as NEXT_PUBLIC_PROGRAM_ID"
echo "  2. cd ../app && TOKEN_MINT=<your-pump-mint> node scripts/deploy-init.js"
