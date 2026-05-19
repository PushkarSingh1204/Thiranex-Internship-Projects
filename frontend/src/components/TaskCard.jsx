const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const isOverdue =
    task.due_date &&
    task.status !== 'done' &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  return (
    <article className={`task-card status-${task.status} priority-${task.priority}`}>
      <div className="task-card-header">
        <h3 className="task-title">{task.title}</h3>
        <span className={`badge badge-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-meta">
        <span className={`badge badge-status badge-${task.status}`}>
          {STATUS_LABELS[task.status]}
        </span>
        {task.due_date && (
          <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
            Due {formatDate(task.due_date)}
          </span>
        )}
      </div>

      <div className="task-actions">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
          aria-label="Change status"
          className="status-select"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}
