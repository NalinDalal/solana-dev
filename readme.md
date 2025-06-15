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

typescript code:
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

1. Create a Anchor Project
   Go to beta.solpg.io and Create a new project under Anchor Framework

project init with `src/lib.rs` file.

creates a new account and stores a number in it. The program contains one instruction (`initialize`) which:

- Requires a `data: u64` parameter as input
- Creates a new account
- Saves the value of the `data: u64` parameter in the account's data
- Logs a message to the transaction's program logs

2. Build and Deploy
   create the rs code, simple run the command:

```sh
build
```

Solana Playground updates the address in declare_id!(). This address represents your program's on-chain address (program ID).

get some alance in your faucet by running:

```sh
solana airdrop 5
```

deploy the program:

```sh
deploy
```

we fucking deployed the program, can also use the tool button on sidebar

After deploying the program, you can call its instructions.

3. Test Program
   starter code includes a test file located in `tests/anchor.test.ts`. This file demonstrates how to invoke the initialize instruction on the program from the client.

now after deploying the code, run the test:

```sh
test
```

view the transaction logs by running:

```sh
solana confirm -v [TxHash]
```

4. Close the Program

```bash
solana program close [ProgramID]
```

# Creating Determinstic Accounts | Program Derived Address

how to build a basic Create, Read, Update, Delete (CRUD) program.

CRUD opr on message, which exist on an account with a deterministic address derived from the program itself (Program Derived Address or PDA).

1. **Starter Code**
   click the "Import" button to add the program to your Solana Playground projects.
   kept the project nme `test`.
   In the lib.rs file, you'll find a program with the create, update, and delete instructions to add in the following steps.
   the code is empty for now, build it, it successfully compiles

2. **Define Message Account**

```rs
#[account]                                  //annotates structs that represent account data
pub struct MessageAccount {                 //stores a message created by users 3 fields
    pub user: Pubkey,                       //public key of user creating account
    pub message: String,                    //String that contains the user's message.
    pub bump: u8,                           //bump seed for deriving PDA
}
```

build the project

3. **Add Create Instruction**
   add the create instruction that creates and initializes the MessageAccount.

```rs
#[derive(Accounts)]
#[instruction(message: String)]
pub struct Create<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        seeds = [b"message", user.key().as_ref()],
        bump,
        payer = user,
        space = 8 + 32 + 4 + message.len() + 1
    )]
    pub message_account: Account<'info, MessageAccount>,
    pub system_program: Program<'info, System>,
}
```

add the business logic for the create instruction by updating the create function

```rs
pub fn create(ctx: Context<Create>, message: String) -> Result<()> {
    msg!("Create Message: {}", message);
    let account_data = &mut ctx.accounts.message_account;
    account_data.user = ctx.accounts.user.key();
    account_data.message = message;
    account_data.bump = ctx.bumps.message_account;
    Ok(())
}
```

build the project

4. **Add Update Instruction**
   add the update instruction to change the MessageAccount with a new message.

```rs
#[derive(Accounts)]
#[instruction(message: String)]
pub struct Update<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"message", user.key().as_ref()],
        bump = message_account.bump,
        realloc = 8 + 32 + 4 + message.len() + 1,
        realloc::payer = user,
        realloc::zero = true,
    )]
    pub message_account: Account<'info, MessageAccount>,
    pub system_program: Program<'info, System>,
}
```

add the logic for the update instruction.

```rs
pub fn update(ctx: Context<Update>, message: String) -> Result<()> {
    msg!("Update Message: {}", message);
    let account_data = &mut ctx.accounts.message_account;
    account_data.message = message;
    Ok(())
}
```

5. **Add Delete Instruction**
   add `delete` instruction to close the `MessageAccount`
   update the `delete` struct

```rs
#[derive(Accounts)]
pub struct Delete<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"message", user.key().as_ref()],
        bump = message_account.bump,
        close = user,
    )]
    pub message_account: Account<'info, MessageAccount>,
}
```

add logic for `delete` instruction

```rs
pub fn delete(_ctx: Context<Delete>) -> Result<()> {
    msg!("Delete Message");
    Ok(())
}
```

6. **Deploy**
   Deploy the program by running `deploy`

check the ![transaction details](https://explorer.solana.com/tx/6HPPCa3vGEucMeAqT3oFKhxrtq23vAYBSb1Kjh8eEQJSZt52KczgwQN7DRtWZ4Q8RM2FxnH3kbTvmS4Gohr1veZ?cluster=devnet)

7. **Writing the test**
   the starter code has a test folder, some code in anchor.test.ts file, run the
   test by

```bash
test
```

8. **Invoke Create Instruction**

```ts
it("Create Message Account", async () => {
  const message = "Hello, World!";
  const transactionSignature = await program.methods
    .create(message)
    .accounts({
      messageAccount: messagePda,
    })
    .rpc({ commitment: "confirmed" });

  const messageAccount = await program.account.messageAccount.fetch(
    messagePda,
    "confirmed",
  );

  console.log(JSON.stringify(messageAccount, null, 2));
  console.log(
    "Transaction Signature:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`,
  );
});
```

9. **Invoke Update Instruction**

```ts
it("Update Message Account", async () => {
  const message = "Hello, Solana!";
  const transactionSignature = await program.methods
    .update(message)
    .accounts({
      messageAccount: messagePda,
    })
    .rpc({ commitment: "confirmed" });

  const messageAccount = await program.account.messageAccount.fetch(
    messagePda,
    "confirmed",
  );

  console.log(JSON.stringify(messageAccount, null, 2));
  console.log(
    "Transaction Signature:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`,
  );
});
```

10. **Invoke Delete Instruction**

```ts
it("Delete Message Account", async () => {
  const transactionSignature = await program.methods
    .delete()
    .accounts({
      messageAccount: messagePda,
    })
    .rpc({ commitment: "confirmed" });

  const messageAccount = await program.account.messageAccount.fetchNullable(
    messagePda,
    "confirmed",
  );

  console.log("Expect Null:", JSON.stringify(messageAccount, null, 2));
  console.log(
    "Transaction Signature:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`,
  );
});
```

run the test via `test`

# Cross Program Invocation

Cross Program Invocations (CPIs), a feature that enables Solana programs to invoke each other.
update and delete instructions need modification to handle SOL transfers between accounts by invoking the System Program.

1. **Update the Update Instruction**
   simple "pay-to-update" mechanism by changing the Update struct and update function in lib.rs
   `use anchor_lang::system_program::{transfer, Transfer};`

Next, update the Update struct to include a new account called `vault_account`.

```rs
#[account(
    mut,
    seeds = [b"vault", user.key().as_ref()],
    bump,
)]
pub vault_account: SystemAccount<'info>,

```

Next, add the CPI logic in the `update instruction` to transfer 0.001 SOL from the user's account to the vault account.

```rs
let transfer_accounts = Transfer {
    from: ctx.accounts.user.to_account_info(),
    to: ctx.accounts.vault_account.to_account_info(),
};

let cpi_context = CpiContext::new(
    ctx.accounts.system_program.to_account_info(),
    transfer_accounts,
);

transfer(cpi_context, 1_000_000)?;
```

build the program

2. **Update the Delete Instruction**
   update the Delete struct to include the vault_account. This allows the transfer of any SOL in the vault back to the user when they close their message account.

```rs
#[account(
    mut,
    seeds = [b"vault", user.key().as_ref()],
    bump,
)]
```

add the `system_program` as the CPI for the transfer requires invoking the System Program.
`pub system_program: Program<'info, System>,`

add the CPI logic in the `delete` instruction to transfer SOL from the vault account back to the user's account.

```rs
let user_key = ctx.accounts.user.key();
let signer_seeds: &[&[&[u8]]] =
    &[&[b"vault", user_key.as_ref(), &[ctx.bumps.vault_account]]];

let transfer_accounts = Transfer {
    from: ctx.accounts.vault_account.to_account_info(),
    to: ctx.accounts.user.to_account_info(),
};
let cpi_context = CpiContext::new(
    ctx.accounts.system_program.to_account_info(),
    transfer_accounts,
).with_signer(signer_seeds);
transfer(cpi_context, ctx.accounts.vault_account.lamports())?;
```

3. **redeploy the program**

4. **Update test file**

- update the anchor.test.ts file to include the new vault account in the instructions.
- This requires deriving the vault PDA and including it in the update and delete instruction calls.
- add the vault PDA derivation
- update instruction to include the vaultAccount
- update the delete instruction to include the vaultAccount

# Installation

install rust, Solana CLI, anchor cli, node.js, and yarn
air drop yourself some sol, and then check balance
run local validator: `solana-test-validator`

