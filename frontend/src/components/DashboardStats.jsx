import React from 'react';
import { ListTodo, ClipboardList, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

const DashboardStats = ({ tasks }) => {
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  
  // Overdue count helper
  const overdue = tasks.filter(task => {
    if (!task.dueDate || task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  }).length;

  const statItems = [
    {
      label: 'Total Tasks',
      value: total,
      icon: <ClipboardList size={22} color="#ffffff" />,
      bg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    },
    {
      label: 'Pending',
      value: pending,
      icon: <ListTodo size={22} color="#ffffff" />,
      bg: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: <Activity size={22} color="#ffffff" />,
      bg: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
    },
    {
      label: 'Completed',
      value: completed,
      icon: <CheckCircle2 size={22} color="#ffffff" />,
      bg: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: <AlertTriangle size={22} color="#ffffff" />,
      bg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
    },
  ];

  return (
    <div className="stats-grid">
      {statItems.map((item, idx) => (
        <div key={idx} className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: item.bg }}>
            {item.icon}
          </div>
          <div className="stat-info">
            <span className="stat-value">{item.value}</span>
            <span className="stat-label">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
