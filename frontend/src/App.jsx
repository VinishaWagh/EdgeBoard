import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Info, 
  Plus, 
  X, 
  Loader2, 
  AlertCircle,
  Database,
  Globe,
  Code2
} from 'lucide-react';
import { taskService } from './services/api';
import DashboardStats from './components/DashboardStats';
import FilterSortControls from './components/FilterSortControls';
import TaskCard from './components/TaskCard';
import TaskFormModal from './components/TaskFormModal';

function App() {
  // Navigation Tabs: 'dashboard' | 'board' | 'about'
  const [activeTab, setActiveTab] = useState('board');
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Controls state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // Toast Notifications state
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 4000 / 10); // 400ms debounce
    return () => clearTimeout(timer);
  }, [search]);

  // Load tasks from backend
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskService.getTasks({
        status: statusFilter,
        priority: priorityFilter,
        search: debouncedSearch,
        sortBy,
        sortOrder
      });
      setTasks(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve tasks. Please verify your connection to the database.');
      showToast('Error loading tasks from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, debouncedSearch, sortBy, sortOrder, showToast]);

  // Fetch tasks when parameters change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handle task creation or update
  const handleSaveTask = async (taskData) => {
    try {
      if (taskToEdit) {
        // Edit mode
        const updated = await taskService.updateTask(taskToEdit._id, taskData);
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        showToast('Task updated successfully!', 'success');
      } else {
        // Create mode
        const created = await taskService.createTask(taskData);
        setTasks((prev) => [created, ...prev]);
        showToast('Task created successfully!', 'success');
      }
      setIsModalOpen(false);
      setTaskToEdit(null);
    } catch (err) {
      showToast(err.message || 'Error saving task', 'error');
    }
  };

  // Handle quick status changes
  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await taskService.updateTask(id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
      showToast(`Task status updated to ${newStatus.replace('-', ' ')}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this task?')) {
      try {
        await taskService.deleteTask(id);
        setTasks((prev) => prev.filter((t) => t._id !== id));
        showToast('Task deleted successfully!', 'success');
      } catch (err) {
        showToast(err.message || 'Error deleting task', 'error');
      }
    }
  };

  // Open modal for task creation
  const handleAddTaskClick = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditClick = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">C</div>
          <span className="brand-name">COLL-EDGE</span>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <a 
                className={`nav-link ${activeTab === 'board' ? 'active' : ''}`}
                onClick={() => setActiveTab('board')}
              >
                <ClipboardList size={18} />
                <span>Task Board</span>
              </a>
            </li>
            <li>
              <a 
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard Stats</span>
              </a>
            </li>
            <li>
              <a 
                className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => setActiveTab('about')}
              >
                <Info size={18} />
                <span>System Specs</span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <p>© 2026 COLL-EDGE Connect</p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>Full Stack Intern Project</p>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="main-panel">
        
        {/* Topbar Header */}
        <header className="topbar">
          <div className="topbar-title">
            {activeTab === 'board' && (
              <>
                <h1>Task Tracker</h1>
                <p>Manage, prioritize, and complete your projects dynamically.</p>
              </>
            )}
            {activeTab === 'dashboard' && (
              <>
                <h1>Task Analytics</h1>
                <p>Monitor completion stats, overdue flags, and pending work.</p>
              </>
            )}
            {activeTab === 'about' && (
              <>
                <h1>Project Specifications</h1>
                <p>Technical Architecture and MERN guidelines details.</p>
              </>
            )}
          </div>
        </header>

        {/* Loading Overlay/Spinner */}
        {loading && tasks.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '1rem' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Syncing with database...</p>
          </div>
        )}

        {/* Error Alert Bar */}
        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '12px', 
            padding: '1rem 1.25rem', 
            color: '#f87171', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '2rem'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab content rendering */}
        {!loading && activeTab === 'dashboard' && (
          <DashboardStats tasks={tasks} />
        )}

        {activeTab === 'board' && (
          <>
            {/* Filter, Sort & Search Toolbar */}
            <FilterSortControls 
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              onAddTaskClick={handleAddTaskClick}
            />

            {/* Task list display */}
            {loading && tasks.length > 0 && (
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Refreshing tasks...</p>
            )}

            {tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <ClipboardList size={32} />
                </div>
                <h3>No tasks found</h3>
                <p>
                  {search || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'No tasks match your current filter parameters.'
                    : 'Get started by creating your very first task right now!'}
                </p>
                <button className="btn" onClick={handleAddTaskClick}>
                  <Plus size={16} />
                  <span>Create Task</span>
                </button>
              </div>
            ) : (
              <div className="tasks-grid">
                {tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'about' && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '800px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>COLL-EDGE CONNECT</h2>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--primary)' }}>Full Stack Developer Technical Assignment</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
                This Task Tracker Web Application was engineered to fulfill the requirements of the intern assessment. It implements a complete MERN (MongoDB, Express, React, Node) stack with robust server-side routing, query filter support, and a responsive frontend user interface.
              </p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code2 size={18} color="var(--primary)" /> Tech Stack Detail
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ color: 'var(--text-primary)', width: '120px' }}>Frontend:</strong> React 19, Vite (bundling), Lucide Icons, Custom CSS Variables
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ color: 'var(--text-primary)', width: '120px' }}>Backend:</strong> Node.js, Express.js (REST APIs, CORS configuration, JSON parsers)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ color: 'var(--text-primary)', width: '120px' }}>Database:</strong> MongoDB via Mongoose Object Modeling
                </li>
              </ul>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={18} color="var(--primary)" /> API Handlers
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <li><code>GET /api/tasks</code> - List tasks with query support for filters, sorting, and text searching</li>
                <li><code>POST /api/tasks</code> - Register a task (validators: title required, min length 3)</li>
                <li><code>GET /api/tasks/:id</code> - Retrieve single task document</li>
                <li><code>PUT /api/tasks/:id</code> - Update fields dynamically with mongoose validators</li>
                <li><code>DELETE /api/tasks/:id</code> - Remove document</li>
              </ul>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)' }} />

            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={18} color="var(--primary)" /> Deployment Preparation
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Both components are fully configurable using environment variables (`.env`). The server runs on custom ports, and the frontend connects dynamically. Production build bundles can be generated via <code>npm run build</code> in the frontend, suitable for Netlify/Vercel hosting, while the Node server can be launched directly on Render/Railway.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Task Creation & Update Modal Dialog */}
      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
        onSubmit={handleSaveTask}
        taskToEdit={taskToEdit}
      />

      {/* Floating Toast Alerts Container */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span className="toast-message">{toast.message}</span>
            <button 
              className="toast-close" 
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Close alert"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
