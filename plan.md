# Enterprise RAG with Role-Based Access Control (RBAC) — Project Plan

## Vision

Build a production-style Enterprise Retrieval-Augmented Generation (RAG) platform that allows
authenticated users to query organisational knowledge while ensuring they can only retrieve
documents they are authorised to access.

---

## Objectives

- Build a secure RAG application.
- Implement authentication and RBAC.
- Support document ingestion and semantic search.
- Return answers with citations.
- Maintain audit logs for enterprise compliance.
- Containerise the application for deployment.

---

## Tech Stack

### Frontend

| Technology   | Version | Purpose                 |
| ------------ | ------- | ----------------------- |
| React        | 19.x    | UI framework            |
| TypeScript   | ~6.0    | Type safety             |
| Tailwind CSS | v4.x    | Utility-first styling   |
| Vite         | 8.x     | Build tool / dev server |
| oxlint       | 1.x     | Linting                 |

### Backend

| Technology       | Version   | Purpose               |
| ---------------- | --------- | --------------------- |
| FastAPI          | 0.141.x   | REST API framework    |
| SQLAlchemy       | 2.0.x     | ORM                   |
| Alembic          | 1.18.x    | DB migrations         |
| Pydantic         | 2.13.x    | Data validation       |
| python-jose      | 3.5.x     | JWT encoding/decoding |
| passlib + bcrypt | 1.7 / 5.0 | Password hashing      |

### Database

| Technology                  | Purpose                                                      |
| --------------------------- | ------------------------------------------------------------ |
| PostgreSQL (Supabase Cloud) | Relational persistence — users, roles, documents, audit logs |
| Qdrant Cloud                | Vector database — document embeddings & semantic search      |

### AI / ML

| Technology                                     | Version | Purpose                      |
| ---------------------------------------------- | ------- | ---------------------------- |
| Sentence Transformers (BAAI/bge-small-en-v1.5) | 5.6.x   | 384-dim text embeddings      |
| Ollama (llama3.1 model)                        | 0.6.x   | Local LLM for RAG generation |

### DevOps

| Technology              | Purpose                 |
| ----------------------- | ----------------------- |
| Docker + Docker Compose | Container orchestration |
| GitHub                  | Version control         |
| pytest + httpx          | Automated testing       |

---

## System Architecture

```
                       React Frontend (Vite + TypeScript + Tailwind v4)
                                        |
                                JWT Bearer Token
                                        |
                        FastAPI Master API Gateway
                           [ backend/main.py ]
                                        |
     +--------------+-------------------+-----------------+--------------+
     |              |                   |                 |              |
Authentication  Users & DB          Roles & RBAC      Documents    RAG & LLM Pipeline
(backend/auth) (users/models)   (roles/middleware)  (documents/) (rag/llm/retriever)
     |              |                   |                 |              |
     v              v                   v                 v              v
PostgreSQL (Supabase)           RBAC Filters          SentenceTransformer
SQLAlchemy 2.0 ORM              (retriever/)          BAAI/bge-small-en-v1.5
(User, Role, Document,                |                   |
 AuditLog)                           v                   v
                           Qdrant Cloud Vector DB --> Ollama Local LLM (llama3.1)
                            (enterprise_docs)               |
                                                            v
                                                    Answer + Citations
```

---

## Authorisation

### Roles

| Role          | Description                                                               |
| ------------- | ------------------------------------------------------------------------- |
| `admin`       | Full system access — user management, audit logs, all document operations |
| `hr`          | HR department documents — read, upload, delete, share                     |
| `finance`     | Finance department documents — read, upload, delete, share                |
| `engineering` | Engineering documents — read, upload, delete, share                       |
| `sales`       | Sales documents — read, upload, share                                     |
| `employee`    | General employee — read-only access                                       |

### Permissions Matrix

| Permission     | admin | hr  | finance | engineering | sales | employee |
| -------------- | :---: | :-: | :-----: | :---------: | :---: | :------: |
| `read`         |  YES  | YES |   YES   |     YES     |  YES  |   YES    |
| `upload`       |  YES  | YES |   YES   |     YES     |  YES  |    NO    |
| `delete`       |  YES  | YES |   YES   |     YES     |  NO   |    NO    |
| `share`        |  YES  | YES |   YES   |     YES     |  YES  |    NO    |
| `manage_users` |  YES  | NO  |   NO    |     NO      |  NO   |    NO    |

