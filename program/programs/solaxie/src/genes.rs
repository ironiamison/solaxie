use crate::constants::*;

/// A single body part carries three genes: dominant (D) + two recessive (R1, R2).
/// The dominant gene's class is the one that is visually expressed and used for stats.
/// Recessive genes only matter for breeding, exactly like Axie's gene system.
pub type PartGenes = [u8; 3]; // [dominant_class, recessive1_class, recessive2_class]

/// Full genome: one PartGenes per body part.
pub type Genome = [PartGenes; NUM_PARTS];

/// Per-class stat contribution of a single part of that class: [HP, Speed, Skill, Morale].
/// Tuned so each class has an identity (Plant/Reptile tanky, Bird/Aquatic fast, Beast/Bug high morale).
pub const CLASS_STATS: [[u32; 4]; 6] = [
    // Beast
    [6, 4, 3, 8],
    // Aquatic
    [5, 8, 5, 3],
    // Plant
    [9, 3, 3, 6],
    // Bird
    [3, 9, 6, 4],
    // Bug
    [5, 5, 5, 6],
    // Reptile
    [8, 4, 4, 5],
];

pub const CLASS_NAMES: [&str; 6] = [
    "Beast", "Aquatic", "Plant", "Bird", "Bug", "Reptile",
];

/// Derived combat stats for an Axol.
#[derive(Clone, Copy, Debug, Default)]
pub struct Stats {
    pub hp: u32,
    pub speed: u32,
    pub skill: u32,
    pub morale: u32,
}

/// Lightweight deterministic PRNG (xorshift64*). On-chain randomness here is derived from
/// the slot/timestamp and is therefore predictable; for production wire up Switchboard VRF.
pub struct Rng {
    state: u64,
}

impl Rng {
    pub fn new(seed: u64) -> Self {
        // Avoid a zero state which would lock xorshift at 0.
        Self { state: seed ^ 0x9E3779B97F4A7C15 | 1 }
    }

    pub fn next_u64(&mut self) -> u64 {
        let mut x = self.state;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.state = x;
        x.wrapping_mul(0x2545F4914F6CDD1D)
    }

    /// Returns a value in [0, bound).
    pub fn below(&mut self, bound: u32) -> u32 {
        if bound == 0 {
            return 0;
        }
        (self.next_u64() % bound as u64) as u32
    }

    /// Returns true with probability `percent`/100.
    pub fn chance(&mut self, percent: u32) -> bool {
        self.below(100) < percent
    }

    pub fn random_class(&mut self) -> u8 {
        self.below(NUM_CLASSES as u32) as u8
    }
}

/// Roll a brand new origin genome (all genes randomized).
pub fn random_genome(rng: &mut Rng) -> Genome {
    let mut genome: Genome = [[0u8; 3]; NUM_PARTS];
    for part in genome.iter_mut() {
        part[0] = rng.random_class();
        part[1] = rng.random_class();
        part[2] = rng.random_class();
    }
    genome
}

/// The expressed (dominant) class of each part.
pub fn expressed_classes(genome: &Genome) -> [u8; NUM_PARTS] {
    let mut out = [0u8; NUM_PARTS];
    for (i, part) in genome.iter().enumerate() {
        out[i] = part[0] % NUM_CLASSES;
    }
    out
}

/// The primary class is the dominant class that appears most across the parts.
pub fn primary_class(genome: &Genome) -> u8 {
    let mut counts = [0u32; 6];
    for c in expressed_classes(genome).iter() {
        counts[*c as usize] += 1;
    }
    let mut best = 0u8;
    let mut best_count = 0u32;
    for (class, count) in counts.iter().enumerate() {
        if *count > best_count {
            best_count = *count;
            best = class as u8;
        }
    }
    best
}

/// Derive combat stats from the expressed genes.
pub fn derive_stats(genome: &Genome) -> Stats {
    let mut hp = 0u32;
    let mut speed = 0u32;
    let mut skill = 0u32;
    let mut morale = 0u32;

    for class in expressed_classes(genome).iter() {
        let s = CLASS_STATS[*class as usize];
        hp += s[0];
        speed += s[1];
        skill += s[2];
        morale += s[3];
    }

    Stats {
        hp: BASE_HP + hp * HP_PER_POINT,
        speed,
        skill,
        morale,
    }
}

