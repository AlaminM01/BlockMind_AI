# Mastering Ethereum and Smart Contract Architecture
**Author:** Dr. Gavin Wood & Vitalik Buterin  
**Source:** Ethereum Technical Standards & Architecture Guide  
**Category:** Smart Contracts, Virtual Machines, Cryptography

---

## Chapter 1: The Ethereum Virtual Machine (EVM) Architecture
Ethereum is not merely a decentralized ledger for tracking balances; it is a globally decentralized, Turing-complete state machine. The heart of Ethereum is the Ethereum Virtual Machine (EVM), a stack-based runtime environment for executing byte-code. The EVM has a stack depth of 1024 elements, with each word being 256 bits (32 bytes) in length to natively support Keccak-256 cryptographic hashing and elliptic curve operations.

The EVM architecture comprises three primary data storage areas:
1. **Stack:** A volatile LIFO container where all in-flight computational values and opcodes operate. Most stack operations consume 3 gas.
2. **Memory:** A volatile, byte-addressable linear memory array initialized to zero for each message execution. The cost of memory scales quadratically as more words are allocated to prevent denial-of-service memory exhaustion attacks.
3. **Storage:** A persistent, 256-bit word addressable key-value store associated with each smart contract account. Modifying storage via the `SSTORE` opcode is the most expensive operation in the EVM (costing up to 20,000 gas for uninitialized slots), reflecting the permanent disk footprint imposed upon all full node operators globally.

---

## Chapter 2: Gas Economics, Opcodes, and EIP-1559
To solve the halting problem inherent in Turing-complete systems, Ethereum requires computation to be paid for in units of "Gas". Every computational instruction (opcode) in the EVM has a predefined gas schedule defined in the Yellow Paper.

With the activation of EIP-1559 in the London hard fork, Ethereum introduced a dynamic fee mechanism:
- **Base Fee:** An algorithmically determined minimum fee per gas required for a transaction to be included in a block. The base fee increases by up to 12.5% when block target size (15 million gas) is exceeded, and decreases when blocks are underfilled. The entirety of the Base Fee is burned (destroyed), removing ETH from circulating supply.
- **Priority Fee (Tip):** An optional incentive paid directly to block proposers (validators) to prioritize transaction execution during periods of high congestion.
- **Max Fee:** The absolute upper limit of ETH per gas a user is willing to pay.

---

## Chapter 3: Account Models: EOA vs Smart Contract Accounts
Ethereum uses an Account-Based State Model, contrasting with Bitcoin's UTXO (Unspent Transaction Output) model. There are two distinct types of accounts:
1. **Externally Owned Accounts (EOAs):** Controlled entirely by private cryptographic keys (secp256k1). EOAs have no contract code, have an internal nonce (tracking transaction count), and possess a balance. EOAs are the sole originators of transactions.
2. **Contract Accounts (Smart Contracts):** Governed by executable EVM bytecode. They contain code storage, contract state storage, an ETH balance, and a nonce (tracking the number of contracts created by this address). Contract accounts cannot initiate execution autonomously; they only run in response to transactions or internal calls initiated by EOAs.

---

## Chapter 4: Solidity Programming and Common Token Standards
Solidity is a statically typed, contract-oriented, high-level programming language designed for compiling to EVM bytecode. Key open standard specifications include:

### ERC-20: Fungible Token Standard
The ERC-20 standard establishes standard interfaces for fungible assets:
- `totalSupply()`: Returns the total token supply in existence.
- `balanceOf(address account)`: Returns token balance of a specific address.
- `transfer(address recipient, uint256 amount)`: Transfers tokens directly.
- `approve(address spender, uint256 amount)` and `transferFrom(...)`: Enables delegated spending for decentralized exchanges and lending pools.

### ERC-721: Non-Fungible Token (NFT) Standard
ERC-721 provides a interface for uniquely identifiable non-fungible assets. Each token ID maps to a discrete owner, enabling digital provenance, on-chain gaming assets, and tokenized real-world items via `ownerOf(uint256 tokenId)` and `tokenURI(uint256 tokenId)`.

### ERC-1155: Multi-Token Standard
Combines fungible and non-fungible tokens within a single unified contract, drastically reducing gas fees for batch minting, transfers, and inventory management.

---

## Chapter 5: Smart Contract Security and Attack Vectors
Smart contract security is paramount because deployed contract bytecode is immutable and directly controls high-value financial assets. Common vulnerabilities include:
1. **Reentrancy Attacks:** Illustrated by The DAO hack (2016). Occurs when a contract calls an external untrusted address before updating its internal state balances. The external contract's fallback function re-enters the caller contract repeatedly, draining funds. Remediation: Implement the Checks-Effects-Interactions pattern or OpenZeppelin `ReentrancyGuard` nonReentrant modifiers.
2. **Integer Overflow and Underflow:** Historically mitigated using SafeMath libraries, Solidity 0.8.0+ now includes native panic-reverting arithmetic checks.
3. **Flash Loan Price Oracle Manipulation:** Relying on spot prices from low-liquidity decentralized exchanges. Mitigation requires Time-Weighted Average Price (TWAP) or decentralized oracle networks (e.g. Chainlink).
4. **Front-Running and MEV (Maximal Extractable Value):** Searchers and block builders reordering, inserting (sandwich attacks), or censoring transactions in the mempool to capture arbitrage opportunities.
