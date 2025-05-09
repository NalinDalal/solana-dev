import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMint2Instruction,
  getMinimumBalanceForRentExemptMint
} from "@solana/spl-token";

//1. creating a connection and funding the wallet
const connection = new Connection("http://localhost:8899", "confirmed");

const wallet = new Keypair();
// Fund the wallet with SOL
const signature = await connection.requestAirdrop(
  wallet.publicKey,
  LAMPORTS_PER_SOL
);
await connection.confirmTransaction(signature, "confirmed");

// 2. Generate keypair to use as address of mint account
const mint = new Keypair();

//3. Calculate lamports required for rent exemption
const rentExemptionLamports =
  await getMinimumBalan[48;52;178;1768;2848tceForRentExemptMint(connection);

//4. Instruction to create new account with space for new mint account
const createAccountInstruction = SystemProgram.createAccount({
  fromPubkey: wallet.publicKey,
  newAccountPubkey: mint.publicKey,
  space: MINT_SIZE,
  lamports: rentExemptionLamports,
  programId: TOKEN_2022_PROGRAM_ID
});

//5. Instruction to initialize mint account
const initializeMintInstruction = createInitializeMint2Instruction(
  mint.publicKey,
  2, // decimals
  wallet.publicKey, // mint authority
  wallet.publicKey, // freeze authority
  TOKEN_2022_PROGRAM_ID
);

//6. Build transaction with instructions to create new account and initialize mint account
const transaction = new Transaction().add(
  createAccountInstruction,
  initializeMintInstruction
);

//7. Send and confirm the transaction with both required signers
const transactionSignature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [
    wallet, // payer
    mint // mint address keypair
  ]
);

//8. Print Mint Account and Transaction Signature
console.log("Mint Account:", `${mint.publicKey}`);
console.log("Transaction Signature:", `${transactionSignature}`);
