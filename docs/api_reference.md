# API Reference

API documentation for the Enterprise RAG application.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication Endpoints

| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| POST   | /auth/register   | Register new user  |
| POST   | /auth/login      | Login and get JWT  |
| POST   | /auth/refresh    | Refresh JWT token  |

## User Endpoints

| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| GET    | /users/me        | Get current user   |
| GET    | /users           | List all users     |
| PUT    | /users/{id}      | Update user        |
| DELETE | /users/{id}      | Delete user        |

## Document Endpoints

| Method | Endpoint             | Description           |
|--------|----------------------|-----------------------|
| POST   | /documents/upload    | Upload document       |
| GET    | /documents           | List user documents   |
| GET    | /documents/{id}      | Get document details  |
| DELETE | /documents/{id}      | Delete document       |

## RAG Query Endpoints

| Method | Endpoint    | Description              |
|--------|-------------|--------------------------|
| POST   | /query      | Query the knowledge base |

## Admin Endpoints

| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| GET    | /admin/audit-logs | View audit logs      |
| GET    | /admin/users      | Manage users         |
| PUT    | /admin/roles      | Assign roles         |
| GET    | /admin/dashboard  | Dashboard metrics    |