# Anchor CLI Basics

## Initialize Project

To create a new Anchor project, run the following command:

```sh
anchor init <project-name>
```

Navigate to the project directory:

```sh
cd <project-name>
```

## Build Program

To build your project, run the following command:

```sh
anchor build
```

You can find the compiled program in the `/target/deploy` directory.

## Deploy Program

To deploy your project, run the following command:

```sh
anchor deploy
```

This command deploys your program to the cluster specified in the Anchor.toml file.

## Test Program

To test your project, run the following command:

```sh
anchor test
```

---

# Core Concepts

## Program Derived Addresses

Program Derived Addresses (PDAs) provide developers on Solana with two main use cases:

- **Deterministic Account Addresses**: PDAs provide a mechanism to deterministically derive an address using a combination of optional "seeds" (predefined inputs) and a specific program ID.
- **Enable Program Signing**: The Solana runtime enables programs to "sign" for PDAs which are derived from its program ID.
  You can think of PDAs as a way to create hashmap-like structures on-chain from a predefined set of inputs (e.g. strings, numbers, and other account addresses).

The benefit of this approach is that it eliminates the need to keep track of an exact address. Instead, you simply need to recall the specific inputs used for its derivation.

a way to create hashmap-like structures on-chain from a predefined set of inputs

## Cross Program Invocations

A Cross Program Invocation (CPI) refers to when one program invokes the instructions of another program. This mechanism allows for the composability of Solana programs.

You can think of instructions as API endpoints that a program exposes to the network and a CPI as one API internally invoking another API.

---

# Solana Account Model

all data is stored in what are called "accounts."
Every account on Solana has a unique 32-byte address, often shown as a base58 encoded string.

account and its address works like a key-value pair.
ex: `address.rs` and `address.ts`

public keys-> account addresses
Program Derived Addresses(PDA)-> special addresses that you can deterministically derive from a program ID and optional inputs (seeds).
ex: `pda.rs` and `pda.ts`

# Account

Each account has following:

- `data`: store arbitary data in byte array.stores state that's meant be read from.For program accounts (smart contracts), this contains the executable program code.
- `executable`: This flag shows if an account is a program.
- `lamports`: The account's balance in lamports, the smallest unit of SOL (1 SOL = 1 billion lamports).
- `owner`: The program ID (public key) of the program that owns this account.

ex: `account.rs`, `account.ts`

# Rent

consider it as a `rent`(in lamports) needed to be deposited to store something
on account, works more like a deposit because you can recover the full amount when you close an account.

# Program Owner

They are owner of the contracts. Only the owner program can:

- Change the account's data field
- Deduct lamports from the account's balance

# Solana Account Types

1. **System Program & System Account**
   - The **System Program** (`111111...`) is the default program for creating accounts and transferring SOL.
   - A **System Account** is any regular account created by the system program, usually holds SOL and metadata.
   - ex: `sys_pro.rs`,`sys_pro.ts`
2. **Program & Program Data Account**
   - A **Program Account** is an executable account deployed to the chain, which runs smart contract code (BPF).
   - A **Program Data Account** holds upgradeable program data when using the BPF upgradeable loader.
   - ex: `program_acc.ts`,`pro_acc.rs`
3. **Data Account (Buffer Account / Custom Account)**
   - A **Data Account** stores custom state/data for your program (e.g., user profiles, messages).
   - A **Buffer Account** temporarily holds program code before being deployed or upgraded.
   - ex: `data_acc.rs`,`data_acc.ts`

# Transactions and Instructions

instruction to interact with network, and collection of instruction is
transaction

- If a transaction includes multiple instructions, the instructions execute in the order added to the transaction.
- Transactions are "atomic" - all instructions must process successfully, or the entire transaction fails and no changes occur.

A transaction is essentially a request to process one or more instructions.

- Transactions are atomic - if any instruction fails, the entire transaction fails and no changes occur.
- Instructions on a transaction execute in sequential order.
- The transaction size limit is 1232 bytes.
- Each instruction requires three pieces of information:
  A. The address of the program to invoke
  B. The accounts the instruction reads from or writes to
  C. Any extra data required by the instruction (e.g., function arguments)

SOL Transfer Example

# Transaction Fees

bruh, that;s like paying for transfers of crypto:

- The base fee for a transaction is 5000 lamports per signature on the transaction.
- The prioritization fee (optional) is an extra fee you pay to the validator to increase the chance that the current leader processes your transaction.
- The prioritization fee equals: (compute unit limit \* compute unit price).
- The compute unit limit is the maximum compute units your transaction can use.
- The compute unit price is the price per compute unit, in micro-lamports.
- 1,000,000 micro lamports = 1 lamport
- The transaction fee payer must be an account owned by the System Program.

## Calculate Prioritization Fee

prio-fee.ts, prio-fee.rs

In Solana, wallets are accounts owned by the **System Program**. To transfer SOL between wallets, a transaction must be created that **invokes the System Program**. This requires:

- The **sender** to sign the transaction (`is_signer`)
- Both accounts (sender and recipient) to be **writable** (`is_writable`)

Once the transaction is submitted, the System Program deducts lamports from the sender and credits the recipient.

---

## 🔁 Transfer Process (Kit Example)

```ts
import {
  airdropFactory,
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";

const rpc = createSolanaRpc("http://localhost:8899");
const rpcSubscriptions = createSolanaRpcSubscriptions("ws://localhost:8900");

const sender = await generateKeyPairSigner();
const recipient = await generateKeyPairSigner();

const LAMPORTS_PER_SOL = 1_000_000_000n;
const transferAmount = lamports(LAMPORTS_PER_SOL / 100n); // 0.01 SOL

await airdropFactory({ rpc, rpcSubscriptions })({
  recipientAddress: sender.address,
  lamports: lamports(LAMPORTS_PER_SOL),
  commitment: "confirmed",
});

const { value: preBalance1 } = await rpc.getBalance(sender.address).send();
const { value: preBalance2 } = await rpc.getBalance(recipient.address).send();

const transferInstruction = getTransferSolInstruction({
  source: sender,
  destination: recipient.address,
  amount: transferAmount,
});

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(sender, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions([transferInstruction], tx),
);

const signedTransaction =
  await signTransactionMessageWithSigners(transactionMessage);
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
  signedTransaction,
  { commitment: "confirmed" },
);
const transactionSignature = getSignatureFromTransaction(signedTransaction);

const { value: postBalance1 } = await rpc.getBalance(sender.address).send();
const { value: postBalance2 } = await rpc.getBalance(recipient.address).send();

console.log(
  "Sender prebalance:",
  Number(preBalance1) / Number(LAMPORTS_PER_SOL),
);
console.log(
  "Recipient prebalance:",
  Number(preBalance2) / Number(LAMPORTS_PER_SOL),
);
console.log(
  "Sender postbalance:",
  Number(postBalance1) / Number(LAMPORTS_PER_SOL),
);
console.log(
  "Recipient postbalance:",
  Number(postBalance2) / Number(LAMPORTS_PER_SOL),
);
console.log("Transaction Signature:", transactionSignature);
```

---

## 🛠 Manual Instruction Construction

### Kit

```ts
const transferAmount = 0.01;

const transferInstruction = getTransferSolInstruction({
  source: sender,
  destination: recipient.address,
  amount: transferAmount * LAMPORTS_PER_SOL,
});
```

### Legacy (SystemProgram)

```ts
const transferAmount = 0.01;

const transferInstruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: receiver.publicKey,
  lamports: transferAmount * LAMPORTS_PER_SOL,
});
```

### Rust

```rust
let transfer_amount = LAMPORTS_PER_SOL / 100;

let transfer_instruction =
    system_instruction::transfer(&sender.pubkey(), &recipient.pubkey(), transfer_amount);
```

---

## 📦 Instruction Overview

Every instruction requires:

- **Program ID**: the Solana program handling the logic
- **Accounts**: list of accounts accessed or modified
- **Data**: byte-encoded parameters

```rust
pub struct Instruction {
    pub program_id: Pubkey,
    pub accounts: Vec<AccountMeta>,
    pub data: Vec<u8>,
}
```

### `AccountMeta` structure:

```rust
pub struct AccountMeta {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}
```

---

## 📄 Example Output (Kit JSON)

```json
{
  "program_id": "11111111111111111111111111111111",
  "accounts": [
    {
      "pubkey": "Hhh6vrA6xUNwaNftJVAXSTzfHiRiAKFKLGmHdcRH6Pmo",
      "is_signer": true,
      "is_writable": true
    },
    {
      "pubkey": "6RYMY3mFLixELbfNCMA7zNtzgNfRyEZs5YYkZQb8aK4t",
      "is_signer": false,
      "is_writable": true
    }
  ],
  "data": [2, 0, 0, 0, 128, 150, 152, 0, 0, 0, 0, 0]
}
```

