# 🧠 AI Smart Notes

> **AI Smart Notes** is a full-stack note-taking application that automatically generates **titles, summaries, and tags** using AI — helping users organize and revisit notes effortlessly.

---

## 🚀 Live Demo
🔗 _Coming Soon_

---

## ✨ Features

- ✍️ Create, edit, delete notes
- 🤖 AI-generated **Title**, **Summary**, and **Tags**
- 🔐 Secure authentication (JWT + Refresh Tokens)
- ⚡ AI processing during note creation (no extra AI routes)
- 📱 Fully responsive UI
- 🧠 Clean & scalable backend architecture

---

## 🧠 AI Workflow (Key Highlight)

AI logic is handled **entirely on the backend**.

**Flow:**
1. User creates a note
2. Backend sends note content to AI service
3. AI generates:
   - Title
   - Summary
   - Tags
4. All data is stored in the database
5. Frontend only fetches and displays results  

✅ No separate `/api/ai/*` routes  
✅ Faster frontend  
✅ Cleaner architecture  

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Axios
- React Router
- CSS / Tailwind CSS

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication

### AI
- Google Gemini / OpenAI API
- Custom AI service layer

---

## 📂 Folder Structure

```bash
ai-smart-notes/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   ├── App.jsx
│   │   └── main.jsx
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/      # AI logic
│   ├── middleware/
│   └── server.js
│
└── README.md
