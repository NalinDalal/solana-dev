import { Connection, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";

const connection = new Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed",
);

const accountInfo = await connection.getAccountInfo(SYSVAR_CLOCK_PUBKEY);
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
