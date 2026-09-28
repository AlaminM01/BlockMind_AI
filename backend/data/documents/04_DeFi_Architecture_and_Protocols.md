# Decentralized Finance (DeFi) Protocols and Primitive Mechanics
**Author:** Decentralized Finance Institute  
**Source:** Handbook of Decentralized Financial Primitives  
**Category:** DeFi, Automated Market Makers, Lending, Oracles

---

## Chapter 1: Foundations of Decentralized Finance (DeFi)
Decentralized Finance (DeFi) replaces traditional financial intermediaries—such as centralized custodian banks, brokerages, and clearing houses—with open, composable, permissionless, and non-custodial smart contracts on public blockchains. 

Key pillars of DeFi include:
1. **Composability (Money Legos):** Smart contracts interact atomically within a single transaction frame. A single transaction can borrow funds from Aave, swap on Uniswap, and deposit collateral into Compound.
2. **Non-Custodial Ownership:** Users retain full sovereignty over their private keys; protocols cannot freeze, censor, or seize user collateral unless explicitly governed by smart contract liquidation parameters.
3. **Transparent Execution:** All logic, balances, liquidity reserves, and interest rate curves are public on-chain and verifiable in real time.

---

## Chapter 2: Automated Market Makers (AMMs) and Uniswap Mechanics
Traditional order-book matching engines (CLOB) require frequent bid/ask placements and cancellations that are cost-prohibitive on Layer 1 blockchains due to gas fees. AMMs replace order books with mathematical invariant formulas and liquidity pools.

### The Constant Product Invariant: $x \cdot y = k$
Pioneered by Uniswap V1/V2:
- $x$: Reserve balance of Token A.
- $y$: Reserve balance of Token B.
- $k$: Constant invariant value.

When a trader swaps $\Delta x$ of Token A into the pool to receive $\Delta y$ of Token B, the product of reserves must remain invariant after taking into account the fee (e.g., 0.3%):
$$(x + \Delta x \cdot (1 - \gamma)) \cdot (y - \Delta y) = k$$

### Impermanent Loss
Liquidity Providers (LPs) deposit pairs of tokens into pools. When external market prices shift, arbitrageurs trade with the pool until the internal ratio matches external market prices. The difference between holding tokens in a wallet versus holding them in an AMM pool is known as **Impermanent Loss (IL)**. Impermanent loss becomes permanent only when the LP withdraws their liquidity at shifted price ratios.

### Concentrated Liquidity (Uniswap V3)
Uniswap V3 introduces granular capital efficiency by allowing LPs to allocate capital within specific bounded price intervals $[p_{min}, p_{max}]$. This concentrates liquidity where trading volume actually occurs, boosting capital efficiency by up to 4000x compared to V2.

---

## Chapter 3: Over-Collateralized Lending and Flash Loans
Decentralized lending protocols (such as Aave, Compound, and MakerDAO) enable permissionless borrowing and lending through algorithmic interest rate pools.

### Over-Collateralization & Loan-to-Value (LTV)
Because pseudonymous users lack credit scores or real-world legal recourse, loans must be strictly over-collateralized:
- **Collateral Factor / Maximum LTV:** The percentage of collateral value that can be borrowed (e.g., 80% LTV means $1,000 worth of ETH collateral allows borrowing up to $800 in USDC).
- **Liquidation Threshold:** If collateral value depreciates such that the Health Factor drops below 1.0 ($H_f < 1.0$), third-party liquidators can repay up to 50% of the borrowed debt in exchange for seized collateral plus a liquidation penalty bonus (e.g., 5-10%).

### Flash Loans (Uncollateralized Atomic Borrowing)
A Flash Loan allows a user to borrow millions of dollars in cryptocurrency with zero upfront collateral, under one strict condition: the loan principal plus a small fee (e.g., 0.09%) must be borrowed, utilized, and fully repaid within the exact same atomic transaction block. If the repayment fails or reverts, the entire transaction rolls back as if it never occurred. Common applications include arbitrage, collateral swapping, and debt refinancing.

---

## Chapter 4: Decentralized Oracles and The Oracle Problem
Smart contracts operate in a deterministic sandbox and cannot natively make HTTP requests or fetch external real-world API data (such as USD/ETH prices, weather metrics, or sports scores) without breaking consensus determinism.

**The Oracle Problem:** How to inject off-chain data into an on-chain smart contract securely and without introducing a single point of failure.

### Decentralized Oracle Networks (DONs) - Chainlink
Chainlink resolves this via a network of independent node operators that fetch data from multiple premium data providers, aggregate the responses off-chain through cryptographic threshold signatures, and write the verified consensus answer into an on-chain Price Feed aggregator contract.

---

## Chapter 5: Stablecoins: Collateralized vs Algorithmic
1. **Fiat-Backed Stablecoins (USDC, USDT):** Centralized issuer holds fiat dollars or government treasuries in off-chain bank vaults and mints 1:1 matching tokens on-chain.
2. **Crypto-Collateralized Stablecoins (DAI / USDS):** Governed by MakerDAO / Sky. Users lock crypto collateral (ETH, WBTC) into Collateralized Debt Positions (CDPs / Vaults) to mint decentralized DAI stablecoins.
3. **Algorithmic Stablecoins:** Attempt to maintain peg through elastic supply adjustments, two-token mint-and-burn mechanics, or fractional collateral. Famous collapse: Terra/Luna (UST) in May 2022 due to a death-spiral bank run.
