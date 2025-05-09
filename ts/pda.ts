import { PublicKey } from "@solana/web3.js";

const programAddress = new PublicKey("11111111111111111111111111111111");

const seeds = [Buffer.from("helloWorld")];
const [pda, bump] = await PublicKey.findProgramAddressSync(
  seeds,
  programAddress,
);

console.log(`PDA: ${pda}`);
console.log(`Bump: ${bump}`);
