/**
 * Updates the scaled UI multiplier for an existing SPL-Token 2022 mint.
 *
 * @param connection – An initialized Solana Connection.
 * @param payer      – Signer paying for fees and rent.
 * @param mint       – PublicKey of the mint to update.
 * @param multiplier – New multiplier value to set.
 * @returns The transaction signature.
 */
export async function updateScaledUiMultiplier(
  connection: Connection,
  payer: Signer,
  mint: PublicKey,
  multiplier: number,
  effectiveTimestamp: bigint,
): Promise<string> {
  const transaction = new Transaction().add(
    createUpdateMultiplierDataInstruction(
      mint,
      payer.publicKey,
      multiplier,
      effectiveTimestamp,
      [],
      TOKEN_2022_PROGRAM_ID,
    ),
  );

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer],
    undefined,
  );

  console.log(
    `✅ Updated scaled-UI multiplier to ${multiplier} for mint:`,
    mint.toBase58(),
  );
  return signature;
}
const multiplier = 1.5;
const effectiveTimestamp = BigInt(Date.now());
const updateSignature = await updateScaledUiMultiplier(
  connection,
  payer,
  mintPubkey,
  multiplier,
  effectiveTimestamp,
);
console.log("Update signature:", updateSignature);