---

## 📬 Transaction Structure

Solana transactions include:

- **Signatures**: authorizations
- **Message**: transaction body with instructions

```rust
pub struct Transaction {
    pub signatures: Vec<Signature>,
    pub message: Message,
}
```

### Message Breakdown:

```rust
pub struct Message {
    pub header: MessageHeader,
    pub account_keys: Vec<Pubkey>,
    pub recent_blockhash: Hash,
    pub instructions: Vec<CompiledInstruction>,
}
```

### Header:

```rust
pub struct MessageHeader {
    pub num_required_signatures: u8,
    pub num_readonly_signed_accounts: u8,
    pub num_readonly_unsigned_accounts: u8,
}
```

### Instruction Format:

```rust
pub struct CompiledInstruction {
    pub program_id_index: u8,
    pub accounts: Vec<u8>,
    pub data: Vec<u8>,
}
```

---

## 🧪 Rust Example: Full Transaction

```rust
use anyhow::Result;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig, native_token::LAMPORTS_PER_SOL,
    signature::Signer, signer::keypair::Keypair, system_instruction, transaction::Transaction,
};

#[tokio::main]
async fn main() -> Result<()> {
    let connection = RpcClient::new_with_commitment(
        "http://localhost:8899".to_string(),
        CommitmentConfig::confirmed(),
    );

    let blockhash = connection.get_latest_blockhash().await?;
    let sender = Keypair::new();
    let recipient = Keypair::new();

    let transfer_instruction = system_instruction::transfer(
        &sender.pubkey(),
        &recipient.pubkey(),
        LAMPORTS_PER_SOL / 100,
    );

    let mut transaction =
        Transaction::new_with_payer(&[transfer_instruction], Some(&sender.pubkey()));
    transaction.sign(&[&sender], blockhash);

    println!("{:#?}", transaction);

    Ok(())
}
```

# Program on Solana

Solana "smart contracts" are called **programs**, and they are deployed to **on-chain executable accounts**. Users interact by sending transactions with **instructions** for the program to execute.

---

## 📌 Key Concepts

- **Programs** = On-chain accounts with compiled executable code (sBPF).
- **Instructions** = Functions inside programs invoked via transactions.
- **Stateless** = Programs do not store state themselves but can manage external accounts.
- **Upgrade Authority** = Can update the program; removing it makes the program immutable.
- **Verifiable Builds** = Ensure deployed binaries match public source code.

---

## 🛠 Writing Solana Programs

| Approach        | Description                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| **Anchor**      | Rust-based framework using macros; simplifies development; beginner-friendly. |
| **Native Rust** | Full control without frameworks; more complex and flexible.                   |

---

## 🔁 Updating Programs

- Programs can be **upgraded** by an account with **upgrade authority**.
- Once upgrade authority is set to `None`, the program becomes **immutable**.

---

## ✅ Verifiable Builds

| Tool / Feature           | Description                                         |
| ------------------------ | --------------------------------------------------- |
| **Solana Explorer**      | Check if a program is verified via its address.     |
| **Verifiable Build CLI** | From Ellipsis Labs, enables source-binary matching. |
| **Anchor Support**       | Built-in verifiable build support.                  |

---

## ⚙️ Program Deployment Format

- Programs are compiled to **ELF** files containing **Solana BPF (sBPF)** bytecode.
- Stored on-chain in executable accounts owned by **loader programs**.

---

## 📦 Loader Programs

| Loader   | Program ID                                    | Notes                  |
| -------- | --------------------------------------------- | ---------------------- |
| `native` | `NativeLoader1111111111111111111111111111111` | Owns all other loaders |
| `v1`     | `BPFLoader1111111111111111111111111111111111` | Execution-only         |
| `v2`     | `BPFLoader2111111111111111111111111111111111` | Execution-only         |
| `v3`     | `BPFLoaderUpgradeab1e11111111111111111111111` | Deprecated             |
| `v4`     | `LoaderV411111111111111111111111111111111111` | Expected standard      |

**Loader Functions:**

- Deploy/Upgrade/Finalize programs
- Transfer or close program buffers
- Authority-based permission control

---

## 🔐 Precompiled Programs

### Ed25519

| Name            | Program ID                                    | Description                 |
| --------------- | --------------------------------------------- | --------------------------- |
| Ed25519 Program | `Ed25519SigVerify111111111111111111111111111` | Verifies Ed25519 signatures |

**Offsets Struct:**

```rust
struct Ed25519SignatureOffsets {
    signature_offset: u16,
    signature_instruction_index: u16,
    public_key_offset: u16,
    public_key_instruction_index: u16,
    message_data_offset: u16,
    message_data_size: u16,
    message_instruction_index: u16,
}
```

---

### Secp256k1

| Name              | Program ID                                    | Description                                    |
| ----------------- | --------------------------------------------- | ---------------------------------------------- |
| Secp256k1 Program | `KeccakSecp256k11111111111111111111111111111` | Verifies Ethereum-style signatures (ecrecover) |

**Offsets Struct:**

```rust
struct Secp256k1SignatureOffsets {
    secp_signature_offset: u16,
    secp_signature_instruction_index: u8,
    secp_pubkey_offset: u16,
    secp_pubkey_instruction_index: u8,
    secp_message_data_offset: u16,
    secp_message_data_size: u16,
    secp_message_instruction_index: u8,
}
```

---

### Secp256r1

| Name              | Program ID                                    | Description                       |
| ----------------- | --------------------------------------------- | --------------------------------- |
| Secp256r1 Program | `Secp256r1SigVerify1111111111111111111111111` | Verifies up to 8 P-256 signatures |

**Offsets Struct:**

```rust
struct Secp256r1SignatureOffsets {
    signature_offset: u16,
    signature_instruction_index: u16,
    public_key_offset: u16,
    public_key_instruction_index: u16,
    message_data_offset: u16,
    message_data_size: u16,
    message_instruction_index: u16,
}
```

---

## 🧩 Core Programs

| Program                          | Program ID                                    | Purpose                                         |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| **System Program**               | `11111111111111111111111111111111`            | Account creation, lamport transfer, fee payment |
| **Vote Program**                 | `Vote111111111111111111111111111111111111111` | Validator vote management                       |
| **Stake Program**                | `Stake11111111111111111111111111111111111111` | Stake and delegation                            |
| **Config Program**               | `Config1111111111111111111111111111111111111` | Store configuration data with gated access      |
| **Compute Budget Program**       | `ComputeBudget111111111111111111111111111111` | Set compute limits and fee prioritization       |
| **Address Lookup Table Program** | `AddressLookupTab1e1111111111111111111111111` | Reference more accounts in transactions         |
| **ZK ElGamal Proof Program**     | `ZkE1Gama1Proof11111111111111111111111111111` | Zero-knowledge proof for encrypted data         |

# Program Derived Address(PDA)

Here’s a summarized version of the content with original headings preserved:

---

## Program Derived Address

**Program Derived Addresses (PDAs)** serve two primary purposes on Solana:

1. **Deterministic Account Addresses**: Created using seeds and a program ID.
2. **Program Signing**: Solana allows programs to "sign" for PDAs.

PDAs are similar to hashmap keys—derived from predictable inputs—and remove the need to store full addresses.

---

## Program Derived Address

Merely deriving a PDA doesn't create an on-chain account. Accounts at PDA addresses must be explicitly created by a program. Think of it like identifying a location on a map without building anything there.

---

## Key Points

- PDAs are deterministically derived using seeds, a bump seed, and a program ID.
- They lie **off the Ed25519 curve**, so no private key exists.
- Solana programs can sign on behalf of their own PDAs.
- Accounts must be created through instructions; derivation alone is not sufficient.

---

## What's a PDA

PDAs appear like public keys but lack private keys due to being off-curve. Solana programs can still "sign" on behalf of them. This makes them useful for identifying on-chain program state without security risks tied to private key exposure.

---

## On Curve Address

Standard keypairs lie **on the Ed25519 curve** and support cryptographic operations like signing.

---

## Off Curve Address

PDAs are deliberately made to be **off-curve**, so they can't be signed with in traditional ways. This makes them secure program-controlled identifiers.

---

## How to Derive a PDA

To derive a PDA, you need:

- **Seeds**: Optional values like strings or addresses.
- **Bump Seed**: Ensures the result is off-curve; starts from 255 and decrements.
- **Program ID**: The owning program’s address.

### Supported SDK Functions

