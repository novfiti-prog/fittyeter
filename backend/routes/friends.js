const express = require('express');
const router = express.Router();
const { getDB } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

// GET /api/friends - Get friends list
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const friends = db.prepare(`
      SELECT u.id, u.full_name, u.avatar_url, f.status, f.created_at,
        CASE WHEN f.requester_id = ? THEN 'sent' ELSE 'received' END as direction
      FROM friendships f
      JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
      WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status != 'blocked'
    `).all(req.user.userId, req.user.userId, req.user.userId, req.user.userId);
    res.json({ friends });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/friends/add - Send friend request by email
router.post('/add', authMiddleware, (req, res) => {
  const { email } = req.body;
  try {
    const db = getDB();
    const target = db.prepare('SELECT id, full_name FROM users WHERE email = ? AND is_active = 1').get(email?.toLowerCase());
    if (!target) return res.status(404).json({ error: 'User not found', message_tr: 'Kullanıcı bulunamadı', message_en: 'User not found' });
    if (target.id === req.user.userId) return res.status(400).json({ error: 'Cannot add yourself' });
    const existing = db.prepare('SELECT * FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)').get(req.user.userId, target.id, target.id, req.user.userId);
    if (existing) return res.status(409).json({ error: 'Already connected', status: existing.status });
    db.prepare('INSERT INTO friendships (requester_id, addressee_id) VALUES (?, ?)').run(req.user.userId, target.id);
    // Notification
    db.prepare('INSERT INTO notifications (user_id, type, title_tr, title_en, message_tr, message_en) VALUES (?, ?, ?, ?, ?, ?)').run(
      target.id, 'friend_request', 'Arkadaşlık İsteği', 'Friend Request',
      `Yeni bir arkadaşlık isteğin var!`, `You have a new friend request!`
    );
    res.json({ success: true, message_tr: 'İstek gönderildi', message_en: 'Request sent' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/friends/respond - Accept/reject friend request
router.put('/respond', authMiddleware, (req, res) => {
  const { requester_id, action } = req.body;
  if (!['accepted', 'blocked'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  try {
    const db = getDB();
    db.prepare('UPDATE friendships SET status = ? WHERE requester_id = ? AND addressee_id = ?').run(action, requester_id, req.user.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/friends/leaderboard - Friends activity leaderboard
router.get('/leaderboard', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const friendIds = db.prepare(`
      SELECT CASE WHEN requester_id = ? THEN addressee_id ELSE requester_id END as fid
      FROM friendships WHERE (requester_id = ? OR addressee_id = ?) AND status = 'accepted'
    `).all(req.user.userId, req.user.userId, req.user.userId).map(r => r.fid);

    friendIds.push(req.user.userId);
    const placeholders = friendIds.map(() => '?').join(',');

    const leaderboard = db.prepare(`
      SELECT u.id, u.full_name, u.avatar_url,
        COUNT(wl.id) as total_workouts,
        COALESCE(SUM(ua.achievement_id), 0) as achievement_points
      FROM users u
      LEFT JOIN workout_logs wl ON wl.user_id = u.id AND wl.workout_completed = 1 AND wl.log_date >= date('now', '-30 days')
      LEFT JOIN user_achievements ua ON ua.user_id = u.id
      WHERE u.id IN (${placeholders})
      GROUP BY u.id ORDER BY total_workouts DESC LIMIT 10
    `).all(...friendIds);

    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/friends/notifications
router.get('/notifications', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.userId);
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.userId);
    res.json({ notifications: notifs });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
