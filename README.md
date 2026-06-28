# COLL-EDGE CONNECT | Task Tracker Web Application

A premium, high-fidelity Task Tracker Web Application built with the **MERN Stack** (MongoDB, Express, React, Node.js). This project is submitted as part of the Technical Assignment for the **Full Stack Developer Intern** position.

---

## 🌟 Key Features

- **Full CRUD Operations**: Create, view, update, and delete tasks dynamically with instantaneous frontend updates and zero page refreshes.
- **Form Validation**: Strict client-side validation for character lengths, mandatory inputs, and date checks, coupled with corresponding Mongoose database-level schema constraints.
- **REST APIs**: Structured RESTful endpoints for listing, creating, reading, updating, and deleting tasks.
- **Advanced Query Parameters**:
  - **Dynamic Search**: Instantly filter tasks by typing into the search bar (searches both title and description).
  - **Status Filters**: Filter tasks by status (`Pending`, `In Progress`, `Completed`).
  - **Priority Filters**: Filter tasks by priority (`Low`, `Medium`, `High`).
  - **Sorting**: Sort tasks by creation date, due date, or priority in ascending/descending order.
- **Performance Optimizations**: Implemented a **search input debounce (400ms)** to prevent excessive API requests to the backend while typing.
- **Interactive Analytics Dashboard**: A dedicated dashboard tab with visual metrics representing:
  - Total tasks count.
  - Count of pending tasks.
  - Count of tasks currently in progress.
  - Completed task aggregates.
  - Real-time **Overdue** tracker highlighting task deadlines.
- **Premium Glassmorphic UI**: Highly responsive, responsive layouts, smooth hover animations, dark-themed styling, and clean icons.
- **Floating Toast Notifications**: Contextual success, information, and error notifications for CRUD events.
- **Single-command Coordination**: Integrated workspaces using a root-level `package.json` to boot up the backend and frontend concurrently.

---

## 📂 Project Directory Structure

```text
Task Tracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # MongoDB database connection
│   │   ├── controllers/
│   │   │   └── taskController.js# Express controllers (CRUD, filter, sort logic)
│   │   ├── models/
│   │   │   └── Task.js          # Mongoose schema and database validation
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
│   │   │   ├── DashboardStats.jsx # Analytics metric cards
│   │   │   ├── FilterSortControls.jsx # Controls toolbar (search, sort, filter)
│   │   │   ├── TaskCard.jsx       # Individual task rendering
│   │   │   └── TaskFormModal.jsx  # Creation and Editing modal with validation
│   │   ├── services/
│   │   │   └── api.js           # API fetch wrappers
│   │   ├── App.css              # Unused styles placeholder
│   │   ├── App.jsx              # Main React controller
│   │   ├── index.css            # Custom CSS variables, typography, layouts
│   │   └── main.jsx             # React entry point
│   ├── .env                     # Frontend environment variables
│   ├── .env.example             # Frontend environment template
│   ├── index.html               # HTML container (SEO optimized title/meta tags)
│   └── package.json             # Frontend dependencies
├── package.json                 # Root script coordinator
└── README.md                    # Project submission guide
```

---

## ⚙️ Environment Configurations

### Backend Settings (`backend/.env`)
Create a file named `.env` in the `backend/` directory with the following variables:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/tasktracker
NODE_ENV=development
```
*Note: If `MONGODB_URI` is omitted, the app will fall back to local MongoDB (`mongodb://127.0.0.1:27017/tasktracker`).*

### Frontend Settings (`frontend/.env`)
Create a file named `.env` in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```
*Note: If `VITE_API_URL` is omitted, the frontend will automatically direct requests to `http://localhost:5000/api`.*

---

## 🚀 Running the Application Locally

Follow these three steps to run both the frontend and backend concurrently:

### 1. Clone the repository and navigate to the project directory
```bash
cd "Task Tracker"
```

### 2. Install all dependencies
You can install dependencies for the root coordinator, backend, and frontend at once:
```bash
# Install root developer tools (concurrently)
npm install

# Installs subproject dependencies inside both client and server folders
npm run install-all
```

### 3. Spin up both local servers
Launch the application:
```bash
npm run dev
```
- **Backend API Server**: Runs on [http://localhost:5000](http://localhost:5000)
- **Frontend App client**: Runs on [http://localhost:5173](http://localhost:5173)

---

## 🔌 REST API Documentation

All requests support and expect JSON body inputs.

| Method | Endpoint | Description | Query Parameters (Optional) |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/tasks` | Fetch list of tasks | `search` (text), `status` (`pending` / `in-progress` / `completed`), `priority` (`low` / `medium` / `high`), `sortBy` (`createdAt` / `dueDate` / `priority`), `sortOrder` (`asc` / `desc`) |
| **GET** | `/api/tasks/:id` | Get details of a single task | None |
| **POST** | `/api/tasks` | Create a new task document | Requires JSON body |
| **PUT** | `/api/tasks/:id` | Update properties of an existing task | Requires JSON body |
| **DELETE**| `/api/tasks/:id` | Permanently remove a task document | None |

### Task Schema Details (JSON)
When creating (`POST`) or updating (`PUT`) a task, pass the following JSON format:
```json
{
  "title": "Build user auth API",
  "description": "Develop signup and signin handlers using bcrypt and JWT.",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-07-05T00:00:00.000Z"
}
```

---

## 🌐 Deployment Guidelines

### Backend Deployment (e.g. Render / Railway / Heroku)
1. Set the root directory of the build to `backend` or use the subfolder.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set environment variables on the hosting platform:
   - `PORT`: `10000` (or whatever the host provides)
   - `MONGODB_URI`: Connect to a MongoDB Atlas cluster URI.
   - `NODE_ENV`: `production`

### Frontend Deployment (e.g. Vercel / Netlify)
1. Connect your GitHub repository to Vercel/Netlify.
2. Set the root directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Set environment variables:
   - `VITE_API_URL`: Your deployed backend URL + `/api` (e.g. `https://your-backend-app.onrender.com/api`)
