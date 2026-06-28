import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['created', 'status', 'comment', 'assigned'],
    required: true
  },
  user: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
});

const taskSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: [true, 'User email is required to associate tasks'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    client: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in-progress', 'completed', 'overdue'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending'
    },
    priority: {
      type: String,
      enum: {
        values: ['critical', 'high', 'medium', 'low'],
        message: '{VALUE} is not a valid priority'
      },
      default: 'medium'
    },
    dueDate: {
      type: String,
      required: false,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },
    timeTracked: {
      type: Number,
      default: 0
    },
    timerStartedAt: {
      type: String,
      default: ''
    },
    assigneeIds: {
      type: [String],
      default: []
    },
    activity: {
      type: [activitySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Task = mongoose.model('Task', taskSchema);

export default Task;
