# Wormhole Scaffolding

This repository warehouses apps that integrate with Wormhole generic messaging and existing apps that use Wormhole message passing. These apps range in complexity and demonstrate how to organize your business logic in your smart contracts. These examples also show how you would write tests supporting your Wormhole integration.

## Prerequisites

### EVM

If your xChain app will require EVM smart contracts, we recommend using [Foundry tools](https://book.getfoundry.sh/getting-started/installation), which include `forge`, `anvil` and `cast` CLI tools.

### Solana

If your xChain app will require Solana programs, prepare your development environment by installing [Solana and Anchor dependencies](https://book.anchor-lang.com/getting_started/installation.html), which include `solana` and `anchor` CLI tools.

## Build

Each directory represents Wormhole integrations for specific blockchain networks.

**Note: Normally for web3 contract interactions, the Wormhole SDK is installed via [npm](https://www.npmjs.com/package/@certusone/wormhole-sdk). But for these examples, an unreleased version of the SDK is used. Please see [the temporary directory](tmp) for more details.**
