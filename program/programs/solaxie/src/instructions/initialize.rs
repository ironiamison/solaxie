use crate::state::game_data::GameData;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

/// One-time setup: register the launchpad token as the game currency and create the
/// program-owned treasury vault that holds the recycling reward pool.
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let game = &mut ctx.accounts.game_data;
    game.authority = ctx.accounts.authority.key();
    game.token_mint = ctx.accounts.token_mint.key();
    game.total_axols = 0;
    game.total_battles = 0;
    game.total_rewards_paid = 0;
    msg!("Solaxie initialized with token mint {}", game.token_mint);
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + GameData::MAX_SIZE,
        seeds = [b"config".as_ref()],
        bump,
    )]
    pub game_data: Account<'info, GameData>,

    /// The token used as the game currency (e.g. the pump.fun mint).
    pub token_mint: Account<'info, Mint>,

    /// PDA that owns the treasury vault and signs reward payouts.
    /// CHECK: PDA derived from a constant seed; not read or written directly.
    #[account(seeds = [b"vault_auth".as_ref()], bump)]
    pub vault_authority: UncheckedAccount<'info>,

    /// Program-owned treasury vault (an SPL token account at a PDA).
    #[account(
        init,
        payer = authority,
        seeds = [b"vault".as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = vault_authority,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