---

## Audit Events Tracked

- User login
- Document uploaded
- Document deleted
- Document shared
- Query executed
- Unauthorised access attempt
- Role updated

---

## Complete Folder Structure

```
enterprise-rag/
|
+-- frontend/                          <- React + Vite + TypeScript + Tailwind v4
|   +-- index.html
|   +-- vite.config.ts
|   +-- tsconfig.json / tsconfig.app.json / tsconfig.node.json
|   +-- package.json
|   +-- src/
|       +-- App.tsx
|       +-- main.tsx
|       +-- App.css / index.css
|       +-- assets/
|       +-- components/
|       |   +-- admin/                 <- [scaffolded - implementation pending]
|       |   +-- auth/                  <- [scaffolded - implementation pending]
|       |   +-- common/                <- [scaffolded - implementation pending]
|       |   +-- documents/             <- [scaffolded - implementation pending]
|       |   +-- layout/                <- [scaffolded - implementation pending]
|       |   +-- query/                 <- [scaffolded - implementation pending]
|       +-- pages/
|       |   +-- admin/                 <- [scaffolded - implementation pending]
|       |   +-- auth/                  <- [scaffolded - implementation pending]
|       |   +-- dashboard/             <- [scaffolded - implementation pending]
|       |   +-- documents/             <- [scaffolded - implementation pending]
|       |   +-- query/                 <- [scaffolded - implementation pending]
|       +-- context/                   <- [scaffolded - implementation pending]
|       +-- hooks/                     <- [scaffolded - implementation pending]
|       +-- router/                    <- [scaffolded - implementation pending]
|       +-- services/                  <- [scaffolded - implementation pending]
|       +-- types/                     <- [scaffolded - implementation pending]
|       +-- utils/                     <- [scaffolded - implementation pending]
|
+-- backend/                           <- FastAPI + SQLAlchemy + Qdrant + Ollama  [COMPLETE]
|   +-- main.py                        <- App entry point, lifespan, CORS, router mount
|   +-- config.py                      <- Centralised env-var settings (dotenv)
|   +-- requirements.txt               <- Pinned Python dependencies
|   +-- .env                           <- Runtime environment variables (gitignored)
|   +-- .env.example                   <- Template for environment setup
|   +-- alembic.ini                    <- Alembic migration configuration
|   +-- alembic/
|   |   +-- env.py                     <- Migration environment script
|   |   +-- versions/                  <- Migration version files
|   |
|   +-- api/                           <- Master router aggregation
|   |   +-- routes.py                  <- Includes all feature sub-routers under /api/v1
|   |   +-- dependencies.py            <- get_current_user (JWT -> User) dependency
|   |
|   +-- database/                      <- Relational DB layer
|   |   +-- base.py                    <- SQLAlchemy Base + TimestampMixin
|   |   +-- session.py                 <- Engine, SessionLocal, get_db, init_db, seed
|   |
|   +-- models/                        <- SQLAlchemy ORM models
|   |   +-- role.py                    <- Role (id, name, description, permissions JSON)
|   |   +-- user.py                    <- User (email, hashed_password, department, role_id)
|   |   +-- document.py                <- Document (title, dept, shared_with, qdrant IDs)
|   |   +-- audit_log.py               <- AuditLog (event_type, user_id, action, ip)
|   |
|   +-- auth/                          <- JWT authentication
|   |   +-- jwt_handler.py             <- encode/decode JWT (sub, email, role, department)
|   |   +-- password.py                <- bcrypt hash/verify (72-byte truncation)
|   |   +-- schemas.py                 <- RegisterRequest, LoginRequest, TokenResponse
|   |   +-- service.py                 <- register_user, login_user, get_current_user_profile
|   |   +-- routes.py                  <- POST /api/v1/auth/register|login, GET /me
|   |
|   +-- users/                         <- User management (Admin-protected)
|   |   +-- schemas.py                 <- UserResponse, UserUpdate
|   |   +-- service.py                 <- CRUD: get_by_id, list_users, update_user, delete_user
|   |   +-- routes.py                  <- GET|PUT|DELETE /api/v1/users/{id}
|   |
|   +-- roles/                         <- RBAC engine
|   |   +-- schemas.py                 <- RoleInfo, AssignRoleRequest, PermissionCheckResponse
|   |   +-- service.py                 <- ROLE_PERMISSIONS matrix, has_permission, is_admin
|   |   +-- middleware.py              <- require_permission(), require_admin FastAPI deps
|   |   +-- routes.py                  <- GET /api/v1/roles/, POST /assign, GET /check-permission
|   |
|   +-- documents/                     <- Document ingestion pipeline
|   |   +-- parser.py                  <- PDF (pypdf), Word (python-docx), TXT text extractor
|   |   +-- chunker.py                 <- 500-token sliding-window chunker with metadata binding
|   |   +-- schemas.py                 <- DocumentUploadResponse, ShareRequest
|   |   +-- service.py                 <- upload_document, share_document, delete_document
|   |   +-- routes.py                  <- POST /upload, POST /{id}/share, DELETE /{id}
|   |
|   +-- embeddings/                    <- Sentence Transformer embedding service
|   |   +-- service.py                 <- Lazy-loaded BAAI/bge-small-en-v1.5 (384-dim)
|   |
|   +-- retriever/                     <- Qdrant vector search + RBAC filtering
|   |   +-- qdrant_client.py           <- QdrantManager: collection, payload indexes, CRUD
|   |   +-- service.py                 <- Metadata-filtered vector search (dept+role+shared_with)
|   |
|   +-- llm/                           <- Ollama LLM generation layer
|   |   +-- prompts.py                 <- System prompt, context + query builders, [Source] format
|   |   +-- service.py                 <- Ollama Client/AsyncClient, citation extraction
|   |
|   +-- rag/                           <- RAG orchestration
|   |   +-- schemas.py                 <- QueryRequest, QueryResponse, SourceDocument
|   |   +-- service.py                 <- embed -> retrieve -> filter -> prompt -> generate
|   |   +-- routes.py                  <- POST /api/v1/rag/query, GET /api/v1/rag/health
|   |
|   +-- audit/                         <- Compliance audit trail
|   |   +-- schemas.py                 <- AuditLogCreate, AuditLogResponse
|   |   +-- service.py                 <- log_event() compliance recorder
|   |   +-- routes.py                  <- GET /api/v1/admin/audit-logs (Admin only)
|   |
|   +-- utils/                         <- Shared utilities
|       +-- logger.py                  <- Centralised Python logging configuration
|       +-- exceptions.py              <- CredentialsException, custom HTTP exceptions
|       +-- rate_limiter.py            <- Request rate limiting utility
|
+-- docker/                            <- Container configuration
|   +-- Dockerfile.backend             <- FastAPI container image
|   +-- Dockerfile.frontend            <- React/Vite container image
|   +-- docker-compose.yml             <- Full-stack orchestration
|   +-- .env.example                   <- Docker env template
|
+-- tests/                             <- Automated test suite
|   +-- conftest.py                    <- Pytest fixtures (test client, test DB, mock users)
|   +-- test_api.py                    <- Root/health endpoint tests
|   +-- test_auth.py                   <- Registration, login, JWT validation tests
|   +-- test_documents.py              <- Document upload/delete/share tests
|   +-- test_rag.py                    <- RAG query pipeline tests
|   +-- test_rbac.py                   <- Permission enforcement tests
|
+-- docs/                              <- Project documentation
|   +-- api_reference.md               <- Full API endpoint reference
|   +-- architecture.md                <- System architecture documentation
|   +-- setup.md                       <- Development environment setup guide
|
+-- start.ps1                          <- PowerShell dev-server launcher script
+-- .gitignore
+-- README.md
```

