import { useState, useEffect } from 'react';

const EMPTY = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
};

export default function TaskForm({ task, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [task]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    try {
      await onSubmit({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        due_date: form.due_date || null,
      });
      if (!task) setForm(EMPTY);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>{task ? 'Edit Task' : 'New Task'}</h2>
      {error && <p className="form-error" role="alert">{error}</p>}

      <label>
        Title *
        <input name="title" value={form.title} onChange={handleChange} required placeholder="Task title" />
      </label>

      <label>
        Description
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder="Optional details"
        />
      </label>

      <div className="form-row">
        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label>
          Priority
          <select name="priority" value={form.priority} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          Due Date
          <input type="date" name="due_date" value={form.due_date} onChange={handleChange} />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {task ? 'Save Changes' : 'Add Task'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
