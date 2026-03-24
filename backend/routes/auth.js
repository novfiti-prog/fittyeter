const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { getDB } = require('../db/schema');
const { generateToken, authMiddleware } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, full_name, language } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Missing fields', message_tr: 'Tüm alanları doldurun', message_en: 'Please fill all fields' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password too short', message_tr: 'Şifre en az 6 karakter olmalı', message_en: 'Password must be at least 6 characters' });
  }
  try {
    const db = getDB();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Email exists', message_tr: 'Bu e-posta zaten kayıtlı', message_en: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, full_name, language) VALUES (?, ?, ?, ?)'
    ).run(email.toLowerCase(), hash, full_name, language || 'tr');

    db.prepare('INSERT INTO user_profiles (user_id) VALUES (?)').run(result.lastInsertRowid);

    const token = generateToken(result.lastInsertRowid, email.toLowerCase());
    res.json({
      token,
      user: { id: result.lastInsertRowid, email: email.toLowerCase(), full_name, language: language || 'tr', onboarding_completed: 0 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields', message_tr: 'E-posta ve şifre gerekli', message_en: 'Email and password required' });
  }
  try {
    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials', message_tr: 'E-posta veya şifre hatalı', message_en: 'Invalid email or password' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials', message_tr: 'E-posta veya şifre hatalı', message_en: 'Invalid email or password' });
    }
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    const profile = db.prepare('SELECT onboarding_completed FROM user_profiles WHERE user_id = ?').get(user.id);
    const token = generateToken(user.id, user.email);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        language: user.language,
        avatar_url: user.avatar_url,
        onboarding_completed: profile?.onboarding_completed || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const user = db.prepare('SELECT id, email, full_name, language, avatar_url FROM users WHERE id = ?').get(req.user.userId);
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/language
router.put('/language', authMiddleware, (req, res) => {
  const { language } = req.body;
  if (!['tr', 'en'].includes(language)) return res.status(400).json({ error: 'Invalid language' });
  const db = getDB();
  db.prepare('UPDATE users SET language = ? WHERE id = ?').run(language, req.user.userId);
  res.json({ success: true });
});

module.exports = router;
