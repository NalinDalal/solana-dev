use anyhow::Result;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    program_pack::Pack,
    signature::{Keypair, Signer},
    system_instruction::create_account,
    transaction::Transaction,
};
use spl_token_2022::{
    id as token_2022_program_id,
    instruction::{initialize_account, initialize_mint},
    state::{Account, Mint},
};

fn main() -> Result<()> {
    // Create connection to local validator
    let client = RpcClient::new_with_commitment(
        String::from("http://127.0.0.1:8899"),
        CommitmentConfig::confirmed(),
    );
    let recent_blockhash = client.get_latest_blockhash()?;

    // Generate a new keypair for the fee payer
    let fee_payer = Keypair::new();

    // Airdrop 1 SOL to fee payer
    let airdrop_signature = client.request_airdrop(&fee_payer.pubkey(), 1_000_000_000)?;
    client.confirm_transaction(&airdrop_signature)?;

    loop {
        let confirmed = client.confirm_transaction(&airdrop_signature)?;
        if confirmed {
            break;
        }
    }

    // Generate keypair to use as address of mint
    let mint = Keypair::new();

    // Get default mint account size (in bytes), no extensions enabled
    let mint_space = Mint::LEN;
    let mint_rent = client.get_minimum_balance_for_rent_exemption(mint_space)?;

    // Instruction to create new account for mint (token 2022 program)
    let create_account_instruction = create_account(
        &fee_payer.pubkey(),      // payer
        &mint.pubkey(),           // new account (mint)
        mint_rent,                // lamports
        mint_space as u64,        // space
        &token_2022_program_id(), // program id
    );

    // Instruction to initialize mint account data
    let initialize_mint_instruction = initialize_mint(
        &token_2022_program_id(),
        &mint.pubkey(),            // mint
        &fee_payer.pubkey(),       // mint authority
        Some(&fee_payer.pubkey()), // freeze authority
        2,                         // decimals
    )?;

    // Create transaction and add instructions
    let transaction = Transaction::new_signed_with_payer(
        &[create_account_instruction, initialize_mint_instruction],
        Some(&fee_payer.pubkey()),
        &[&fee_payer, &mint],
        recent_blockhash,
    );

    // Send and confirm transaction
    let transaction_signature = client.send_and_confirm_transaction(&transaction)?;

    println!("Mint Address: {}", mint.pubkey());
    println!("Transaction Signature: {}", transaction_signature);

    // Generate keypair to use as address of token account
    let token_account = Keypair::new();

    // Get token account size (in bytes)
    let token_account_space = Account::LEN;
    let token_account_rent = client.get_minimum_balance_for_rent_exemption(token_account_space)?;

    // Instruction to create new account for token account (token 2022 program)
    let create_token_account_instruction = create_account(
        &fee_payer.pubkey(),        // payer
        &token_account.pubkey(),    // new account (token account)
        token_account_rent,         // lamports
        token_account_space as u64, // space
        &token_2022_program_id(),   // program id
    );

    // Instruction to initialize token account data
    let initialize_token_account_instruction = initialize_account(
        &token_2022_program_id(),
        &token_account.pubkey(), // account
        &mint.pubkey(),          // mint
        &fee_payer.pubkey(),     // owner
    )?;

    // Create transaction and add instructions
    let transaction = Transaction::new_signed_with_payer(
        &[
            create_token_account_instruction,
            initialize_token_account_instruction,
        ],
        Some(&fee_payer.pubkey()),
        &[&fee_payer, &token_account],
        recent_blockhash,
    );

    // Send and confirm transaction
    let transaction_signature = client.send_and_confirm_transaction(&transaction)?;

    println!("Token Account Address: {}", token_account.pubkey());
    println!("Transaction Signature: {}", transaction_signature);

    Ok(())
}
