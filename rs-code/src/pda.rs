use solana_sdk::pubkey; // macro
use solana_sdk::pubkey::Pubkey;

#[tokio::main]
async fn main() {
    let program_address = pubkey!("11111111111111111111111111111111");
    let seeds = [b"helloWorld".as_ref()];
    let (pda, bump) = Pubkey::find_program_address(&seeds, &program_address);
    println!("PDA: {}", pda);
    println!("Bump: {}", bump);
}
