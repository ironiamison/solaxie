use crate::constants::*;
use crate::errors::GameErrorCode;
use crate::genes::{random_genome, Rng};
use crate::state::axol::Axol;
use crate::state::game_data::GameData;
use crate::state::player_data::PlayerData;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount};

/// Roll a brand new origin (generation 0) Axol with randomized genes. Costs tokens, which
/// are sent into the treasury vault. `axol_id` must equal the registry's current `total_axols`.
pub fn mint_axol(ctx: Context<MintAxol>, axol_id: u64) -> Result<()> {
    require!(
        axol_id == ctx.accounts.game_data.total_axols,
        GameErrorCode::InvalidGenes
    );

    let player = &mut ctx.accounts.player;
    player.update_energy()?;
    require!(
        player.axol_count < MAX_AXOLS_PER_PLAYER,
        GameErrorCode::TooManyAxols
    );

    // Sink: burn the mint cost (removed from circulating supply).
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.token_mint.to_account_info(),
                from: ctx.accounts.player_token_account.to_account_info(),
                authority: ctx.accounts.signer.to_account_info(),
            },
        ),
        MINT_AXOL_COST,
    )?;

    let clock = Clock::get()?;
    let seed = (clock.slot)
        ^ (clock.unix_timestamp as u64).wrapping_mul(0x100000001B3)
        ^ axol_id.wrapping_mul(0x9E3779B1)
        ^ (player.authority.to_bytes()[0] as u64);
    let mut rng = Rng::new(seed);

    let id = ctx.accounts.game_data.next_axol_id();

    let axol = &mut ctx.accounts.axol;
    axol.owner = player.authority;
    axol.id = id;
    axol.genome = random_genome(&mut rng);
    axol.generation = 0;
    axol.breed_count = 0;
    axol.parent_a = u64::MAX;
    axol.parent_b = u64::MAX;
    axol.born_at = clock.unix_timestamp;
    axol.level = 1;
    axol.xp = 0;

    player.axol_count = player.axol_count.saturating_add(1);

    msg!("Minted Axol #{} (class {})", id, axol.class());
    Ok(())
}

#[derive(Accounts)]
#[instruction(axol_id: u64)]
pub struct MintAxol<'info> {
    #[account(
        mut,
        seeds = [b"player".as_ref(), signer.key().as_ref()],
        bump,
    )]
    pub player: Account<'info, PlayerData>,

    #[account(seeds = [b"config".as_ref()], bump)]
    pub game_data: Account<'info, GameData>,

    #[account(mut, address = game_data.token_mint)]
    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = signer,
        space = 8 + Axol::MAX_SIZE,
        seeds = [b"axol".as_ref(), axol_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub axol: Account<'info, Axol>,

    #[account(
        mut,
        constraint = player_token_account.mint == game_data.token_mint @ GameErrorCode::InvalidGenes,
        constraint = player_token_account.owner == signer.key() @ GameErrorCode::WrongAuthority,
    )]
    pub player_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
