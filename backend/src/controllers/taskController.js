import Task from '../models/Task.js';

// @desc    Get all tasks with filtering, sorting, and search
// @route   GET /api/tasks
// @access  Public
export const getTasks = async (req, res) => {
  try {
    const { status, priority, search, sortBy, sortOrder } = req.query;
    
    // Build query object
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { client: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort options
    let sortOptions = {};
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      sortOptions[sortBy] = order;
    } else {
      sortOptions.createdAt = -1; // Default: newest first
    }
    
    const tasks = await Task.find(query).sort(sortOptions);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving tasks', error: error.message });
  }
};

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
// @access  Public
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json(task);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).json({ message: 'Server error retrieving task', error: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Public
export const createTask = async (req, res) => {
  try {
    const { title, client, description, status, priority, dueDate, tags, assigneeIds, activity } = req.body;
    
    // Basic title validation (backend level)
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ message: 'Title is required and must be at least 3 characters long' });
    }

    const newTask = new Task({
      title,
      client,
      description,
      status,
      priority,
      dueDate,
      tags: tags || [],
      assigneeIds: assigneeIds || [],
      activity: activity || []
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: 'Validation Error', errors: messages });
    }
    res.status(500).json({ message: 'Server error creating task', error: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Public
export const updateTask = async (req, res) => {
  try {
    const { title, client, description, status, priority, dueDate, tags, assigneeIds, activity } = req.body;
    
    // Find task
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Update fields if provided
    if (title !== undefined) task.title = title;
    if (client !== undefined) task.client = client;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;
    if (assigneeIds !== undefined) task.assigneeIds = assigneeIds;
    if (activity !== undefined) task.activity = activity;

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: 'Validation Error', errors: messages });
    }
    res.status(500).json({ message: 'Server error updating task', error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Public
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ id: req.params.id, message: 'Task removed successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(500).json({ message: 'Server error deleting task', error: error.message });
  }
};
