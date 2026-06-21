pub use crate::errors::GameErrorCode;
pub use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod genes;
pub mod instructions;
pub mod state;

use instructions::*;

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

declare_id!("FYvhXM6Jv4crAVWcpZYtGT9WN2Ai2z9cUpY2EY8CTCcg");

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "Solaxie",
    project_url: "https://github.com/solana-developers/solana-game-preset",
    contacts: "email:security@example.com",
    policy: "PRs welcome.",
    preferred_languages: "en",
    source_code: "https://github.com/solana-developers/solana-game-preset"
}

#[program]
pub mod solaxie {
    use super::*;

    /// One-time setup: register the launchpad token and create the treasury vault.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::initialize(ctx)
    }

    /// Top up the treasury vault (e.g. from pump.fun creator rewards).
    pub fn fund_treasury(ctx: Context<FundTreasury>, amount: u64) -> Result<()> {
        fund_treasury::fund_treasury(ctx, amount)
    }

    /// Create a player profile + token account and grant a starter stash from the vault.
    pub fn init_player(ctx: Context<InitPlayer>, name: String) -> Result<()> {
        init_player::init_player(ctx, name)
    }

    /// Roll a fresh origin (gen 0) Axol with randomized genes. Costs LOVE.
    pub fn mint_axol(ctx: Context<MintAxol>, axol_id: u64) -> Result<()> {
        mint_axol::mint_axol(ctx, axol_id)
    }

    /// Breed two owned Axols into a new child Axol.
    pub fn breed(ctx: Context<Breed>, child_id: u64) -> Result<()> {
        breed::breed(ctx, child_id)
    }

    /// Battle the player's Axol against an opponent.
    pub fn battle(ctx: Context<Battle>, counter: u16) -> Result<()> {
        battle::battle(ctx, counter)
    }

    /// Pay for a shop item — tokens sink into the treasury vault.
    pub fn shop_purchase(ctx: Context<ShopPurchase>, amount: u64, sku: u32) -> Result<()> {
        shop_purchase::shop_purchase(ctx, amount, sku)
    }
}
