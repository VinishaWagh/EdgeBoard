import { Task } from '../app/App';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getUserEmail = (): string => {
  return localStorage.getItem('user_email') || '';
};

const getAuthHeaders = (extraHeaders: Record<string, string> = {}): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'X-User-Email': getUserEmail(),
    ...extraHeaders
  };
};

const handleResponse = async (response: Response) => {
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

export const mapTaskFromBackend = (t: any): Task => {
  return {
    id: t._id || t.id,
    title: t.title,
    client: t.client || '',
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate || '',
    tags: t.tags || [],
    assigneeIds: t.assigneeIds || [],
    description: t.description || '',
    activity: t.activity || []
  };
};

export const taskService = {
  async getTasks(params: { status?: string; priority?: string; search?: string; sortBy?: string; sortOrder?: string } = {}): Promise<Task[]> {
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
    
    const response = await fetch(url, {
      headers: {
        'X-User-Email': getUserEmail()
      }
    });
    const data = await handleResponse(response);
    return data.map(mapTaskFromBackend);
  },

  async getTaskById(id: string): Promise<Task> {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      headers: {
        'X-User-Email': getUserEmail()
      }
    });
    const data = await handleResponse(response);
    return mapTaskFromBackend(data);
  },

  async createTask(taskData: Omit<Task, 'id'>): Promise<Task> {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    const data = await handleResponse(response);
    return mapTaskFromBackend(data);
  },

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData),
    });
    const data = await handleResponse(response);
    return mapTaskFromBackend(data);
  },

  async deleteTask(id: string): Promise<{ id: string; message: string }> {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'X-User-Email': getUserEmail()
      }
    });
    return handleResponse(response);
  },
};

export const authService = {
  async register(name: string, email: string, password: string): Promise<{ name: string; email: string }> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    return handleResponse(response);
  },

  async login(email: string, password: string): Promise<{ name: string; email: string }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
  }
};
