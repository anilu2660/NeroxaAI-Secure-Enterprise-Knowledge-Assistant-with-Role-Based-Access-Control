"""
Upload Document with Admin Credentials and Test RAG Pipeline (using httpx with extended timeout)
"""

import sys
import os
import time
import httpx

BASE_URL = "http://127.0.0.1:8000"

def main():
    # Use 300 second timeout for embedding generation / LLM calls
    client = httpx.Client(timeout=300.0)

    print("--- 1. Authenticating as Admin ---")
    login_payload = {
        "email": "upadhyayanuj526@gmail.com",
        "password": "Anujup2660@"
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
                "role": "admin"
            }
            reg_res = client.post(f"{BASE_URL}/api/v1/auth/register", json=reg_payload)
            print("Register result:", reg_res.status_code, reg_res.text)
            res = client.post(f"{BASE_URL}/api/v1/auth/login", json=login_payload)
        
        token_data = res.json()
        token = token_data.get("access_token")
        print(f"[+] Admin Login successful!")
        print(f"    User ID: {token_data.get('user_id')}")
        print(f"    Email: {token_data.get('email')}")
        print(f"    Role: {token_data.get('role')}")
        print(f"    Department: {token_data.get('department')}")
        
    except Exception as e:
        print(f"[-] Failed to connect or log in: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 2. Uploading Presidency University Finance Policy Document ---")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    doc_path = os.path.abspath(os.path.join(script_dir, "..", "docs", "Presidency_University_Finance_Policy.txt"))
    if not os.path.exists(doc_path):
        print(f"Error: Document file not found at {doc_path}")
        return

    start_time = time.time()
    print(f"Ingesting '{doc_path}' to department 'Finance'...")
    with open(doc_path, "rb") as f:
        files = {"file": ("Presidency_University_Finance_Policy.txt", f, "text/plain")}
        data = {"department": "Finance"}
        upload_res = client.post(f"{BASE_URL}/api/v1/documents/upload", files=files, data=data, headers=headers)

    elapsed = time.time() - start_time
    print(f"Upload API Status Code: {upload_res.status_code} (took {elapsed:.2f}s)")
    if upload_res.status_code != 200:
        print(f"[-] Upload failed: {upload_res.text}")
        return
    
    upload_data = upload_res.json()
    document_id = upload_data.get("document_id")
    print(f"[+] Document Ingested & Vector Indexed Successfully!")
    print(f"    Document ID: {document_id}")
    print(f"    Title: {upload_data.get('title')}")
    print(f"    Department: {upload_data.get('department')}")
    print(f"    Chunks Created: {upload_data.get('chunks_created')}")
    print(f"    Status: {upload_data.get('status')}")

    print("\n--- 3. Testing RAG Queries on Uploaded Finance Policy Document ---")
    test_queries = [
        "A department wants to start a new capital project that is expected to exceed its approved budget by 20%. Explain the complete approval workflow, who must be informed, what reports are required, and which governing bodies need to approve the additional expenditure",
        "An employee requests a second imprest advance before accounting for the first one, wants ₹2,500 in cash, and plans to submit the expense report two weeks after completing the trip. According to the Finance Policy, identify every policy violation and explain the correct procedure.",
        "Compare the responsibilities of the Finance Officer, Accounts Officer, Internal Auditor, Board of Management (BoM), and Board of Governors (BoG) in financial management, budgeting, auditing, payments, and expenditure control. Present the comparison in a table."
    ]

    for i, q in enumerate(test_queries, 1):
        print(f"\n==========================================")
        print(f"[Test Query #{i}]: '{q}'")
        print(f"==========================================")
        rag_payload = {
            "query": q,
            "user_role": "admin",
            "user_department": "Finance",
            "top_k": 3
        }
        q_start = time.time()
        rag_res = client.post(f"{BASE_URL}/api/v1/rag/query", json=rag_payload, headers=headers)
        q_elapsed = time.time() - q_start
        print(f"RAG Response Status: {rag_res.status_code} (took {q_elapsed:.2f}s)")
        if rag_res.status_code == 200:
            rag_data = rag_res.json()
            print(f"Answer:\n{rag_data.get('answer')}\n")
            print(f"Sources Cited: {rag_data.get('sources')}")
            print(f"Chunks Retrieved: {rag_data.get('chunks_retrieved')}")
            print(f"Model Used: {rag_data.get('model')}")
        else:
            print(f"[-] RAG query failed: {rag_res.text}")

if __name__ == "__main__":
    main()
