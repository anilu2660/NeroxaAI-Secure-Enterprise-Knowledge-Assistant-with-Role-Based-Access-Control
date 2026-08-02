## Enterprise RAG with Role-Based Access Control (RBAC) -- Project Plan

## Vision

Build a production-style Enterprise Retrieval-Augmented Generation (RAG)platform that allows authenticated users to query organizationalknowledge while ensuring they can only retrieve documents they areauthorized to access.

## Objectives

Build a secure RAG application.

Implement authentication and RBAC.

Support document ingestion and semantic search.

Return answers with citations.

Maintain audit logs for enterprise compliance.

Containerize the application for deployment.

## Tech Stack

# Frontend

React

TypeScript

Tailwind CSS

# Backend

FastAPI

SQLAlchemy

Alembic

# Database

PostgreSQL

# Vector Database

Qdrant

# Authentication

JWT

Password hashing

# LLM

Ollama (local)

# Embeddings

Sentence Transformers (BAAI/bge-small-en-v1.5 initially)

# DevOps

Docker

Docker Compose

GitHub

## Industry standard Architecture

                React Frontend
                       │
              JWT Authentication
                       │
                 FastAPI Backend
                       │
        ┌──────────────┴──────────────┐
        │                             │

        User Database Audit Logging
        │                             │
        └── ────────────┬──────────────┘
                       │
                Authorization Layer
                 (RBAC Enforcement)
                       │
               Metadata Filtering
                       │
                Vector Database
                       │
                 Relevant Chunks
                       │
                Local / Cloud LLM
                       │
                 Final Response

# High-Level Architecture

React UI
│
JWT Authentication
│
FastAPI Backend
│
RBAC Authorization Layer
│
Retriever (Metadata Filter)
│
Qdrant Vector Database
│
Ollama LLM
│
Answer + Citations

## Authorisation

# Roles:

Admin

HR

Finance

Engineering

Sales

Employee

# Permissions:

Read

Upload

Delete

Share

Manage Users

## Audit Logs

# Track events such as:

User login

Document uploaded

Document deleted

Query executed

Unauthorized access attempt

Role updated

## Folder Structure

enterprise-rag/
│
├── frontend/
│
├── backend/
│ ├── api/
│ ├── auth/
│ ├── users/
│ ├── roles/
│ ├── documents/
│ ├── embeddings/
│ ├── retriever/
│ ├── llm/
│ ├── rag/
│ ├── audit/
│ ├── database/
│ ├── models/
│ └── utils/
│
├── docker/
├── docs/
├── tests/
└── README.md

## Development Roadmap

# Phase 0 -- Planning

Define requirements

Create architecture diagrams

Design database schema

Set up Git repository

Deliverable: - Approved design

# Phase 1 -- Project Setup

Tasks: - Create backend structure - Create frontend structure -Configure Docker Compose - Connect PostgreSQL - Connect Qdrant -Configure environment variables

Deliverable: - Running development environment

# Phase 2 -- Authentication & RBAC

Tasks: - User registration - Login - JWT authentication - Passwordhashing - Role management - Permission middleware - Protected routes

Roles: - Admin - HR - Finance - Engineering - Sales - Employee

Deliverable: - Secure login system

# Phase 3 -- Document Management

Tasks: - Upload PDF/DOCX/TXT - Extract text - Chunk documents - Generateembeddings - Store vectors and metadata - Track document ownership

Metadata example: - document_id - title - department - role - owner -page_number

Deliverable: - Searchable knowledge base

# Phase 4 -- RAG Pipeline

Tasks: - Embed user queries - Metadata-filtered retrieval - Promptconstruction - LLM response generation - Source citations

Deliverable: - Secure question answering

# Phase 5 -- Admin Features

Tasks: - User management - Role assignment - Document management - Auditlogs - Dashboard metrics

Deliverable: - Enterprise administration tools

# Phase 6 -- Testing

Unit tests

API tests

Integration tests

RBAC tests

Retrieval quality checks

Deliverable: - Stable application

# Phase 7 -- Deployment

Tasks: - Docker images - Docker Compose - Environment configuration -Production documentation

Deliverable: - Deployable system

Stretch Goals

Hybrid search

Reranking

Conversation memory

Multi-tenant organizations

SSO (OAuth/OIDC)

Streaming responses

Observability (OpenTelemetry)

## Success Criteria

Functional: - Users authenticate securely. - RBAC is enforced beforeretrieval. - Answers include citations. - Unauthorized documents arenever retrieved.

Engineering: - Clean architecture - Modular codebase - Dockerizeddeployment - Comprehensive README - Automated tests
