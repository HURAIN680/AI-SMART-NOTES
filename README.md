# 🧠 AI Smart Notes

> A smart note-taking app powered by AI that automatically generates titles, summaries, and tags to help you organize and revisit your notes effortlessly.

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=for-the-badge)](https://ai-smart-notes-frontend.onrender.com/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

<div align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind" />
</div>

---

## 🌟 Overview

AI Smart Notes revolutionizes note-taking by leveraging artificial intelligence to automatically organize your thoughts. Simply write your notes, and our AI will generate meaningful titles, concise summaries, and relevant tags—making it easier than ever to find and revisit your ideas.

### 🔗 Quick Links

- **Live Demo:** [https://ai-smart-notes-frontend.onrender.com/](https://ai-smart-notes-frontend.onrender.com/)
- **Report Bug:** [Issues](https://github.com/yourusername/ai-smart-notes/issues)

---

## ✨ Key Features

### 📝 Core Functionality
- **Create, Edit, Delete Notes** — Full CRUD operations with a clean interface
- **AI-Powered Metadata** — Automatically generated titles, summaries, and tags
- **Smart Organization** — Find notes quickly with AI-generated tags and summaries
- **Rich Text Support** — Write formatted notes with ease

### 🔐 Security & Performance
- **JWT Authentication** — Secure user authentication with access and refresh tokens
- **Session Management** — Automatic token refresh for seamless user experience

### 🎨 User Experience
- **Fully Responsive Design** — Works seamlessly on desktop, tablet, and mobile
- **Real-time AI Processing** — AI metadata generation during note creation
- **Intuitive Interface** — Clean, modern UI built with Tailwind CSS
- **Fast Performance** — Optimized backend architecture for quick responses

---

## 🧠 How AI Works

Our AI integration is designed for simplicity and efficiency:

```
┌─────────────┐
│ User writes │
│   a note    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Backend receives│
│  note content   │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│  AI Service      │
│  (Grok API)      │
│  processes text  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ AI generates:    │
│ • Title          │
│ • Summary        │
│ • Tags           │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Data saved to    │
│ MongoDB          │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Frontend fetches │
│ and displays     │
└──────────────────┘
```

**Key Benefits:**
- ✅ No separate AI endpoints — integrated into note creation flow
- ✅ Faster processing — AI runs during creation, not as separate step
- ✅ Cleaner architecture — Single API call handles everything
- ✅ Better UX — Users see AI results immediately

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React.js** | UI framework for building interactive components |
| **React Router** | Client-side routing and navigation |
| **Axios** | HTTP client for API requests |
| **Tailwind CSS** | Utility-first CSS framework for styling |
| **Vite** | Fast build tool and development server |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime environment |
| **Express.js** | Web application framework |
| **MongoDB** | NoSQL database for flexible data storage |
| **Mongoose** | ODM for MongoDB with schema validation |
| **JWT** | Secure token-based authentication |
| **bcrypt** | Password hashing and encryption |

### AI & Services
| Technology | Purpose |
|------------|---------|
| **Grok API** | AI model for generating metadata |
| **MongoDB Atlas** | Cloud database with built-in security |

---

## 📂 Project Structure

```
ai-smart-notes/
│
├── client/                      # Frontend React application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── NoteCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ...
│   │   ├── pages/               # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── CreateNote.jsx
│   │   ├── api/                 # API service layer
│   │   │   └── axios.js
│   │   ├── utils/               # Helper functions
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Backend Node.js application
│   ├── controllers/             # Request handlers
│   │   ├── authController.js
│   │   └── noteController.js
│   ├── models/                  # Database schemas
│   │   ├── User.js
│   │   └── Note.js
│   ├── routes/                  # API routes
│   │   ├── auth.js
│   │   └── notes.js
│   ├── services/                # Business logic
│   │   └── aiService.js         # AI integration
│   ├── middleware/              # Custom middleware
│   │   └── authMiddleware.js
│   ├── config/                  # Configuration files
│   │   └── database.js
│   ├── .env                     # Environment variables
│   ├── server.js                # Entry point
│   └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- **Grok API Key** - [Get API Key](https://grok.x.ai/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-smart-notes.git
   cd ai-smart-notes
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `server/` directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=your_mongodb_atlas_connection_string
   
   # JWT Secrets
   JWT_SECRET=your_super_secret_jwt_key
   JWT_REFRESH_SECRET=your_super_secret_refresh_key
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d
   
   # AI Service
   GROK_API_KEY=your_grok_api_key
   GROK_API_URL=https://api.x.ai/v1
   
   # Frontend URL (for CORS)
   CLIENT_URL=http://localhost:5173
   ```

5. **Start the development servers**
   
   **Backend:**
   ```bash
   cd server
   npm run dev
   ```
   
   **Frontend (in a new terminal):**
   ```bash
   cd client
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:5173`

---

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### Notes Endpoints

#### Create Note (with AI)
```http
POST /api/notes
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "Your note content here..."
}
```

**Response:**
```json
{
  "success": true,
  "note": {
    "_id": "note_id",
    "title": "AI-generated title",
    "content": "Your note content here...",
    "summary": "AI-generated summary",
    "tags": ["tag1", "tag2", "tag3"],
    "createdAt": "2026-01-29T10:00:00.000Z"
  }
}
```

#### Get All Notes
```http
GET /api/notes
Authorization: Bearer {access_token}
```

#### Update Note
```http
PUT /api/notes/{note_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "Updated content"
}
```

#### Delete Note
```http
DELETE /api/notes/{note_id}
Authorization: Bearer {access_token}
```

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based Authentication** — Stateless, secure token system
- **Refresh Token Rotation** — Enhanced security with automatic token refresh
- **Password Hashing** — bcrypt with salt rounds for secure password storage
- **Protected Routes** — Middleware-based route protection

### Data Security
- **Encryption at Rest** — MongoDB Atlas encryption for stored data
- **TLS/SSL Connections** — All data transmitted over HTTPS
- **Environment Variables** — Sensitive data kept in .env files
- **CORS Configuration** — Controlled cross-origin access
- **Input Validation** — Server-side validation to prevent injection attacks

### Best Practices
- **No Sensitive Data in Client** — API keys and secrets server-side only
- **Rate Limiting** — (Recommended to add) Prevent abuse
- **SQL Injection Prevention** — Mongoose ODM provides protection
- **XSS Prevention** — React's built-in protection

---

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- [React](https://react.dev/) - Frontend framework
- [Express.js](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Grok AI](https://grok.x.ai/) - AI service
- [Render](https://render.com/) - Hosting platform


