import { Router } from 'express';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const VALID_STATUS = ['todo', 'in_progress', 'done'];
const VALID_PRIORITY = ['low', 'medium', 'high'];

function emitTask(io, userId, event, task) {
  io.to(`user:${userId}`).emit(event, task);
}

router.use(authenticate);

router.get('/', (req, res) => {
  const { status, priority, search } = req.query;
  let sql = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [req.user.id];

  if (status && VALID_STATUS.includes(status)) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (priority && VALID_PRIORITY.includes(priority)) {
    sql += ' AND priority = ?';
    params.push(priority);
  }
  if (search) {
    sql += ' AND (title LIKE ? OR description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term);
  }

  sql += ' ORDER BY updated_at DESC';
  const tasks = db.prepare(sql).all(...params);
  res.json({ tasks });
});

router.get('/:id', (req, res) => {
  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task });
});

router.post('/', (req, res) => {
  const { title, description = '', status = 'todo', priority = 'medium', due_date } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (!VALID_PRIORITY.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  const result = db
    .prepare(
      `INSERT INTO tasks (user_id, title, description, status, priority, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, title.trim(), description.trim(), status, priority, due_date || null);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  emitTask(req.app.get('io'), req.user.id, 'task:created', task);
  res.status(201).json({ task });
});

router.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const { title, description, status, priority, due_date } = req.body;

  if (status && !VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (priority && !VALID_PRIORITY.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  db.prepare(
    `UPDATE tasks SET
      title = ?, description = ?, status = ?, priority = ?, due_date = ?,
      updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`
  ).run(
    title?.trim() ?? existing.title,
    description?.trim() ?? existing.description,
    status ?? existing.status,
    priority ?? existing.priority,
    due_date !== undefined ? due_date : existing.due_date,
    req.params.id,
    req.user.id
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  emitTask(req.app.get('io'), req.user.id, 'task:updated', task);
  res.json({ task });
});

router.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  emitTask(req.app.get('io'), req.user.id, 'task:deleted', { id: Number(req.params.id) });
  res.json({ message: 'Task deleted' });
});

export default router;
