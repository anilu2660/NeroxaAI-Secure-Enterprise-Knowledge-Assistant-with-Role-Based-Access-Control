# 🏛️ Enterprise RAG Platform — Complete Architectural & Implementation Walkthrough

## 📋 Executive Summary

The **NeroxaAI Enterprise RAG** platform is a production-grade, hardened knowledge assistant designed for zero-trust enterprise environments. It unites **Role-Based Access Control (RBAC)**, **Hybrid Vector & Lexical Retrieval (Dense BGE + Sparse BM25)**, **Cross-Encoder Reranking**, **Parent-Child Document Chunking**, **Semantic Redis Caching**, **Multi-Agent Orchestration**, and **Social OAuth2 Authentication** into a unified, high-performance architecture.

This document serves as the comprehensive technical walkthrough of all backend subsystems, architectural patterns, data pipelines, security boundaries, and production deployment mechanisms.

---

## 🏗️ End-to-End System Topology

```
                               ┌─────────────────────────────────────────┐
                               │       Client Layer (React 19 SPA)       │
                               │      Vercel Deployment (Vite + TS)      │
                               └────────────────────┬────────────────────┘
                                                    │
                                   HTTPS / JWT Bearer Authorization
                                                    │
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │   FastAPI Gateway (backend/main.py)     │
                               │     Railway Containerized Service       │
                               └────────────────────┬────────────────────┘
                                                    │
           ┌─────────────────────┬──────────────────┴──────────────────┬─────────────────────┐
           ▼                     ▼                                     ▼                     ▼
┌────────────────────┐ ┌────────────────────┐                ┌───────────────────┐ ┌───────────────────┐
│ Auth & Identity    │ │ Database & ORM     │                │ RBAC Guardrails   │ │ Ingestion Saga    │
│ (backend/auth)     │ │ (backend/database) │                │ (backend/roles)   │ │ (backend/documents│
│ - JWT HS256 Token  │ │ - PostgreSQL 16    │                │ - Role Matrix     │ │ - PDF/TXT Parser  │
│ - OAuth2 Providers │ │ - SQLAlchemy 2.0   │                │ - Scoped Filters  │ │ - Parent-Child    │
│ - Passlib / Bcrypt │ │ - Supabase Cloud   │                │ - Middleware      │ │ - Chunk Metadata  │
└────────────────────┘ └────────────────────┘                └───────────────────┘ └─────────┬─────────┘
                                                                                             │
                                                                         ┌───────────────────┘
                                                                         │
                                                                         ▼
                                                     ┌─────────────────────────────────────────┐
                                                     │ Hybrid Encoders (backend/embeddings)    │
                                                     │ - Dense: BAAI/bge-small-en-v1.5 (384d)  │
                                                     │ - Sparse: BM25 Term-Hashed Vectorizer   │
                                                     └───────────────────┬─────────────────────┘
                                                                         │
                                                                         ▼
                                                     ┌─────────────────────────────────────────┐
                                                     │ Vector Database (backend/retriever)     │
                                                     │ - Qdrant Cloud (Cluster w/ API Key)     │
                                                     │ - Dual Named Vectors: "dense" & "sparse"│
                                                     │ - RBAC Payload Payload Keyword Indexing │
                                                     └───────────────────┬─────────────────────┘
                                                                         │
                                                                         ▼
                                                     ┌─────────────────────────────────────────┐
                                                     │ Rank Fusion & Precision Reranking       │
                                                     │ - Reciprocal Rank Fusion (RRF k=60)     │
                                                     │ - Cross-Encoder (ms-marco-MiniLM-L-6-v2)│
                                                     │ - Parent-Child Section Context Resolv   │
                                                     └───────────────────┬─────────────────────┘
                                                                         │
                                                                         ▼
                                                     ┌─────────────────────────────────────────┐
                                                     │ Semantic Cache (backend/cache)          │
                                                     │ - Upstash Redis / Managed Redis         │
                                                     │ - Cosine Similarity Lookup (sim >= 0.90)│
                                                     │ - Scoped by (user, role, dept, version) │
                                                     └───────────────────┬─────────────────────┘
                                                                         │
                                                                         ▼
                                                     ┌─────────────────────────────────────────┐
                                                     │ Query Router & Multi-Agent Orchestrator │
                                                     │ - 2-Stage Hierarchical Classifier       │
                                                     │ - Multi-Step Autonomous Agent Planner   │
                                                     │ - Sandboxed Tool Calling (Calculator)   │
                                                     └───────────────────┬─────────────────────┘
                                                                         │
                                                                         ▼
                                                     ┌─────────────────────────────────────────┐
                                                     │ LLM Generation & Safety (backend/llm)   │
                                                     │ - Ollama Server (qwen2.5 / llama3.2)    │
                                                     │ - Anti-Prompt Injection Guardrails      │
                                                     │ - Context-Grounded Strict Prompting     │
                                                     └─────────────────────────────────────────┘
```