| SDK                 | Function                   |
| ------------------- | -------------------------- |
| `@solana/kit`       | `getProgramDerivedAddress` |
| `@solana/web3.js`   | `findProgramAddressSync`   |
| `solana_sdk` (Rust) | `find_program_address`     |

You pass the seeds and program ID, and receive the PDA and bump seed.

---

## Examples

- **Single string seed**
- **Single address seed**
- **Multiple seeds**

Each example shows deriving a PDA using `@solana/kit`.

---

## Canonical Bump

The canonical bump is the first bump seed (starting from 255 downward) that produces a valid off-curve PDA. Security best practices dictate using and validating the **canonical bump** to prevent spoofing or unintended behavior.

Example code iterates through bump seeds to demonstrate how different bumps may still yield valid PDAs.

---

## Create PDA Accounts

Using the **Anchor** framework, a PDA can be used as the address of a new account.

### Program

The PDA is derived using a static seed (`"data"`) and the user's public key. The account is created during an `initialize` instruction, and stores the user's address and bump.

Rust:

```rust
#[account(
    init,
    seeds = [b"data", user.key().as_ref()],
    bump,
    payer = user,
    space = 8 + DataAccount::INIT_SPACE
)]
pub pda_account: Account<'info, DataAccount>,
```

### Test

TypeScript derives the PDA, sends the transaction, and later fetches the created account.

- **Initialize Instruction**: Creates the account.
- **Fetch Account**: Reads the state at the PDA address.

Re-invoking the `initialize` instruction with the same seed fails, since the PDA-derived address already has an account.

---

# Cross Program Invocation (CPI)

A **Cross Program Invocation** (CPI) is when one Solana program calls into another program’s instruction.

- Think of program instructions like public API endpoints.
- A CPI is like one API calling another internally.
- Enables **composability**: programs can work together.

---

## Key Concepts

- **Instruction Stack Depth**: Limited to 5 total (i.e., 4 nested CPIs).
- **Signer privileges**: Extend to invoked programs.
- **PDAs (Program Derived Addresses)**: Programs can sign on behalf of their own derived PDAs.
- **Callee can invoke more CPIs**: up to the stack depth limit.

---

## CPI Anatomy

To create a CPI:

- **Program address**: The callee program's ID
- **Accounts**: All read/write accounts, including the program being invoked
- **Instruction data**: Which instruction to run and with what arguments

---

## CPI Privileges

If Program A invokes Program B:

- Program B inherits signer and write privileges of A’s accounts.
- Program B can pass these further down if it invokes Program C.

---

## Basic CPI Functions

### `invoke` (no PDA signer)

```rust
pub fn invoke(instruction: &Instruction, account_infos: &[AccountInfo]) -> ProgramResult {
    invoke_signed(instruction, account_infos, &[])
}
```

---

## CPI in Anchor

### ✅ Example 1 (High-level with `CpiContext`)

```rust
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

#[program]
pub mod cpi {
    use super::*;

    pub fn sol_transfer(ctx: Context<SolTransfer>, amount: u64) -> Result<()> {
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sender.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
            },
        );
        transfer(cpi_context, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SolTransfer<'info> {
    #[account(mut)]
    sender: Signer<'info>,
    #[account(mut)]
    recipient: SystemAccount<'info>,
    system_program: Program<'info, System>,
}
```

---

### Native Rust CPI (no PDA)

```rust
use borsh::BorshDeserialize;
use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, program::invoke,
    program_error::ProgramError, pubkey::Pubkey, system_instruction,
};

entrypoint!(process_instruction);

#[derive(BorshDeserialize)]
enum ProgramInstruction {
    SolTransfer { amount: u64 },
}

impl ProgramInstruction {
    fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        Self::try_from_slice(input).map_err(|_| ProgramError::InvalidInstructionData)
    }
}

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = ProgramInstruction::unpack(instruction_data)?;

    match instruction {
        ProgramInstruction::SolTransfer { amount } => {
            let [sender_info, recipient_info, system_program_info] = accounts else {
                return Err(ProgramError::NotEnoughAccountKeys);
            };

            if !sender_info.is_signer {
                return Err(ProgramError::MissingRequiredSignature);
            }

            let transfer_ix =
                system_instruction::transfer(sender_info.key, recipient_info.key, amount);

            invoke(
                &transfer_ix,
                &[
                    sender_info.clone(),
                    recipient_info.clone(),
                    system_program_info.clone(),
                ],
            )?;

            Ok(())
        }
    }
}
```

---

## CPI with PDA Signers

### `invoke_signed`

```rust
pub fn invoke_signed(
    instruction: &Instruction,
    account_infos: &[AccountInfo],
    signers_seeds: &[&[&[u8]]],
) -> ProgramResult {
    invoke_signed_unchecked(instruction, account_infos, signers_seeds)
}
```

---

## Anchor CPI with PDA Signer

```rust
use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

#[program]
pub mod cpi {
    use super::*;

    pub fn sol_transfer(ctx: Context<SolTransfer>, amount: u64) -> Result<()> {
        let bump_seed = ctx.bumps.pda_account;
        let signer_seeds: &[&[&[u8]]] = &[&[b"pda", ctx.accounts.recipient.key.as_ref(), &[bump_seed]]];

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pda_account.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
            },
        ).with_signer(signer_seeds);

        transfer(cpi_context, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SolTransfer<'info> {
    #[account(
        mut,
        seeds = [b"pda", recipient.key().as_ref()],
        bump,
    )]
    pda_account: SystemAccount<'info>,
    #[account(mut)]
    recipient: SystemAccount<'info>,
    system_program: Program<'info, System>,
}
```

---

## Native Rust CPI with PDA Signer

```rust
use borsh::BorshDeserialize;
use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
};

entrypoint!(process_instruction);

#[derive(BorshDeserialize)]
enum ProgramInstruction {
    SolTransfer { amount: u64 },
}

impl ProgramInstruction {
    fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        Self::try_from_slice(input).map_err(|_| ProgramError::InvalidInstructionData)
    }
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = ProgramInstruction::unpack(instruction_data)?;

    match instruction {
        ProgramInstruction::SolTransfer { amount } => {
            let [pda_account_info, recipient_info, system_program_info] = accounts else {
                return Err(ProgramError::NotEnoughAccountKeys);
            };

            let recipient_pubkey = recipient_info.key;
            let seeds = &[b"pda", recipient_pubkey.as_ref()];
            let (expected_pda, bump_seed) = Pubkey::find_program_address(seeds, program_id);

            if expected_pda != *pda_account_info.key {
                return Err(ProgramError::InvalidArgument);
            }

            let transfer_ix = system_instruction::transfer(
                pda_account_info.key,
                recipient_info.key,
                amount,
            );

            let signer_seeds: &[&[&[u8]]] =
                &[&[b"pda", recipient_pubkey.as_ref(), &[bump_seed]]];

            invoke_signed(
                &transfer_ix,
                &[
                    pda_account_info.clone(),
                    recipient_info.clone(),
                    system_program_info.clone(),
                ],
                signer_seeds,
            )?;

            Ok(())
        }
    }
}
```

---

# Tokens on Solana

Tokens are digital assets that represent ownership over diverse categories of assets.
Tokenization enables the digitalization of property rights. Tokens on Solana are referred to as SPL (Solana Program Library) Tokens.

- Token Programs contain all instruction logic for interacting with tokens on the network (both fungible and non-fungible).

- A Mint Account represents a specific token and stores global metadata about the token such as the total supply and mint authority (address authorized to create new units of a token).

- A Token Account tracks individual ownership of tokens for a specific mint account for a specific owner.

- An Associated Token Account is a Token Account created with an address derived from the owner and mint account addresses.

## Token Program

2 type of token program:

- Token Program(Original) : contains all instruction logic for interacting with tokens on the network
- Token Extension Program

## Associated Token Account

Think of the Associated Token Account as the "default" token account for a specific mint and owner.
They simplify the process of finding a token account's address for a specific mint and owner.

Derieved from owner's address and the mint account's address.

Introduces Program Derieved Address(PDA)
A PDA derives an address deterministically using predefined inputs, making it easy to find the address of an account.

## Token CLI Examples

spl-token CLI helps you experiment with SPL tokens

to install locally:

```sh
cargo install spl-token-cli
```

get devnet SOL from the public web faucet.

```sh
solana airdrop 2
```

see all available commands:

```sh
spl-token --help
```

## Create a New Token

create a new token:

```sh
spl-token create-token
```

Check the current supply:

```sh
spl-token supply <TOKEN_ADDRESS>
```

## Create Token Account

To hold tokens of a specific mint, create a token account:

```sh
spl-token create-account <TOKEN_ADDRESS>
```

