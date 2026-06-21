use crate::constants::*;
use crate::errors::GameErrorCode;
use anchor_lang::prelude::*;

#[account]
pub struct PlayerData {
    pub authority: Pubkey,
    pub name: String,
    pub energy: u64,
    pub last_login: i64,
    pub last_id: u16,
    pub axol_count: u16,  // how many Axols this player has minted/bred
    pub battles_won: u32,
    pub battles_lost: u32,
    pub claimed_starter: bool,
}

impl PlayerData {
    pub const MAX_SIZE: usize = 32 + (4 + 32) + 8 + 8 + 2 + 2 + 4 + 4 + 1;

    /// Refill energy based on elapsed time since the last action.
    pub fn update_energy(&mut self) -> Result<()> {
        let current_timestamp = Clock::get()?.unix_timestamp;
        let mut time_passed: i64 = current_timestamp - self.last_login;
        let mut time_spent = 0;

        while time_passed >= TIME_TO_REFILL_ENERGY && self.energy < MAX_ENERGY {
            self.energy += 1;
            time_passed -= TIME_TO_REFILL_ENERGY;
            time_spent += TIME_TO_REFILL_ENERGY;
        }

        if self.energy >= MAX_ENERGY {
            self.last_login = current_timestamp;
        } else {
            self.last_login += time_spent;
        }
        Ok(())
    }

    pub fn spend_energy(&mut self, amount: u64) -> Result<()> {
        if self.energy < amount {
            return err!(GameErrorCode::NotEnoughEnergy);
        }
        self.energy -= amount;
        Ok(())
    }
}
