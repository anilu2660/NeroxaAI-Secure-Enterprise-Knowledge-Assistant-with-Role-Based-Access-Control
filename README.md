# 🔐 Enterprise RAG - Secure Knowledge Assistant with RBAC

A production-grade Enterprise Retrieval-Augmented Generation (RAG) platform with Role-Based Access Control (RBAC), Hybrid Vector Search, Cross-Encoder Reranking, Parent-Child Retrieval, Multi-Query Decomposition, and Real-Time SSE Token Streaming.

---

## 🏗️ System Architecture

```
                       React Frontend (Client / UI)
                                    │
                            JWT Bearer Token
                                    │
                    FastAPI Master API Gateway
                       [ backend/main.py ]
                                    │
     ┌──────────────┬───────────────┼───────────────┬──────────────┐
     │              │               │               │              │
Authentication  Users & DB      Roles & RBAC     Documents RAG & LLM Pipeline
(backend/auth) (users/models)  (roles/middleware) (documents) (rag/llm/retriever)
     │              │               │               │              │
     ▼              ▼               ▼               ▼              ▼
  PostgreSQL / SQLAlchemy 2.0 ORM    RBAC Filters   Dense (BAAI/bge-small) + Sparse (BM25)
 (User, Role, Document, AuditLog)  (retriever)      Hybrid Vectors (RRF Fusion)
                                    │               │
                                    ▼               ▼
                            Qdrant Vector DB ──> Cross-Encoder Reranker
                          (enterprise_docs)   (ms-marco-MiniLM-L-6-v2)
                                                    │
                                                    ▼
                                            Parent-Child Context
                                            (Full Section Resolution)
                                                    │
                                                    ▼
                                            Ollama Local LLM
                                              (qwen2.5:3b)
                                                    │
                                                    ▼
                                            Answer + Citations
                                          (Cached & SSE Streamed)
```

---

## 🛠️ Advanced Tech Stack & Pipeline Capabilities

| Component | Technology / Implementation | Features & Purpose |
|---|---|---|
| **Frontend** | React, TypeScript, Tailwind CSS | Enterprise query interface & admin portal |
| **API Gateway** | FastAPI, Python 3.11, Pydantic v2 | Async execution, OpenAPI docs, CORS security |
| **Database** | PostgreSQL 16, SQLAlchemy 2.0 ORM | User management, roles, document metadata, audit logs |
| **Vector Database** | Qdrant (Local / Qdrant Cloud) | Dual named vectors (`dense` + `sparse`) with payload RBAC filtering |
| **Dense Embeddings** | SentenceTransformers (`BAAI/bge-small-en-v1.5`) | 384-dimensional dense semantic vectors |
| **Sparse Embeddings** | BM25 Sparse Encoder (`backend/embeddings/sparse.py`) | Term-frequency hash-indexed sparse vectors for exact keyword matching |
| **Rank Fusion** | Reciprocal Rank Fusion (RRF) | Merges dense and sparse vector ranks: $RRF(d) = \sum \frac{1}{60 + r_m(d)}$ |
| **Reranker** | Cross-Encoder (`cross-encoder/ms-marco-MiniLM-L-6-v2`) | Re-scores candidate pool for maximum top-k context precision |
| **Chunking Engine** | Parent-Child Hierarchical Chunker | 150-word child chunks for Qdrant vector search $\rightarrow$ 600-word parent sections for LLM context |
| **Query Engine** | Multi-Query Decomposition | Decomposes complex multi-part questions into targeted sub-queries |
| **LLM Engine** | Ollama (`qwen2.5:3b` / `llama3`) | Context-grounded response generation with source citations |
| **Streaming** | FastAPI `StreamingResponse` (SSE) | Real-time token streaming (`POST /api/v1/rag/stream`) with <0.5s initial latency |
| **Caching** | RBAC-Scoped In-Memory TTL Cache | Hash-keyed cache `SHA256(query + role + dept + filter)` preventing cross-role leaks |
| **Security** | Multi-Layer Anti-Jailbreak Guardrails | NFKC Unicode normalization + 10 Regex patterns + 20 exact injection signatures |

