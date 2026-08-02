# Local Development & Production Setup Guide

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose (for Qdrant and Ollama)

---

### 2. Backend Installation

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database & start FastAPI backend server
uvicorn main:app --reload --port 8000
```

---

### 3. Vector DB & LLM Setup

#### Qdrant Setup (Docker):
```bash
docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest
```

#### Ollama Setup (Local LLM):
```bash
# Pull Llama3 model
ollama pull llama3
```

---

### 4. Running Full Stack via Docker Compose

```bash
cd docker
docker-compose up --build -d
```

Services exposed:
- **FastAPI Backend:** `http://localhost:8000`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **React Frontend:** `http://localhost:3000`
- **Qdrant Vector Dashboard:** `http://localhost:6333/dashboard`
