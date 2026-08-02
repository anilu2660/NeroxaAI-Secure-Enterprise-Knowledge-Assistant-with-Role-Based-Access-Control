# Setup Guide

Instructions for setting up the Enterprise RAG development environment.

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- Git

## Quick Start

1. Clone the repository
2. Copy environment files: `cp backend/.env.example backend/.env`
3. Start services: `cd docker && docker-compose up -d`
4. Install backend dependencies: `cd backend && pip install -r requirements.txt`
5. Run migrations: `alembic upgrade head`
6. Start backend: `uvicorn main:app --reload`
7. Start frontend: `cd frontend && npm run dev`

## Environment Variables

See `backend/.env.example` for all available configuration options.
