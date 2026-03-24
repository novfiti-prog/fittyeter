const express = require('express');
const router = express.Router();
const { getDB } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');

// POST /api/logs/workout - Log workout completion
router.post('/workout', authMiddleware, (req, res) => {
  const { log_date, day_number, exercises_completed, workout_completed, duration_minutes, difficulty_rating, notes, program_id } = req.body;
  try {
    const db = getDB();
    const existing = db.prepare('SELECT id FROM workout_logs WHERE user_id = ? AND log_date = ?').get(req.user.userId, log_date);
    if (existing) {
      db.prepare(`UPDATE workout_logs SET exercises_completed = ?, workout_completed = ?, duration_minutes = ?, difficulty_rating = ?, notes = ? WHERE id = ?`)
        .run(JSON.stringify(exercises_completed || []), workout_completed ? 1 : 0, duration_minutes, difficulty_rating, notes, existing.id);
    } else {
      db.prepare(`INSERT INTO workout_logs (user_id, program_id, log_date, day_number, exercises_completed, workout_completed, duration_minutes, difficulty_rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(req.user.userId, program_id, log_date, day_number, JSON.stringify(exercises_completed || []), workout_completed ? 1 : 0, duration_minutes, difficulty_rating, notes);
    }
    checkAchievements(db, req.user.userId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/logs/meal - Log meal completion
router.post('/meal', authMiddleware, (req, res) => {
  const { log_date, meal_type, meal_completed, notes, program_id } = req.body;
  try {
    const db = getDB();
    const existing = db.prepare('SELECT id FROM meal_logs WHERE user_id = ? AND log_date = ? AND meal_type = ?').get(req.user.userId, log_date, meal_type);
    if (existing) {
      db.prepare('UPDATE meal_logs SET meal_completed = ?, notes = ? WHERE id = ?').run(meal_completed ? 1 : 0, notes, existing.id);
    } else {
      db.prepare('INSERT INTO meal_logs (user_id, program_id, log_date, meal_type, meal_completed, notes) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.userId, program_id, log_date, meal_type, meal_completed ? 1 : 0, notes);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs/today - Get today's logs
router.get('/today', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const db = getDB();
    const workout = db.prepare('SELECT * FROM workout_logs WHERE user_id = ? AND log_date = ?').get(req.user.userId, today);
    const meals = db.prepare('SELECT * FROM meal_logs WHERE user_id = ? AND log_date = ?').all(req.user.userId, today);
    if (workout) { try { workout.exercises_completed = JSON.parse(workout.exercises_completed || '[]'); } catch {} }
    res.json({ date: today, workout, meals });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs/week - Get this week's logs
router.get('/week', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const workouts = db.prepare(`SELECT * FROM workout_logs WHERE user_id = ? AND log_date >= date('now', '-7 days') ORDER BY log_date`).all(req.user.userId);
    const meals = db.prepare(`SELECT * FROM meal_logs WHERE user_id = ? AND log_date >= date('now', '-7 days') ORDER BY log_date`).all(req.user.userId);
    res.json({ workouts, meals });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/logs/achievements - Get user achievements
router.get('/achievements', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const all = db.prepare('SELECT a.*, ua.earned_at FROM achievements a LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?').all(req.user.userId);
    res.json({ achievements: all });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

function checkAchievements(db, userId) {
  const totalWorkouts = db.prepare('SELECT COUNT(*) as c FROM workout_logs WHERE user_id = ? AND workout_completed = 1').get(userId).c;
  const grantAchievement = (key) => {
    const ach = db.prepare('SELECT id FROM achievements WHERE key = ?').get(key);
    if (ach) {
      try { db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, ach.id); } catch {}
    }
  };
  if (totalWorkouts >= 1) grantAchievement('first_workout');
  if (totalWorkouts >= 30) grantAchievement('consistency_king');

  // Check week streak
  const last7 = db.prepare(`SELECT COUNT(DISTINCT log_date) as c FROM workout_logs WHERE user_id = ? AND workout_completed = 1 AND log_date >= date('now', '-7 days')`).get(userId).c;
  if (last7 >= 7) grantAchievement('week_streak');
}

module.exports = router;
