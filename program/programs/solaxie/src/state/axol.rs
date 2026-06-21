use crate::constants::*;
use crate::genes::{derive_stats, primary_class, Combatant, Genome, Stats};
use anchor_lang::prelude::*;

/// An Axol is a collectible, breedable, battle creature. For v1 it lives as a program
/// account; wrapping it as a Metaplex NFT (so it is tradeable on open marketplaces) is the
/// next step on the roadmap.
#[account]
pub struct Axol {
    pub owner: Pubkey,
    pub id: u64,          // global unique id
    pub genome: [[u8; 3]; NUM_PARTS],
    pub generation: u16,  // 0 = origin
    pub breed_count: u8,
    pub parent_a: u64,    // u64::MAX for origin Axols
    pub parent_b: u64,
    pub born_at: i64,
    pub level: u16,
    pub xp: u64,
}

impl Axol {
    pub const MAX_SIZE: usize =
        32 + 8 + (NUM_PARTS * 3) + 2 + 1 + 8 + 8 + 8 + 2 + 8;

    pub fn genome(&self) -> Genome {
        self.genome
    }

    pub fn class(&self) -> u8 {
        primary_class(&self.genome)
    }

    pub fn stats(&self) -> Stats {
        derive_stats(&self.genome)
    }

    pub fn as_combatant(&self) -> Combatant {
        Combatant {
            class: self.class(),
            stats: self.stats(),
            level: self.level,
        }
    }

    pub fn can_breed(&self) -> bool {
        self.breed_count < MAX_BREED_COUNT
    }

    /// Grant XP and level up. Every level needs `level * 100` xp.
    pub fn gain_xp(&mut self, amount: u64) {
        self.xp = self.xp.saturating_add(amount);
        loop {
            let needed = (self.level as u64 + 1) * 100;
            if self.xp >= needed {
                self.xp -= needed;
                self.level = self.level.saturating_add(1);
            } else {
                break;
            }
        }
    }
}
