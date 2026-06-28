const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'Something went wrong';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // JSON parsing failed
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const taskService = {
  async getTasks(params = {}) {
    const query = new URLSearchParams();
    
    if (params.status && params.status !== 'all') {
      query.append('status', params.status);
    }
    
    if (params.priority && params.priority !== 'all') {
      query.append('priority', params.priority);
    }
    
    if (params.search) {
      query.append('search', params.search);
    }
    
    if (params.sortBy) {
      query.append('sortBy', params.sortBy);
    }
    
    if (params.sortOrder) {
      query.append('sortOrder', params.sortOrder);
    }

    const queryString = query.toString();
    const url = `${API_URL}/tasks${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    return handleResponse(response);
  },

  async getTaskById(id) {
    const response = await fetch(`${API_URL}/tasks/${id}`);
    return handleResponse(response);
  },

  async createTask(taskData) {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    return handleResponse(response);
  },

  async updateTask(id, taskData) {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    return handleResponse(response);
  },

  async deleteTask(id) {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};
