use crate::constants::MAX_ENERGY;
use crate::state::game_data::GameData;
use crate::state::player_data::PlayerData;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

/// Create a player profile and token account. Trainers fund themselves via pump.fun — no faucet.
pub fn init_player(ctx: Context<InitPlayer>, name: String) -> Result<()> {
    let player = &mut ctx.accounts.player;
    player.authority = ctx.accounts.signer.key();
    player.name = name;
    player.energy = MAX_ENERGY;
    player.last_login = Clock::get()?.unix_timestamp;
    player.axol_count = 0;
    player.battles_won = 0;
    player.battles_lost = 0;
    player.claimed_starter = true;
    Ok(())
}

#[derive(Accounts)]
pub struct InitPlayer<'info> {
    #[account(
        init,
        payer = signer,
        space = 8 + PlayerData::MAX_SIZE,
        seeds = [b"player".as_ref(), signer.key().as_ref()],
        bump,
    )]
    pub player: Account<'info, PlayerData>,

    #[account(seeds = [b"config".as_ref()], bump)]
    pub game_data: Account<'info, GameData>,

    #[account(address = game_data.token_mint)]
    pub token_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = signer,
        associated_token::mint = token_mint,
        associated_token::authority = signer,
    )]
    pub player_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