---

## 📦 Deep-Dive Subsystem Walkthrough

### 1. 🔐 Authentication, Identity & OAuth2 (`backend/auth/`)
* **[auth/jwt_handler.py](file:///e:/enterprise-rag/backend/auth/jwt_handler.py):** Encodes, signs, and decodes HMAC-SHA256 JWT tokens containing `sub` (User UUID), `email`, `role`, `department`, and expiration timestamp.
* **[auth/password.py](file:///e:/enterprise-rag/backend/auth/password.py):** Cryptographic password hashing and verification using `passlib` with `bcrypt`.
* **[auth/oauth_service.py](file:///e:/enterprise-rag/backend/auth/oauth_service.py):** Implements OAuth2 authorization code flows for **Google**, **GitHub**, and **Microsoft**:
  - Validates HMAC state parameters against CSRF attacks.
  - Automatically provisions new user accounts with default department scoping (`General`) and standard roles upon successful provider verification.
* **[auth/routes.py](file:///e:/enterprise-rag/backend/auth/routes.py):** Endpoints for `/login`, `/register`, `/register/initiate` (OTP email), `/register/verify-otp`, `/oauth/{provider}/login`, `/oauth/{provider}/callback`, and `/me`.

---

### 2. 🛡️ Role-Based Access Control (RBAC) Engine (`backend/roles/`)
* **[roles/service.py](file:///e:/enterprise-rag/backend/roles/service.py):** Enforces the enterprise RBAC permission matrix:
  ```python
  ROLE_PERMISSIONS = {
      "admin": ["*"],
      "hr": ["documents:read", "documents:upload", "documents:share", "query:execute"],
      "finance": ["documents:read", "documents:upload", "documents:share", "query:execute"],
      "engineering": ["documents:read", "documents:upload", "documents:share", "query:execute"],
      "sales": ["documents:read", "documents:upload", "documents:share", "query:execute"],
      "employee": ["documents:read", "query:execute"],
  }
  ```
* **Department Isolation:** Access scopes restrict queries so employees can only retrieve documents tagged for their specific department or marked as `General`.
* **[roles/middleware.py](file:///e:/enterprise-rag/backend/roles/middleware.py):** FastAPI dependency guards (`require_admin`, `require_permission`) ensuring non-admin users cannot manage identities, alter permissions, or inspect audit logs.

---

### 3. 📄 Document Ingestion & Parent-Child Chunking (`backend/documents/`)
* **[documents/parser.py](file:///e:/enterprise-rag/backend/documents/parser.py):** Robust text extraction supporting PDF (`pypdf`), Plain Text, and Markdown with unicode cleanup.
* **[documents/chunker.py](file:///e:/enterprise-rag/backend/documents/chunker.py):** **Parent-Child Hierarchical Chunker**:
  - **Child Chunks (~150 words)**: Highly specific snippets with minimal noise, ideal for vector distance calculations.
  - **Parent Chunks (~600 words / Full Page)**: Preserves broad surrounding section context stored in vector payload `parent_content`.
* **[documents/service.py](file:///e:/enterprise-rag/backend/documents/service.py):** Ingestion saga orchestrator:
  1. Computes SHA-256 document content hash to prevent duplicate uploads.
  2. Stores relational record in PostgreSQL (`documents` table).
  3. Generates dense and sparse embeddings for each child chunk.
  4. Upserts vector points into Qdrant Cloud with payload metadata (`document_id`, `department`, `role`, `parent_content`, `page_number`).
  5. Records compliance audit event in PostgreSQL.

---

### 4. 🔍 Hybrid Vector Search, RRF & Cross-Encoder Reranking (`backend/retriever/`)
* **[embeddings/service.py](file:///e:/enterprise-rag/backend/embeddings/service.py):** `SentenceTransformers` model (`BAAI/bge-small-en-v1.5`) generating 384-dimensional dense vectors normalized for Cosine distance.
* **[embeddings/sparse.py](file:///e:/enterprise-rag/backend/embeddings/sparse.py):** BM25 sparse vectorizer computing term-frequency hashes for exact term matching.
* **[retriever/qdrant_client.py](file:///e:/enterprise-rag/backend/retriever/qdrant_client.py):** Manages connection to Qdrant Cloud via HTTPS and API key authentication, automatically initializing collection schema and payload keyword indices (`department`, `role`, `document_id`).
* **[retriever/service.py](file:///e:/enterprise-rag/backend/retriever/service.py):** Executes dual search (Dense Vector + Sparse BM25) and applies **Reciprocal Rank Fusion (RRF)**:
  $$RRF(d) = \sum_{m \in M} \frac{1}{60 + r_m(d)}$$
* **[retriever/reranker.py](file:///e:/enterprise-rag/backend/retriever/reranker.py):** Cross-Encoder (`cross-encoder/ms-marco-MiniLM-L-6-v2`) re-scores candidate chunks against the original user query, pruning irrelevant candidates.
* **Parent Resolution:** Expands the top reranked child chunks into full parent sections, deduplicating overlapping sections before passing to the LLM.

---

### 5. ⚡ Semantic Caching with Redis (`backend/cache/`)
* **[cache/service.py](file:///e:/enterprise-rag/backend/cache/service.py):**
  - Connects to Upstash Redis / Redis asynchronously.
  - Key namespace: `neroxa:semantic:<sha256(user_id + role + dept + filter)>`.
  - Calculates cosine similarity between incoming query embedding and cached queries.
  - When similarity $\ge 0.90$, returns cached answer with `< 10ms` response time, bypassing vector DB and LLM compute.

---

### 6. 🧠 Query Routing, Multi-Step Agent & Tools (`backend/router/`, `backend/agent/`, `backend/tools/`)
* **[router/service.py](file:///e:/enterprise-rag/backend/router/service.py):** Hierarchical query classifier:
  - **CASUAL**: Greetings & general conversation $\rightarrow$ Lightweight conversational prompt.
  - **TOOL**: Arithmetic & calculations $\rightarrow$ Sandboxed Python AST calculator.
  - **ENTERPRISE**: Company knowledge queries $\rightarrow$ Hybrid RAG pipeline.
  - **AGENT**: Complex, multi-constraint questions $\rightarrow$ Autonomous multi-step planner.
* **[agent/service.py](file:///e:/enterprise-rag/backend/agent/service.py):** Autonomous agent engine that builds structured execution plans, iteratively retrieves evidence from multiple departments, verifies hypotheses, and synthesizes unified answers.
* **[tools/calculator.py](file:///e:/enterprise-rag/backend/tools/calculator.py):** Safe AST-based mathematical evaluation tool preventing arbitrary code execution.

---

### 7. 🤖 LLM Generation & Anti-Injection Guardrails (`backend/llm/`)
* **[llm/service.py](file:///e:/enterprise-rag/backend/llm/service.py):** Asynchronous client for Ollama models (`qwen2.5:0.5b`, `qwen2.5:3b`, `llama3.2:1b`).
* **[llm/prompts.py](file:///e:/enterprise-rag/backend/llm/prompts.py):**
  - Strict grounding prompts prohibiting extrapolation, unverified assumptions, or fictitious role hierarchies.
  - **Prompt Injection Defense**: Normalizes input via Unicode NFKC and scans against regex signatures and adversarial jailbreak patterns before any LLM processing.

---

### 8. 💬 Multi-Turn Conversational Chat Sessions (`backend/chat/`)
* **[chat/service.py](file:///e:/enterprise-rag/backend/chat/service.py):**
  - Manages persistent chat sessions and multi-turn message history in PostgreSQL.
  - Rewrites contextual follow-up questions incorporating recent turns.
  - Automatically creates and repairs sessions on demand, preventing 404 access-denied disconnects.

---

### 9. 📊 Compliance Audit Trail (`backend/audit/`)
* **[audit/service.py](file:///e:/enterprise-rag/backend/audit/service.py):**
  - Tracks events: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `DOCUMENT_UPLOADED`, `DOCUMENT_DELETED`, `QUERY_EXECUTED`, `ROLE_UPDATED`.
  - Records IP address, user UUID, user role, resource target, and detailed metadata JSON.
  - Admin-only access protected by RBAC dependencies.

---

## 🌐 Production Cloud Topology & Environment Mapping

```
┌───────────────────────────┐         ┌───────────────────────────┐
│     Vercel (Frontend)     │         │     Railway (Backend)     │
│   SPA: React 19 + Vite    │ ──────> │  FastAPI + Docker Runner  │
│   VITE_API_URL            │         │  OLLAMA_BASE_URL          │
└───────────────────────────┘         └─────────────┬─────────────┘
                                                    │
              ┌─────────────────────────────────────┼─────────────────────────────────────┐
              ▼                                     ▼                                     ▼
┌───────────────────────────┐         ┌───────────────────────────┐         ┌───────────────────────────┐
│   Supabase (PostgreSQL)   │         │    Qdrant Cloud (Vector)  │         │    Upstash Redis (Cache)  │
│ - Users, Roles, Documents │         │ - Dense 384d Vectors      │         │ - Semantic Query Caching  │
│ - ChatSessions, AuditLogs │         │ - Sparse BM25 Vectors     │         │ - Distributed Rate Limits │
└───────────────────────────┘         └───────────────────────────┘         └───────────────────────────┘
```

---

## 🔒 Security Hardening Summary

| Vector | Threat Addressed | Mitigation Applied |
|---|---|---|
| **Prompt Injection** | Jailbreak / System Prompt Override | NFKC Unicode normalization + 10 Regex patterns + 20 exact signature blocks |
| **Unauthorized Data Access** | Cross-Department / Cross-Tenant Leakage | Pre-filtered Qdrant vector search using user's verified JWT department & role claims |
| **API Abuse** | Distributed Denial of Service | Token-bucket rate limiter backed by Redis with per-route thresholds |
| **Session Hijacking** | Token Forgery | Signed HMAC-SHA256 JWTs with 30-480 min configurable expiration |
| **Path Traversal** | Malicious File Upload | Strict basename sanitization and extension whitelisting on document ingestion |
| **Arbitrary Code Execution** | Malicious Math Expressions | Sandboxed Python AST-based expression evaluator replacing `eval()` |

---

## ✅ Quality & Verification Status
* **Unit & Integration Tests**: All unit tests passing across database models, RBAC guards, hybrid retriever, and chunking engines.
* **Static Analysis**: Clean Pydantic schemas, strict TypeScript compilation in frontend.
* **Production Status**: Ready for cloud deployment on Railway, Vercel, Supabase, Qdrant Cloud, and Upstash.
