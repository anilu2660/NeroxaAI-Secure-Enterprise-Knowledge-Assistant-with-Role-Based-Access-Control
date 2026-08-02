# API Reference Guide

Base URL: `http://localhost:8000/api/v1`

---

## Authentication

### `POST /auth/register`
Register a new enterprise user.
* **Request Body:**
  ```json
  {
    "email": "user@enterprise.com",
    "password": "Password123!",
    "full_name": "Jane Doe",
    "department": "Engineering",
    "role": "employee"
  }
  ```

### `POST /auth/login`
Authenticate credentials and return JWT bearer token.
* **Response:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "role": "admin",
    "department": "General"
  }
  ```

---

## RAG Knowledge Query

### `POST /rag/query`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Body:**
  ```json
  {
    "query": "What is our company's paid leave policy?",
    "top_k": 5,
    "temperature": 0.7
  }
  ```
* **Response:**
  ```json
  {
    "query": "What is our company's paid leave policy?",
    "answer": "Employees are entitled to 20 days paid leave per year. [Source: HR_Policy.pdf, Page: 4]",
    "sources": [
      {
        "document_title": "HR_Policy.pdf",
        "department": "HR",
        "page_number": 4
      }
    ],
    "model": "llama3",
    "chunks_retrieved": 2
  }
  ```

---

## Documents Management

### `POST /documents/upload`
Upload PDF, DOCX, or TXT file into vector store.
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Form-Data:** `file` (binary), `department` (string)

### `POST /documents/{id}/share`
Grant explicit document access to specific users.
* **Request Body:**
  ```json
  {
    "user_ids": ["emp_123", "emp_456"]
  }
  ```

### `DELETE /documents/{id}`
Purge document vectors from Qdrant and metadata from PostgreSQL (Admin only).
