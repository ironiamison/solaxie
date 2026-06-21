import { AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createBurnInstruction,
} from "@solana/spl-token";
import {
  Connection,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_DECIMALS,
  TOKEN_MINT,
  TOKEN_PROGRAM_FOR_MINT,
  axolPDA,
  configPDA,
  playerAta,
  playerPDA,
  getProgram,
  type PlayerData,
} from "@/utils/anchor";
import { fetchWalletSolaxBalance } from "@/lib/wallet-balance";
import { solaxPriceToBaseUnits } from "@/lib/token";
import { chainAxolToUi } from "@/lib/chain-mapper";
import type { Axol } from "@/lib/game";

export type ChainPlayerState = {
  energy: number;
  maxEnergy: number;
  battlesWon: number;
  battlesLost: number;
  axolCount: number;
};

export type ChainClient = {
  isReady: () => Promise<boolean>;
  fetchTokenBalance: () => Promise<number>;
  fetchPlayer: () => Promise<PlayerData | null>;
  fetchOwnedAxols: () => Promise<Axol[]>;
  fetchAxolExists: (id: number) => Promise<boolean>;
  ensurePlayer: (name: string) => Promise<void>;
  /** Burn pump.fun SOLAX from the connected wallet (permanent supply reduction). */
  burnSolax: (priceWhole: number) => Promise<string>;
  mintAxol: () => Promise<{ sig: string; axol: Axol }>;
  breed: (parentAId: number, parentBId: number) => Promise<{ sig: string; child: Axol }>;
  battle: (myAxolId: number, opponentAxolId: number, counter: number) => Promise<{ sig: string; won: boolean }>;
  refreshState: () => Promise<{ solax: number; energy: number; axols: Axol[]; player: ChainPlayerState | null }>;
};

