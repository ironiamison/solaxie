// ----- Energy (stamina) -----
pub const TIME_TO_REFILL_ENERGY: i64 = 60; // seconds per energy point
pub const MAX_ENERGY: u64 = 100;
pub const BATTLE_ENERGY_COST: u64 = 5;
pub const BREED_ENERGY_COST: u64 = 10;

// ----- Economy (single SPL token — burn-only, no team payouts) -----
// All amounts are in token base units. The mock/dev token uses 6 decimals, so
// ONE_TOKEN = 1_000_000 base units. All costs burn from the player's wallet.
pub const ONE_TOKEN: u64 = 1_000_000;
pub const STARTER_GRANT: u64 = 0; // trainers buy SOLAX on pump.fun
pub const MINT_AXOL_COST: u64 = 100 * ONE_TOKEN; // burned on mint
pub const BREED_BASE_COST: u64 = 150 * ONE_TOKEN; // burned on breed (scales with breed count)
pub const BATTLE_WIN_REWARD: u64 = 0;
pub const BATTLE_LOSS_REWARD: u64 = 0;

// ----- Shop -----
/// Upper bound for a single shop purchase (500k whole tokens at 6 decimals).
pub const MAX_SHOP_PURCHASE: u64 = 500_000 * ONE_TOKEN;

// ----- Creatures -----
pub const NUM_PARTS: usize = 6; // eyes, ears, mouth, horn, back, tail
pub const NUM_CLASSES: u8 = 6; // Beast, Aquatic, Plant, Bird, Bug, Reptile
pub const MAX_BREED_COUNT: u8 = 7; // like Axie: each creature can breed at most 7 times
pub const MAX_AXOLS_PER_PLAYER: u16 = 50;

// ----- Battle tuning -----
pub const BASE_HP: u32 = 30;
pub const HP_PER_POINT: u32 = 5;
pub const MAX_BATTLE_TURNS: u32 = 60;
pub const ADVANTAGE_BONUS_PERCENT: u32 = 15; // damage +/- when class advantage applies
