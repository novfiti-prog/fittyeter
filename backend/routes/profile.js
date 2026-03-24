const express = require('express');
const router = express.Router();
const { getDB } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

// POST /api/profile/onboarding - Save onboarding data
router.post('/onboarding', authMiddleware, (req, res) => {
  const {
    age, gender, height_cm, weight_kg, target_weight_kg,
    fitness_goal, fitness_level, job_type, weekly_workout_hours,
    workout_location, equipment, health_notes, dietary_restrictions
  } = req.body;

  try {
    const db = getDB();
    db.prepare(`
      UPDATE user_profiles SET
        age = ?, gender = ?, height_cm = ?, weight_kg = ?, target_weight_kg = ?,
        fitness_goal = ?, fitness_level = ?, job_type = ?, weekly_workout_hours = ?,
        workout_location = ?, equipment = ?, health_notes = ?, dietary_restrictions = ?,
        onboarding_completed = 1, profile_updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      age, gender, height_cm, weight_kg, target_weight_kg,
      fitness_goal, fitness_level, job_type, weekly_workout_hours,
      workout_location, JSON.stringify(equipment || []),
      health_notes, JSON.stringify(dietary_restrictions || []),
      req.user.userId
    );

    // Log initial weight
    db.prepare('INSERT INTO weight_logs (user_id, weight_kg, notes) VALUES (?, ?, ?)')
      .run(req.user.userId, weight_kg, 'Başlangıç kilosu / Starting weight');

    res.json({ success: true, message_tr: 'Profil kaydedildi', message_en: 'Profile saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/profile - Get full profile
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.userId);
    if (profile) {
      try { profile.equipment = JSON.parse(profile.equipment || '[]'); } catch {}
      try { profile.dietary_restrictions = JSON.parse(profile.dietary_restrictions || '[]'); } catch {}
    }
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/profile - Update profile
router.put('/', authMiddleware, (req, res) => {
  const allowed = ['age','gender','height_cm','weight_kg','target_weight_kg','fitness_goal',
    'fitness_level','job_type','weekly_workout_hours','workout_location','equipment',
    'health_notes','dietary_restrictions'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.equipment) updates.equipment = JSON.stringify(updates.equipment);
  if (updates.dietary_restrictions) updates.dietary_restrictions = JSON.stringify(updates.dietary_restrictions);

  try {
    const db = getDB();
    const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const vals = [...Object.values(updates), req.user.userId];
    db.prepare(`UPDATE user_profiles SET ${sets}, profile_updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`).run(...vals);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/profile/weight - Log weight
router.post('/weight', authMiddleware, (req, res) => {
  const { weight_kg, notes } = req.body;
  if (!weight_kg) return res.status(400).json({ error: 'Weight required' });
  try {
    const db = getDB();
    db.prepare('INSERT INTO weight_logs (user_id, weight_kg, notes) VALUES (?, ?, ?)').run(req.user.userId, weight_kg, notes || '');
    db.prepare('UPDATE user_profiles SET weight_kg = ? WHERE user_id = ?').run(weight_kg, req.user.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/profile/weight - Get weight history
router.get('/weight', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const logs = db.prepare('SELECT * FROM weight_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 52').all(req.user.userId);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/profile/stats - Dashboard stats
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const totalWorkouts = db.prepare('SELECT COUNT(*) as count FROM workout_logs WHERE user_id = ? AND workout_completed = 1').get(req.user.userId);
    const thisWeek = db.prepare(`SELECT COUNT(*) as count FROM workout_logs WHERE user_id = ? AND workout_completed = 1 AND log_date >= date('now', '-7 days')`).get(req.user.userId);
    const streak = getStreak(db, req.user.userId);
    const achievements = db.prepare('SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?').get(req.user.userId);
    const weightLogs = db.prepare('SELECT weight_kg, logged_at FROM weight_logs WHERE user_id = ? ORDER BY logged_at ASC').all(req.user.userId);

    res.json({
      total_workouts: totalWorkouts.count,
      this_week_workouts: thisWeek.count,
      current_streak: streak,
      achievement_count: achievements.count,
      weight_logs: weightLogs
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

function getStreak(db, userId) {
  const logs = db.prepare(`
    SELECT DISTINCT log_date FROM workout_logs 
    WHERE user_id = ? AND workout_completed = 1 
    ORDER BY log_date DESC LIMIT 60
  `).all(userId);
  if (!logs.length) return 0;
  let streak = 0;
  let current = new Date();
  current.setHours(0,0,0,0);
  for (const log of logs) {
    const logDate = new Date(log.log_date);
    const diff = Math.floor((current - logDate) / (1000*60*60*24));
    if (diff <= 1) { streak++; current = logDate; }
    else break;
  }
  return streak;
}

module.exports = router;
