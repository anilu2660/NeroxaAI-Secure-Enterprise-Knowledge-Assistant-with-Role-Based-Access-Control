"""
RAG Module

Orchestrates the full RAG pipeline:
1. Embed user query
2. Metadata-filtered retrieval (with RBAC)
3. Prompt construction with retrieved context
4. LLM response generation
5. Source citation formatting
"""
