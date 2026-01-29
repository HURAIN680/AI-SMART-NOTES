🧠 AI Smart Notes

AI Smart Notes is a smart note-taking app that uses AI to automatically generate titles, summaries, and tags, helping you organize and revisit your notes easily.

⸻

🚀 Live Demo

🔗 Coming Soon

⸻

✨ Features
	•	✍️ Create, edit, delete notes
	•	🤖 AI-generated Title, Summary, and Tags
	•	🔐 Secure authentication (JWT + Refresh Tokens)
	•	⚡ AI processing during note creation
	•	📱 Fully responsive design
	•	🧠 Clean and scalable backend

⸻

🧠 How AI Works
	1.	User creates a note
	2.	Backend sends note content to AI service
	3.	AI generates:
	•	Title
	•	Summary
	•	Tags
	4.	All data is saved in the database
	5.	Frontend fetches and displays results

✅ No separate AI routes → faster and cleaner

⸻

🛠️ Tech Stack

Frontend: React.js, Axios, React Router, Tailwind CSS
Backend: Node.js, Express.js, MongoDB + Mongoose, JWT Authentication
AI: Google Gemini / OpenAI API

📂 Folder Structure
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

Data Security: Notes are stored in MongoDB Atlas with encryption at rest and secure TLS connections.
