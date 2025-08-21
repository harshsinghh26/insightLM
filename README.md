# 📘 InsightLM

InsightLM is a lightweight version of **NotebookLM**, built as a personal learning and research tool.  
It allows you to **upload PDFs, paste raw text, or add website links** to generate insights and manage your notes efficiently.

---

## 🚀 Features
- 📂 Upload PDF documents for processing  
- 📝 Paste raw text to analyze or save as notes  
- 🌐 Provide website links for quick reference  
- ⚡ Organized **Frontend (React + Vite)** and **Backend (Node.js/Express, Docker)** structure  
- 🔄 API integration between frontend and backend  

---

## 🛠️ Tech Stack
### Frontend
- React.js (with Vite)  
- TailwindCSS
- Hooks & Components architecture  

### Backend
- Node.js & Express  
- Docker (for containerization)  
- File upload & parsing support  

---

## 📂 Folder Structure

InsightLM/
- │── Backend/              # Node.js backend
- │   ├── uploads/          # Uploaded files
- │   ├── .env              # Environment variables
- │   ├── docker-compose.yml
- │   ├── server.js         # Express server entry
- │   ├── package.json
- │
- │── Frontend/             # React frontend
- │   ├── public/           # Static assets
- │   ├── src/              # Source code
- │   │   ├── components/   # Reusable components
- │   │   ├── hooks/        # Custom hooks
- │   │   ├── pages/        # Page views
- │   │   ├── App.tsx
- │   │   ├── main.tsx
- │   ├── package.json
- │   ├── vite.config.js
- │
- │── README.md


---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (>= 18)  
- Docker (optional, for containerized backend)  

### Backend Setup
```bash
cd Backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

##🖥️ Usage
	- 1. Run the backend server (npm run dev inside Backend/).
	- 2. Run the frontend client (npm run dev inside Frontend/).
	- 3. Open your browser at http://localhost:5173 (Vite default).
	- 4. Upload a PDF, paste text, or provide a website link to get insights.
