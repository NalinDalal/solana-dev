/**
 * Gets the scaled UI amount balance for a token holder.
 *
 * @param connection – An initialized Solana Connection.
 * @param mint       – PublicKey of the mint to check.
 * @param owner      – PublicKey of the token holder.
 * @returns The scaled UI amount balance.
 */
export async function getScaledUiAmountBalance(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
): Promise<number> {
  // Get the token account for this mint/owner pair
  const tokenAccount = getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID,
  );

  // Get the token account info
  const accountInfo = await connection.getAccountInfo(tokenAccount);
  if (!accountInfo) {
    throw new Error("Token account not found");
  }

  const info = await connection.getTokenAccountBalance(tokenAccount);
  if (info.value.uiAmount == null) throw new Error("No balance found");
  console.log("Balance: ", info.value.uiAmount);
  return info.value.uiAmount;
}
const balance = await getScaledUiAmountBalance(connection, mint, owner);
