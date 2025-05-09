import { Keypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Generate a new keypair
const keypair = Keypair.generate();
console.log(`Public Key: ${keypair.publicKey}`);

// Create a connection to the Solana cluster
const connection = new Connection("http://localhost:8899", "confirmed");

// Funding an address with SOL automatically creates an account
const signature = await connection.requestAirdrop(
  keypair.publicKey,
  LAMPORTS_PER_SOL,
);
await connection.confirmTransaction(signature, "confirmed");

const accountInfo = await connection.getAccountInfo(keypair.publicKey);
console.log(JSON.stringify(accountInfo, null, 2));
