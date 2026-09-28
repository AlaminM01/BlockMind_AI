from typing import List, Dict, Any

class BlockchainGraphService:
    """Provides structured nodes and edges for the Interactive Blockchain Knowledge Map."""
    
    @staticmethod
    def get_knowledge_graph() -> Dict[str, Any]:
        nodes = [
            # Layer 1 & Bitcoin Core
            {"id": "btc", "label": "Bitcoin Network", "category": "L1", "book": "Bitcoin: A Peer-to-Peer Electronic Cash System", "color": "#F7931A", "size": 32, "desc": "Decentralized digital currency powered by SHA-256 and Nakamoto consensus."},
            {"id": "pow", "label": "Proof of Work (PoW)", "category": "Consensus", "book": "Bitcoin: A Peer-to-Peer Electronic Cash System", "color": "#00E5FF", "size": 26, "desc": "Miners solve computational puzzles to order transactions without a central authority."},
            {"id": "utxo", "label": "UTXO Model", "category": "Architecture", "book": "Bitcoin: A Peer-to-Peer Electronic Cash System", "color": "#7B61FF", "size": 22, "desc": "Unspent Transaction Output accounting model for verification and privacy."},
            {"id": "merkle", "label": "Merkle Trees", "category": "Cryptography", "book": "Bitcoin: A Peer-to-Peer Electronic Cash System", "color": "#00FFB2", "size": 24, "desc": "Binary hash trees allowing efficient and secure verification of transactions in blocks."},

            # Ethereum & Smart Contracts
            {"id": "eth", "label": "Ethereum Protocol", "category": "L1", "book": "Mastering Ethereum & Smart Contract Security", "color": "#627EEA", "size": 32, "desc": "Turing-complete programmable blockchain with global state and EVM execution."},
            {"id": "evm", "label": "Ethereum Virtual Machine (EVM)", "category": "Architecture", "book": "Mastering Ethereum & Smart Contract Security", "color": "#7B61FF", "size": 28, "desc": "Decentralized state machine executing bytecode opcodes across thousands of validator nodes."},
            {"id": "smart_contracts", "label": "Solidity Smart Contracts", "category": "Applications", "book": "Mastering Ethereum & Smart Contract Security", "color": "#00E5FF", "size": 26, "desc": "Self-executing code with immutable business logic on-chain."},
            {"id": "gas", "label": "Gas & EIP-1559", "category": "Economics", "book": "Mastering Ethereum & Smart Contract Security", "color": "#FF007A", "size": 22, "desc": "Computational metering preventing infinite loops and burning base fees dynamically."},

            # Consensus Protocols
            {"id": "pos", "label": "Proof of Stake (PoS)", "category": "Consensus", "book": "Consensus Mechanisms: PoW, PoS, and Byzantine Fault Tolerance", "color": "#00FFB2", "size": 28, "desc": "Validators stake capital to propose and attest to blocks with 99.9% energy savings."},
            {"id": "bft", "label": "Byzantine Fault Tolerance", "category": "Consensus", "book": "Consensus Mechanisms: PoW, PoS, and Byzantine Fault Tolerance", "color": "#00E5FF", "size": 24, "desc": "Consensus resilience tolerating up to 1/3 arbitrary or malicious actors in the network."},
            {"id": "slashing", "label": "Slashing Mechanism", "category": "Security", "book": "Consensus Mechanisms: PoW, PoS, and Byzantine Fault Tolerance", "color": "#EF4444", "size": 20, "desc": "Economic penalty destroying staked collateral for malicious double-signing."},

            # DeFi Protocols
            {"id": "defi", "label": "DeFi Ecosystem", "category": "DeFi", "book": "DeFi Architecture, AMMs, and Protocol Engineering", "color": "#FF007A", "size": 30, "desc": "Permissionless decentralized financial infrastructure for lending, swapping, and derivatives."},
            {"id": "amm", "label": "Automated Market Makers (AMM)", "category": "DeFi", "book": "DeFi Architecture, AMMs, and Protocol Engineering", "color": "#00E5FF", "size": 26, "desc": "Algorithmic liquidity pools utilizing the Constant Product formula x * y = k."},
            {"id": "flash_loans", "label": "Flash Loans", "category": "DeFi", "book": "DeFi Architecture, AMMs, and Protocol Engineering", "color": "#7B61FF", "size": 22, "desc": "Uncollateralized lending executed atomically within a single block transaction."},
            {"id": "oracles", "label": "Decentralized Oracles", "category": "Infrastructure", "book": "DeFi Architecture, AMMs, and Protocol Engineering", "color": "#F59E0B", "size": 22, "desc": "Cryptographic price feeds bringing real-world external market data into smart contracts."},

            # Layer 2 Scaling & ZK
            {"id": "l2", "label": "Layer 2 Scaling", "category": "Scaling", "book": "Layer 2 Scaling Solutions and Zero-Knowledge Rollups", "color": "#00FFB2", "size": 30, "desc": "Off-chain execution environments settling proofs and transaction batches on Layer 1."},
            {"id": "optimistic", "label": "Optimistic Rollups", "category": "Scaling", "book": "Layer 2 Scaling Solutions and Zero-Knowledge Rollups", "color": "#F59E0B", "size": 24, "desc": "Rollups assuming transaction validity with 7-day interactive Fraud Proof challenge windows."},
            {"id": "zk_rollups", "label": "ZK-Rollups", "category": "Scaling", "book": "Layer 2 Scaling Solutions and Zero-Knowledge Rollups", "color": "#00E5FF", "size": 26, "desc": "Rollups posting mathematical validity proofs (SNARKs/STARKs) verified instantly on L1."},
            {"id": "snark", "label": "zk-SNARKs & STARKs", "category": "Cryptography", "book": "Layer 2 Scaling Solutions and Zero-Knowledge Rollups", "color": "#7B61FF", "size": 24, "desc": "Succinct Zero-Knowledge cryptographic arguments proving computational correctness without revealing secret inputs."}
        ]

        edges = [
            {"source": "btc", "target": "pow", "label": "Consensus"},
            {"source": "btc", "target": "utxo", "label": "Ledger State"},
            {"source": "btc", "target": "merkle", "label": "Block Hashing"},
            {"source": "eth", "target": "evm", "label": "Virtual Machine"},
            {"source": "evm", "target": "smart_contracts", "label": "Executes"},
            {"source": "evm", "target": "gas", "label": "Resource Metering"},
            {"source": "eth", "target": "pos", "label": "Consensus Upgrade"},
            {"source": "pos", "target": "bft", "label": "Safety Model"},
            {"source": "pos", "target": "slashing", "label": "Penalty Rule"},
            {"source": "smart_contracts", "target": "defi", "label": "Enables"},
            {"source": "defi", "target": "amm", "label": "Liquidity Mechanism"},
            {"source": "defi", "target": "flash_loans", "label": "Atomic Arbitrage"},
            {"source": "defi", "target": "oracles", "label": "Price Feeds"},
            {"source": "eth", "target": "l2", "label": "Scales via"},
            {"source": "l2", "target": "optimistic", "label": "Fraud Proofs"},
            {"source": "l2", "target": "zk_rollups", "label": "Validity Proofs"},
            {"source": "zk_rollups", "target": "snark", "label": "Cryptographic Proof"},
            {"source": "merkle", "target": "zk_rollups", "label": "State Trees"},
            {"source": "pow", "target": "pos", "label": "Evolution"}
        ]

        categories = [
            {"name": "L1", "color": "#F7931A"},
            {"name": "Consensus", "color": "#00E5FF"},
            {"name": "Architecture", "color": "#7B61FF"},
            {"name": "Cryptography", "color": "#00FFB2"},
            {"name": "DeFi", "color": "#FF007A"},
            {"name": "Scaling", "color": "#F59E0B"},
            {"name": "Security", "color": "#EF4444"}
        ]

        return {"nodes": nodes, "edges": edges, "categories": categories}