---

## 📁 Project Structure

```
enterprise-rag/
├── frontend/               # React + TypeScript + Tailwind CSS
├── backend/
│   ├── api/                # API router and dependency guards
│   ├── auth/               # JWT authentication & password hashing
│   ├── users/              # User management service & routes
│   ├── roles/              # RBAC matrix & permission middleware
│   ├── documents/          # Document parser, Parent-Child chunker, & saga ingestion
│   ├── embeddings/         # Dense (bge-small) & Sparse (BM25) embedding encoders
│   ├── retriever/          # Qdrant client manager, hybrid search (RRF), & cross-encoder reranker
│   ├── llm/                # Ollama integration, anti-injection guardrails, & streaming
│   ├── rag/                # RAG pipeline orchestration, query decomposition, & SSE routes
│   ├── audit/              # Compliance audit logging
│   ├── database/           # PostgreSQL connection & SQLAlchemy sessions
│   ├── models/             # SQLAlchemy ORM models (User, Role, Document, AuditLog)
│   └── utils/              # Query cache, rate limiter, logger, & exceptions
├── docker/                 # Docker Compose & container configurations
├── docs/                   # Documentation & sample enterprise policies
├── scripts/                # Verification, ingestion, & testing scripts
└── README.md
```

---

## 🔑 Roles & Permissions (RBAC Matrix)

| Role | Department Scope | Access Level & Permissions |
|---|---|---|
| **Admin** | All Departments | Full system access: Read, Upload, Delete, Share, User Management, Audit Logs |
| **HR** | HR + General | Upload, Read, Share HR and General documents |
| **Finance** | Finance + General | Upload, Read, Share Finance and General documents |
| **Engineering** | Engineering + General | Upload, Read, Share Engineering and General documents |
| **Sales** | Sales + General | Upload, Read, Share Sales and General documents |
| **Employee** | General + Explicit Shared | Read-only access to General documents & files shared directly with user ID |

---

## 🚀 Quick Start

### 1. Clone & Environment Setup

```bash
git clone https://github.com/anilu2660/Secure-Enterprise-Knowledge-Assistant-with-Role-Based-Access-Control.git
cd Secure-Enterprise-Knowledge-Assistant-with-Role-Based-Access-Control

# Copy backend environment configuration
cp backend/.env.example backend/.env
```

### 2. Start Backend & Dependencies

```bash
# Start PostgreSQL database and Qdrant vector database via Docker
cd docker && docker-compose up -d

# Install backend Python dependencies
cd ../backend
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Launch Uvicorn dev server
uvicorn main:app --reload
```

### 3. Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

---

## 📋 API Routes Reference

| HTTP Method | Endpoint Path | Description | Authorization |
|:---|:---|:---|:---|
| **POST** | `/api/v1/auth/register` | Register new user | Public |
| **POST** | `/api/v1/auth/login` | Authenticate & get JWT | Public |
| **GET** | `/api/v1/auth/me` | Current user profile | Authenticated |
| **GET** | `/api/v1/users/` | List all users | Admin Only |
| **POST** | `/api/v1/documents/upload` | Ingest PDF/DOCX/TXT file | Upload Permission |
| **POST** | `/api/v1/documents/{id}/share` | Share document with users | Share Permission |
| **DELETE** | `/api/v1/documents/{id}` | Delete document vectors | Delete Permission |
| **POST** | `/api/v1/rag/query` | Standard RAG query | Authenticated |
| **POST** | `/api/v1/rag/stream` | Real-time SSE token stream | Authenticated |
| **GET** | `/api/v1/rag/health` | Pipeline health check | Public |
| **GET** | `/api/v1/admin/audit-logs` | Compliance audit trail | Admin Only |

---

## 📄 License

This project is released for enterprise demonstration and educational purposes.