---

## Complete API Endpoints Reference

| Module        | Method | Route                            | Description                      | Access            |
| ------------- | ------ | -------------------------------- | -------------------------------- | ----------------- |
| **Health**    | GET    | `/health`                        | Application health check         | Public            |
| **Root**      | GET    | `/`                              | API welcome & docs links         | Public            |
| **Auth**      | POST   | `/api/v1/auth/register`          | Register new user                | Public            |
|               | POST   | `/api/v1/auth/login`             | Authenticate & get JWT           | Public            |
|               | GET    | `/api/v1/auth/me`                | Current user profile             | Authenticated     |
| **Users**     | GET    | `/api/v1/users/`                 | List all users                   | Admin Only        |
|               | GET    | `/api/v1/users/{id}`             | User details by ID               | Authenticated     |
|               | PUT    | `/api/v1/users/{id}`             | Update user details/role         | Admin Only        |
|               | DELETE | `/api/v1/users/{id}`             | Delete user account              | Admin Only        |
| **Roles**     | GET    | `/api/v1/roles/`                 | List system roles & permissions  | Authenticated     |
|               | POST   | `/api/v1/roles/assign`           | Assign role to user              | Admin Only        |
|               | GET    | `/api/v1/roles/check-permission` | Check role permission            | Authenticated     |
| **Documents** | POST   | `/api/v1/documents/upload`       | Ingest PDF/DOCX/TXT into Qdrant  | Upload Permission |
|               | GET    | `/api/v1/documents/`             | List user's accessible documents | Authenticated     |
|               | POST   | `/api/v1/documents/{id}/share`   | Grant access to specific users   | Share Permission  |
|               | DELETE | `/api/v1/documents/{id}`         | Delete document & vectors        | Delete Permission |
| **RAG**       | POST   | `/api/v1/rag/query`              | Perform RAG query with citations | Authenticated     |
|               | GET    | `/api/v1/rag/health`             | RAG pipeline health check        | Public            |
| **Audit**     | GET    | `/api/v1/admin/audit-logs`       | View compliance audit trail      | Admin Only        |

