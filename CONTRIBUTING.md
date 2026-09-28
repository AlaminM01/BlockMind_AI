# Contributing to BlockMind AI

Thank you for your interest in contributing to **BlockMind AI**! We welcome community contributions from developers, researchers, and blockchain enthusiasts worldwide.

---

## 💻 Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/AlaminM01/BlockMind_AI.git
   cd BlockMind_AI
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   python -m venv venv
   # Activate venv:
   # Windows: venv\Scripts\activate
   # macOS/Linux: source venv/bin/activate
   pip install -r requirements.txt
   python app.py
   ```

3. **Setup Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 📌 Code Style & Guidelines

- **Python (Backend):** Follow PEP 8 guidelines. Use type annotations (`typing`, Pydantic models).
- **React (Frontend):** Use functional components, Tailwind CSS utility classes, and custom hooks.
- **Git Commits:** Follow Conventional Commits format:
  - `feat: Add new feature`
  - `fix: Resolve bug in RAG chunker`
  - `docs: Update installation guide`
  - `refactor: Clean up vectorstore logic`

---

## 🚀 Submitting Pull Requests

1. Create a dedicated branch (`git checkout -b feat/your-feature-name`).
2. Make modular, well-tested commits.
3. Push your branch to your fork (`git push origin feat/your-feature-name`).
4. Submit a Pull Request targeting the `main` branch.
