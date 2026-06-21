/* Send SPL tokens from your wallet into the game treasury vault (prize pool / rewards).
 * Run from app/:  AMOUNT=1000000 node scripts/fund-vault.js
 */
const anchor = require("@coral-xyz/anchor");
const { Connection, PublicKey, Keypair } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } = require("@solana/spl-token");
const fs = require("fs");
const os = require("os");
const path = require("path");

const idl = require("../idl/solaxie.json");
const token = require("../idl/token.json");
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID ?? idl.address);
const MINT = new PublicKey(process.env.TOKEN_MINT ?? token.mint);
const RPC = process.env.RPC ?? process.env.NEXT_PUBLIC_RPC ?? "https://api.devnet.solana.com";
const DECIMALS = Number(process.env.TOKEN_DECIMALS ?? token.decimals ?? 6);
const ONE = 10 ** DECIMALS;
const AMOUNT = BigInt(process.env.AMOUNT ?? process.argv[2] ?? "0");

const pda = (seeds) => PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
const configPDA = pda([Buffer.from("config")]);
const vaultPDA = pda([Buffer.from("vault")]);

(async () => {
  if (AMOUNT <= 0n) throw new Error("Set AMOUNT (whole tokens) env or pass as argument");

  const connection = new Connection(RPC, "confirmed");
  const secretPath = process.env.SOLANA_KEYPAIR ?? path.join(os.homedir(), ".config/solana/id.json");
  const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(secretPath))));
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(kp), { commitment: "confirmed" });
  const program = new anchor.Program(idl, PROGRAM_ID, provider);
  const funderAta = getAssociatedTokenAddressSync(MINT, kp.publicKey);
  const baseUnits = new anchor.BN((AMOUNT * BigInt(ONE)).toString());

  const sig = await program.methods.fundTreasury(baseUnits).accountsStrict({
    gameData: configPDA,
    vault: vaultPDA,
    funderTokenAccount: funderAta,
    funder: kp.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  }).rpc();

  console.log("✅ Funded vault with", AMOUNT.toString(), "tokens. Sig:", sig);
})().catch((e) => { console.error("FUND VAULT FAILED:", e); process.exit(1); });
