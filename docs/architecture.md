# SupportAI Architecture

## High-Level Architecture

Frontend:
Next.js + TypeScript

Backend:
Java + Spring Boot

AI Service:
Python + FastAPI

Primary Database:
PostgreSQL

Vector Storage:
pgvector

## Communication

Frontend -> Spring Boot REST API

Spring Boot -> PostgreSQL

Spring Boot -> FastAPI AI Service

FastAPI -> LLM / Embedding Model

FastAPI -> pgvector

## Planned Modules

### Backend
- Authentication
- Users
- Roles
- Departments
- Categories
- Tickets
- Comments
- Attachments
- Notifications
- SLA Management
- Analytics

### AI Service
- Ticket Classification
- Priority Recommendation
- Summarization
- Response Suggestions
- Knowledge Base / RAG