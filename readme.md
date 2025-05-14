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

