import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TaskFormModal = ({ isOpen, onClose, onSubmit, taskToEdit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  
  // Validation errors state
  const [errors, setErrors] = useState({});

  // Sync state if editing a task
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setStatus(taskToEdit.status || 'pending');
      setPriority(taskToEdit.priority || 'medium');
      setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.substring(0, 10) : '');
      setErrors({});
    } else {
      // Clear fields for new task
      setTitle('');
      setDescription('');
      setStatus('pending');
      setPriority('medium');
      setDueDate('');
      setErrors({});
    }
  }, [taskToEdit, isOpen]);

  // Form submit validation handler
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Perform client-side validation
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }

    if (description && description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Call onSubmit parent method
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || null
    });
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{taskToEdit ? 'Edit Task' : 'Create Task'}</h2>
          <button className="action-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title Field */}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className={`form-input ${errors.title ? 'error-border' : ''}`}
              placeholder="e.g. Implement user login API"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              required
            />
            {errors.title && <p className="error-message">{errors.title}</p>}
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className={`form-input ${errors.description ? 'error-border' : ''}`}
              placeholder="Provide a brief explanation of the task..."
              rows="3"
              style={{ resize: 'vertical' }}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
            />
            {errors.description && <p className="error-message">{errors.description}</p>}
          </div>

          {/* Status & Priority Row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Due Date Field */}
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Modal Buttons */}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn">
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
