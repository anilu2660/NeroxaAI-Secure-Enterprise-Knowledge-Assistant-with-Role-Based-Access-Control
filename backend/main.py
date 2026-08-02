"""
Enterprise RAG Application - Main Entry Point

A production-style Enterprise Retrieval-Augmented Generation (RAG) platform
with Role-Based Access Control (RBAC).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Enterprise RAG API",
    description="Secure Enterprise Knowledge Assistant with Role-Based Access Control",
    version="0.1.0",
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "enterprise-rag"}
