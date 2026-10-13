# Medhā AI

**Your AI study saathi.** Upload your own PDFs, then chat with them, summarize them, or get quizzed on them. No login needed, just open the app and start learning.

Most students already have their notes and books as PDFs. Medhā AI lets them ask questions directly from that material instead of searching through pages manually.

---

## What it can do

- **Chat with your PDFs** – Ask questions and get answers based only on the documents you selected.
- **Summaries** – Get a short summary of any uploaded PDF, generated section by section.
- **Quizzes** – Practice with multiple-choice questions, either from your PDF or on random topics. Questions don't repeat.
- **General chat** – Ask anything, even without a PDF.
- **Web search** – When a question needs fresh information, the AI searches the web on its own.
- **Understands your language** – Replies in the same language you write in: English, Hindi, or Hinglish.
- **Plans and payments** – Free, Pro and Premium plans with different usage limits, paid through Razorpay.

---

## How it works

When you upload a PDF, the text is split into small chunks and converted into embeddings. These are stored in a vector database. When you ask a question, the most relevant chunks are fetched and sent to the LLM along with your question, so the answer comes from your own material.

```
PDF upload → text chunks → embeddings → Qdrant
Your question → similar chunks from Qdrant → LLM → answer in your language
```

A few details:

- Chunks are 500 characters long with a 100 character overlap.
- The top 3 matching chunks (similarity score above 0.5) are used as context.
- The same PDF can't be uploaded twice (checked using a file hash).
- Each session can hold up to 5 PDFs.

---

## Tech stack

| Area | Tools |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| LLM | Groq (`openai/gpt-oss-20b`) |
| RAG | LangChain text splitters, Nomic embeddings, Qdrant |
| Web search | Tavily |
| Language support | Sarvam AI |
| Database | MongoDB |
| Usage limits | Upstash Redis |
| File storage | Cloudinary |
| Payments | Razorpay |

---

## Plans

| | Free | Pro | Premium |
|---|---|---|---|
| Price | ₹0 | ₹149 | ₹299 |
| Requests per minute | 10 | 15 | 20 |
| Requests per day | 200 | 400 | 600 |
| Tokens per minute | 4,000 | 6,000 | 7,000 |
| Tokens per day | 50,000 | 100,000 | 150,000 |

All plans include every feature. Only the limits change. Paid plans are valid for 30 days.

> **Note:** The payment integration is currently in test mode. No real money will be charged during testing.

---

## Project structure

```
GenAi-Project/
├── backend/
│   ├── server.js       # Express app, payment routes, webhook
│   ├── chatbot.js      # Chat, quiz, summary, upload and limits
│   ├── Rag.js          # Chunking, embeddings, Qdrant search
│   ├── sarvam.js       # Language detection and translation
│   ├── redis.js        # Redis client
│   ├── db.js           # MongoDB connection
│   ├── config/         # Cloudinary setup
│   └── models/         # User, Document, Summary schemas
└── frontend/
    └── src/
        ├── Home.jsx    # Main app (chat, quiz, summary)
        ├── Pricing.jsx # Plans and checkout
        └── components/ # Loader and small UI pieces
```

---

## Running it locally

You will need Node.js (v18 or above) and accounts for the services listed in the tech stack.

**1. Clone the repo**

```bash
git clone https://github.com/the-coder-aadi/GenAi-Project.git
cd GenAi-Project
```

**2. Backend**

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=3000
MONGODBURL=
GROQ_API=
TAVILY_API_KEY=
NOMIC_API_KEY=
SARVAM_API_KEY=
QDRANT_URL=
QDRANT_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
TEST_API_KEY=            # Razorpay key id
TEST_KEY_SECRET=         # Razorpay key secret
RAZORPAY_WEBHOOK_SECRET=
```

Then start the server:

```bash
node server.js
```

Two things to set up first:

- In Qdrant, create a collection named `medha-ai-documents` with a vector size of **768** (this matches the Nomic embedding size).
- In `server.js`, the CORS origin points to the deployed frontend. For local use, switch it to `http://localhost:5173`.

**3. Frontend**

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

The app will open at `http://localhost:5173`.

---

## Good to know

- Users are identified by a session cookie, so there is no signup or login.
- Payments run in Razorpay test mode, and the plan prices are placeholders for testing. Update the prices and use live keys before going to production.

---

## Author

Built by [Megha](https://github.com/the-coder-aadi).

If you found this useful, a star on the repo is always appreciated. ⭐