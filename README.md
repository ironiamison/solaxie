# 🧬 Solaxie

An **Axie Infinity–style** collect / breed / battle creature game, built on **Solana** with
**Anchor**. Players roll **Axols** — creatures whose look, class, and combat stats come from a
6-part **gene** system across 6 classes — then **breed** them (Mendelian gene mixing) and
**battle** them on-chain to earn the game's **SPL token**.

The game uses a **single token** (intended to launch on **pump.fun**) under a **fixed-supply +
recycling treasury** model — see [Tokenomics](#tokenomics).

Originally bootstrapped from
[`solana-developers/solana-game-preset`](https://github.com/solana-developers/solana-game-preset)
and rebuilt into a creature game.

---

## Gameplay

- **Collect** — `mint_axol` rolls a generation-0 Axol with a randomized genome (costs tokens →
  treasury).
- **Breed** — `breed` combines two of your Axols into a child. Each gene part is inherited from a
  parent with Axie-like dominant/recessive odds (60/30/10). Breeding costs tokens (→ treasury)
  that scale with how often the parents have already bred; each Axol can breed at most 7 times.
- **Battle** — `battle` runs a deterministic, on-chain turn simulation between two Axols using
  their stats + a class-advantage cycle + a seeded PRNG. Winners earn tokens (← treasury) and XP
  (which levels the Axol up). Battles cost energy, which refills over time.

## Tokenomics

Single token, **fixed supply**, intended for a **pump.fun** launch (so its mint authority is
revoked — the program never mints). Sustainability comes from a **recycling treasury vault** owned
by a program PDA:

- **Sinks → vault:** minting Axols and breeding pay tokens *into* the vault.
- **Faucets ← vault:** the new-player starter grant and battle rewards pay tokens *out* of the
  vault (battle payouts are capped by the vault balance).
- Because sinks refill what faucets pay out, the pool self-sustains as long as the economy is
  tuned (`programs/solaxie/src/constants.rs`).

**Funding the vault (mainnet):** with a pump.fun fixed-supply launch you can't pre-mint a treasury
allocation, so you top it up via the **`fund_treasury`** instruction — the intended source is
**pump.fun creator rewards** (swapped into the token) routed into the vault. New trainers then draw
their starter stash straight from the vault, so onboarding needs zero manual airdrops.

> The token mint is **configurable** (set once via `initialize`), so the program is
> launch-mechanism-agnostic. For local dev, `scripts/setup.js` creates a mock 6-decimal mint and
> funds the vault.

### Classes & stats

6 classes — **Beast, Aquatic, Plant, Bird, Bug, Reptile** — each with a stat identity
(HP / Speed / Skill / Morale). An Axol's stats are the sum of its 6 expressed gene parts, and its
**primary class** is whichever class appears most. Class advantage follows a clean cycle: each
class is strong vs. the next two and weak vs. the previous two (±15% damage).

---

## Architecture

```
program/                      Anchor workspace (Rust)
  programs/solaxie/src/
    lib.rs                    program entrypoint + instructions
    constants.rs              tunables (energy, costs, battle params)
    errors.rs                 custom errors
    genes.rs                  gene model, stat derivation, RNG, breeding, battle engine (+ tests)
    state/
      player_data.rs          PlayerData PDA (energy, LOVE, record)
      axol.rs                 Axol PDA (genome, stats, level/xp, parents)
      game_data.rs            global GameData registry PDA
    instructions/             init_player, mint_axol, breed, battle
app/                          Next.js + Chakra UI + Solana wallet-adapter client
  pages/index.tsx             the full game UI
  components/AxolCard.tsx     creature card (procedural SVG art)
  utils/anchor.ts             program/PDA helpers + stat helpers
  idl/                        generated IDL + TS types (copied from the build)
  scripts/demo.js             end-to-end CLI check against a local validator
```

### Accounts (PDAs)

| Account          | Seeds                     | Purpose                                       |
|------------------|---------------------------|-----------------------------------------------|
| `GameData`       | `["config"]`              | global registry; token mint; assigns Axol ids |
| `PlayerData`     | `["player", owner]`       | per-player energy, win/loss record            |
| `Axol`           | `["axol", id (u64 le)]`   | a creature                                    |
| treasury vault   | `["vault"]`               | program-owned SPL token account (reward pool) |
| vault authority  | `["vault_auth"]`          | PDA that signs payouts from the vault         |

Instructions: `initialize`, `fund_treasury`, `init_player`, `mint_axol`, `breed`, `battle`.

---

## Prerequisites

- Node 18+ and npm
- Rust + the Solana toolchain
- **Solana CLI 1.18+** and **Anchor CLI 0.31** (the program targets `anchor-lang = 0.31`)

> **macOS build notes (gotchas we hit):**
> - Anchor's SBF build uses `cargo +<sbpf-toolchain>`. If Homebrew's `cargo` shadows rustup's,
>   `+toolchain` directives fail — make sure **rustup's cargo** is first on `PATH`
>   (`export PATH="$HOME/.cargo/bin:$PATH"`).
> - `solana-test-validator` can fail with `extra entry found: "._genesis.bin"`. Fix with
>   `export COPYFILE_DISABLE=1` before starting it.

---

## Run it locally

### 1. Build & deploy the program

```bash
cd program
export PATH="$HOME/.cargo/bin:$PATH"
anchor build
anchor keys sync          # makes declare_id match the program keypair
anchor build              # rebuild so the id is baked in

# In a separate terminal, start a local validator:
export COPYFILE_DISABLE=1
solana-test-validator --reset

# Fund your CLI wallet and deploy:
solana config set --url http://127.0.0.1:8899
solana airdrop 100
anchor deploy             # or: solana program deploy target/deploy/solaxie.so \
                          #        --program-id target/deploy/solaxie-keypair.json
```

### 2. Set up the token economy + sanity-check (optional)

```bash
cd ../app
npm install --legacy-peer-deps
node scripts/setup.js      # create mock mint, initialize game, fund the treasury vault
node scripts/demo.js       # new trainer -> starter grant -> mint x2 -> breed -> battle
```

`setup.js` writes `app/idl/token.json` (the mint the frontend uses). On mainnet you'd instead set
`initialize` to the **pump.fun mint** and fund the vault via `fund_treasury` from creator rewards.

### 3. Run the web client

```bash
cd app
npm run dev                # http://localhost:3000 (or next free port)
```

Open the app, set your wallet (e.g. Phantom) to **localhost / the local validator**, connect,
use the **Airdrop** button for SOL, create a player, then roll, breed, and battle Axols.

> Point at devnet instead of localnet by setting `NEXT_PUBLIC_RPC` for the app and deploying with
> `solana config set --url devnet` / `anchor deploy --provider.cluster devnet`.

---

## Tests

```bash
cd program
export PATH="$HOME/.cargo/bin:$PATH"
cargo test -p solaxie --lib -- --nocapture     # gene/stat/breeding/battle engine tests + demo
```

---

## Roadmap / next steps

This is a v1 vertical slice. What's done and what's next:

- ✅ **Real SPL token economy** with a recycling treasury vault (sinks/faucets).
- **Launch**: create the token on **pump.fun**, point `initialize` at its mint, and wire
  **creator rewards → `fund_treasury`** to keep the vault topped up.
- **NFTs**: wrap Axols as **Metaplex** NFTs so they're tradeable on open marketplaces.
- **Secure randomness**: replace the slot/timestamp-seeded PRNG with **Switchboard VRF**
  (on-chain randomness here is currently predictable — exploitable for breeding/battle outcomes).
- **Smooth UX**: re-introduce **session keys** so battles auto-approve without a wallet popup.
- **Marketplace & PvP matchmaking**, leaderboards, daily quests.
