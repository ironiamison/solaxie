use anchor_lang::prelude::*;

/// Global, single-instance game registry (PDA seeded by "config").
#[account]
pub struct GameData {
    pub authority: Pubkey,
    pub token_mint: Pubkey,    // the launchpad token used as the game's currency
    pub total_axols: u64,      // monotonically increasing; also used to assign Axol ids
    pub total_battles: u64,
    pub total_rewards_paid: u64,
}

impl GameData {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 8 + 8;

    /// Reserve and return the next Axol id.
    pub fn next_axol_id(&mut self) -> u64 {
        let id = self.total_axols;
        self.total_axols = self.total_axols.saturating_add(1);
        id
    }
}
