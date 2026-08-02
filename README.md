# 🔐 Enterprise RAG - Secure Knowledge Assistant with RBAC

A production-style Enterprise Retrieval-Augmented Generation (RAG) platform that allows authenticated users to query organizational knowledge while ensuring they can only retrieve documents they are authorized to access.

## 🏗️ Architecture

```
React Frontend → JWT Auth → FastAPI Backend → RBAC Layer → Qdrant Vector DB → Ollama LLM → Answer + Citations
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, Alembic |
| Database | PostgreSQL |
| Vector DB | Qdrant |
| Auth | JWT, bcrypt |
| LLM | Ollama (local) |
| Embeddings | Sentence Transformers (BAAI/bge-small-en-v1.5) |
| DevOps | Docker, Docker Compose |

## 📁 Project Structure

```
enterprise-rag/
├── frontend/               # React + TypeScript + Tailwind CSS
├── backend/
│   ├── api/                # API router and dependencies
│   ├── auth/               # JWT authentication & password hashing
│   ├── users/              # User management
│   ├── roles/              # RBAC roles & permissions
│   ├── documents/          # Document upload, parsing, chunking
│   ├── embeddings/         # Embedding generation service
│   ├── retriever/          # Metadata-filtered semantic search
│   ├── llm/                # Ollama LLM integration
│   ├── rag/                # RAG pipeline orchestration
│   ├── audit/              # Audit logging for compliance
│   ├── database/           # PostgreSQL connection & session
│   ├── models/             # SQLAlchemy ORM models
│   └── utils/              # Shared utilities
├── docker/                 # Docker Compose & Dockerfiles
├── docs/                   # Documentation
├── tests/                  # Test suite
└── README.md
```

## 🔑 Roles & Permissions

| Role | Permissions |
|------|-----------|
| Admin | Read, Upload, Delete, Share, Manage Users |
| HR | Read, Upload, Share (HR docs) |
| Finance | Read, Upload, Share (Finance docs) |
| Engineering | Read, Upload, Share (Engineering docs) |
| Sales | Read, Upload, Share (Sales docs) |
| Employee | Read (authorized docs only) |

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd enterprise-rag

# 2. Copy environment files
cp backend/.env.example backend/.env

# 3. Start all services
cd docker && docker-compose up -d

# 4. Install backend dependencies
cd ../backend && pip install -r requirements.txt

# 5. Run database migrations
alembic upgrade head

# 6. Start backend
uvicorn main:app --reload

# 7. Start frontend
cd ../frontend && npm run dev
```

## 📋 Development Roadmap

- [x] Phase 0: Planning & Architecture Design
- [ ] Phase 1: Project Setup & Docker Configuration
- [ ] Phase 2: Authentication & RBAC
- [ ] Phase 3: Document Management
- [ ] Phase 4: RAG Pipeline
- [ ] Phase 5: Admin Features
- [ ] Phase 6: Testing
- [ ] Phase 7: Deployment

## 📄 License

This project is for educational and enterprise demonstration purposes.
