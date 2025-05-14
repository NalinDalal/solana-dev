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
  getInitializeAccount2Instruction,
  getInitializeMintInstruction,
  getMintSize,
  getTokenSize,
  TOKEN_2022_PROGRAM_ADDRESS,
} from "@solana-program/token-2022";

// Create Connection, local validator in this example
const rpc = createSolanaRpc("http://127.0.0.1:8899");
const rpcSubscriptions = createSolanaRpcSubscriptions("ws://localhost:8900");

// Get latest blockhash to include in transaction
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

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
  createTransactionMessage({ version: 0 }), // Create transaction message
  (tx) => setTransactionMessageFeePayerSigner(feePayer, tx), // Set fee payer
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx), // Set transaction blockhash
  (tx) => appendTransactionMessageInstructions(instructions, tx), // Append instructions
);

// Sign transaction message with required signers (fee payer and mint keypair)
const signedTransaction =
  await signTransactionMessageWithSigners(transactionMessage);

// Send and confirm transaction
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
  signedTransaction,
  { commitment: "confirmed" },
);

// Get transaction signature
const transactionSignature = getSignatureFromTransaction(signedTransaction);

console.log("Mint Address: ", mint.address);
console.log("Transaction Signature: ", transactionSignature);

// Generate keypair to use as address of token account
const tokenAccount = await generateKeyPairSigner();

// Get token account size (in bytes)
const tokenAccountSpace = BigInt(getTokenSize());

// Get minimum balance for rent exemption
const tokenAccountRent = await rpc
  .getMinimumBalanceForRentExemption(tokenAccountSpace)
  .send();

// Instruction to create new account for token account (token 2022 program)
// Invokes the system program
const createTokenAccountInstruction = getCreateAccountInstruction({
  payer: feePayer,
  newAccount: tokenAccount,
  lamports: tokenAccountRent,
  space: tokenAccountSpace,
  programAddress: TOKEN_2022_PROGRAM_ADDRESS,
});

// Instruction to initialize token account data
// Invokes the token 2022 program
const initializeTokenAccountInstruction = getInitializeAccount2Instruction({
  account: tokenAccount.address,
  mint: mint.address,
  owner: feePayer.address,
});

const instructions2 = [
  createTokenAccountInstruction,
  initializeTokenAccountInstruction,
];

// Create transaction message for token account creation
const tokenAccountMessage = pipe(
  createTransactionMessage({ version: 0 }), // Create transaction message
  (tx) => setTransactionMessageFeePayerSigner(feePayer, tx), // Set fee payer
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx), // Set transaction blockhash
  (tx) => appendTransactionMessageInstructions(instructions2, tx), // Append instructions
);

// Sign transaction message with required signers (fee payer and token account keypair)
const signedTokenAccountTx =
  await signTransactionMessageWithSigners(tokenAccountMessage);

// Send and confirm transaction
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
  signedTokenAccountTx,
  { commitment: "confirmed" },
);

// Get transaction signature
const tokenAccountTxSignature =
  getSignatureFromTransaction(signedTokenAccountTx);

console.log("Token Account Address:", tokenAccount.address);
console.log("Transaction Signature:", tokenAccountTxSignature);
