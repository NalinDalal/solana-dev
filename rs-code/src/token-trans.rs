use anyhow::Result;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    program_pack::Pack,
    signature::{Keypair, Signer},
    system_instruction::create_account,
    transaction::Transaction,
};
use spl_associated_token_account::{
    get_associated_token_address_with_program_id, instruction::create_associated_token_account,
};
use spl_token_2022::{
    id as token_2022_program_id,
    instruction::{initialize_mint, mint_to, transfer_checked},
    state::Mint,
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

    // Generate a recipient keypair
    let recipient = Keypair::new();

    // Airdrop 1 SOL to fee payer
    let airdrop_signature = client.request_airdrop(&fee_payer.pubkey(), 1_000_000_000)?;
    client.confirm_transaction(&airdrop_signature)?;

    loop {
        let confirmed = client.confirm_transaction(&airdrop_signature)?;
        if confirmed {
            break;
        }
    }

    // Airdrop 0.1 SOL to recipient for rent exemption
    let recipient_airdrop_signature = client.request_airdrop(&recipient.pubkey(), 100_000_000)?;
    client.confirm_transaction(&recipient_airdrop_signature)?;

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

    // Calculate the associated token account address for fee_payer
    let payer_ata = get_associated_token_address_with_program_id(
        &fee_payer.pubkey(),      // owner
        &mint.pubkey(),           // mint
        &token_2022_program_id(), // program_id
    );

    // Instruction to create associated token account for fee_payer
    let create_payer_ata_instruction = create_associated_token_account(
        &fee_payer.pubkey(),      // funding address
        &fee_payer.pubkey(),      // wallet address
        &mint.pubkey(),           // mint address
        &token_2022_program_id(), // program id
    );

    // Calculate the associated token account address for recipient
    let recipient_ata = get_associated_token_address_with_program_id(
        &recipient.pubkey(),      // owner
        &mint.pubkey(),           // mint
        &token_2022_program_id(), // program_id
    );

    // Instruction to create associated token account for recipient
    let create_recipient_ata_instruction = create_associated_token_account(
        &fee_payer.pubkey(),      // funding address
        &recipient.pubkey(),      // wallet address
        &mint.pubkey(),           // mint address
        &token_2022_program_id(), // program id
    );

    // Amount of tokens to mint (1.00 tokens with 2 decimals)
    let amount = 100;

    // Create mint_to instruction to mint tokens to the associated token account
    let mint_to_instruction = mint_to(
        &token_2022_program_id(),
        &mint.pubkey(),         // mint
        &payer_ata,             // destination
        &fee_payer.pubkey(),    // authority
        &[&fee_payer.pubkey()], // signer
        amount,                 // amount
    )?;

    // Create transaction and add instructions
    let transaction = Transaction::new_signed_with_payer(
        &[
            create_account_instruction,
            initialize_mint_instruction,
            create_payer_ata_instruction,
            create_recipient_ata_instruction,
            mint_to_instruction,
        ],
        Some(&fee_payer.pubkey()),
        &[&fee_payer, &mint],
        recent_blockhash,
    );

    // Send and confirm transaction
    let _transaction_signature = client.send_and_confirm_transaction(&transaction)?;

    // Get the latest blockhash for the transfer transaction
    let recent_blockhash = client.get_latest_blockhash()?;

    // Amount of tokens to transfer (0.50 tokens with 2 decimals)
    let transfer_amount = 50;

    // Create transfer instruction
    let transfer_instruction = transfer_checked(
        &token_2022_program_id(), // program id
        &payer_ata,               // source
        &mint.pubkey(),           // mint
        &recipient_ata,           // destination
        &fee_payer.pubkey(),      // authority
        &[&fee_payer.pubkey()],   // signers
        transfer_amount,          // amount
        2,                        // decimals
    )?;

    // Create transaction for transferring tokens
    let transaction = Transaction::new_signed_with_payer(
        &[transfer_instruction],
        Some(&fee_payer.pubkey()),
        &[&fee_payer],
        recent_blockhash,
    );

    // Send and confirm transaction
    let transaction_signature = client.send_and_confirm_transaction(&transaction)?;

    println!("Successfully transferred 0.50 tokens from sender to recipient");
    println!("Transaction Signature: {}", transaction_signature);

    Ok(())
}
