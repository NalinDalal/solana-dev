import {
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  Connection,
} from "@solana/web3.js";

const connection = new Connection("http://localhost:8899", "confirmed");

const sender = new Keypair();
const receiver = new Keypair();

const signature = await connection.requestAirdrop(
  sender.publicKey,
  LAMPORTS_PER_SOL,
);
await connection.confirmTransaction(signature, "confirmed");

//1. Create the instruction you want to invoke.
const transferInstruction = SystemProgram.transfer({
  fromPubkey: sender.publicKey,
  toPubkey: receiver.publicKey,
  lamports: 0.01 * LAMPORTS_PER_SOL,
});

//2. Add the instruction to a transaction
const transaction = new Transaction().add(transferInstruction);

//3. Sign and Send the Transaction
const transactionSignature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [sender],
);

console.log("Transaction Signature:", `${transactionSignature}`);
