import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "@/idl/solaxie.json";
import type { Solaxie } from "@/idl/solaxie";
import {
  PROGRAM_ID,
  TOKEN_DECIMALS,
  TOKEN_MINT,
  configPDA,
  playerPDA,
  vaultPDA,
  vaultAuthorityPDA,
  getProgram,
} from "@/utils/anchor";
import { shopSku, solaxPriceToBaseUnits } from "@/lib/token";

export type ChainClient = {
  /** True when the program config account exists on this cluster. */
  isReady: () => Promise<boolean>;
  fetchTokenBalance: () => Promise<number>;
  ensurePlayer: (name: string) => Promise<void>;
  shopPurchase: (price: number, itemId: string) => Promise<string>;
};

export function createChainClient(
  connection: Connection,
  wallet: AnchorWallet,
): ChainClient {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = getProgram(provider);
  const owner = wallet.publicKey;

  const playerAta = () => getAssociatedTokenAddressSync(TOKEN_MINT, owner);

  async function isReady(): Promise<boolean> {
    try {
      const info = await connection.getAccountInfo(configPDA);
      return info != null;
    } catch {
      return false;
    }
  }

  async function fetchTokenBalance(): Promise<number> {
    try {
      const bal = await connection.getTokenAccountBalance(playerAta());
      return bal.value.uiAmount ?? 0;
    } catch {
      return 0;
    }
  }

  async function ensurePlayer(name: string): Promise<void> {
    try {
      await program.account.playerData.fetch(playerPDA(owner));
      return;
    } catch {
      // not initialized yet
    }

    const ata = playerAta();
    const tx = new Transaction();
    const ataInfo = await connection.getAccountInfo(ata);
    if (!ataInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          owner,
          ata,
          owner,
          TOKEN_MINT,
        ),
      );
    }

    const ix = await program.methods
      .initPlayer(name.slice(0, 32))
      .accountsStrict({
        player: playerPDA(owner),
        gameData: configPDA,
        tokenMint: TOKEN_MINT,
        vaultAuthority: vaultAuthorityPDA,
        vault: vaultPDA,
        playerTokenAccount: ata,
        signer: owner,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx.add(ix);
    const sig = await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
    console.info("[chain] init_player", sig);
  }

  async function shopPurchase(price: number, itemId: string): Promise<string> {
    const amount = solaxPriceToBaseUnits(price, TOKEN_DECIMALS);
    if (amount <= BigInt(0)) throw new Error("Invalid purchase price");

    const ata = playerAta();
    const tx = new Transaction();
    const ataInfo = await connection.getAccountInfo(ata);
    if (!ataInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          owner,
          ata,
          owner,
          TOKEN_MINT,
        ),
      );
    }

    const sku = shopSku(itemId);
    const ix = await program.methods
      .shopPurchase(new BN(amount.toString()), sku)
      .accountsStrict({
        gameData: configPDA,
        playerTokenAccount: ata,
        vault: vaultPDA,
        signer: owner,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();

    tx.add(ix);
    return provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
  }

  return { isReady, fetchTokenBalance, ensurePlayer, shopPurchase };
}

export { PROGRAM_ID, TOKEN_MINT, TOKEN_DECIMALS };
