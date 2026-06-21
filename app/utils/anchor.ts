import { Program, AnchorProvider, BN, IdlAccounts } from "@coral-xyz/anchor";
import idl from "../idl/solaxie.json";
import type { Solaxie } from "../idl/solaxie";
import tokenInfo from "../idl/token.json";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  AnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";

// Default to mainnet public RPC in production; local validator when developing.
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC ??
  (process.env.NODE_ENV === "production"
    ? "https://api.mainnet-beta.solana.com"
    : "http://127.0.0.1:8899");

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? (idl as Solaxie).address,
);

// The game currency (the launchpad/pump.fun token). Override with NEXT_PUBLIC_TOKEN_MINT.
export const TOKEN_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_TOKEN_MINT ?? tokenInfo.mint,
);
export const TOKEN_DECIMALS = tokenInfo.decimals;
export { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID };

export function getProgram(provider: AnchorProvider): Program<Solaxie> {
  return new Program(idl as Solaxie, provider);
}

export function useAnchorProvider() {
  const { connection } = useConnection();
  const wallet = useWallet();
  return new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });
}

export const [configPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  PROGRAM_ID
);

export const [vaultPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault")],
  PROGRAM_ID
);

export const [vaultAuthorityPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault_auth")],
  PROGRAM_ID
);

export function playerPDA(owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("player"), owner.toBuffer()],
    PROGRAM_ID
  )[0];
}

export function playerAta(owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(TOKEN_MINT, owner);
}

export function axolPDA(id: number | bigint | BN): PublicKey {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(id.toString()));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("axol"), buf],
    PROGRAM_ID
  )[0];
}

// Account types from the IDL.
export type PlayerData = IdlAccounts<Solaxie>["playerData"];
export type Axol = IdlAccounts<Solaxie>["axol"];

// ----- Game presentation helpers (mirror the on-chain constants) -----
export const CLASS_NAMES = [
  "Beast",
  "Aquatic",
  "Plant",
  "Bird",
  "Bug",
  "Reptile",
] as const;

export const CLASS_COLORS: Record<string, string> = {
  Beast: "#f6ad55",
  Aquatic: "#4299e1",
  Plant: "#48bb78",
  Bird: "#ed64a6",
  Bug: "#9f7aea",
  Reptile: "#38b2ac",
};

export const PART_NAMES = ["Eyes", "Ears", "Mouth", "Horn", "Back", "Tail"];

export const MINT_AXOL_COST = 100;
export const BREED_BASE_COST = 150;
export const MAX_ENERGY = 100;

const CLASS_STATS: number[][] = [
  [6, 4, 3, 8], // Beast
  [5, 8, 5, 3], // Aquatic
  [9, 3, 3, 6], // Plant
  [3, 9, 6, 4], // Bird
  [5, 5, 5, 6], // Bug
  [8, 4, 4, 5], // Reptile
];

export type Stats = { hp: number; speed: number; skill: number; morale: number };

/** Mirror of the on-chain stat derivation so the UI can show stats without an RPC call. */
export function deriveStats(genome: number[][]): Stats {
  let hp = 0,
    speed = 0,
    skill = 0,
    morale = 0;
  for (const part of genome) {
    const cls = part[0] % 6;
    const s = CLASS_STATS[cls];
    hp += s[0];
    speed += s[1];
    skill += s[2];
    morale += s[3];
  }
  return { hp: 30 + hp * 5, speed, skill, morale };
}

export function expressedClasses(genome: number[][]): number[] {
  return genome.map((p) => p[0] % 6);
}

export function primaryClass(genome: number[][]): number {
  const counts = new Array(6).fill(0);
  for (const c of expressedClasses(genome)) counts[c]++;
  let best = 0;
  let bestCount = -1;
  counts.forEach((count, cls) => {
    if (count > bestCount) {
      bestCount = count;
      best = cls;
    }
  });
  return best;
}

// ----- UI presentation helpers (cosmetic, derived deterministically) -----
export const CLASS_SLUG = [
  "beast",
  "aquatic",
  "plant",
  "bird",
  "bug",
  "reptile",
] as const;

/** Transparent full-body sprite for a genome (used on the pond + collection). */
export function spritePath(genome: number[][]): string {
  return `/sprites/${CLASS_SLUG[primaryClass(genome)]}.png`;
}

export type Rarity = { tier: string; stars: number; color: string };

/** Rarity from gene purity: how many of the 6 expressed parts match the primary class. */
export function rarity(genome: number[][]): Rarity {
  const prim = primaryClass(genome);
  const match = expressedClasses(genome).filter((p) => p === prim).length;
  if (match >= 6) return { tier: "Legendary", stars: 5, color: "#ffb02e" };
  if (match === 5) return { tier: "Epic", stars: 4, color: "#a779ff" };
  if (match === 4) return { tier: "Rare", stars: 3, color: "#3db4ff" };
  if (match === 3) return { tier: "Uncommon", stars: 2, color: "#54e07a" };
  return { tier: "Common", stars: 1, color: "#9aa4b2" };
}

export type BattleStats = { hp: number; atk: number; def: number; spd: number };

/** Flavored combat stats for the detail screen (HP/ATK/DEF/SPD), derived from genome. */
export function battleStats(genome: number[][]): BattleStats {
  const s = deriveStats(genome);
  return {
    hp: s.hp,
    atk: 60 + s.skill * 8,
    def: 50 + s.morale * 6,
    spd: 40 + s.speed * 5,
  };
}
