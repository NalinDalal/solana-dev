# Solana Quick Start Guide
so go to beta.solpg.io and click on not connected in bottom left, create a local
wallet by saving the keypair

- wallet address: a 32-byte public key from a Ed25519 keypair, generally displayed as a base-58 encoded string. The corresponding private key signs transactions from this address.
- connected cluster: the Solana network for your current interactions. Common clusters include:
    - devnet: A development network for developer experimentation
    - testnet: A network reserved for validator testing (don't use as app developer)
    - mainnet-beta: The main Solana network for live transactions

## Get DevNet Sol
before starting out get some devnet SOL for:
- Creating new accounts to store data or deploy programs on the network
- Paying transaction fees when interacting with the Solana network

now ways:
1. Using the Playground Terminal
```sh
solana airdrop 5     #only 5 or less, else rates limits for 24 hours
```

2. Via Devnet Faucet
go to ![Web Faucet](https://faucet.solana.com/) and enter wallet address of
playground, select amount and then Confirm Airdrop

# Reading from Network
On Solana, all data exists in "accounts". You can think of data on Solana as a public database with a single "Accounts" table, where each entry is an account with the same base Account type.

2 types of programs stored: `State` or `Executable`
Each account has an "address" (public key) that serves as its unique ID used to locate its corresponding on-chain data.

So accounts contain either:
- `State`: `Data` that meant to be `read from and persisted`. For example, information about tokens, user data, or other data defined within a program.
- `Executable Programs`: Accounts `containing` the actual `code` of Solana programs. These accounts store instructions that users can invoke.

A.ts-> Fetch Wallet Account
B.ts-> Fetch Token Program
C.ts-> Fetch Mint Account
D.ts-> Deserialize Mint Account

All "wallet" accounts are simply System Program owned accounts that hold SOL and can sign transactions.

A Mint account is an account owned by the Token Program. It stores global metadata for a specific token, including the total supply, number of decimals, and the accounts authorized to mint or freeze tokens.

# Writing to Network
When you submit a transaction, the Solana runtime executes each instruction in sequence and atomically (meaning either all instructions succeed or the entire transaction fails).

## Transfer Sol
The System Program is the owner for all "wallet" accounts. To transfer SOL, you must invoke the System Program's transfer instruction.
E.ts

## Create a Token
In this example, you'll learn how to create a new token on Solana using the Token Extensions Program. This requires two instructions:

Invoke the System Program to create a new account.
Invoke the Token Extensions Program to initialize that account as a Mint.
F.ts

# Deploying Programs