/// Class advantage cycle: class `c` is strong against (c+1) and (c+2) mod 6,
/// and weak against (c-1) and (c-2) mod 6. A clean generalized rock-paper-scissors.
/// Returns +ADVANTAGE_BONUS_PERCENT, 0, or -ADVANTAGE_BONUS_PERCENT (as i32).
pub fn advantage_modifier(attacker_class: u8, defender_class: u8) -> i32 {
    let a = attacker_class as i32;
    let d = defender_class as i32;
    let diff = ((d - a) % 6 + 6) % 6; // 0..5
    match diff {
        1 | 2 => ADVANTAGE_BONUS_PERCENT as i32,  // attacker is strong
        4 | 5 => -(ADVANTAGE_BONUS_PERCENT as i32), // attacker is weak
        _ => 0,                                    // same or mirror (diff == 3)
    }
}

/// Breed two genomes into a child genome.
/// For each part, the child inherits one gene from each parent slot with Axie-like
/// probabilities: dominant gene passes 6/10, recessive1 3/10, recessive2 1/10.
/// The child's dominant comes from parent A's draw, recessives from subsequent draws.
pub fn breed_genomes(parent_a: &Genome, parent_b: &Genome, rng: &mut Rng) -> Genome {
    let mut child: Genome = [[0u8; 3]; NUM_PARTS];
    for part in 0..NUM_PARTS {
        // Three gene slots in the child part; alternate which parent contributes.
        for slot in 0..3 {
            let source = if rng.chance(50) { &parent_a[part] } else { &parent_b[part] };
            child[part][slot] = draw_gene(source, rng);
        }
    }
    child
}

/// Draw one gene from a part's (D, R1, R2) using weighted probabilities.
fn draw_gene(part: &PartGenes, rng: &mut Rng) -> u8 {
    let roll = rng.below(10);
    let idx = if roll < 6 {
        0 // dominant: 60%
    } else if roll < 9 {
        1 // recessive1: 30%
    } else {
        2 // recessive2: 10%
    };
    part[idx] % NUM_CLASSES
}

/// One combatant in a battle, derived from an Axol.
#[derive(Clone, Copy)]
pub struct Combatant {
    pub class: u8,
    pub stats: Stats,
    pub level: u16,
}

/// Resolve a deterministic battle between two combatants.
/// Returns true if `a` (the player) wins.
pub fn resolve_battle(a: &Combatant, b: &Combatant, seed: u64) -> bool {
    let mut rng = Rng::new(seed);

    let mut a_hp = a.stats.hp as i64 + (a.level as i64) * 10;
    let mut b_hp = b.stats.hp as i64 + (b.level as i64) * 10;

    // Higher speed attacks first; ties broken by morale, then by player.
    let a_first = a.stats.speed > b.stats.speed
        || (a.stats.speed == b.stats.speed && a.stats.morale >= b.stats.morale);

    for _ in 0..MAX_BATTLE_TURNS {
        if a_first {
            b_hp -= attack(a, b, &mut rng);
            if b_hp <= 0 {
                return true;
            }
            a_hp -= attack(b, a, &mut rng);
            if a_hp <= 0 {
                return false;
            }
        } else {
            a_hp -= attack(b, a, &mut rng);
            if a_hp <= 0 {
                return false;
            }
            b_hp -= attack(a, b, &mut rng);
            if b_hp <= 0 {
                return true;
            }
        }
    }

    // Time out: whoever kept the larger HP fraction wins; player wins exact ties.
    let a_max = a.stats.hp as i64 + (a.level as i64) * 10;
    let b_max = b.stats.hp as i64 + (b.level as i64) * 10;
    (a_hp * b_max) >= (b_hp * a_max)
}

