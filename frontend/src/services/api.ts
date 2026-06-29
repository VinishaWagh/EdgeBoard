import { Task } from '../app/App';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();

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

const handleResponse = async (response: Response, url: string) => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} (${response.statusText || 'Error'}) from ${url}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // JSON parsing failed, likely HTML or raw text
      try {
        const text = await response.clone().text();
        if (text && text.trim().startsWith('<!DOCTYPE html>')) {
          errorMessage = `HTTP ${response.status}: Received HTML instead of JSON. This usually indicates that the backend API URL is misconfigured, or the API route was not found (Url: ${url})`;
        } else if (text && text.length < 150) {
          errorMessage = `HTTP ${response.status}: ${text} (Url: ${url})`;
        }
      } catch (_) {}
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

const customFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  try {
    return await fetch(url, options);
  } catch (err: any) {
    console.error("Network Fetch Error:", err);
    throw new Error(`Failed to reach the API server at: ${url}. Please check if the backend is running and your network / CORS is configured.`);
  }
};

export const mapTaskFromBackend = (t: any): Task => {
  // Defensive normalization of category: map 'client' from DB if present, default to 'work'
  let dbCategory = 'work';
  if (t.client) {
    const rawClient = t.client.toLowerCase();
    if (['work', 'personal', 'health', 'learning', 'finance', 'creative'].includes(rawClient)) {
      dbCategory = rawClient;
    }
  }
  
  return {
    id: t._id || t.id,
    title: t.title || 'Untitled Task',
    category: dbCategory as any,
    priority: t.priority || 'medium',
    status: t.status || 'pending',
    dueDate: t.dueDate || '',
    tags: t.tags || [],
    description: t.description || '',
    activity: t.activity || [],
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    timeTracked: t.timeTracked || 0,
    timerStartedAt: t.timerStartedAt || ''
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
    
    const response = await customFetch(url, {
      headers: {
        'X-User-Email': getUserEmail()
      }
    });
    const data = await handleResponse(response, url);
    return data.map(mapTaskFromBackend);
  },

  async getTaskById(id: string): Promise<Task> {
    const url = `${API_URL}/tasks/${id}`;
    const response = await customFetch(url, {
      headers: {
        'X-User-Email': getUserEmail()
      }
    });
    const data = await handleResponse(response, url);
    return mapTaskFromBackend(data);
  },

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const { category, ...rest } = taskData as any;
    const body = {
      ...rest,
      client: category
    };
    const url = `${API_URL}/tasks`;
    const response = await customFetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await handleResponse(response, url);
    return mapTaskFromBackend(data);
  },

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const { category, ...rest } = taskData as any;
    const body = {
      ...rest,
      ...(category !== undefined ? { client: category } : {})
    };
    const url = `${API_URL}/tasks/${id}`;
    const response = await customFetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await handleResponse(response, url);
    return mapTaskFromBackend(data);
  },

  async deleteTask(id: string): Promise<{ id: string; message: string }> {
    const url = `${API_URL}/tasks/${id}`;
    const response = await customFetch(url, {
      method: 'DELETE',
      headers: {
        'X-User-Email': getUserEmail()
      }
    });
    return handleResponse(response, url);
  },
};

export const authService = {
  async register(name: string, email: string, password: string): Promise<{ name: string; email: string }> {
    const url = `${API_URL}/auth/register`;
    const response = await customFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    return handleResponse(response, url);
  },

  async login(email: string, password: string): Promise<{ name: string; email: string }> {
    const url = `${API_URL}/auth/login`;
    const response = await customFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(response, url);
  }
};
