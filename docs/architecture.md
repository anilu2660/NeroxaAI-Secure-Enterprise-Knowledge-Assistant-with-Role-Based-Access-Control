# Architecture Overview

This document describes the architecture of the Enterprise RAG application.

## System Architecture

```
React Frontend
       │
JWT Authentication
       │
FastAPI Backend
       │
┌──────┴──────┐
│             │
User DB    Audit Log
│             │
└──────┬──────┘
       │
Authorization Layer
 (RBAC Enforcement)
       │
Metadata Filtering
       │
Qdrant Vector DB
       │
Relevant Chunks
       │
Ollama LLM
       │
Final Response
```

## Components

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + Alembic
- **Database**: PostgreSQL (users, roles, documents, audit logs)
- **Vector Store**: Qdrant (document embeddings with metadata)
- **LLM**: Ollama (local inference)
- **Embeddings**: Sentence Transformers (BAAI/bge-small-en-v1.5)
