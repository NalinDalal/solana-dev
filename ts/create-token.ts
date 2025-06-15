import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeScaledUiAmountConfigInstruction,
  ExtensionType,
  getMintLen
} from "@solana/spl-token";

/**
 * Creates a new SPL-Token 2022 mint with the Scaled UI extension enabled
 * and a UI multiplier of 1.1.
 *
 * @param connection – An initialized Solana Connection.
 * @param payer      – Signer paying for fees and rent.
 * @returns The newly created mint PublicKey.
 */
export async function createScaledUiMint(
  connection: Connection,
  payer: Signer
): Promise<PublicKey> {
  // 1) Generate a new mint Keypair
  const mint = Keypair.generate();
  const MINT_EXTENSIONS = [ExtensionType.ScaledUiAmountConfig];
  const mintLen = getMintLen(MINT_EXTENSIONS);
  const mintLamports =
    await connection.getMinimumBalanceForRentExemption(mintLen);
  const mintTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: mintLen,
      lamports: mintLamports,
      programId: TOKEN_2022_PROGRAM_ID
    }),
    createInitializeScaledUiAmountConfigInstruction(
      mint.publicKey,
      payer.publicKey,
      1.1,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint.publicKey,
      0,
      payer.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );
  await sendAndConfirmTransaction(
    connection,
    mintTransaction,
    [payer, mint],
    undefined
  );

  console.log(
    "✅ Created mint w/ scaled-UI extension:",
    mint.publicKey.toBase58()
  );
  return mint.publicKey;
}
(async () => {
  // 1) Establish a connection to the Solana devnet
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  // 2) Generate a new fee-payer Keypair
  const payer = Keypair.generate();

  // 3) Airdrop 1 SOL to the fee-payer so it has funds for transactions
  const airdropSignature = await connection.requestAirdrop(
    payer.publicKey,
    1_000_000_000 // 1 SOL in lamports
  );

  // 4) Create the scaled-UI mint using our helper
  const mintPubkey = await createScaledUiMint(connection[48;52;178;1768;2848t, payer);
})().catch((err) => {
  console.error("Error running example:", err);
});
