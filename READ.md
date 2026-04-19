Document Intelligence Platform (Okiru.Pro)

A system where users can:

Upload documents (PDF, DOCX, images)

Ask questions about documents via text or voice

See answers with tables and images

Listen to voice answers

Features

Upload documents

Extract text, tables, and images

Ask questions and get answers

Voice input and voice output

View documents with pages, tables, and images

Tech Stack

Backend: Python, FastAPI

Frontend: React / Next.js

Vector Database: Qdrant

Relational Database: PostgreSQL

Speech-to-Text: Whisper

Text-to-Speech: ElevenLabs

LLM: GPT-4.1 / GPT-5

Setup

Clone repository:

git clone <repo-url>
cd document-intelligence-platform

Copy environment file:

cp .env.example .env

Fill in:

OPENAI_API_KEY=<your-key>
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
QDRANT_URL=http://localhost:6333
JWT_SECRET=<random-secret>

Start Docker containers:

docker-compose up --build
Usage

Register and login

Upload a document

Ask questions via text or voice

See answers with tables, images, and sources

Listen to answers (optional)

API Endpoints

POST /auth/register – create account

POST /auth/login – login

POST /documents/upload – upload documents

POST /chat – ask questions

POST /voice-question – ask with audio

POST /voice-answer – get answer as audio

Database

Users: id, email, password, created_at
Documents: id, user_id, filename, created_at
Chunks: id, document_id, type (text/table/image), page, content

License

MIT License