# Medhā AI

Medhā AI is an AI-powered study assistant that helps users learn from their own PDF documents.

You can upload a PDF and then chat with it, generate quizzes from it, or get a summary of it. You can also use the app without uploading a PDF for normal AI chat and random quizzes.

## What can you do with Medhā AI?

Medhā AI has three main modes:

### 1. Chat

Upload a PDF and ask questions about it.

The AI uses the content of the uploaded document to answer questions related to it.

You can also use Chat mode without a PDF for normal conversations.

### 2. Quiz

You can generate quizzes from your uploaded PDFs and test your understanding of the document.

There is also a random quiz option if you want to practice without uploading anything.

### 3. Summary

Upload a PDF and ask Medhā AI to summarize its content so you can understand the main points more quickly.

---

## How it works

When a PDF is uploaded, its content is processed and converted into embeddings.

The embeddings are stored in a vector database and are later used to find the most relevant parts of the document when the user asks a question or requests a quiz or summary.

This allows the AI to work with the actual content of the uploaded PDF instead of relying only on its general knowledge.

The project uses a RAG (Retrieval-Augmented Generation) approach for this.

---

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB
- Redis

### AI

- `openai/gpt-oss-20b`
- Qdrant Vector Database
- `nomic-embed-text-v1.5` for embeddings
- RAG for working with uploaded documents
- Tavily for web search
- Sarvam AI for translation

### Payments

- Razorpay
- Razorpay Webhooks
- Test mode is currently being used

---

## Why RAG?

A small language model cannot always remember or understand a large PDF directly.

So instead of sending the complete document every time, Medhā AI retrieves the relevant parts of the document first and then gives those parts to the AI.

The basic flow is:

```text
PDF Upload
    ↓
Extract PDF Content
    ↓
Create Embeddings
    ↓
Store in Qdrant
    ↓
User asks a question
    ↓
Find relevant document content
    ↓
Send relevant content to AI
    ↓
Generate response