import React from 'react';
import { Calendar, Trash2, Edit, CheckCircle, Clock, Circle, Play } from 'lucide-react';

const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const { _id, title, description, status, priority, dueDate } = task;

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Check if task is overdue
  const isOverdue = () => {
    if (!dueDate || status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  // Get status transition configurations
  const renderQuickStatusButton = () => {
    if (status === 'pending') {
      return (
        <button
          className="action-btn"
          onClick={() => onStatusChange(_id, 'in-progress')}
          title="Start Task"
        >
          <Play size={16} className="text-inprogress" />
        </button>
      );
    }
    if (status === 'in-progress') {
      return (
        <button
          className="action-btn"
          onClick={() => onStatusChange(_id, 'completed')}
          title="Complete Task"
        >
          <CheckCircle size={16} className="text-completed" />
        </button>
      );
    }
    if (status === 'completed') {
      return (
        <button
          className="action-btn"
          onClick={() => onStatusChange(_id, 'pending')}
          title="Reopen Task"
        >
          <Circle size={16} className="text-pending" />
        </button>
      );
    }
    return null;
  };

  return (
    <div className={`task-card ${status}`}>
      <div className="task-header">
        <h3 className={`task-title ${status === 'completed' ? 'line-through' : ''}`}>
          {title}
        </h3>
      </div>
      
      <div className="task-badges">
        <span className={`badge status-${status}`}>
          {status === 'in-progress' ? 'In Progress' : status}
        </span>
        <span className={`badge priority-${priority}`}>
          {priority} Priority
        </span>
      </div>

      {description && <p className="task-description">{description}</p>}

      <div className="task-footer">
        <div className={`task-due-date ${isOverdue() ? 'overdue' : ''}`}>
          <Calendar size={14} />
          <span>
            {dueDate ? formatDate(dueDate) : 'No due date'}
            {isOverdue() && ' (Overdue)'}
          </span>
        </div>

        <div className="task-actions">
          {renderQuickStatusButton()}
          
          <button
            className="action-btn"
            onClick={() => onEdit(task)}
            title="Edit Task"
          >
            <Edit size={16} />
          </button>
          
          <button
            className="action-btn btn-delete"
            onClick={() => onDelete(_id)}
            title="Delete Task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
