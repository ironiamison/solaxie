use crate::constants::*;
use crate::errors::GameErrorCode;
use crate::genes::resolve_battle;
use crate::state::axol::Axol;
use crate::state::game_data::GameData;
use crate::state::player_data::PlayerData;
use anchor_lang::prelude::*;

/// Battle the player's Axol against an opponent. Costs energy; XP only — no token payouts.
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

    let xp_gain = if won {
        30 + (opponent.level as u64) * 5
    } else {
        10
    };
    if won {
        player.battles_won = player.battles_won.saturating_add(1);
    } else {
        player.battles_lost = player.battles_lost.saturating_add(1);
    }

    let my_axol = &mut ctx.accounts.my_axol;
    my_axol.gain_xp(xp_gain);

    let game_data = &mut ctx.accounts.game_data;
    game_data.total_battles = game_data.total_battles.saturating_add(1);

    msg!(
        "Battle: {} | xp +{}",
        if won { "WIN" } else { "LOSS" },
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

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
