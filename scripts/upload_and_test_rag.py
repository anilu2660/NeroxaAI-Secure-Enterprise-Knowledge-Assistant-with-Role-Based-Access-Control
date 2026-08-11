"""
Upload Document with Admin Credentials and Test RAG Pipeline (using httpx with extended timeout)

Deduplication-aware:
The server checks if the document AND its Qdrant vectors exist.
If both exist: returns 'already_exists' instantly (0 duplicate memory / vectors created).
If vectors are missing (e.g. after backend restart with in-memory Qdrant): re-indexes automatically.
"""

import os
import time
import httpx

BASE_URL   = "http://127.0.0.1:8000"
FILENAME   = "finance_policy.pdf"
DEPARTMENT = "Finance"


def main():
    # Extended timeout for embedding generation / LLM calls
    client = httpx.Client(timeout=300.0)

    # ── 1. Authenticate ──────────────────────────────────────────────────────
    print("--- 1. Authenticating as Admin ---")
    login_payload = {
        "email": "upadhyayanuj526@gmail.com",
        "password": "Anujup2660@",
    }

    try:
        res = client.post(f"{BASE_URL}/api/v1/auth/login", json=login_payload)
        if res.status_code != 200:
            print(f"Login failed ({res.status_code}): {res.text}")
            print("Attempting to register default admin...")
            reg_payload = {
                "email": "upadhyayanuj526@gmail.com",
                "password": "Anujup2660@",
                "full_name": "Enterprise Admin",
                "department": "Finance",
                "role": "admin",
            }
            reg_res = client.post(f"{BASE_URL}/api/v1/auth/register", json=reg_payload)
            print("Register result:", reg_res.status_code, reg_res.text)
            res = client.post(f"{BASE_URL}/api/v1/auth/login", json=login_payload)

        token_data = res.json()
        token = token_data.get("access_token")
        print(f"[+] Admin Login successful!")
        print(f"    User ID:    {token_data.get('user_id')}")
        print(f"    Email:      {token_data.get('email')}")
        print(f"    Role:       {token_data.get('role')}")
        print(f"    Department: {token_data.get('department')}")

    except Exception as e:
        print(f"[-] Failed to connect or log in: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # ── 2. Ingestion / Deduplication Check ────────────────────────────────────
    print(f"\n--- 2. Submitting '{FILENAME}' to department '{DEPARTMENT}' ---")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    doc_path   = os.path.abspath(os.path.join(script_dir, "..", "docs", FILENAME))

    if not os.path.exists(doc_path):
        print(f"[-] Error: Document file not found at {doc_path}")
        return

    start_time = time.time()
    with open(doc_path, "rb") as f:
        files = {"file": (FILENAME, f, "application/pdf")}
        data  = {"department": DEPARTMENT}
        upload_res = client.post(
            f"{BASE_URL}/api/v1/documents/upload",
            files=files,
            data=data,
            headers=headers,
        )

    elapsed = time.time() - start_time

    if upload_res.status_code != 200:
        print(f"[-] Upload failed ({upload_res.status_code}): {upload_res.text}")
        return

    upload_data   = upload_res.json()
    document_id   = upload_data.get("document_id")
    total_chunks  = upload_data.get("chunks_created")
    upload_status = upload_data.get("status")

    if upload_status == "already_exists":
        print()
        print("  ╔══════════════════════════════════════════════════════════╗")
        print("  ║         ⚠️  DOCUMENT ALREADY EXISTS IN DATABASE          ║")
        print("  ╠══════════════════════════════════════════════════════════╣")
        print(f"  ║  File       : {FILENAME:<42} ║")
        print(f"  ║  Department : {DEPARTMENT:<42} ║")
        print(f"  ║  Document ID: {document_id:<42} ║")
        print(f"  ║  Chunks     : {str(total_chunks):<42} ║")
        print("  ╠══════════════════════════════════════════════════════════╣")
        print("  ║  Ingestion SKIPPED — proceeding to RAG test queries.     ║")
        print("  ╚══════════════════════════════════════════════════════════╝")
        print()
    else:
        print(f"[+] Document Ingested & Vector Indexed Successfully! (took {elapsed:.2f}s)")
        print(f"    Document ID: {document_id}")
        print(f"    Title:       {upload_data.get('title')}")
        print(f"    Department:  {upload_data.get('department')}")
        print(f"    Chunks:      {total_chunks}")
        print(f"    Status:      {upload_status}")

    # ── 3. RAG Query Tests ───────────────────────────────────────────────────
    print("\n--- 3. Testing RAG Queries on Uploaded Finance Policy Document ---")
    test_queries = [
        "Who has overall responsibility for management of University financial resources?",
        "What must a certifying officer verify before recommending an invoice for payment?",
        "What is the difference between the University's Finance Committee, Board of Management, and Board of Governors in financial administration?",
        "Does the policy specify the University's total annual budget?",
        "Who has overall responsibility for University financial resources AND what are the cash limits for imprest advances?",
    ]

    for i, q in enumerate(test_queries, 1):
        print(f"\n==========================================")
        print(f"[Test Query #{i}]: '{q}'")
        print(f"==========================================")
        rag_payload = {
            "query": q,
            "user_role": "admin",
            "user_department": "Finance",
            "top_k": 6,
        }
        q_start   = time.time()
        rag_res   = client.post(f"{BASE_URL}/api/v1/rag/query", json=rag_payload, headers=headers)
        q_elapsed = time.time() - q_start
        print(f"RAG Response Status: {rag_res.status_code} (took {q_elapsed:.2f}s)")

        if rag_res.status_code == 200:
            rag_data         = rag_res.json()
            chunks_retrieved = rag_data.get("chunks_retrieved", 0)
            print(f"\nChunks Retrieved: {chunks_retrieved}")
            sources = rag_data.get("sources", [])
            for j, src in enumerate(sources, 1):
                print(
                    f"\n--- Source {j} ---\n"
                    f"Document: {src.get('document_title', 'N/A')}\n"
                    f"Page:     {src.get('page_number', 'N/A')}\n"
                    f"Dept:     {src.get('department', 'N/A')}"
                )
            print(f"\nAnswer:\n{rag_data.get('answer')}\n")
            print(f"Model Used: {rag_data.get('model')}")
        else:
            print(f"[-] RAG query failed: {rag_res.text}")


if __name__ == "__main__":
    main()
