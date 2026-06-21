use crate::constants::{MAX_ENERGY, STARTER_GRANT};
use crate::state::game_data::GameData;
use crate::state::player_data::PlayerData;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

/// Create a player profile, their token account, and grant a starter stash of tokens
/// from the treasury vault so a brand-new trainer can start playing immediately.
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

    // Grant the starter stash from the vault (capped by what the vault holds).
    let grant = STARTER_GRANT.min(ctx.accounts.vault.amount);
    if grant > 0 {
        let bump = ctx.bumps.vault_authority;
        let seeds: &[&[u8]] = &[b"vault_auth".as_ref(), &[bump]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.player_token_account.to_account_info(),
                    authority: ctx.accounts.vault_authority.to_account_info(),
                },
                &[seeds],
            ),
            grant,
        )?;
    }

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

    /// CHECK: PDA that owns the vault; validated via seeds.
    #[account(seeds = [b"vault_auth".as_ref()], bump)]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"vault".as_ref()],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,

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
