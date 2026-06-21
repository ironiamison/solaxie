# Solaxie deploy checklist

## 1. Anchor program (mainnet)

```bash
cd program
./scripts/deploy.sh mainnet-beta   # or devnet for testing
anchor idl init -f target/idl/solaxie.json <PROGRAM_ID>
```

Copy `target/idl/solaxie.json` → `app/idl/solaxie.json` after any program change.

Initialize once (authority wallet):

```bash
cd app
node scripts/setup.js          # initialize + fund vault
node scripts/demo.js             # smoke test mint/breed/battle
```

Fund the recycling vault with creator-reward SOLAX:

```bash
node scripts/fund-vault.js <amount_in_whole_tokens>
```

**Skip this** — economy is burn-only; vault stays empty and no SOLAX is paid out to players.

## 2. Vercel env vars

Set in **Project → Settings → Environment Variables** (root directory: `app`):

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | yes | `https://solaxie.com` |
| `NEXT_PUBLIC_RPC` | yes | Helius/QuickNode mainnet URL |
| `NEXT_PUBLIC_PROGRAM_ID` | yes | Must match deployed program |
| `NEXT_PUBLIC_TOKEN_MINT` | yes | pump.fun SPL mint |
| `BLOB_READ_WRITE_TOKEN` | yes | Leaderboard, feed, stats, **cloud saves** |

Without Blob, data is in-memory per serverless instance (leaderboard and saves reset on cold start).

## 3. Economy model (v1.2)

**Burn-only — zero SOLAX distribution from the team.**

- **Client burns:** feed, power-up, energy refill, Harbor shop, arena slots
- **Program burns:** mint (100k), breed (150k × factor)
- **No faucet** — trainers buy SOLAX on pump.fun; no starter grant
- **Battles:** XP + DNA only — no SOLAX payouts ever
- **Vault:** created at init but stays empty; you do not need to fund it

Track total burned via Island Economy meter (`/api/stats` + on-chain burn txs).

## 4. What runs on-chain vs Vercel

| Data | Source |
|------|--------|
| Solaxies (Axols) | On-chain PDAs |
| SOLAX balance | Wallet SPL ATA |
| Energy | On-chain `PlayerData` |
| Trainer profile, quests, pond layout | Vercel Blob (`/api/save`) |
| Leaderboard / PvP discovery | Vercel Blob (`/api/players`) |
| Live feed / economy meter | Vercel Blob + vault RPC read |

## 5. Deploy

```bash
cd app
npm run build
git push   # Vercel auto-deploys if connected
```

After deploy: connect wallet on solaxie.com → confirm mint/breed/battle txs succeed and `/api/save` returns 201 in Network tab.
