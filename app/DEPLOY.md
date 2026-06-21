# Deploy Solaxie → solaxie.com

## Vercel (recommended)

### 1. Import project
1. Push repo to GitHub
2. [vercel.com/new](https://vercel.com/new) → import repo
3. **Root Directory:** `app`
4. **Environment variables** (Production):

```
NEXT_PUBLIC_SITE_URL=https://solaxie.com
NEXT_PUBLIC_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_PROGRAM_ID=<after anchor deploy>
NEXT_PUBLIC_TOKEN_MINT=<your pump.fun mint>
```

5. Deploy

### 2. DNS for solaxie.com

In Vercel → Project → **Settings → Domains**, add:
- `solaxie.com`
- `www.solaxie.com` (auto-redirects to apex via vercel.json)

At your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.):

**Option A — Vercel nameservers (easiest)**  
Point the domain to Vercel’s nameservers; Vercel manages all records.

**Option B — Keep your DNS host**

| Type | Name | Value |
|------|------|--------|
| **A** | `@` | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

(Vercel may show slightly different values in the Domains UI — use those if they differ.)

SSL is automatic. Wait 5–30 minutes for DNS propagation.

### 3. On-chain (mainnet)

```bash
cd program && ./scripts/deploy.sh mainnet-beta
cd ../app
TOKEN_MINT=<mint> RPC=https://api.mainnet-beta.solana.com node scripts/deploy-init.js
AMOUNT=1000000 node scripts/fund-vault.js
```

Update `NEXT_PUBLIC_PROGRAM_ID` in Vercel → **Redeploy**.

---

## Verify launch

- [ ] https://solaxie.com loads over HTTPS
- [ ] https://www.solaxie.com redirects to https://solaxie.com
- [ ] Phantom connects on the live domain
- [ ] Shop purchases use mainnet RPC + your token mint

## Local production test

```bash
cd app
cp .env.example .env.local   # fill values
npm run build && npm start
```
