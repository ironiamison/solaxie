use crate::state::game_data::GameData;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Top up the treasury vault from any token account. On mainnet this is how you route
/// pump.fun creator rewards (swapped into the token) into the game's reward pool.
pub fn fund_treasury(ctx: Context<FundTreasury>, amount: u64) -> Result<()> {
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.funder_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.funder.to_account_info(),
            },
        ),
        amount,
    )?;
    msg!("Treasury funded with {} base units", amount);
    Ok(())
}

#[derive(Accounts)]
pub struct FundTreasury<'info> {
    #[account(seeds = [b"config".as_ref()], bump)]
    pub game_data: Account<'info, GameData>,

    #[account(
        mut,
        seeds = [b"vault".as_ref()],
        bump,
        constraint = vault.mint == game_data.token_mint,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = funder_token_account.mint == game_data.token_mint,
        constraint = funder_token_account.owner == funder.key(),
    )]
    pub funder_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub funder: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
