/* Initialize the on-chain game with your pump.fun (or any) SPL mint.
 *
 * Prerequisites:
 *   1. Deploy the program:  cd program && anchor deploy --provider.cluster devnet
 *   2. Copy the program id into app/.env.local as NEXT_PUBLIC_PROGRAM_ID
 *   3. Set NEXT_PUBLIC_TOKEN_MINT to your pump.fun mint
 *   4. Fund your wallet with SOL for rent + (optionally) fund the vault treasury
 *
 * Usage (from app/):
 *   TOKEN_MINT=<mint> node scripts/deploy-init.js
 *   TOKEN_MINT=<mint> RPC=https://api.devnet.solana.com node scripts/deploy-init.js
 */
const anchor = require("@coral-xyz/anchor");
const {
  Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY,
} = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const fs = require("fs");
const os = require("os");
const path = require("path");

const idl = require("../idl/solaxie.json");
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID ?? idl.address);
const TOKEN_MINT = new PublicKey(process.env.TOKEN_MINT ?? process.argv[2]);
const RPC = process.env.RPC ?? process.env.NEXT_PUBLIC_RPC ?? "https://api.devnet.solana.com";

const pda = (seeds) => PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
const configPDA = pda([Buffer.from("config")]);
const vaultPDA = pda([Buffer.from("vault")]);
const vaultAuthPDA = pda([Buffer.from("vault_auth")]);

(async () => {
  if (!TOKEN_MINT) throw new Error("Pass TOKEN_MINT env or as first argument");

  const connection = new Connection(RPC, "confirmed");
  const secretPath = process.env.SOLANA_KEYPAIR ?? path.join(os.homedir(), ".config/solana/id.json");
  const secret = JSON.parse(fs.readFileSync(secretPath));
  const kp = Keypair.fromSecretKey(Uint8Array.from(secret));
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(kp), { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);

  console.log("Cluster:", RPC);
  console.log("Authority:", kp.publicKey.toBase58());
  console.log("Program:", PROGRAM_ID.toBase58());
  console.log("Token mint:", TOKEN_MINT.toBase58());

  const existing = await connection.getAccountInfo(configPDA);
  if (existing) {
    const game = await program.account.gameData.fetch(configPDA);
    console.log("\n✅ Already initialized.");
    console.log("   Registered mint:", game.tokenMint.toBase58());
    console.log("   Vault:", vaultPDA.toBase58());
    return;
  }

  const sig = await program.methods.initialize().accountsStrict({
    gameData: configPDA,
    tokenMint: TOKEN_MINT,
    vaultAuthority: vaultAuthPDA,
    vault: vaultPDA,
    authority: kp.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  }).rpc();

  console.log("\n✅ Initialized:", sig);
  console.log("   Vault PDA:", vaultPDA.toBase58());
  console.log("\nAdd to app/.env.local:");
  console.log(`NEXT_PUBLIC_RPC=${RPC}`);
  console.log(`NEXT_PUBLIC_PROGRAM_ID=${PROGRAM_ID.toBase58()}`);
  console.log(`NEXT_PUBLIC_TOKEN_MINT=${TOKEN_MINT.toBase58()}`);
  console.log("\nVault stays empty — SOLAX is burn-only; no team payouts.");
})().catch((e) => { console.error("DEPLOY INIT FAILED:", e); process.exit(1); });
