# EDGEBOARD | Task Tracker Web Application

A premium, high-fidelity Task Tracker Web Application built with the **MERN Stack** (MongoDB, Express, React, Node.js). This project is built as a state-of-the-art task management portal with complete user scoping, real-time analytics, and visual time-tracking mechanics.

---

## 🌟 Key Features

- **User Authentication & Session Scoping**:
  - Secure login and registration flows with validation and feedback.
  - User initials auto-generation (`AR`, `VW`, etc.) displayed in the premium sidebar.
  - Multi-user data isolation: tasks are strictly filtered and queried by user email via dynamic request headers (`X-User-Email`).
  - Rotated `Back to Home` navigation links to easily jump between login, signup, and the landing page.
- **Task Timer & Productivity Analytics**:
  - Real-time **Start/Stop active timers** directly on the task cards.
  - Visual blinking indicators and live counting formats (`00h 00m 00s`) for active tasks.
  - Tracked time is saved directly to MongoDB in milliseconds, preventing data loss.
  - Safeguarded against edits: updating task descriptions/due dates preserves accumulated time metrics.
- **Interactive Analytics Dashboard**:
  - **Tasks by Status Distribution**: Interactive Recharts Pie chart outlining task status shares.
  - **Tasks by Category**: Bar charts plotting total tasks against completed counts per category.
  - **Productive Hours spent by Category**: Live bar chart mapping total cumulative tracked hours per category that updates dynamically in real-time.
  - **Weekly Task Volume & Trends**: Trend lines tracking backlog counts vs. completed task speeds.
- **Advanced Query Filters & Debouncing**:
  - **Dynamic Search**: Filter tasks by title or description with a 400ms debounce on keystrokes.
  - **Status, Category, & Priority Filters**: Clean inline dropdown components to slice and dice your board.
- **Premium User Interface (Aesthetics)**:
  - Custom fluid neon cursor follow-animation.
  - Glassmorphic spotlight cards (`SpotlightCard`), glowing buttons, and hover state transitions.
  - Smooth light/dark theme toggle shifting the page from a deep space canvas to a crisp light layout.
- **Auto-Seeding**:
  - Includes a backend database seeding mechanism (`seed.js`) that boots default tasks for first-time developers when the task collection is empty.

---

## 📂 Project Directory Structure

```text
Task Tracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # MongoDB database connection
│   │   │   └── seed.js          # Auto-seeding mock tasks script
│   │   ├── controllers/
│   │   │   └── taskController.js# CRUD controllers (user scoping, filter, sort logic)
│   │   ├── models/
│   │   │   └── Task.js          # Mongoose schema (client, timeTracked, timerStartedAt)
│   │   ├── routes/
│   │   │   └── taskRoutes.js    # REST endpoints mapping
│   │   └── server.js            # Express entry point
│   ├── .env                     # Environment variables (local)
│   ├── .env.example             # Environment template
│   └── package.json             # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── assets/              # Standard static assets
│   │   ├── components/
│   │   │   └── TargetCursor/    # Neon pointer follow animation
│   │   ├── services/
│   │   │   └── api.ts           # Axios client & request headers configuration
│   │   ├── styles/
│   │   │   ├── theme.css        # Color scheme variables
│   │   │   └── tailwind.css     # Tailwind v4 import
│   │   ├── app/
│   │   │   └── App.tsx          # Main React Single-Page Application (Landing, Auth, Dashboard, Analytics, Board)
│   │   └── main.tsx             # React entry point
│   ├── .env                     # Frontend environment variables
│   ├── index.html               # HTML entry container (SEO optimized tags)
│   ├── vite.config.ts           # Vite + Tailwind compiler plugins
│   └── package.json             # Frontend dependencies
├── package.json                 # Root script coordinator
└── README.md                    # Project documentation
```

---

## ⚙️ Environment Configurations

### Backend Settings (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/tasktracker
NODE_ENV=development
```
*If `MONGODB_URI` is omitted, the server automatically defaults to `mongodb://127.0.0.1:27017/tasktracker`.*

### Frontend Settings (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Running the Application Locally

Follow these steps to set up the development workspace:

### 1. Navigate to the project directory
```bash
cd "Task Tracker"
```

### 2. Install all dependencies
Installs the concurrent runner for workspaces and subproject dependencies:
```bash
# Install root workspaces dependencies
npm install

# Installs subproject dependencies for backend & frontend
npm run install-all
```

### 3. Start local development servers
```bash
npm run dev
```
- **Backend API Server**: Runs on [http://localhost:5000](http://localhost:5000)
- **Frontend App Client**: Runs on [http://localhost:5174](http://localhost:5174) (auto-fallback if port 5173 is occupied)

---

## 🔌 REST API Documentation

All request endpoints expect and return JSON. Endpoints are secured by the **`X-User-Email`** header for secure multi-tenant isolation.

| Method | Endpoint | Description | Expected Headers / Query Params |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/tasks` | Fetch list of tasks | Header: `X-User-Email` <br> Query: `search`, `status`, `priority`, `sortBy`, `sortOrder` |
| **GET** | `/api/tasks/:id` | Get details of a single task | Header: `X-User-Email` |
| **POST** | `/api/tasks` | Create a new task document | Header: `X-User-Email` <br> Body: JSON |
| **PUT** | `/api/tasks/:id` | Update properties of a task | Header: `X-User-Email` <br> Body: JSON |
| **DELETE**| `/api/tasks/:id` | Delete task document | Header: `X-User-Email` |

### Task Model Sample Structure (JSON)
```json
{
  "title": "Build Real-time Analytics Tracker",
  "client": "creative",
  "description": "Implement Recharts visualization for productive time tracked by category.",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-07-01",
  "tags": ["frontend", "charts", "analytics"],
  "timeTracked": 3600000,
  "timerStartedAt": "2026-06-28T15:00:00.000Z"
}
```

---

## 🌐 Deployment Guidelines

### Backend Deployment (e.g. Render / Railway / Heroku)
1. Set the root directory of the build to `backend`.
2. Build Command: `npm install`
3. Start Command: `node src/server.js`
4. Set platform environment variables:
   - `PORT`: `10000` (or provided port)
   - `MONGODB_URI`: Connect to a MongoDB Atlas cluster URI.
   - `NODE_ENV`: `production`

### Frontend Deployment (e.g. Vercel / Netlify)
1. Connect the GitHub repository to the platform.
2. Set the root directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Set environment variables:
   - `VITE_API_URL`: Your deployed backend URL + `/api` (e.g. `https://your-backend-app.onrender.com/api`)
