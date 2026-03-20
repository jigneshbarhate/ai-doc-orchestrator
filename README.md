# 🚀 AI-Powered Document Orchestrator

**AI-Powered Document Orchestrator** is a full-stack MERN application that allows users to upload documents (`.pdf`, `.txt`), ask analytical questions, automatically extract structured insights using the **Groq AI API**, and dynamically trigger downstream conditional email workflows through **n8n**. It also features an interactive chat interface to converse with the document after the initial extraction.

---

## 🌟 Key Features
- **Intelligent Data Extraction:** Upload PDF or Text files and extract custom key-value pairs purely based on natural language queries.
- **Interactive Document Chat:** Ask endless follow-up questions directly within the UI, keeping the document's context entirely memory-resident.
- **n8n Email Workflow Automation:** Trigger a configurable webhook endpoint that compiles the document data and chat transcript, sending a beautifully formatted final email directly to an inbox of your choice via n8n's Gmail integration.

---

## ⚙️ Technology Stack
- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **AI Processing:** [Groq Cloud](https://console.groq.com/) (Model: `llama-3.1-8b-instant`)
- **Workflow Automation:** [n8n](https://n8n.io/)
- **File Parsing:** `multer`, `pdf-parse`

---

## 💻 Local Installation & Setup

### 1. Prerequisites
- Node.js (v16+)
- A [Groq API Key](https://console.groq.com/keys)
- An active n8n instance (Cloud or Self-hosted)

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/ai-doc-orchestrator.git
cd ai-doc-orchestrator
```

### 3. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
```
Start the backend:
```bash
npm start
```

### 4. Frontend Setup
Open a new terminal and navigate to the client folder.
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory:
```env
REACT_APP_BACKEND_URL=http://localhost:5000
```
Start the frontend:
```bash
npm start
```

---

## 🤖 n8n Workflow Configuration
This project includes a fully robust n8n workflow file.
1. Open your n8n dashboard.
2. Create a new Workflow.
3. Select "Import from URL" or "Import from File" and use the exact logic provided in your `n8n-workflow.json`.
4. Configure the **Gmail Node** by linking your Gmail Credentials to cleanly process emails.
5. Grab the **Production Webhook URL** inside the Webhook node. Make sure this URL is used as an environment variable or tracked efficiently if you decide to alter it!

---

## 🌐 Deployment
This application is designed to be effortlessly deployed across Vercel and Render.

### Backend (Render)
1. Link the repository to Render as a Web Service.
2. Set the Root Directory to `server`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Map the `GROQ_API_KEY` in Environment Variables.

### Frontend (Vercel)
1. Link the repository to Vercel.
2. Set the Root Directory to `client`.
3. Add the `REACT_APP_BACKEND_URL` environment variable containing the live Render endpoint URL.
4. Deploy!

