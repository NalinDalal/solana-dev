import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  TOKEN_2022_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";

// Create connection to local validator
const connection = new Connection("http://localhost:8899", "confirmed");
const recentBlockhash = await connection.getLatestBlockhash();

// Generate a new keypair for the fee payer
const feePayer = Keypair.generate();

// Airdrop 1 SOL to fee payer
const airdropSignature = await connection.requestAirdrop(
  feePayer.publicKey,
  LAMPORTS_PER_SOL,
);
await connection.confirmTransaction({
  blockhash: recentBlockhash.blockhash,
  lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
  signature: airdropSignature,
});

// Generate keypair to use as address of mint
const mint = Keypair.generate();

const createAccountInstruction = SystemProgram.createAccount({
  fromPubkey: feePayer.publicKey,
  newAccountPubkey: mint.publicKey,
  space: MINT_SIZE,
  lamports: await getMinimumBalanceForRentExemptMint(connection),
  programId: TOKEN_2022_PROGRAM_ID,
});

const initializeMintInstruction = createInitializeMintInstruction(
  mint.publicKey, // mint pubkey
  9, // decimals
  feePayer.publicKey, // mint authority
  feePayer.publicKey, // freeze authority
  TOKEN_2022_PROGRAM_ID,
);

const transaction = new Transaction().add(
  createAccountInstruction,
  initializeMintInstruction,
);

const transactionSignature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [feePayer, mint], // Signers
);

console.log("Mint Address: ", mint.publicKey.toBase58());
console.log("Transaction Signature: ", transactionSignature);

const accountInfo = await connection.getAccountInfo(mint.publicKey);
console.log(
  JSON.stringify(
    accountInfo,
    (key, value) => {
      if (key === "data" && value && value.length > 1) {
        return [
          value[0],
          "...truncated, total bytes: " + value.length + "...",
          value[value.length - 1],
        ];
      }
      return value;
    },
    2,
  ),
);
