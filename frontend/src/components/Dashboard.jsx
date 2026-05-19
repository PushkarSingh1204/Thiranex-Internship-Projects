import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { tasksApi } from '../api.js';
import { useSocket } from '../hooks/useSocket.js';
import TaskCard from './TaskCard.jsx';
import TaskForm from './TaskForm.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.search) params.search = filter.search;
      const { tasks: data } = await tasksApi.list(params);
      setTasks(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useSocket(
    useCallback((event, payload) => {
    if (event === 'created') {
      setTasks((prev) => {
        if (prev.some((t) => t.id === payload.id)) return prev;
        return [payload, ...prev];
      });
    } else if (event === 'updated') {
      setTasks((prev) => prev.map((t) => (t.id === payload.id ? payload : t)));
    } else if (event === 'deleted') {
      setTasks((prev) => prev.filter((t) => t.id !== payload.id));
    }
  }, []),
    useCallback((connected) => setLiveConnected(connected), [])
  );

  async function handleCreate(data) {
    const { task } = await tasksApi.create(data);
    setTasks((prev) => {
      if (prev.some((t) => t.id === task.id)) return prev;
      return [task, ...prev];
    });
    setShowForm(false);
  }

  async function handleUpdate(data) {
    const { task } = await tasksApi.update(editingTask.id, data);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    setEditingTask(null);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task?')) return;
    await tasksApi.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleStatusChange(id, status) {
    const { task } = await tasksApi.update(id, { status });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-brand">
          <h1>TaskFlow</h1>
          <span className={`live-indicator ${liveConnected ? 'connected' : ''}`} title="Real-time sync">
            {liveConnected ? '● Live' : '○ Offline'}
          </span>
        </div>
        <div className="header-user">
          <span>Hi, {user?.name}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <section className="stats-bar">
        <div className="stat"><span className="stat-value">{stats.total}</span><span className="stat-label">Total</span></div>
        <div className="stat"><span className="stat-value">{stats.todo}</span><span className="stat-label">To Do</span></div>
        <div className="stat"><span className="stat-value">{stats.in_progress}</span><span className="stat-label">In Progress</span></div>
        <div className="stat"><span className="stat-value">{stats.done}</span><span className="stat-label">Done</span></div>
      </section>

      <section className="toolbar">
        <input
          type="search"
          placeholder="Search tasks…"
          value={filter.search}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
          className="search-input"
        />
        <select
          value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          value={filter.priority}
          onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))}
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
        >
          + New Task
        </button>
      </section>

      {(showForm || editingTask) && (
        <section className="form-panel">
          <TaskForm
            task={editingTask}
            onSubmit={editingTask ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
          />
        </section>
      )}

      {error && <p className="form-error banner-error" role="alert">{error}</p>}

      <main className="task-grid">
        {loading ? (
          <p className="empty-state">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="empty-state">No tasks yet. Create your first one!</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={(t) => {
                setShowForm(false);
                setEditingTask(t);
              }}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </main>
    </div>
  );
}
