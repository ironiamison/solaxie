/* End-to-end check of the token economy against the local validator.
 * Requires scripts/setup.js to have been run first. Run from app/: node scripts/demo.js */
const anchor = require("@coral-xyz/anchor");
const { Connection, PublicKey, Keypair, SystemProgram } = require("@solana/web3.js");
const {
  TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync,
} = require("@solana/spl-token");
const fs = require("fs");
const os = require("os");
const path = require("path");

const idl = require("../idl/solaxie.json");
const token = require("../idl/token.json");
const PROGRAM_ID = new PublicKey(idl.address);
const MINT = new PublicKey(token.mint);
const ONE = 10 ** token.decimals;

const CLASS_NAMES = ["Beast", "Aquatic", "Plant", "Bird", "Bug", "Reptile"];
const CLASS_STATS = [[6,4,3,8],[5,8,5,3],[9,3,3,6],[3,9,6,4],[5,5,5,6],[8,4,4,5]];
function primaryClass(g){const c=[0,0,0,0,0,0];for(const p of g)c[p[0]%6]++;let b=0,bc=-1;c.forEach((x,i)=>{if(x>bc){bc=x;b=i;}});return b;}
function stats(g){let h=0,s=0,k=0,m=0;for(const p of g){const v=CLASS_STATS[p[0]%6];h+=v[0];s+=v[1];k+=v[2];m+=v[3];}return{hp:30+h*5,s,k,m};}
function describe(l,a){const c=primaryClass(a.genome),s=stats(a.genome);console.log(`  ${l} #${a.id} | ${CLASS_NAMES[c].padEnd(8)} gen${a.generation} lvl${a.level} | HP ${s.hp} SPD ${s.s} SKL ${s.k} MRL ${s.m}`);}

const pda = (seeds) => PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
const configPDA = pda([Buffer.from("config")]);
const vaultPDA = pda([Buffer.from("vault")]);
const vaultAuthPDA = pda([Buffer.from("vault_auth")]);
const playerPDA = (o) => pda([Buffer.from("player"), o.toBuffer()]);
const axolPDA = (id) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(id.toString())); return pda([Buffer.from("axol"), b]); };

(async () => {
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  // Use a fresh keypair to demonstrate the starter-grant flow from the vault.
  const kp = Keypair.generate();
  await connection.confirmTransaction(await connection.requestAirdrop(kp.publicKey, 2 * 1e9), "confirmed");
  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(kp), { commitment: "confirmed" });
  const program = new anchor.Program(idl, provider);
  const ata = getAssociatedTokenAddressSync(MINT, kp.publicKey);
  const bal = async () => (await connection.getTokenAccountBalance(ata)).value.uiAmount;

  console.log("New trainer:", kp.publicKey.toBase58(), "\n");

  console.log("[init_player] (grants starter stash from vault)");
  await program.methods.initPlayer("CLI Tester").accountsStrict({
    player: playerPDA(kp.publicKey), gameData: configPDA, tokenMint: MINT,
    vaultAuthority: vaultAuthPDA, vault: vaultPDA, playerTokenAccount: ata,
    signer: kp.publicKey, tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
  }).rpc();
  console.log(`  token balance: ${await bal()}\n`);

  const ids = [];
  for (let i = 0; i < 2; i++) {
    const game = await program.account.gameData.fetch(configPDA);
    const id = game.totalAxols;
    await program.methods.mintAxol(id).accountsStrict({
      player: playerPDA(kp.publicKey), gameData: configPDA, axol: axolPDA(id),
      playerTokenAccount: ata, vault: vaultPDA, signer: kp.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
    }).rpc();
    describe("minted", await program.account.axol.fetch(axolPDA(id)));
    ids.push(id);
  }
  console.log(`  balance after 2 mints (-200): ${await bal()}\n`);

  const game = await program.account.gameData.fetch(configPDA);
  const childId = game.totalAxols;
  await program.methods.breed(childId).accountsStrict({
    player: playerPDA(kp.publicKey), gameData: configPDA,
    parentA: axolPDA(ids[0]), parentB: axolPDA(ids[1]), child: axolPDA(childId),
    playerTokenAccount: ata, vault: vaultPDA, signer: kp.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
  }).rpc();
  describe("[breed] child", await program.account.axol.fetch(axolPDA(childId)));
  console.log(`  balance after breed (-150): ${await bal()}\n`);

  const before = await bal();
  await program.methods.battle(1).accountsStrict({
    player: playerPDA(kp.publicKey), gameData: configPDA,
    myAxol: axolPDA(childId), opponent: axolPDA(ids[0]),
    playerTokenAccount: ata, vault: vaultPDA, vaultAuthority: vaultAuthPDA,
    signer: kp.publicKey, tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
  }).rpc();
  const p = await program.account.playerData.fetch(playerPDA(kp.publicKey));
  console.log(`[battle] W/L ${p.battlesWon}/${p.battlesLost} | balance ${before} -> ${await bal()} (reward from vault)\n`);

  const vaultBal = (await connection.getTokenAccountBalance(vaultPDA)).value.uiAmount;
  console.log(`Vault balance: ${vaultBal.toLocaleString()} tokens. ✅ token economy works end-to-end.`);
})().catch((e) => { console.error("FAILED:", e); process.exit(1); });