---

## Development Roadmap

### Phase 0 — Planning [COMPLETE]

- [x] Define requirements
- [x] Create architecture diagrams
- [x] Design database schema
- [x] Set up Git repository

### Phase 1 — Project Setup [COMPLETE]

- [x] Create backend package structure (12 modules)
- [x] Create frontend scaffold (Vite + React + TypeScript + Tailwind v4)
- [x] Configure Docker Compose (backend, frontend containers)
- [x] Connect PostgreSQL (Supabase Cloud)
- [x] Connect Qdrant Cloud
- [x] Configure environment variables (.env, .env.example)
- [x] Create start.ps1 dev-server launcher

### Phase 2 — Authentication & RBAC [COMPLETE]

- [x] User registration (POST /api/v1/auth/register)
- [x] Login with JWT (POST /api/v1/auth/login)
- [x] JWT encode/decode (auth/jwt_handler.py)
- [x] Password hashing with bcrypt — 72-byte truncation (auth/password.py)
- [x] Role management service (roles/service.py) — ROLE_PERMISSIONS matrix
- [x] Permission middleware (roles/middleware.py) — require_permission(), require_admin
- [x] Protected routes via get_current_user dependency (api/dependencies.py)
- [x] Default admin seeding on startup (database/session.py)

### Phase 3 — Document Management [COMPLETE]

- [x] File upload — PDF (pypdf), Word (python-docx), TXT
- [x] Text extraction (documents/parser.py)
- [x] Sliding-window chunking with metadata (documents/chunker.py)
- [x] Embedding generation — BAAI/bge-small-en-v1.5 (embeddings/service.py)
- [x] Qdrant vector storage with payload indexes (retriever/qdrant_client.py)
- [x] Document metadata tracking in PostgreSQL (models/document.py)
- [x] Document sharing (POST /api/v1/documents/{id}/share)
- [x] Document deletion — DB + Qdrant vectors (DELETE /api/v1/documents/{id})

### Phase 4 — RAG Pipeline [COMPLETE]

- [x] Query embedding via SentenceTransformer
- [x] Qdrant metadata-filtered retrieval (RBAC + shared_with enforcement)
- [x] Prompt construction with context chunks (llm/prompts.py)
- [x] LLM response generation via Ollama llama3.1 (llm/service.py)
- [x] Source citations — [Source: title, Page: N] format
- [x] RAG orchestration service (rag/service.py)
- [x] RAG API endpoint (POST /api/v1/rag/query)

### Phase 5 — Admin Features [COMPLETE]

