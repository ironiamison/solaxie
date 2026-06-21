/* One-time local setup:
 *  1. create a mock SPL mint (stands in for the pump.fun token, 6 decimals)
 *  2. initialize the game with that mint (creates the treasury vault)
 *  3. mint a big supply and fund the treasury vault
 *  4. write app/idl/token.json so the frontend knows the mint
 * Run from app/:  node scripts/setup.js
 */
const anchor = require("@coral-xyz/anchor");
const {
  Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY,
} = require("@solana/web3.js");
const {
  TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo,
} = require("@solana/spl-token");
const fs = require("fs");
const os = require("os");
const path = require("path");

const idl = require("../idl/solaxie.json");
const PROGRAM_ID = new PublicKey(idl.address);
const DECIMALS = 6;
const ONE = 10 ** DECIMALS;

const pda = (seeds) => PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
const configPDA = pda([Buffer.from("config")]);
const vaultPDA = pda([Buffer.from("vault")]);
const vaultAuthPDA = pda([Buffer.from("vault_auth")]);

(async () => {
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const secret = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".config/solana/id.json")));
  const kp = Keypair.fromSecretKey(Uint8Array.from(secret));
  const wallet = new anchor.Wallet(kp);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);

  console.log("Authority:", kp.publicKey.toBase58());

  // 1. Mock token mint (authority = dev wallet for local funding only).
  const mint = await createMint(connection, kp, kp.publicKey, null, DECIMALS);
  console.log("Mock token mint:", mint.toBase58());

  // 2. Initialize the game with the mint (creates the vault).
  await program.methods.initialize().accountsStrict({
    gameData: configPDA,
    tokenMint: mint,
    vaultAuthority: vaultAuthPDA,
    vault: vaultPDA,
    authority: kp.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  }).rpc();
  console.log("Initialized. Vault:", vaultPDA.toBase58());

  // 3. Mint supply to dev, then fund the vault treasury.
  const devAta = await getOrCreateAssociatedTokenAccount(connection, kp, mint, kp.publicKey);
  const SUPPLY = 100_000_000; // whole tokens
  await mintTo(connection, kp, mint, devAta.address, kp, BigInt(SUPPLY) * BigInt(ONE));
  console.log(`Minted ${SUPPLY.toLocaleString()} tokens to dev.`);

  const VAULT_FUND = 50_000_000; // whole tokens into the reward pool
  await program.methods.fundTreasury(new anchor.BN(VAULT_FUND).mul(new anchor.BN(ONE))).accountsStrict({
    gameData: configPDA,
    vault: vaultPDA,
    funderTokenAccount: devAta.address,
    funder: kp.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  }).rpc();
  console.log(`Funded vault with ${VAULT_FUND.toLocaleString()} tokens.`);

  // 4. Persist the mint for the frontend.
  const tokenInfo = { mint: mint.toBase58(), decimals: DECIMALS };
  fs.writeFileSync(path.join(__dirname, "../idl/token.json"), JSON.stringify(tokenInfo, null, 2));
  console.log("\nWrote idl/token.json:", tokenInfo);
  console.log("✅ setup complete.");
})().catch((e) => { console.error("SETUP FAILED:", e); process.exit(1); });