create-account command creates an associated token account with your wallet address as the owner.

To create a token account with a different owner:

```sh
spl-token create-account --owner <OWNER_ADDRESS> <TOKEN_ADDRESS>
```

1. The System Program creates a new account with space for the Token Account data and transfers ownership to the Token Program.

2. The Token Program initializes the data as a Token Account

## Mint Token

To create new units of a token, mint tokens to a Token Account:

```sh
spl-token mint [OPTIONS] <TOKEN_ADDRESS> <TOKEN_AMOUNT> [--] [RECIPIENT_TOKEN_ACCOUNT_ADDRESS]
```

To mint tokens to a different token account:

```sh
spl-token mint 99zqUzQGohamfYxyo8ykTEbi91iom3CLmwCA75FK5zTg 100 -- Hmyk3FSw4cfsuAes7sanp2oxSkE9ivaH6pMzDzbacqmt
```

MintTo instruction on the Token Program creates new tokens.

## Transfer Tokens

To transfer tokens between token accounts:

```sh
spl-token transfer [OPTIONS] <TOKEN_ADDRESS> <TOKEN_AMOUNT> <RECIPIENT_ADDRESS or RECIPIENT_TOKEN_ACCOUNT_ADDRESS>
```

`Transfer` instruction on the Token Program handles token transfers.owner of the sender's Token Account must sign the transaction.

## Create Token Metadata

Token Extensions Program lets you store metadata (name, symbol, image link) directly on the Mint Account.
create a token with metadata extension:

```sh
spl-token create-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --enable-metadata
```

initialize the metadata:

```sh
spl-token initialize-metadata <TOKEN_MINT_ADDRESS> <YOUR_TOKEN_NAME> <YOUR_TOKEN_SYMBOL> <YOUR_TOKEN_URI>
```

---

# SPL Token Basics

basics for interacting with SPL Tokens, focusing on the most commonly used instructions.

common instructions you'll see when interacting with SPL Tokens include:

- Create a Token Mint
- Create a Token Account
- Mint Tokens
- Transfer Tokens

# Create a Token Mint

## What's a Mint Account?

A mint account is an account type in Solana's Token Programs that uniquely represents a token on the network and stores global metadata about the token.

```rs
/// Mint data.
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Mint {
  /// Optional authority used to mint new tokens. The mint authority may only
  /// be provided during mint creation. If no mint authority is present
  /// then the mint has a fixed supply and no further tokens may be
  /// minted.
  pub mint_authority: COption<Pubkey>,
  /// Total supply of tokens.
  pub supply: u64,
  /// Number of base 10 digits to the right of the decimal place.
  pub decimals: u8,
  /// Is `true` if this structure has been initialized
  pub is_initialized: bool,
  /// Optional authority to freeze token accounts.
  pub freeze_authority: COption<Pubkey>,
}
```

Every token on Solana exists as a mint account where the address of the mint account is its unique identifier on the network.

## Creating a mint Account

invoke the `InitializeMint` instruction.
transaction to create a mint account needs two instructions:

1. Invoke the System Program to create and allocate space for a mint account and transfer ownership to the Token Program.
2. Invoke the Token Program to initialize the mint account data.

check the mint.rs and mint.ts file

# Create a Token Account

A token account is an account type in Solana's Token Programs that stores information about an individual's ownership of a specific token (mint).
Each token account is associated with a single mint and tracks details like the token balance and owner.

```rs
/// Account data.
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Account {
    /// The mint associated with this account
    pub mint: Pubkey,
    /// The owner of this account.
    pub owner: Pubkey,
    /// The amount of tokens this account holds.
    pub amount: u64,
    /// If `delegate` is `Some` then `delegated_amount` represents
    /// the amount authorized by the delegate
    pub delegate: COption<Pubkey>,
    /// The account's state
    pub state: AccountState,
    /// If `is_native.is_some`, this is a native token, and the value logs the
    /// rent-exempt reserve. An Account is required to be rent-exempt, so
    /// the value is used by the Processor to ensure that wrapped SOL
    /// accounts do not drop below this threshold.
    pub is_native: COption<u64>,
    /// The amount delegated
    pub delegated_amount: u64,
    /// Optional authority to close the account.
    pub close_authority: COption<Pubkey>,
}
```

it keeps track of:

1. A specific mint (the token type the token account holds units of)
2. An owner (the authority who can transfer tokens from the account)

## What's an Associated Token Account?

It is a token account with an address that's a Program Derived Address (PDA) created by the Associated Token Program.
Think of it as the default token account for a user to hold units of a specific token (mint).

ex:

```rs
pub fn get_associated_token_address_and_bump_seed_internal(
    wallet_address: &Pubkey,
    token_mint_address: &Pubkey,
    program_id: &Pubkey,
    token_program_id: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            &wallet_address.to_bytes(), // Owner's public key
            &token_program_id.to_bytes(), // Token Program or Token Extension Program
            &token_mint_address.to_bytes(), // Token mint address
        ],
        program_id, // Associated Token Program ID
    )
}
```

## How to Create a Token Account

invoke the `InitializeAccount` instruction.
The transaction to create a token account needs two instructions:

1. Invoke the System Program to create and allocate space for a token account and transfer ownership to the Token Program.
2. Invoke the Token Program to initialize the token account data.

`token-acc.rs`,`token-acc.ts`

## How to Create an Associated Token Account

invoke the Create instruction.

`ata.ts`,`ata.rs`

# Mint Tokens

Minting tokens refers to the process of creating new units of a token by
invoking the MintTo instruction on a token program.

`mint-token.ts`,`mint-token.rs`

# Transfer Tokens

- Transferring tokens involves moving tokens from one token account to another token account that share the same mint.
- happens when you invoke the TransferChecked instruction on a token program.
  `token-trans.ts`,`token-trans.rs`

# Extensions

Toekn Extensions provides more features through extra instructions referred to
as extensions. They are optional features you can add to a token mint or token account.

The Token Extensions Program defines an `ExtensionType` enum that lists all available extensions you can add to a token mint or token account.

ExtensionType enum is defined as:

```rs
/// Extensions that can be applied to mints or accounts.  Mint extensions must
/// only be applied to mint accounts, and account extensions must only be
/// applied to token holding accounts.
#[repr(u16)]
#[cfg_attr(feature = "serde-traits", derive(Serialize, Deserialize))]
#[cfg_attr(feature = "serde-traits", serde(rename_all = "camelCase"))]
#[derive(Clone, Copy, Debug, PartialEq, TryFromPrimitive, IntoPrimitive)]
pub enum ExtensionType {
    /// Used as padding if the account size would otherwise be 355, same as a
    /// multisig
    Uninitialized,
    /// Includes transfer fee rate info and accompanying authorities to withdraw
    /// and set the fee
    TransferFeeConfig,
    /// Includes withheld transfer fees
    TransferFeeAmount,
    /// Includes an optional mint close authority
    MintCloseAuthority,
    /// Auditor configuration for confidential transfers
    ConfidentialTransferMint,
    /// State for confidential transfers
    ConfidentialTransferAccount,
    /// Specifies the default Account::state for new Accounts
    DefaultAccountState,
    /// Indicates that the Account owner authority cannot be changed
    ImmutableOwner,
    /// Require inbound transfers to have memo
    MemoTransfer,
    /// Indicates that the tokens from this mint can't be transferred
    NonTransferable,
    /// Tokens accrue interest over time,
    InterestBearingConfig,
    /// Locks privileged token operations from happening via CPI
    CpiGuard,
    /// Includes an optional permanent delegate
    PermanentDelegate,
    /// Indicates that the tokens in this account belong to a non-transferable
    /// mint
    NonTransferableAccount,
    /// Mint requires a CPI to a program implementing the "transfer hook"
    /// interface
    TransferHook,
    /// Indicates that the tokens in this account belong to a mint with a
    /// transfer hook
    TransferHookAccount,
    /// Includes encrypted withheld fees and the encryption public that they are
    /// encrypted under
    ConfidentialTransferFeeConfig,
    /// Includes confidential withheld transfer fees
    ConfidentialTransferFeeAmount,
    /// Mint contains a pointer to another account (or the same account) that
    /// holds metadata
    MetadataPointer,
    /// Mint contains token-metadata
    TokenMetadata,
    /// Mint contains a pointer to another account (or the same account) that
    /// holds group configurations
    GroupPointer,
    /// Mint contains token group configurations
    TokenGroup,
    /// Mint contains a pointer to another account (or the same account) that
    /// holds group member configurations
    GroupMemberPointer,
    /// Mint contains token group member configurations
    TokenGroupMember,
    /// Mint allowing the minting and burning of confidential tokens
    ConfidentialMintBurn,
    /// Tokens whose UI amount is scaled by a given amount
    ScaledUiAmount,
    /// Tokens where minting / burning / transferring can be paused
    Pausable,
    /// Indicates that the account belongs to a pausable mint
    PausableAccount,

    /// Test variable-length mint extension
    #[cfg(test)]
    VariableLenMintTest = u16::MAX - 2,
    /// Padding extension used to make an account exactly Multisig::LEN, used
    /// for testing
    #[cfg(test)]
    AccountPaddingTest,
    /// Padding extension used to make a mint exactly Multisig::LEN, used for
    /// testing
    #[cfg(test)]
    MintPaddingTest,
}
```

