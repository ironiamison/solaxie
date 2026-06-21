use crate::constants::*;
use crate::errors::GameErrorCode;
use crate::genes::resolve_battle;
use crate::state::axol::Axol;
use crate::state::game_data::GameData;
use crate::state::player_data::PlayerData;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Battle the player's Axol against an opponent Axol (PvP or sparring vs any Axol).
/// Costs energy; the winner earns tokens paid out of the treasury vault, capped by the
/// vault's balance. Resolved on-chain with a deterministic, slot-seeded simulation.
pub fn battle(ctx: Context<Battle>, counter: u16) -> Result<()> {
    let player = &mut ctx.accounts.player;
    player.update_energy()?;
    player.spend_energy(BATTLE_ENERGY_COST)?;
    player.last_id = counter;

    let my_axol = &ctx.accounts.my_axol;
    let opponent = &ctx.accounts.opponent;

    let clock = Clock::get()?;
    let seed = clock.slot
        ^ (clock.unix_timestamp as u64).wrapping_mul(0x100000001B3)
        ^ my_axol.id.wrapping_mul(0x9E3779B1)
        ^ opponent.id.wrapping_mul(0x85EBCA77)
        ^ (counter as u64);

    let won = resolve_battle(&my_axol.as_combatant(), &opponent.as_combatant(), seed);

    let reward;
    let xp_gain;
    if won {
        reward = BATTLE_WIN_REWARD + (opponent.level as u64) * ONE_TOKEN / 5;
        xp_gain = 30 + (opponent.level as u64) * 5;
        player.battles_won = player.battles_won.saturating_add(1);
    } else {
        reward = BATTLE_LOSS_REWARD;
        xp_gain = 10;
        player.battles_lost = player.battles_lost.saturating_add(1);
    }

    // Pay the reward out of the vault, capped by what it holds.
    let payout = reward.min(ctx.accounts.vault.amount);
    if payout > 0 {
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
            payout,
        )?;
    }

    let my_axol = &mut ctx.accounts.my_axol;
    my_axol.gain_xp(xp_gain);

    let game_data = &mut ctx.accounts.game_data;
    game_data.total_battles = game_data.total_battles.saturating_add(1);
    game_data.total_rewards_paid = game_data.total_rewards_paid.saturating_add(payout);

    msg!(
        "Battle: {} | payout {} base units | xp +{}",
        if won { "WIN" } else { "LOSS" },
        payout,
        xp_gain
    );
    Ok(())
}

#[derive(Accounts)]
pub struct Battle<'info> {
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

    #[account(
        mut,
        seeds = [b"axol".as_ref(), my_axol.id.to_le_bytes().as_ref()],
        bump,
        constraint = my_axol.owner == player.authority @ GameErrorCode::WrongAuthority,
    )]
    pub my_axol: Account<'info, Axol>,

    /// Any Axol can be challenged (read-only).
    #[account(
        seeds = [b"axol".as_ref(), opponent.id.to_le_bytes().as_ref()],
        bump,
    )]
    pub opponent: Account<'info, Axol>,

    #[account(
        mut,
        constraint = player_token_account.mint == game_data.token_mint @ GameErrorCode::InvalidGenes,
        constraint = player_token_account.owner == signer.key() @ GameErrorCode::WrongAuthority,
    )]
    pub player_token_account: Account<'info, TokenAccount>,

    #[account(mut, seeds = [b"vault".as_ref()], bump)]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: PDA that owns the vault; validated via seeds.
    #[account(seeds = [b"vault_auth".as_ref()], bump)]
    pub vault_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