/// Damage dealt by `attacker` to `defender` for a single attack.
fn attack(attacker: &Combatant, defender: &Combatant, rng: &mut Rng) -> i64 {
    // Base damage scales with skill plus a small random spread.
    let base = attacker.stats.skill + 5 + rng.below(attacker.stats.skill.max(1) / 2 + 5);

    // Class advantage / disadvantage.
    let modifier = advantage_modifier(attacker.class, defender.class);
    let mut dmg = base as i64;
    dmg += dmg * modifier as i64 / 100;

    // Morale fuels critical hits (capped chance).
    let crit_chance = attacker.stats.morale.min(60);
    if rng.chance(crit_chance) {
        dmg += dmg / 2; // 1.5x on crit
    }

    dmg.max(1)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn describe(label: &str, genome: &Genome) {
        let s = derive_stats(genome);
        let c = primary_class(genome);
        let parts: Vec<&str> = expressed_classes(genome)
            .iter()
            .map(|x| CLASS_NAMES[*x as usize])
            .collect();
        println!(
            "  {label}: class={:<8} HP={:<3} SPD={:<2} SKL={:<2} MRL={:<2} | parts={:?}",
            CLASS_NAMES[c as usize], s.hp, s.speed, s.skill, s.morale, parts
        );
    }

    #[test]
    fn all_genes_produce_valid_classes() {
        let mut rng = Rng::new(7);
        for _ in 0..200 {
            let g = random_genome(&mut rng);
            for part in g.iter() {
                for gene in part.iter() {
                    assert!(*gene < NUM_CLASSES);
                }
            }
            let s = derive_stats(&g);
            assert!(s.hp >= BASE_HP);
        }
    }

    #[test]
    fn advantage_cycle_is_symmetric() {
        for c in 0..NUM_CLASSES {
            // strong vs the next two classes, weak vs the previous two, neutral vs mirror.
            assert_eq!(advantage_modifier(c, (c + 1) % NUM_CLASSES), ADVANTAGE_BONUS_PERCENT as i32);
            assert_eq!(advantage_modifier(c, (c + 2) % NUM_CLASSES), ADVANTAGE_BONUS_PERCENT as i32);
            assert_eq!(advantage_modifier(c, (c + 3) % NUM_CLASSES), 0);
            assert_eq!(advantage_modifier(c, (c + 4) % NUM_CLASSES), -(ADVANTAGE_BONUS_PERCENT as i32));
        }
    }

    #[test]
    fn child_inherits_only_parent_genes() {
        let mut rng = Rng::new(123);
        let a = random_genome(&mut rng);
        let b = random_genome(&mut rng);
        let child = breed_genomes(&a, &b, &mut rng);
        for part in 0..NUM_PARTS {
            let allowed: Vec<u8> = a[part].iter().chain(b[part].iter()).copied().collect();
            for gene in child[part].iter() {
                assert!(allowed.contains(gene), "child gene must come from a parent");
            }
        }
    }

    #[test]
    fn demo_collect_breed_battle() {
        println!("\n===== SOLAXIE DEMO: collect -> breed -> battle =====\n");

        let mut rng = Rng::new(0xA11CE);

        println!("[1] Two players each roll a starter Axol:");
        let parent_a = random_genome(&mut rng);
        let parent_b = random_genome(&mut rng);
        describe("Parent A", &parent_a);
        describe("Parent B", &parent_b);

        println!("\n[2] Breeding Parent A x Parent B -> child genome:");
        let child = breed_genomes(&parent_a, &parent_b, &mut rng);
        describe("Child   ", &child);

        println!("\n[3] Battle: Child (lvl 3) vs an opponent (lvl 2):");
        let opponent = random_genome(&mut rng);
        describe("Child   ", &child);
        describe("Opponent", &opponent);

        let mine = Combatant { class: primary_class(&child), stats: derive_stats(&child), level: 3 };
        let foe = Combatant { class: primary_class(&opponent), stats: derive_stats(&opponent), level: 2 };

        let mut wins = 0;
        for seed in 0..5u64 {
            let won = resolve_battle(&mine, &foe, 0xBEEF ^ seed);
            println!("  match {seed}: {}", if won { "WIN " } else { "LOSS" });
            if won {
                wins += 1;
            }
        }
        println!("\n  Child won {wins}/5 matches.");
        println!("\n===================================================\n");
    }
}
