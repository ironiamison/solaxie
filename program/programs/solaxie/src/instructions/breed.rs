use crate::constants::*;
use crate::errors::GameErrorCode;
use crate::genes::{breed_genomes, Rng};
use crate::state::axol::Axol;
use crate::state::game_data::GameData;
use crate::state::player_data::PlayerData;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Breed two owned Axols into a new child Axol. Costs tokens (scaling with the parents'
/// breed counts) which flow into the treasury vault, plus energy.
/// `child_id` must equal the registry's current `total_axols`.
pub fn breed(ctx: Context<Breed>, child_id: u64) -> Result<()> {
    require!(
        child_id == ctx.accounts.game_data.total_axols,
        GameErrorCode::InvalidGenes
    );

    let parent_a = &ctx.accounts.parent_a;
    let parent_b = &ctx.accounts.parent_b;

    require!(parent_a.key() != parent_b.key(), GameErrorCode::CannotBreedWithSelf);
    require!(parent_a.can_breed(), GameErrorCode::MaxBreedReached);
    require!(parent_b.can_breed(), GameErrorCode::MaxBreedReached);
    require!(
        parent_a.owner == ctx.accounts.signer.key()
            && parent_b.owner == ctx.accounts.signer.key(),
        GameErrorCode::ParentOwnerMismatch
    );

    let player = &mut ctx.accounts.player;
    player.update_energy()?;
    require!(
        player.axol_count < MAX_AXOLS_PER_PLAYER,
        GameErrorCode::TooManyAxols
    );
    player.spend_energy(BREED_ENERGY_COST)?;

    // Cost rises with how often the parents have already bred.
    let breed_factor = (parent_a.breed_count as u64) + (parent_b.breed_count as u64) + 1;
    let cost = BREED_BASE_COST.saturating_mul(breed_factor);

    require!(
        ctx.accounts.player_token_account.amount >= cost,
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
        cost,
    )?;

    let clock = Clock::get()?;
    let seed = clock.slot
        ^ (clock.unix_timestamp as u64).wrapping_mul(0x100000001B3)
        ^ parent_a.id.wrapping_mul(0x9E3779B1)
        ^ parent_b.id.wrapping_mul(0x85EBCA77)
        ^ child_id;
    let mut rng = Rng::new(seed);

    let genome_a = parent_a.genome();
    let genome_b = parent_b.genome();
    let child_genome = breed_genomes(&genome_a, &genome_b, &mut rng);
    let generation = parent_a.generation.max(parent_b.generation).saturating_add(1);
    let parent_a_id = parent_a.id;
    let parent_b_id = parent_b.id;

    let id = ctx.accounts.game_data.next_axol_id();

    let child = &mut ctx.accounts.child;
    child.owner = ctx.accounts.signer.key();
    child.id = id;
    child.genome = child_genome;
    child.generation = generation;
    child.breed_count = 0;
    child.parent_a = parent_a_id;
    child.parent_b = parent_b_id;
    child.born_at = clock.unix_timestamp;
    child.level = 1;
    child.xp = 0;

    let parent_a = &mut ctx.accounts.parent_a;
    parent_a.breed_count += 1;
    let parent_b = &mut ctx.accounts.parent_b;
    parent_b.breed_count += 1;

    player.axol_count = player.axol_count.saturating_add(1);

    msg!("Bred Axol #{} (gen {}) for {} base units", id, generation, cost);
    Ok(())
}

#[derive(Accounts)]
#[instruction(child_id: u64)]
pub struct Breed<'info> {
    #[account(
        mut,
        seeds = [b"player".as_ref(), signer.key().as_ref()],
        bump,
    )]
    pub player: Account<'info, PlayerData>,

    #[account(
        mut,
        seeds = [b"config".as_ref()],
        bump,
    )]
    pub game_data: Account<'info, GameData>,

    #[account(mut, seeds = [b"axol".as_ref(), parent_a.id.to_le_bytes().as_ref()], bump)]
    pub parent_a: Account<'info, Axol>,

    #[account(mut, seeds = [b"axol".as_ref(), parent_b.id.to_le_bytes().as_ref()], bump)]
    pub parent_b: Account<'info, Axol>,

    #[account(
        init,
        payer = signer,
        space = 8 + Axol::MAX_SIZE,
        seeds = [b"axol".as_ref(), child_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub child: Account<'info, Axol>,

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
    pub system_program: Program<'info, System>,
}
