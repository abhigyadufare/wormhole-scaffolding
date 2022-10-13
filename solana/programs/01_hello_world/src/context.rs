use anchor_lang::{
    prelude::*,
    solana_program::sysvar::{clock, rent},
};
use std::str::FromStr;

use crate::{
    env::WORMHOLE_ADDRESS,
    error::HelloWorldError,
    state::{Config, ForeignEmitter},
};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    /// Whoever initializes the config will be the owner of the program.
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        seeds = [b"hello_world.config"],
        bump,
        space = Config::MAXIMUM_SIZE,

    )]
    pub config: Account<'info, Config>,

    #[account(
        constraint = wormhole_program.key() == Pubkey::from_str(WORMHOLE_ADDRESS).unwrap() @ HelloWorldError::InvalidWormholeProgram
    )]
    /// CHECK: Wormhole Program
    pub wormhole_program: AccountInfo<'info>,

    #[account(
        seeds = [b"Bridge"],
        bump,
        seeds::program = wormhole_program
    )]
    /// CHECK: Wormhole Config
    /// TODO: add wormhole config deserializer?
    pub wormhole_config: AccountInfo<'info>,

    #[account(
        seeds = [b"fee_collector"],
        bump,
        seeds::program = wormhole_program
    )]
    /// CHECK: Wormhole Config
    /// TODO: add fee collector deserializer?
    pub wormhole_fee_collector: AccountInfo<'info>,

    #[account(
        seeds = [b"emitter"],
        bump
    )]
    /// CHECK: Wormhole Emitter
    pub wormhole_emitter: AccountInfo<'info>,

    #[account(
        seeds = [
            b"Sequence",
            wormhole_emitter.key().as_ref()
        ],
        bump,
        seeds::program = wormhole_program
    )]
    /// CHECK: Wormhole Emitter Sequence
    pub wormhole_sequence: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(chain: u16, emitter: [u8; 32])]
pub struct RegisterForeignEmitter<'info> {
    /// Owner of the program.
    #[account(
        mut,
        constraint = owner.key() == config.owner @ HelloWorldError::PermissionDenied
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [b"hello_world.config"],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        init_if_needed,
        payer = owner,
        seeds = [
            b"hello_world.foreign_emitter",
            chain.to_le_bytes().as_ref()
        ],
        bump,
        space = ForeignEmitter::MAXIMUM_SIZE
    )]
    pub foreign_emitter: Account<'info, ForeignEmitter>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SendMessage<'info> {
    #[account(mut)]
    /// Payer will initialize an account that tracks his own message IDs
    pub message_sender: Signer<'info>,

    #[account(
        mut,
        seeds = [b"hello_world.config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        constraint = wormhole_program.key() == Pubkey::from_str(WORMHOLE_ADDRESS).unwrap() @ HelloWorldError::InvalidWormholeProgram
    )]
    /// CHECK: Wormhole Program
    pub wormhole_program: AccountInfo<'info>,

    #[account(
        constraint = wormhole_config.key() == config.wormhole.config @ HelloWorldError::InvalidWormholeConfig
    )]
    /// CHECK: Wormhole Config
    /// TODO: add wormhole config deserializer?
    pub wormhole_config: AccountInfo<'info>,

    #[account(
        constraint = wormhole_fee_collector.key() == config.wormhole.fee_collector @ HelloWorldError::InvalidWormholeFeeCollector
    )]
    /// CHECK: Wormhole Config
    /// TODO: add fee collector deserializer?
    pub wormhole_fee_collector: AccountInfo<'info>,

    #[account(
        constraint = wormhole_emitter.key() == config.wormhole.emitter @ HelloWorldError::InvalidWormholeEmitter
    )]
    /// CHECK: Wormhole Emitter
    pub wormhole_emitter: AccountInfo<'info>,

    #[account(
        mut,
        constraint = wormhole_sequence.key() == config.wormhole.sequence @ HelloWorldError::InvalidWormholeSequence
    )]
    /// CHECK: Wormhole Emitter Sequence
    pub wormhole_sequence: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [
            b"hello_world.wormhole_message",
            config.message_count.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    /// CHECK: Wormhole Message
    pub wormhole_message: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    #[account(
        constraint = clock.key() == clock::id() @ HelloWorldError::InvalidSystemProgram
    )]
    /// CHECK: Clock
    pub clock: AccountInfo<'info>,

    #[account(
        constraint = rent.key() == rent::id() @ HelloWorldError::InvalidSystemProgram
    )]
    /// CHECK: Rent
    pub rent: AccountInfo<'info>,
}