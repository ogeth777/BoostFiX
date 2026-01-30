import { PublicKey } from '@solana/web3.js';

export const CONFIG = {
    // Treasury Wallet for receiving deposits
    // Replace with your Platform Wallet Address
    TREASURY_WALLET: new PublicKey("GijMWAMeiRpyFqiGbYVdtAJHheVH4wc64aqCck2yw22j"),
    
    // Tokens
    USDT_MINT: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"), // Mainnet USDT
    
    // App Settings
    MIN_DEPOSIT: 0.5, // USDT
    MIN_WITHDRAWAL: 0.5, // USDT
    PLATFORM_FEE_PERCENT: 0.10, // 10% fee on campaigns (example)
};