use anchor_lang::error_code;

#[error_code]
pub enum GameErrorCode {
    #[msg("Not enough energy")]
    NotEnoughEnergy,
    #[msg("Wrong Authority")]
    WrongAuthority,
    #[msg("Not enough token balance")]
    NotEnoughTokens,
    #[msg("This Axol has reached its maximum breed count")]
    MaxBreedReached,
    #[msg("Cannot breed an Axol with itself")]
    CannotBreedWithSelf,
    #[msg("Parents must share the same owner")]
    ParentOwnerMismatch,
    #[msg("You own the maximum number of Axols")]
    TooManyAxols,
    #[msg("Invalid gene data")]
    InvalidGenes,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Invalid shop purchase amount")]
    InvalidPurchase,
}
