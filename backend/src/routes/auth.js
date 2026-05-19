import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email?.trim() || !password || !name?.trim()) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
    .run(email.trim().toLowerCase(), password_hash, name.trim());

  const user = { id: result.lastInsertRowid, email: email.trim().toLowerCase(), name: name.trim() };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({ user, token });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db
    .prepare('SELECT id, email, name, password_hash FROM users WHERE email = ?')
    .get(email.trim().toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { password_hash, ...safeUser } = user;
  const token = jwt.sign(safeUser, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({ user: safeUser, token });
});

router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

export default router;