adds specialized functionality by including extra state to a mint or token
account. must further deserialize the tlv_data (containing extension state) according to the specific extension types enabled for that account.

```rs
/// Encapsulates immutable base state data (mint or account) with possible
/// extensions, where the base state is Pod for zero-copy serde.
#[derive(Debug, PartialEq)]
pub struct PodStateWithExtensions<'data, S: BaseState + Pod> {
    /// Unpacked base data
    pub base: &'data S,
    /// Slice of data containing all TLV data, deserialized on demand
    tlv_data: &'data [u8],
}
```

---

# Confidential Transfer

They enable to transfer token b/w accounts w/o revealing the token amount. token account addresses remain public.

## Working

extension adds instructions to the Token Extension program that allows you to transfer tokens between accounts without revealing the transfer amount.

    sequenceDiagram

    participant A as Sender Wallet
    participant AA as Sender Token Account
    participant BB as Recipient Token Account
    participant B as Recipient Wallet

    A->>AA: Deposit
    A->>AA: Apply

    AA->>BB: Transfer
    B->>BB: Apply

    B->>BB: Withdraw

basic flow:

1. Create a mint account with the confidential transfer extension.
2. Create token accounts with confidential transfer extension for the sender and recipient.
3. Mint tokens to the sender account.
4. Deposit sender's public balance to confidential pending balance.
5. Apply sender's pending balance to confidential available balance.
6. Confidentially transfer tokens from sender token account to recipient token account.
7. Apply recipient's pending balance to confidential available balance.
8. Withdraw recipient's confidential available balance to public balance.

basic flow:

sequenceDiagram
participant Sender as Sender Wallet
participant SenderAccount as Sender Token Account
participant Mint as Token Mint
participant Token22 as Token Extensions Program
participant ATAProgram as Associated Token Program
participant ElGamal as ZK ElGamal Proof Program
participant RecipientAccount as Recipient Token Account
participant Recipient as Recipient Wallet

    rect rgba(120, 160, 235, 0.3)
    Note over Sender,Mint: 1. Initialize Mint

    activate Sender
    Sender->>Token22: create_mint (with Confidential Transfer Extension)
    activate Token22
    Token22-->>Mint: Initialize mint
    deactivate Token22
    deactivate Sender
    end

    rect rgba(130, 210, 170, 0.3)
    Note over Sender,SenderAccount: 2. Set Up Sender Account

    activate Sender
    Note right of Sender: Generate encryption keys
    Sender->>Sender: Generate ElGamal keypair
    Sender->>Sender: Generate AES key

    Sender->>ATAProgram: create_associated_token_account
    activate ATAProgram
    ATAProgram->>Token22: Create token account at deterministic address
    activate Token22
    Token22-->>SenderAccount: Initialize account
    deactivate Token22
    deactivate ATAProgram

    Sender->>Token22: reallocate & configure_account
    activate Token22
    Token22-->>SenderAccount: Configure for confidential transfers
    deactivate Token22
    deactivate Sender
    end

    rect rgba(130, 210, 170, 0.3)
    Note over Recipient,RecipientAccount: 3. Set Up Recipient Account

    activate Recipient
    Note right of Recipient: Generate encryption keys
    Recipient->>Recipient: Generate ElGamal keypair
    Recipient->>Recipient: Generate AES key

    Recipient->>ATAProgram: create_associated_token_account
    activate ATAProgram
    ATAProgram->>Token22: Create token account at deterministic address
    activate Token22
    Token22-->>RecipientAccount: Initialize account
    deactivate Token22
    deactivate ATAProgram

    Recipient->>Token22: reallocate & configure_account
    activate Token22
    Token22-->>RecipientAccount: Configure for confidential transfers
    deactivate Token22
    deactivate Recipient
    end

    rect rgba(235, 160, 80, 0.3)
    Note over Sender,SenderAccount: 4. Mint & Convert to Confidential Balance

    activate Sender
    Sender->>Token22: mint_tokens
    activate Token22
    Token22-->>SenderAccount: Increase token account public balance
    deactivate Token22

    Sender->>Token22: deposit_tokens
    activate Token22
    Token22-->>SenderAccount: Convert to confidential pending balance
    deactivate Token22

    Sender->>Sender: Use ElGamal keypair & AES key to decrypt
    Sender->>Token22: apply_pending_balance
    activate Token22
    Token22-->>SenderAccount: Convert pending balance to available balance
    deactivate Token22
    deactivate Sender
    end

    rect rgba(235, 120, 120, 0.3)
    Note over Sender,RecipientAccount: 5. Confidential Transfer

    activate Sender
    Note right of Sender: Create proofs
    Sender->>Sender: Generate proof data for transfer

    Sender->>ElGamal: Create equality proof context account
    activate ElGamal
    Sender->>ElGamal: Create ciphertext validity proof context account
    Sender->>ElGamal: Create range proof context account
    ElGamal-->>ElGamal: Verify proofs

    Sender->>Token22: transfer_tokens, providing proof context accounts
    activate Token22
    Token22-->>SenderAccount: Decrease encrypted available balance
    Token22-->>RecipientAccount: Increase encrypted pending balance
    deactivate Token22

    Sender->>ElGamal: Close proof context accounts
    deactivate ElGamal
    deactivate Sender
    end

    rect rgba(180, 150, 235, 0.3)
    Note over Recipient,RecipientAccount: 6. Apply & Withdraw

    activate Recipient
    Recipient->>Recipient: Use ElGamal keypair & AES key to decrypt
    Recipient->>Token22: apply_pending_balance
    activate Token22
    Token22-->>RecipientAccount: Convert pending balance to available balance
    deactivate Token22

    Note right of Recipient: Optional withdrawal
    Recipient->>Recipient: Generate proof data for withdraw

    Recipient->>ElGamal: Create equality proof context account
    activate ElGamal
    Recipient->>ElGamal: Create range proof context account
    ElGamal-->>ElGamal: Verify proofs

    Recipient->>Token22: withdraw_tokens, providing proof context accounts
    activate Token22
    Token22-->>RecipientAccount: Convert from available confidential balance to public balance
    deactivate Token22

    Recipient->>ElGamal: Close proof context accounts
    deactivate ElGamal
    deactivate Recipient
    end

ex:
run the local validator-> `solana-test-validator --clone-upgradeable-program TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb --url https://api.mainnet-beta.solana.com -r`

`toekn-conf.rs`

## Confidential Transfer Instructions

| Instruction                   | Description                                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| InitializeMint                | Sets up mint account for confidential transfers. This instruction must be included in the same transaction as `TokenInstruction::InitializeMint`.  |
| UpdateMint                    | Updates confidential transfer settings for a mint.                                                                                                 |
| ConfigureAccount              | Sets up a token account for confidential transfers.                                                                                                |
| ApproveAccount                | Approves a token account for confidential transfers if the mint requires approval for new token accounts.                                          |
| EmptyAccount                  | Empties the pending and available confidential balances to allow closing a token account.                                                          |
| Deposit                       | Converts public token balance into pending confidential balance.                                                                                   |
| Withdraw                      | Converts available confidential balance back to public balance.                                                                                    |
| Transfer                      | Transfers tokens between token accounts confidentially.                                                                                            |
| ApplyPendingBalance           | Converts pending balance into available balance after deposits or transfers.                                                                       |
| EnableConfidentialCredits     | Allows a token account to receive confidential token transfers.                                                                                    |
| DisableConfidentialCredits    | Blocks incoming confidential transfers while still allowing public transfers.                                                                      |
| EnableNonConfidentialCredits  | Allows a token account to receive public token transfers.                                                                                          |
| DisableNonConfidentialCredits | Blocks regular transfers to make account receive only confidential transfers.                                                                      |
| TransferWithFee               | Transfers tokens between token accounts confidentially with a fee.                                                                                 |
| ConfigureAccountWithRegistry  | Alternative way to configure token accounts for confidential transfers using an `ElGamalRegistry` account instead of `VerifyPubkeyValidity` proof. |