- [x] User management CRUD (users/ — Admin-protected)
- [x] Role assignment (POST /api/v1/roles/assign)
- [x] Audit log recording (audit/service.py)
- [x] Audit log retrieval (GET /api/v1/admin/audit-logs)
- [x] Compliance event tracking (login, upload, delete, query, unauthorized, role_update)

### Phase 5b — Frontend Implementation [IN PROGRESS — next phase]

- [ ] Auth context & JWT storage (context/, hooks/)
- [ ] React Router setup (router/)
- [ ] API service layer (services/)
- [ ] TypeScript type definitions (types/)
- [ ] Login / Register pages (pages/auth/)
- [ ] Dashboard page (pages/dashboard/)
- [ ] Document upload & list page (pages/documents/)
- [ ] RAG query / chat page (pages/query/)
- [ ] Admin panel pages (pages/admin/)
- [ ] Shared UI components — layout, navbar, sidebar

### Phase 6 — Testing [IN PROGRESS]

- [x] Test structure scaffolded (tests/conftest.py, test_auth.py, test_api.py, etc.)
- [ ] Run and validate all test suites
- [ ] RBAC enforcement tests
- [ ] RAG retrieval quality checks
- [ ] Integration tests (end-to-end auth -> query flow)

### Phase 7 — Deployment [IN PROGRESS]

- [x] Docker images (docker/Dockerfile.backend, docker/Dockerfile.frontend)
- [x] Docker Compose (docker/docker-compose.yml)
- [ ] Production environment configuration
- [ ] Production documentation
- [ ] CI/CD pipeline setup

---

## Environment Configuration Summary

| Variable                          | Example Value                                   | Description                    |
| --------------------------------- | ----------------------------------------------- | ------------------------------ |
| `DATABASE_URL`                    | `postgresql://...@supabase.com:5432/postgres`   | Supabase PostgreSQL connection |
| `QDRANT_URL`                      | `https://...eu-central-1-0.aws.cloud.qdrant.io` | Qdrant Cloud endpoint          |
| `QDRANT_API_KEY`                  | `eyJ...`                                        | Qdrant Cloud API key           |
| `QDRANT_COLLECTION`               | `enterprise_docs`                               | Vector collection name         |
| `JWT_SECRET_KEY`                  | `dev-secret-key-...`                            | JWT signing secret             |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `60`                                            | Token TTL                      |
| `OLLAMA_BASE_URL`                 | `http://localhost:11434`                        | Local Ollama server            |
| `OLLAMA_MODEL`                    | `llama3.1`                                      | LLM model name                 |
| `EMBEDDING_MODEL`                 | `BAAI/bge-small-en-v1.5`                        | SentenceTransformer model      |
| `EMBEDDING_DIMENSION`             | `384`                                           | Vector dimension               |
| `CHUNK_SIZE`                      | `500`                                           | Document chunk size (words)    |
| `CHUNK_OVERLAP`                   | `50`                                            | Chunk overlap (words)          |
| `MAX_UPLOAD_SIZE_MB`              | `10`                                            | Max file upload size           |
| `CORS_ORIGINS`                    | `http://localhost:3000`                         | Allowed CORS origins           |

---

## Development Commands

```powershell
# Start backend (from E:\enterprise-rag)
.\start.ps1
# or directly:
backend\myenv\Scripts\uvicorn backend.main:app --reload

# Start frontend (from E:\enterprise-rag\frontend)
npm run dev

# Run tests
backend\myenv\Scripts\pytest tests/ -v

# Database migrations
backend\myenv\Scripts\alembic revision --autogenerate -m "description"
backend\myenv\Scripts\alembic upgrade head
```

---

## Stretch Goals

- Hybrid search (vector + keyword BM25)
- Reranking (cross-encoder)
- Conversation memory (chat history)
- Multi-tenant organisations
- SSO (OAuth/OIDC)
- Streaming responses (SSE)
- Observability (OpenTelemetry)
- Rate limiting per user/role

---

## Success Criteria

**Functional:**

- Users authenticate securely via JWT.
- RBAC is enforced before every document retrieval.
- Answers include verifiable source citations.
- Unauthorised documents are never retrieved.
- Audit trail records all sensitive operations.

**Engineering:**

- Clean, modular architecture across 12 backend packages.
- Dockerised deployment ready.
- Comprehensive README and docs.
- Automated test suite (auth, RBAC, documents, RAG).
