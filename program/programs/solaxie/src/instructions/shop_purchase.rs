use crate::constants::*;
use crate::errors::GameErrorCode;
use crate::state::game_data::GameData;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Pay for a shop item: SPL tokens move from the buyer into the treasury vault (sink).
/// The client grants in-game rewards only after this transaction confirms.
pub fn shop_purchase(ctx: Context<ShopPurchase>, amount: u64, sku: u32) -> Result<()> {
    require!(amount > 0, GameErrorCode::InvalidPurchase);
    require!(amount <= MAX_SHOP_PURCHASE, GameErrorCode::InvalidPurchase);

    require!(
        ctx.accounts.player_token_account.amount >= amount,
        GameErrorCode::NotEnoughTokens
    );

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.player_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        ),
        amount,
    )?;

    emit!(ShopPurchaseEvent {
        buyer: ctx.accounts.signer.key(),
        amount,
        sku,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Shop purchase: {} base units (sku {})", amount, sku);
    Ok(())
}

#[event]
pub struct ShopPurchaseEvent {
    pub buyer: Pubkey,
    pub amount: u64,
    pub sku: u32,
    pub timestamp: i64,
}

#[derive(Accounts)]
pub struct ShopPurchase<'info> {
    #[account(seeds = [b"config".as_ref()], bump)]
    pub game_data: Account<'info, GameData>,

    #[account(
        mut,
        constraint = player_token_account.mint == game_data.token_mint @ GameErrorCode::InvalidGenes,
        constraint = player_token_account.owner == signer.key() @ GameErrorCode::WrongAuthority,
    )]
    pub player_token_account: Account<'info, TokenAccount>,

    #[account(mut, seeds = [b"vault".as_ref()], bump)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