### Create a Token Mint

```sequenceDiagram
    participant Payer as Wallet
    participant Token22 as Token Extensions Program
    participant Mint as Mint Account

    Payer->>Token22: create_mint <br>(with Confidential Transfer Extension)
    activate Token22
    Token22-->>Mint: Initialize mint with extension data
    deactivate Token22
```

adds the `ConfidentialTransferMint` state to the mint account:

```rs
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq, Pod, Zeroable)]
pub struct ConfidentialTransferMint {
    /// Authority to modify the `ConfidentialTransferMint` configuration and to
    /// approve new accounts (if `auto_approve_new_accounts` is true)
    ///
    /// The legacy Token Multisig account is not supported as the authority
    pub authority: OptionalNonZeroPubkey,

    /// Indicate if newly configured accounts must be approved by the
    /// `authority` before they may be used by the user.
    ///
    /// * If `true`, no approval is required and new accounts may be used
    ///   immediately
    /// * If `false`, the authority must approve newly configured accounts (see
    ///   `ConfidentialTransferInstruction::ConfigureAccount`)
    pub auto_approve_new_accounts: PodBool,

    /// Authority to decode any transfer amount in a confidential transfer.
    pub auditor_elgamal_pubkey: OptionalNonZeroElGamalPubkey,
}
```

contains 3 config fields:

- authority: The account that has permission to change confidential transfer settings for the mint and approve new confidential accounts if auto-approval is disabled.

- auto_approve_new_accounts: When set to true, users can create token accounts with confidential transfers enabled by default. When false, the authority must approve each new token account before it can be used for confidential transfers.

- auditor_elgamal_pubkey: An optional auditor that can decrypt transfer amounts in confidential transactions, providing a compliance mechanism while maintaining privacy from the general public.

### Required Instruction

Create the Mint Account: Invoke the System Program's CreateAccount instruction to create the mint account.

Initialize Confidential Transfer Extension: Invoke the Token Extension Program's ConfidentialTransferInstruction::InitializeMint instruction to configure the ConfidentialTransferMint state for the mint.

Initialize Mint: Invoke the Token Extension Program's Instruction::InitializeMint instruction to initialize the standard mint state.

```rs
use anyhow::{Context, Result};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    signature::{Keypair, Signer},
};
use spl_token_client::{
    client::{ProgramRpcClient, ProgramRpcClientSendTransaction},
    spl_token_2022::id as token_2022_program_id,
    token::{ExtensionInitializationParams, Token},
};
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<()> {
    // Create connection to local test validator
    let rpc_client = RpcClient::new_with_commitment(
        String::from("http://localhost:8899"),
        CommitmentConfig::confirmed(),
    );

    // Load the default Solana CLI keypair to use as the fee payer
    // This will be the wallet paying for the transaction fees
    // Use Arc to prevent multiple clones of the keypair
    let payer = Arc::new(load_keypair()?);
    println!("Using payer: {}", payer.pubkey());

    // Generate a new keypair to use as the address of the token mint
    let mint = Keypair::new();
    println!("Mint keypair generated: {}", mint.pubkey());

    // Set up program client for Token client
    let program_client =
        ProgramRpcClient::new(Arc::new(rpc_client), ProgramRpcClientSendTransaction);

    // Number of decimals for the mint
    let decimals = 9;

    // Create a token client for the Token-2022 program
    // This provides high-level methods for token operations
    let token = Token::new(
        Arc::new(program_client),
        &token_2022_program_id(), // Use the Token-2022 program (newer version with extensions)
        &mint.pubkey(),           // Address of the new token mint
        Some(decimals),           // Number of decimal places
        payer.clone(),            // Fee payer for transactions (cloning Arc, not keypair)
    );

    // Create extension initialization parameters
    // The ConfidentialTransferMint extension enables confidential (private) transfers of tokens
    let extension_initialization_params =
        vec![ExtensionInitializationParams::ConfidentialTransferMint {
            authority: Some(payer.pubkey()), // Authority that can modify confidential transfer settings
            auto_approve_new_accounts: true, // Automatically approve new confidential accounts
            auditor_elgamal_pubkey: None,    // Optional auditor ElGamal public key
        }];

    // Create and initialize the mint with the ConfidentialTransferMint extension
    // This sends a transaction to create the new token mint
    let transaction_signature = token
        .create_mint(
            &payer.pubkey(),                 // Mint authority - can mint new tokens
            Some(&payer.pubkey()),           // Freeze authority - can freeze token accounts
            extension_initialization_params, // Add the ConfidentialTransferMint extension
            &[&mint],                        // Mint keypair needed as signer
        )
        .await?;

    // Print results for user verification
    println!("Mint Address: {}", mint.pubkey());
    println!("Transaction Signature: {}", transaction_signature);

    Ok(())
}

// Load the keypair from the default Solana CLI keypair path (~/.config/solana/id.json)
// This enables using the same wallet as the Solana CLI tools
fn load_keypair() -> Result<Keypair> {
    // Get the default keypair path
    let keypair_path = dirs::home_dir()
        .context("Could not find home directory")?
        .join(".config/solana/id.json");

    // Read the keypair file directly into bytes using serde_json
    // The keypair file is a JSON array of bytes
    let file = std::fs::File::open(&keypair_path)?;
    let keypair_bytes: Vec<u8> = serde_json::from_reader(file)?;

    // Create keypair from the loaded bytes
    // This converts the byte array into a keypair
    let keypair = Keypair::from_bytes(&keypair_bytes)?;

    Ok(keypair)
}
```

## Create a Token Account

Confidential Transfer extension enables private token transfers by adding extra state to the token account.

```rs
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq, Pod, Zeroable)]
pub struct ConfidentialTransferAccount {
    /// The account's approval status for confidential transfers.
    /// All confidential transfer operations will fail until this is set to `true`.
    /// If the mint account's `auto_approve_new_accounts` is `true`,
    /// accounts are automatically approved.
    pub approved: PodBool,

    /// The ElGamal public key used to encrypt balances and transfer amounts.
    pub elgamal_pubkey: PodElGamalPubkey,

    /// The encrypted lower 16 bits of the pending balance.
    /// The balance is split into high and low parts for efficient decryption.
    pub pending_balance_lo: EncryptedBalance,

    /// The encrypted higher 48 bits of the pending balance.
    /// The balance is split into high and low parts for efficient decryption.
    pub pending_balance_hi: EncryptedBalance,

    /// The encrypted balance available for transfers.
    pub available_balance: EncryptedBalance,

    /// The available balance encrypted with an AES key,
    /// allowing efficient decryption by the account owner.
    pub decryptable_available_balance: DecryptableBalance,

    /// If `true`, allows incoming confidential transfers.
    pub allow_confidential_credits: PodBool,

    /// If `true`, allows incoming non-confidential transfers.
    pub allow_non_confidential_credits: PodBool,

    /// Counts incoming pending balance credits from `Deposit` and `Transfer` instructions.
    pub pending_balance_credit_counter: PodU64,

    /// The count limit of pending credits before requiring
    /// an `ApplyPendingBalance` instruction to convert them into available balance.
    pub maximum_pending_balance_credit_counter: PodU64,

    /// The `pending_balance_credit_counter` value provided by the client
    /// through the instruction data the last time the `ApplyPendingBalance` instruction was processed.
    pub expected_pending_balance_credit_counter: PodU64,

    /// The actual `pending_balance_credit_counter` value on the token account
    /// at the time the last `ApplyPendingBalance` instruction was processed.
    pub actual_pending_balance_credit_counter: PodU64,
}

```

token account requires three instructions:

1. **`Create the Token Account`**: Invoke the Associated Token Program's `AssociatedTokenAccountInstruction:Create` instruction to create the token account.

2. **`Reallocate Account Space`**: Invoke the Token Extension Program's `TokenInstruction::Reallocate` instruction to add space for the `ConfidentialTransferAccount` state.

3. **`Configure Confidential Transfers`**: Invoke the Token Extension Program's ConfidentialTransferInstruction::ConfigureAccount instruction to initialize the `ConfidentialTransferAccount` state.

code: token_acc.rs

# Deposit Tokens

takes 2 stages:

1. Confidential Pending Balance: Initially, tokens are "deposited" from public balance to a "pending" confidential balance.
2. Confidential Available Balance: The pending balance is then "applied" to the available balance, making the tokens available for confidential transfers.

