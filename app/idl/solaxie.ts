/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solaxie.json`.
 */
export type Solaxie = {
  "address": "FYvhXM6Jv4crAVWcpZYtGT9WN2Ai2z9cUpY2EY8CTCcg",
  "metadata": {
    "name": "solaxie",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Solaxie - a collect, breed and battle creature game on Solana"
  },
  "instructions": [
    {
      "name": "battle",
      "docs": [
        "Battle the player's Axol against an opponent."
      ],
      "discriminator": [
        124,
        60,
        127,
        254,
        179,
        26,
        138,
        20
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "gameData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "myAxol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  120,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "my_axol.id",
                "account": "axol"
              }
            ]
          }
        },
        {
          "name": "opponent",
          "docs": [
            "Any Axol can be challenged (read-only)."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  120,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "opponent.id",
                "account": "axol"
              }
            ]
          }
        },
        {
          "name": "playerTokenAccount",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "counter",
          "type": "u16"
        }
      ]
    },
    {
      "name": "breed",
      "docs": [
        "Breed two owned Axols into a new child Axol."
      ],
      "discriminator": [
        215,
        166,
        48,
        89,
        209,
        205,
        125,
        11
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "gameData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "parentA",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  120,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "parent_a.id",
                "account": "axol"
              }
            ]
          }
        },
        {
          "name": "parentB",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  120,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "parent_b.id",
                "account": "axol"
              }
            ]
          }
        },
        {
          "name": "child",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  120,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "childId"
              }
            ]
          }
        },
        {
          "name": "playerTokenAccount",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "childId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fundTreasury",
      "docs": [
        "Top up the treasury vault (e.g. from pump.fun creator rewards)."
      ],
      "discriminator": [
        71,
        154,
        45,
        220,
        206,
        32,
        174,
        239
      ],
      "accounts": [
        {
          "name": "gameData",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "funderTokenAccount",
          "writable": true
        },
        {
          "name": "funder",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initPlayer",
      "docs": [
        "Create a player profile + token account and grant a starter stash from the vault."
      ],
      "discriminator": [
        114,
        27,
        219,
        144,
        50,
        15,
        228,
        66
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "gameData",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "playerTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "signer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "One-time setup: register the launchpad token and create the treasury vault."
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "gameData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "tokenMint",
          "docs": [
            "The token used as the game currency (e.g. the pump.fun mint)."
          ]
        },
        {
          "name": "vaultAuthority",
          "docs": [
            "PDA that owns the treasury vault and signs reward payouts."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "Program-owned treasury vault (an SPL token account at a PDA)."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "mintAxol",
      "docs": [
        "Roll a fresh origin (gen 0) Axol with randomized genes. Costs LOVE."
      ],
      "discriminator": [
        125,
        40,
        56,
        97,
        166,
        172,
        153,
        62
      ],
      "accounts": [
        {
          "name": "player",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "gameData",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "axol",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  120,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "axolId"
              }
            ]
          }
        },
        {
          "name": "playerTokenAccount",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "axolId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "shopPurchase",
      "docs": [
        "Pay for a shop item — tokens sink into the treasury vault."
      ],
      "discriminator": [
        185,
        234,
        158,
        26,
        40,
        213,
        190,
        42
      ],
      "accounts": [
        {
          "name": "gameData",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "playerTokenAccount",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "sku",
          "type": "u32"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "axol",
      "discriminator": [
        69,
        45,
        224,
        71,
        39,
        180,
        51,
        74
      ]
    },
    {
      "name": "gameData",
      "discriminator": [
        237,
        88,
        58,
        243,
        16,
        69,
        238,
        190
      ]
    },
    {
      "name": "playerData",
      "discriminator": [
        197,
        65,
        216,
        202,
        43,
        139,
        147,
        128
      ]
    }
  ],
  "events": [
    {
      "name": "shopPurchaseEvent",
      "discriminator": [
        33,
        165,
        50,
        113,
        86,
        211,
        70,
        130
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "notEnoughEnergy",
      "msg": "Not enough energy"
    },
    {
      "code": 6001,
      "name": "wrongAuthority",
      "msg": "Wrong Authority"
    },
    {
      "code": 6002,
      "name": "notEnoughTokens",
      "msg": "Not enough token balance"
    },
    {
      "code": 6003,
      "name": "maxBreedReached",
      "msg": "This Axol has reached its maximum breed count"
    },
    {
      "code": 6004,
      "name": "cannotBreedWithSelf",
      "msg": "Cannot breed an Axol with itself"
    },
    {
      "code": 6005,
      "name": "parentOwnerMismatch",
      "msg": "Parents must share the same owner"
    },
    {
      "code": 6006,
      "name": "tooManyAxols",
      "msg": "You own the maximum number of Axols"
    },
    {
      "code": 6007,
      "name": "invalidGenes",
      "msg": "Invalid gene data"
    },
    {
      "code": 6008,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6009,
      "name": "invalidPurchase",
      "msg": "Invalid shop purchase amount"
    }
  ],
  "types": [
    {
      "name": "axol",
      "docs": [
        "An Axol is a collectible, breedable, battle creature. For v1 it lives as a program",
        "account; wrapping it as a Metaplex NFT (so it is tradeable on open marketplaces) is the",
        "next step on the roadmap."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "genome",
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    3
                  ]
                },
                6
              ]
            }
          },
          {
            "name": "generation",
            "type": "u16"
          },
          {
            "name": "breedCount",
            "type": "u8"
          },
          {
            "name": "parentA",
            "type": "u64"
          },
          {
            "name": "parentB",
            "type": "u64"
          },
          {
            "name": "bornAt",
            "type": "i64"
          },
          {
            "name": "level",
            "type": "u16"
          },
          {
            "name": "xp",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "gameData",
      "docs": [
        "Global, single-instance game registry (PDA seeded by \"config\")."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "tokenMint",
            "type": "pubkey"
          },
          {
            "name": "totalAxols",
            "type": "u64"
          },
          {
            "name": "totalBattles",
            "type": "u64"
          },
          {
            "name": "totalRewardsPaid",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "playerData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "energy",
            "type": "u64"
          },
          {
            "name": "lastLogin",
            "type": "i64"
          },
          {
            "name": "lastId",
            "type": "u16"
          },
          {
            "name": "axolCount",
            "type": "u16"
          },
          {
            "name": "battlesWon",
            "type": "u32"
          },
          {
            "name": "battlesLost",
            "type": "u32"
          },
          {
            "name": "claimedStarter",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "shopPurchaseEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "sku",
            "type": "u32"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
