use solana_sdk::signer::{keypair::Keypair, Signer};

#[tokio::main]
async fn main() {
    let keypair = Keypair::new();
    println!("Public Key: {}", keypair.pubkey());
    println!("Secret Key: {:?}", keypair.to_bytes());
}