```sequenceDiagram
    participant Owner as Wallet
    participant Token22 as Token Extensions Program
    participant TokenAccount as Token Account

    Note over TokenAccount: Token account with public balance

    Owner->>Token22: confidential_transfer_deposit()
    activate Token22
    Token22-->>TokenAccount: Convert public balance to <br> confidential pending balance
    deactivate Token22

    Note over TokenAccount: Pending balance must then be <br> applied to available balance before use
```

code: deposit-token.rs

# Apply Pending Balance

Before tokens can be transferred confidentially, the public token balance must
be converted to a confidential balance.

1. Confidential Pending Balance: Initially, tokens are "deposited" from public balance to a "pending" confidential balance.
2. Confidential Available Balance: The pending balance is then "applied" to the available balance, making the tokens available for confidential transfers.

```sequenceDiagram
    participant Owner as Wallet
    participant Token22 as Token Extensions Program
    participant TokenAccount as Token Account

    Note over TokenAccount: Tokens in pending confidential balance<br>after deposit or transfer

 Owner->>Owner: Use encryption keys (ElGamal & AES)<br>for decryption and encryption

    Owner->>Token22: confidential_transfer_apply_pending_balance()
    activate Token22
    Token22-->>TokenAccount: Reset pending balance
    Token22-->>TokenAccount: Add to available balance
    deactivate Token22

    Note over TokenAccount: Tokens now in available confidential balance<br>ready for confidential transfers
```

pending_bal.rs

# Withdraw Token

- Generate an equality proof and range proof client-side
- Invoke the Zk ElGamal proof program to verify the proofs and initialize the "context state" accounts
- Invoke the ConfidentialTransferInstruction::Withdraw instruction providing the two proof accounts.
- Close the two proof accounts to recover rent.

The spl_token_client crate provides the following methods:

- `confidential_transfer_create_context_state_account` method that creates a proof account.
- `confidential_transfer_withdraw` method that invokes the Withdraw instruction.
- `confidential_transfer_close_context_state_account` method that closes a proof account.

withdraw_token.rs

# Transfer Tokens

token account should be configured with `ConfidentialTransferAccount` state.
steps:

1. 3 client-side proofs:
   Equality Proof (CiphertextCommitmentEqualityProofData): Verifies that the new available balance ciphertext after the transfer matches its corresponding Pedersen commitment, ensuring the source account's new available balance is correctly computed as new_balance = current_balance - transfer_amount.

   Ciphertext Validity Proof (BatchedGroupedCiphertext3HandlesValidityProofData): Verifies that the transfer amount ciphertexts are properly generated for all three parties (source, destination, and auditor), ensuring the transfer amount is correctly encrypted under each party's public key.

   Range Proof (BatchedRangeProofU128Data): Verifies that the new available balance and transfer amount (split into low/high bits) are all non-negative and within a specified range.

2. For each proof:

   - Invoke the ZK ElGamal proof program to verify the proof data.
   - Store the proof-specific metadata in a proof "context state" account to use in other instructions.

3. Invoke the ConfidentialTransferInstruction::Transfer instruction, providing the proof context state accounts.

4. Close the proof context state accounts to recover the SOL used to create them.

## Instructions:

To confidentially transfer tokens:

1. Generate equality, ciphertext validity, and range proofs client-side.
2. Verify proofs via the ZK ElGamal program and create context state accounts.
3. Call `ConfidentialTransferInstruction::Transfer`, passing the proof accounts.
4. Close the proof accounts to reclaim rent.

**Helpful methods in `spl_token_client`:**

- `confidential_transfer_create_context_state_account` – creates proof accounts
- `confidential_transfer_transfer` – performs the transfer
- `confidential_transfer_close_context_state_account` – closes proof accounts

# UI Scaled amount

1. Purpose: The Scaled UI Amount extension lets issuers apply a dynamic multiplier to a token's UI amount — useful for representing real-world assets like stocks or dividends.

2. Use Case: In events like stock splits (e.g., doubling shares), it avoids inefficient mass minting by updating the UI multiplier instead.

3. How It Works: With Token-2022, use the ScaledUiAmount extension and the amount_to_ui_amount instruction to set or fetch the UI-adjusted amount anytime.

## Issue Guide

1. Enable the Scaled UI Amount extension on a token mint{create-token.ts}
   set the scaled_ui_amount_extension field to true in the Mint account

   ```sh
   $ spl-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb create-token --ui-amount-multiplier 1.5
   ```

2. Update the UI amount multiplier

   ```sh
   $ spl-token update-ui-amount-multiplier 66EV4CaihdqyQ1fbsr51wBsoqKLgAG5KiYz7r5XNrxUM 1.5 -- 1746471400
   ```

3. Fetch the Balance{balance.ts}

```sh
$ spl-token balance 66EV4CaihdqyQ1fbsr51wBsoqKLgAG5KiYz7r5XNrxUM
```

---

# Developing on Rust

1. create new rust project

```sh
cargo init hello_world --lib
cd hello_world
cargo add solana-program@1.18.26    #add the dependencies
```

2. update `cargo.toml`

```toml
[package]
name = "hello_world"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]

[dependencies]
solana-program = "1.18.26"
```

3. update `src/lib.rs`

```rs
use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, msg, pubkey::Pubkey,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, world!");
    Ok(())
}
```

4. build the program, view program id

```sh
cargo build-sbf #build
solana address -k ./target/deploy/hello_world-keypair.json  #program id
4Ujf5fXfLx2PAwRqcECCLtgDxHKPznoJpa43jUBxFfMz
```

5. testing the code

```sh
#dependencies
cargo add solana-program-test@1.18.26 --dev
cargo add solana-sdk@1.18.26 --dev
cargo add tokio --dev
```

code in `src/lib.rs`

```rs
#[cfg(test)]
mod test {
    use solana_program_test::*;
    use solana_sdk::{
        instruction::Instruction, pubkey::Pubkey, signature::Signer, transaction::Transaction,
    };

    #[tokio::test]
    async fn test_hello_world() {
        let program_id = Pubkey::new_unique();
        let mut program_test = ProgramTest::default();
        program_test.add_program("hello_world", program_id, None);
        let (mut banks_client, payer, recent_blockhash) = program_test.start().await;
        // Create instruction
        let instruction = Instruction {
            program_id,
            accounts: vec![],
            data: vec![],
        };
        // Create transaction with instruction
        let mut transaction = Transaction::new_with_payer(&[instruction], Some(&payer.pubkey()));

        // Sign transaction
        transaction.sign(&[&payer], recent_blockhash);

        let transaction_result = banks_client.process_transaction(transaction).await;
        assert!(transaction_result.is_ok());
    }
}
```

testing via: `cargo test-sbf`

6. Deploy

```sh
#configure the cli
solana config set -ul
```

open new terminal:

```sh
solana-test-validator #to start validator
```

open new terminal:

```sh
solana program deploy ./target/deploy/hello_world.so    #deploy the program
```

7. Update
   updated by redeploying to the same program ID

8. Close the program

```sh
solana program close 4Ujf5fXfLx2PAwRqcECCLtgDxHKPznoJpa43jUBxFfMz
--bypass-warning
```

## Program Structure

entrypoint.rs: Defines the entrypoint that routes incoming instructions.
state.rs: Define program-specific state (account data).
instructions.rs: Defines the instructions that the program can execute.
processor.rs: Defines the instruction handlers (functions) that implement the business logic for each instruction.
error.rs: Defines custom errors that the program can return.

---

# Solana Development Kits

## Rust

following crates are used:

- `solana-program` — Imported by programs running on Solana, compiled to SBF. This crate contains many fundamental data types and is re-exported from solana-sdk, which cannot be imported from a Solana program.

- `solana-sdk` — The basic offchain SDK, it re-exports solana-program and adds more APIs on top of that. Most Solana programs that do not run on-chain will import this.

- `solana-client` — For interacting with a Solana node via the JSON RPC API.

- `solana-cli-config` — Loading and saving the Solana CLI configuration file.

- `solana-clap-utils` — Routines for setting up a CLI, using clap, as used by the main Solana CLI. Includes functions for loading all types of signers supported by the CLI.

```sh
cargo add solana-sdk solana-client  # transaction, interaction
cargo add solana-program            #building program
```

## TypeScript

following packages are used:

- `@solana/web3.js`
- `@solana/wallet-adapter`

```sh
yarn add @solana/web3.js@1      #installation with yarn
npm install --save @solana/web3.js@1    #installation with npm
```

usage:

```JS
//javascript
const solanaWeb3 = require("@solana/web3.js");
console.log(solanaWeb3);
```

```js
//ES6
import * as solanaWeb3 from "@solana/web3.js";
console.log(solanaWeb3);
```

```js
//BrowserBundle
// solanaWeb3 is provided in the global namespace by the bundle script
console.log(solanaWeb3);
```
