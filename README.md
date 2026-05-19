# TaskFlow — Task Management Application

A full-stack task management web app with user authentication, CRUD operations, real-time WebSocket updates, and a responsive UI for desktop and mobile.

**Due date:** 02 Jun 2026

## Features

- **Authentication** — Register, login, JWT-based sessions; each user only sees their own tasks
- **Task CRUD** — Create, read, update, and delete tasks with title, description, status, priority, and due date
- **Real-time sync** — Socket.io broadcasts task changes instantly across tabs/devices
- **Responsive design** — Mobile-first layout with adaptive grids and touch-friendly controls

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 19, Vite, React Router        |
| Backend  | Node.js, Express                    |
| Database | SQLite (better-sqlite3)             |
| Auth     | JWT + bcrypt                        |
| Realtime | Socket.io                           |

## Project Structure

```
task-management-app/
├── backend/          # Express API + WebSocket server
│   └── src/
│       ├── routes/   # auth & tasks endpoints
│       ├── middleware/
│       └── db.js     # SQLite schema
└── frontend/         # React SPA
    └── src/
        ├── components/
        ├── context/  # Auth state
        └── hooks/    # WebSocket hook
```

## Getting Started

### Prerequisites

- Node.js 18+

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

Copy `backend/.env.example` to `backend/.env` and set a strong `JWT_SECRET` for production.

### 3. Run the app

**Terminal 1 — API server:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## API Reference

| Method | Endpoint           | Auth | Description        |
|--------|--------------------|------|--------------------|
| POST   | `/api/auth/register` | No   | Create account     |
| POST   | `/api/auth/login`    | No   | Sign in            |
| GET    | `/api/auth/me`       | Yes  | Current user       |
| GET    | `/api/tasks`         | Yes  | List tasks (filters: `status`, `priority`, `search`) |
| POST   | `/api/tasks`         | Yes  | Create task        |
| PUT    | `/api/tasks/:id`     | Yes  | Update task        |
| DELETE | `/api/tasks/:id`     | Yes  | Delete task        |

## WebSocket Events

Connect with `auth: { token: <JWT> }`. Events per user room:

- `task:created` — new task payload
- `task:updated` — updated task payload
- `task:deleted` — `{ id }` of removed task

## Learning Outcomes

This project demonstrates:

1. **Full-stack structure** — Separate client/server with REST API and shared auth
2. **API integration** — Fetch-based client with token headers and error handling
3. **Dynamic data** — React state, filters, optimistic updates, and live Socket.io sync
