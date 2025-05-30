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
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  getCreateAssociatedTokenInstructionAsync,
  getInitializeMintInstruction,
  getMintSize,
  TOKEN_2022_PROGRAM_ADDRESS,
  findAssociatedTokenPda,
} from "@solana-program/token-2022";

// Create Connection, local validator in this example
const rpc = createSolanaRpc("http://127.0.0.1:8899");
const rpcSubscriptions = createSolanaRpcSubscriptions("ws://localhost:8900");

// Generate keypairs for fee payer
const feePayer = await generateKeyPairSigner();

// Fund fee payer
await airdropFactory({ rpc, rpcSubscriptions })({
  recipientAddress: feePayer.address,
  lamports: lamports(1_000_000_000n),
  commitment: "confirmed",
});

// Generate keypair to use as address of mint
const mint = await generateKeyPairSigner();

// Get default mint account size (in bytes), no extensions enabled
const space = BigInt(getMintSize());

// Get minimum balance for rent exemption
const rent = await rpc.getMinimumBalanceForRentExemption(space).send();

// Get latest blockhash to include in transaction
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

// Instruction to create new account for mint (token 2022 program)
// Invokes the system program
const createAccountInstruction = getCreateAccountInstruction({
  payer: feePayer,
  newAccount: mint,
  lamports: rent,
  space,
  programAddress: TOKEN_2022_PROGRAM_ADDRESS,
});

// Instruction to initialize mint account data
// Invokes the token 2022 program
const initializeMintInstruction = getInitializeMintInstruction({
  mint: mint.address,
  decimals: 2,
  mintAuthority: feePayer.address,
});

const instructions = [createAccountInstruction, initializeMintInstruction];

// Create transaction message
const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(instructions, tx),
);

// Sign transaction message with all required signers
const signedTransaction =
  await signTransactionMessageWithSigners(transactionMessage);

// Send and confirm transaction
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
  signedTransaction,
  { commitment: "confirmed" },
);

// Get transaction signature
const transactionSignature = getSignatureFromTransaction(signedTransaction);

console.log("Mint Address: ", mint.address.toString());
console.log("Transaction Signature: ", transactionSignature);

// Use findAssociatedTokenPda to derive the ATA address
const [associatedTokenAddress] = await findAssociatedTokenPda({
  mint: mint.address,
  owner: feePayer.address,
  tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
});

console.log(
  "Associated Token Account Address: ",
  associatedTokenAddress.toString(),
);

// Get a fresh blockhash for the second transaction
const { value: latestBlockhash2 } = await rpc.getLatestBlockhash().send();

// Create instruction to create the associated token account
const createAtaInstruction = await getCreateAssociatedTokenInstructionAsync({
  payer: feePayer,
  mint: mint.address,
  owner: feePayer.address,
});

// Create transaction message
const transactionMessage2 = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash2, tx),
  (tx) => appendTransactionMessageInstructions([createAtaInstruction], tx),
);

// Sign transaction message with all required signers
const signedTransaction2 =
  await signTransactionMessageWithSigners(transactionMessage2);

// Send and confirm transaction
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
  signedTransaction2,
  { commitment: "confirmed" },
);

// Get transaction signature
const transactionSignature2 = getSignatureFromTransaction(signedTransaction2);
console.log("Transaction Signature: ", transactionSignature2);