export function createChainClient(
  connection: Connection,
  wallet: AnchorWallet,
): ChainClient {
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = getProgram(provider);
  const owner = wallet.publicKey;

  const playerTokenAta = () => playerAta(owner);

  async function addAtaIfNeeded(tx: Transaction): Promise<ReturnType<typeof playerTokenAta>> {
    const ata = playerTokenAta();
    const ataInfo = await connection.getAccountInfo(ata);
    if (!ataInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          owner,
          ata,
          owner,
          TOKEN_MINT,
          TOKEN_PROGRAM_FOR_MINT,
        ),
      );
    }
    return ata;
  }

  async function isReady(): Promise<boolean> {
    try {
      const info = await connection.getAccountInfo(configPDA);
      return info != null;
    } catch {
      return false;
    }
  }

  async function fetchTokenBalance(): Promise<number> {
    return fetchWalletSolaxBalance(connection, owner);
  }

  async function fetchPlayer(): Promise<PlayerData | null> {
    try {
      return await program.account.playerData.fetch(playerPDA(owner));
    } catch {
      return null;
    }
  }

  async function fetchOwnedAxols(): Promise<Axol[]> {
    try {
      const accounts = await program.account.axol.all([
        {
          memcmp: {
            offset: 8,
            bytes: owner.toBase58(),
          },
        },
      ]);
      return accounts
        .map((a) => chainAxolToUi(a.account))
        .sort((a, b) => a.id - b.id);
    } catch (e) {
      console.warn("[chain] fetchOwnedAxols", e);
      return [];
    }
  }

  async function fetchAxolExists(id: number): Promise<boolean> {
    try {
      await program.account.axol.fetch(axolPDA(id));
      return true;
    } catch {
      return false;
    }
  }

  async function burnSolax(priceWhole: number): Promise<string> {
    const amount = solaxPriceToBaseUnits(priceWhole, TOKEN_DECIMALS);
    if (amount <= BigInt(0)) throw new Error("Invalid burn amount");
    const tx = new Transaction();
    const ata = await addAtaIfNeeded(tx);
    tx.add(createBurnInstruction(TOKEN_MINT, ata, owner, amount, [], TOKEN_PROGRAM_FOR_MINT));
    const sig = await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
    console.info("[chain] burn", priceWhole, sig);
    return sig;
  }

  async function ensurePlayer(name: string): Promise<void> {
    try {
      await program.account.playerData.fetch(playerPDA(owner));
      return;
    } catch {
      // not initialized yet
    }

    const tx = new Transaction();
    await addAtaIfNeeded(tx);

    const ix = await program.methods
      .initPlayer(name.slice(0, 32))
      .accountsStrict({
        player: playerPDA(owner),
        gameData: configPDA,
        tokenMint: TOKEN_MINT,
        playerTokenAccount: playerTokenAta(),
        signer: owner,
        tokenProgram: TOKEN_PROGRAM_FOR_MINT,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx.add(ix);
    const sig = await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
    console.info("[chain] init_player", sig);
  }

  async function mintAxol(): Promise<{ sig: string; axol: Axol }> {
    const game = await program.account.gameData.fetch(configPDA);
    const axolId = game.totalAxols;
    const tx = new Transaction();
    await addAtaIfNeeded(tx);

    const ix = await program.methods
      .mintAxol(new BN(axolId.toString()))
      .accountsStrict({
        player: playerPDA(owner),
        gameData: configPDA,
        tokenMint: TOKEN_MINT,
        axol: axolPDA(axolId),
        playerTokenAccount: playerTokenAta(),
        signer: owner,
        tokenProgram: TOKEN_PROGRAM_FOR_MINT,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx.add(ix);
    const sig = await provider.sendAndConfirm(tx, [], { commitment: "confirmed" });
    const axol = chainAxolToUi(await program.account.axol.fetch(axolPDA(axolId)));
    return { sig, axol };
  }

  async function breed(parentAId: number, parentBId: number): Promise<{ sig: string; child: Axol }> {
    const game = await program.account.gameData.fetch(configPDA);
    const childId = game.totalAxols;

    const ix = await program.methods
      .breed(new BN(childId.toString()))
      .accountsStrict({
        player: playerPDA(owner),
        gameData: configPDA,
        tokenMint: TOKEN_MINT,
        parentA: axolPDA(parentAId),
        parentB: axolPDA(parentBId),
        child: axolPDA(childId),
        playerTokenAccount: playerTokenAta(),
        signer: owner,
        tokenProgram: TOKEN_PROGRAM_FOR_MINT,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const sig = await provider.sendAndConfirm(new Transaction().add(ix), [], { commitment: "confirmed" });
    const child = chainAxolToUi(await program.account.axol.fetch(axolPDA(childId)));
    return { sig, child };
  }

  async function battle(
    myAxolId: number,
    opponentAxolId: number,
    counter: number,
  ): Promise<{ sig: string; won: boolean }> {
    const before = await fetchPlayer();
    const wonBefore = before?.battlesWon ?? 0;

    const ix = await program.methods
      .battle(counter)
      .accountsStrict({
        player: playerPDA(owner),
        gameData: configPDA,
        myAxol: axolPDA(myAxolId),
        opponent: axolPDA(opponentAxolId),
        signer: owner,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const sig = await provider.sendAndConfirm(new Transaction().add(ix), [], { commitment: "confirmed" });
    const after = await fetchPlayer();
    const won = (after?.battlesWon ?? wonBefore) > wonBefore;
    return { sig, won };
  }

  async function refreshState() {
    const [solax, axols, player] = await Promise.all([
      fetchTokenBalance(),
      fetchOwnedAxols(),
      fetchPlayer(),
    ]);
    return {
      solax,
      axols,
      energy: player ? Number(player.energy) : 0,
      player: player
        ? {
            energy: Number(player.energy),
            maxEnergy: 100,
            battlesWon: player.battlesWon,
            battlesLost: player.battlesLost,
            axolCount: player.axolCount,
          }
        : null,
    };
  }

  return {
    isReady,
    fetchTokenBalance,
    fetchPlayer,
    fetchOwnedAxols,
    fetchAxolExists,
    ensurePlayer,
    burnSolax,
    mintAxol,
    breed,
    battle,
    refreshState,
  };
}

export { TOKEN_MINT, TOKEN_DECIMALS };
