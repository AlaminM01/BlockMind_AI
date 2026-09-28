import json
import random
from typing import List, Dict, Any, Optional

# Curated, verified multi-choice questions covering all 5 core blockchain domains
BLOCKCHAIN_QUIZ_BANK: List[Dict[str, Any]] = [
    {
        "id": "q1",
        "topic": "Bitcoin & Proof of Work",
        "book": "Bitcoin: A Peer-to-Peer Electronic Cash System",
        "chapter": "Proof-of-Work & Timestamp Server",
        "question": "What mathematical problem does Bitcoin's Proof-of-Work mechanism require miners to solve?",
        "options": [
            "Factor large prime numbers into RSA keys",
            "Find a nonce such that SHA-256(SHA-256(block_header)) starts with a target number of zero bits",
            "Calculate the shortest path in a Byzantine network graph",
            "Generate an ECDSA signature with zero elliptic curve curve coefficients"
        ],
        "correct_index": 1,
        "explanation": "Bitcoin Proof-of-Work involves scanning for a nonce value that, when double-hashed with SHA-256, produces a hash value lower than the current network target difficulty (starting with a specific number of zero bits).",
        "difficulty": "Intermediate"
    },
    {
        "id": "q2",
        "topic": "Bitcoin & Proof of Work",
        "book": "Bitcoin: A Peer-to-Peer Electronic Cash System",
        "chapter": "Network & Incentives",
        "question": "According to Satoshi Nakamoto, how does the longest chain rule resolve network forks?",
        "options": [
            "The node with the highest CPU clock speed dictates the valid chain",
            "The chain with the greatest accumulated Proof-of-Work effort is considered the authentic state of history",
            "A central timestamp server votes on conflicting blocks every 10 minutes",
            "Nodes select the chain with the fewest number of transactions to save disk space"
        ],
        "correct_index": 1,
        "explanation": "The longest chain not only has the most blocks, but represents the greatest cumulative proof-of-work effort invested by the majority of network hash power.",
        "difficulty": "Beginner"
    },
    {
        "id": "q3",
        "topic": "Ethereum & Smart Contracts",
        "book": "Mastering Ethereum & Smart Contract Security",
        "chapter": "EVM Architecture & Gas Mechanics",
        "question": "What is the primary technical purpose of Gas in the Ethereum Virtual Machine (EVM)?",
        "options": [
            "To subsidize miner electricity bills directly in fiat currency",
            "To prevent infinite loops (Halting Problem) and meter the consumption of computational resources",
            "To encrypt transaction payloads before broadcasting to P2P peers",
            "To limit the total supply of Ether to 21 million tokens"
        ],
        "correct_index": 1,
        "explanation": "Gas solves the Turing completeness halting problem by attaching a finite computational budget to every opcode. If an execution runs out of gas, execution terminates and state changes are reverted.",
        "difficulty": "Beginner"
    },
    {
        "id": "q4",
        "topic": "Ethereum & Smart Contracts",
        "book": "Mastering Ethereum & Smart Contract Security",
        "chapter": "Smart Contract Vulnerabilities",
        "question": "Which design pattern is specifically used to prevent Reentrancy attacks in Solidity smart contracts?",
        "options": [
            "State-Memory Swap Pattern",
            "Checks-Effects-Interactions Pattern (or ReentrancyGuard mutex lock)",
            "Proof-of-Stake Validator Delegation Pattern",
            "Merkle Root Leaf Inversion Pattern"
        ],
        "correct_index": 1,
        "explanation": "The Checks-Effects-Interactions pattern ensures that all internal state changes (like updating balances) are executed before calling any untrusted external contract address.",
        "difficulty": "Advanced"
    },
    {
        "id": "q5",
        "topic": "Consensus Mechanisms",
        "book": "Consensus Mechanisms: PoW, PoS, and Byzantine Fault Tolerance",
        "chapter": "Byzantine Fault Tolerance",
        "question": "In standard Practical Byzantine Fault Tolerance (PBFT), what is the maximum fraction of malicious/faulty nodes a network can tolerate?",
        "options": [
            "Up to 50% (f < n/2)",
            "Less than 33.3% (f < n/3, requiring 3f + 1 total nodes)",
            "Up to 66.6% (f < 2n/3)",
            "100% of non-leader nodes"
        ],
        "correct_index": 1,
        "explanation": "In classic Byzantine Fault Tolerance systems with n nodes, the system guarantees safety and liveness as long as fewer than one-third (f < n/3) of the nodes are Byzantine or offline.",
        "difficulty": "Intermediate"
    },
    {
        "id": "q6",
        "topic": "Consensus Mechanisms",
        "book": "Consensus Mechanisms: PoW, PoS, and Byzantine Fault Tolerance",
        "chapter": "Proof-of-Stake & Slashing",
        "question": "What is the penalty mechanism in Proof of Stake called when a validator attempts a double-signing attack?",
        "options": [
            "Halving",
            "Slashing (confiscation/destruction of a portion of staked capital)",
            "Gas Repricing",
            "Difficulty Bomb"
        ],
        "correct_index": 1,
        "explanation": "Slashing imposes a severe economic penalty on validators who act maliciously (such as proposing two conflicting blocks at the same slot height or double-voting on Casper checkpoints).",
        "difficulty": "Beginner"
    },
    {
        "id": "q7",
        "topic": "DeFi Architecture",
        "book": "DeFi Architecture, AMMs, and Protocol Engineering",
        "chapter": "Automated Market Makers (AMM)",
        "question": "What invariant formula does Uniswap v2 use to price token swaps in liquidity pools?",
        "options": [
            "x + y = k (Constant Sum)",
            "x * y = k (Constant Product)",
            "x^3 * y^3 = k (Constant Cubic)",
            "log(x) + log(y) = k (Logarithmic Ratio)"
        ],
        "correct_index": 1,
        "explanation": "The Constant Product Formula (x * y = k) maintains that the product of token balances in the pool remains constant before and after a trade (ignoring swap fees).",
        "difficulty": "Intermediate"
    },
    {
        "id": "q8",
        "topic": "DeFi Architecture",
        "book": "DeFi Architecture, AMMs, and Protocol Engineering",
        "chapter": "Flash Loans & Atomic Execution",
        "question": "What unique property enables Flash Loans to be executed with zero collateral in DeFi?",
        "options": [
            "Borrowers submit government ID verification on-chain",
            "The loan borrow, arbitrage/liquidation logic, and full repayment occur within a single atomic transaction",
            "Loans are backed by zero-knowledge off-chain insurance policies",
            "Miners personally guarantee the debt using their hash power"
        ],
        "correct_index": 1,
        "explanation": "Flash loans leverage the atomicity of EVM transactions. If the borrowed funds plus fee are not returned to the pool by the end of the transaction call, the entire state execution reverts as if the loan never occurred.",
        "difficulty": "Intermediate"
    },
    {
        "id": "q9",
        "topic": "Layer 2 & ZK Rollups",
        "book": "Layer 2 Scaling Solutions and Zero-Knowledge Rollups",
        "chapter": "Optimistic vs ZK Rollups",
        "question": "What is the main fundamental difference in transaction finality verification between Optimistic Rollups and ZK-Rollups?",
        "options": [
            "Optimistic rollups require no gas, while ZK-Rollups require 100x more gas on L1",
            "Optimistic rollups assume validity and rely on a 7-day Fraud Proof challenge window, whereas ZK-Rollups provide instant validity proofs (SNARK/STARK) verified on L1",
            "ZK-Rollups store all state in Bitcoin OP_RETURN scripts",
            "Optimistic rollups only support ERC-20 transfers with no smart contracts"
        ],
        "correct_index": 1,
        "explanation": "Optimistic rollups assume transactions are valid unless proven otherwise via fraud proofs during a challenge period (typically 7 days), while ZK-rollups mathematically prove state correctness using succinct cryptographic proofs on L1 immediately.",
        "difficulty": "Advanced"
    },
    {
        "id": "q10",
        "topic": "Layer 2 & ZK Rollups",
        "book": "Layer 2 Scaling Solutions and Zero-Knowledge Rollups",
        "chapter": "Zero-Knowledge Cryptography",
        "question": "What do the acronyms SNARK and STARK stand for in Zero-Knowledge Rollup scaling?",
        "options": [
            "Secure Network Address Resolution Key & Standard Total Asynchronous Relay Knot",
            "Succinct Non-Interactive Argument of Knowledge & Scalable Transparent Argument of Knowledge",
            "Synchronous Node Authentication Ring Kernel & Stateful Tree Algorithm Routing Key",
            "Solidity Numerical Array Reduction Kit & Scaled Transaction Accumulator Record Keeper"
        ],
        "correct_index": 1,
        "explanation": "zk-SNARK stands for Zero-Knowledge Succinct Non-Interactive Argument of Knowledge, and zk-STARK stands for Zero-Knowledge Scalable Transparent Argument of Knowledge (which does not require a trusted setup).",
        "difficulty": "Advanced"
    }
]


