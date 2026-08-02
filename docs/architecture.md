# Enterprise RAG Architecture & Security System Design

## 🏛️ System Overview

The **Enterprise Knowledge Assistant** is a production-grade Retrieval-Augmented Generation (RAG) platform with strict **Role-Based Access Control (RBAC)**, multi-tenant document isolation, and AI safety guardrails.

```
                          React Frontend (Client / UI)
                                     │
                             JWT Bearer Token
                                     │
                     FastAPI Master API Gateway
                        [ backend/main.py ]
                                     │
     ┌──────────────┬────────────────┼───────────────┬──────────────┐
     │              │                │               │              │
Authentication  Users & DB       Roles & RBAC     Documents RAG & LLM Pipeline
(backend/auth) (users/models)   (roles/middleware)(documents) (rag/llm/retriever)
     │              │                │               │              │
     ▼              ▼                ▼               ▼              ▼
  PostgreSQL / Supabase RDBMS    RBAC Filters    SentenceTransformer Embeddings
 (User, Role, Document, AuditLog)(retriever)     (BAAI/bge-small-en-v1.5)
                                     │               │
                                     ▼               ▼
                             Qdrant Vector DB ──> Ollama Local LLM
                           (enterprise_docs)    (llama3)
                                                     │
                                                     ▼
                                             Answer + Citations
```

---

## 🔒 Security Architecture & Guardrails

### 1. RBAC Metadata Filtering in Vector Search
RBAC is enforced at the database retrieval level **before** context is passed to the LLM. Unauthorized document chunks are never retrieved into the LLM context window, eliminating prompt-based data leakage.

### 2. 2-Phase Saga Pattern (ACID Dual-Write Sync)
Ingesting or deleting documents executes an atomic saga between PostgreSQL and Qdrant. If either step fails, compensating transactions roll back both database states atomically.

### 3. Rate Limiting Guardrails
Sliding window rate limiters protect the backend against abuse and denial of service:
- **Auth routes:** 10 requests / minute
- **RAG queries:** 30 requests / minute
- **Document uploads:** 15 requests / minute

### 4. Anti-Jailbreak & Prompt Injection Defense
Incoming user queries are screened by `detect_prompt_injection()`. Matched jailbreak signatures trigger an immediate `403 Security Alert` and log a compliance event in `audit_logs`.