class QuizService:
    """Service to generate and evaluate blockchain study quizzes from indexed books."""
    
    @staticmethod
    def get_topics() -> List[str]:
        return list(set(q["topic"] for q in BLOCKCHAIN_QUIZ_BANK))

    @staticmethod
    def get_quiz(topic: Optional[str] = None, count: int = 5) -> List[Dict[str, Any]]:
        bank = BLOCKCHAIN_QUIZ_BANK
        if topic and topic != "all":
            bank = [q for q in bank if q["topic"].lower() == topic.lower()]
            if not bank:
                bank = BLOCKCHAIN_QUIZ_BANK

        selected = random.sample(bank, min(count, len(bank)))
        # Return sanitized questions (without exposing correct index to client directly)
        client_questions = []
        for q in selected:
            client_questions.append({
                "id": q["id"],
                "topic": q["topic"],
                "book": q["book"],
                "chapter": q["chapter"],
                "question": q["question"],
                "options": q["options"],
                "difficulty": q["difficulty"]
            })
        return client_questions

    @staticmethod
    def evaluate_quiz(submissions: List[Dict[str, Any]]) -> Dict[str, Any]:
        lookup = {q["id"]: q for q in BLOCKCHAIN_QUIZ_BANK}
        score = 0
        total = len(submissions)
        results = []

        for sub in submissions:
            q_id = sub.get("question_id")
            chosen_idx = sub.get("selected_option")
            original = lookup.get(q_id)

            if not original:
                continue

            is_correct = chosen_idx == original["correct_index"]
            if is_correct:
                score += 1

            results.append({
                "question_id": q_id,
                "question": original["question"],
                "selected_option": chosen_idx,
                "correct_option": original["correct_index"],
                "is_correct": is_correct,
                "explanation": original["explanation"],
                "book_reference": original["book"],
                "chapter_reference": original["chapter"]
            })

        percentage = round((score / max(1, total)) * 100, 1)
        
        grade = "Novice"
        if percentage >= 90:
            grade = "Blockchain Architect (Mastery)"
        elif percentage >= 70:
            grade = "Smart Contract Engineer (Proficient)"
        elif percentage >= 50:
            grade = "Crypto Researcher (Intermediate)"

        return {
            "score": score,
            "total": total,
            "percentage": percentage,
            "grade": grade,
            "results": results
        }
